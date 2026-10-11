import { Module } from '@nestjs/common';

import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { ShareEngagementService } from './share-engagement.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SharesController],
  providers: [SharesService, ShareEngagementService],
})
export class SharesModule {}
