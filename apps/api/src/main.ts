import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { shutdownTelemetry, startTelemetry } from './observability/telemetry';

async function bootstrap() {
  await startTelemetry('soundstudio-api');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`API is running on port ${port}`, 'Bootstrap');

  const teardown = async (signal: string) => {
    logger.log(`Received ${signal}. Shutting down gracefully.`, 'Bootstrap');
    await app.close();
    await shutdownTelemetry();
    process.exit(0);
  };

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
      void teardown(signal);
    });
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console -- ensure we can log bootstrap errors before the logger is ready
  console.error('Failed to bootstrap Nest application', error);
  void shutdownTelemetry().finally(() => {
    process.exit(1);
  });
});
