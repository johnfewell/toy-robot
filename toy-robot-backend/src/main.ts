import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend connection
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'], // Angular dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🤖 Robot API Server running on http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
