import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    PrismaModule, 
    NotificationsModule, 
    LocationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}