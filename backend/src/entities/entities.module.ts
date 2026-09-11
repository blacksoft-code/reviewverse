import { Module } from '@nestjs/common';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module'; // ← NEW

@Module({
  imports: [PrismaModule, EntityMembershipsModule], // ← EntityMembershipsModule যোগ হলো
  controllers: [EntitiesController],
  providers: [EntitiesService],
})
export class EntitiesModule {}