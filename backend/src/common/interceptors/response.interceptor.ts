import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// DB-তে ছবির URL পুরো (http://localhost:3000/uploads/...) আকারে জমা আছে।
// ফোনে "localhost" মানে ফোন নিজেই, তাই ছবি লোড হয় না। response-এ সেই URL-কে
// host ছাড়া /uploads/... বানিয়ে দেওয়া হয় — ব্রাউজার যে host-এ ফ্রন্টএন্ড খুলেছে
// সেখান থেকেই নেয়, আর frontend-এর /uploads route সেটা backend থেকে এনে দেয়।
const UPLOAD_URL = /^https?:\/\/[^/]+(\/uploads\/)/;

function hostless(value: unknown): unknown {
  if (typeof value === 'string') {
    return UPLOAD_URL.test(value) ? value.replace(UPLOAD_URL, '$1') : value;
  }

  if (Array.isArray(value)) return value.map(hostless);

  // শুধু সাধারণ object — Date, Decimal ইত্যাদি যেমন আছে তেমন থাকবে
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = hostless(v);
    return out;
  }

  return value;
}

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

            return hostless(responseBody);
        }),
        );
  }
}