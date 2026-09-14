import { Module } from '@nestjs/common';

import { PostReactionsController } from './post-reactions.controller';
import { PostReactionsService } from './post-reactions.service';

@Module({
  controllers: [PostReactionsController],
  providers: [PostReactionsService],
})
export class PostReactionsModule {}