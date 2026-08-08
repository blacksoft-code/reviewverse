import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe(),
  );

  const config = new DocumentBuilder()
    .setTitle('ReviewVerse API')
    .setDescription(
      'API documentation for the ReviewVerse platform',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup(
    'api/docs',
    app,
    document,
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();