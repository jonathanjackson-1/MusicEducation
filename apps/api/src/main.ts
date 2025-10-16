import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedactingLogger } from './common/logging/redacting.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new RedactingLogger() });
  const config = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`API is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Nest application', error);
  process.exit(1);
});
