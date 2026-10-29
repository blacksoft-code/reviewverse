import { Module } from '@nestjs/common';
import { OfferingsController } from './offerings.controller';
import { OfferingsService } from './offerings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, EntityMembershipsModule, PlansModule],
  controllers: [OfferingsController],
  providers: [OfferingsService],
  exports: [OfferingsService],
})
export class OfferingsModule {}