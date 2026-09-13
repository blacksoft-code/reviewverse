import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';

@Module({
  imports: [EntityMembershipsModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}