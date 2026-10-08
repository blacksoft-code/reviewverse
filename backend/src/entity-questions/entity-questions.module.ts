import { Module } from '@nestjs/common';

import { EntityQuestionsController } from './entity-questions.controller';
import { EntityQuestionsService } from './entity-questions.service';

import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, EntityMembershipsModule, NotificationsModule],
  controllers: [EntityQuestionsController],
  providers: [EntityQuestionsService],
})
export class EntityQuestionsModule {}
