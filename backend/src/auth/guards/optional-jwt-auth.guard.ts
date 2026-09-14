import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// টোকেন না থাকলে বা invalid হলেও route ব্লক হবে না —
// req.user শুধু null থাকবে। লগইন করা থাকলে req.user স্বাভাবিকভাবেই সেট হবে।
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(
  'jwt',
) {
  handleRequest(err: any, user: any) {
    return user || null;
  }
}