import { Module } from '@nestjs/common';

import { EntityVerificationsController } from './entity-verifications.controller';
import { EntityVerificationsService } from './entity-verifications.service';
import { VerificationStorageService } from './verification-storage.service';

import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    EntityMembershipsModule,
    NotificationsModule,
  ],
  controllers: [EntityVerificationsController],
  providers: [
    EntityVerificationsService,
    VerificationStorageService,
  ],
})
export class EntityVerificationsModule {}
