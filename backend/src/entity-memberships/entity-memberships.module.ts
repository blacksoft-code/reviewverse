import { Module } from '@nestjs/common';
import { EntityMembershipsController } from './entity-memberships.controller';
import { EntityMembershipsService } from './entity-memberships.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [EntityMembershipsController],
  providers: [EntityMembershipsService],
  // entity-posts module পরে hasAccess() ব্যবহার করবে বলে export করা হলো
  exports: [EntityMembershipsService],
})
export class EntityMembershipsModule {}