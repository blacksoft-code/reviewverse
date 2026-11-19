import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';


@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter {

  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(
    exception: any,
    host: ArgumentsHost,
  ) {

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();


    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;


    // অপ্রত্যাশিত error (Prisma, bug ইত্যাদি) — client-কে শুধু "Internal server error"
    // যায়, তাই আসল কারণটা terminal-এ লিখে রাখি
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url} → ${exception?.message ?? exception}`,
        exception?.stack,
      );
    }

    const exceptionResponse =
        exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';


    const message =
    typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse['message'];


    response.status(status).json({

      success: false,

      statusCode: status,

      timestamp: new Date().toISOString(),

      path: request.url,

      message,

    });

  }
}