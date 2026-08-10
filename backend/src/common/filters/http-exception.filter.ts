import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';


@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter {

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