import { Global, Module } from '@nestjs/common';

import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';

// Global — PrismaModule-এর মতো, যাতে প্রতিটা module-এ আলাদা import না লাগে
@Global()
@Module({
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
