import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import helmet from 'helmet';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';



async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3001',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
  );

  app.useGlobalInterceptors(
  new ResponseInterceptor(),
  );

  app.useGlobalFilters(
  new HttpExceptionFilter(),
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