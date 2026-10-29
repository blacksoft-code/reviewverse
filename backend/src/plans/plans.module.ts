import { Module } from '@nestjs/common';

import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';

@Module({
  imports: [PrismaModule, EntityMembershipsModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
