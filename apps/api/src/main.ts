import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`API is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Nest application', error);
  process.exit(1);
});
