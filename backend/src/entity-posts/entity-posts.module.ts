import { Module } from '@nestjs/common';

import { EntityPostsController } from './entity-posts.controller';
import { EntityPostsService } from './entity-posts.service';

import { PrismaModule } from '../prisma/prisma.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';

@Module({
  imports: [PrismaModule, EntityMembershipsModule],
  controllers: [EntityPostsController],
  providers: [EntityPostsService],
})
export class EntityPostsModule {}