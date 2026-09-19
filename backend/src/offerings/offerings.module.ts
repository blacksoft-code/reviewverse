import { Module } from '@nestjs/common';

import { OfferingsController } from './offerings.controller';
import { OfferingsService } from './offerings.service';

import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';

@Module({
  imports: [PrismaModule, EntityMembershipsModule],
  controllers: [OfferingsController],
  providers: [OfferingsService],
})
export class OfferingsModule {}
