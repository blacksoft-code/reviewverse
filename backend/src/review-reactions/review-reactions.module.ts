import { Module } from '@nestjs/common';

import { ReviewReactionsController } from './review-reactions.controller';
import { ReviewReactionsService } from './review-reactions.service';

@Module({
  controllers: [ReviewReactionsController],
  providers: [ReviewReactionsService],
})
export class ReviewReactionsModule {}