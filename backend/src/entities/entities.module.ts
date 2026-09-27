import { Module } from '@nestjs/common';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module'; // ← NEW
import { LocationsModule } from '../locations/locations.module';
import { OfferingsModule } from '../offerings/offerings.module';

@Module({
  imports: [
    PrismaModule,
    EntityMembershipsModule,
    LocationsModule,
    OfferingsModule,
  ], // ← EntityMembershipsModule যোগ হলো
  controllers: [EntitiesController],
  providers: [EntitiesService],
})
export class EntitiesModule {}