import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
        map((result) => {
            const responseBody: any = {
            success: true,
            statusCode: response.statusCode,
            data: result?.data ?? result,
            timestamp: new Date().toISOString(),
            };

            if (result?.meta) {
            responseBody.meta = result.meta;
            }

            return responseBody;
        }),
        );
  }
}