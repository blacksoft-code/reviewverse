import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { EntitiesModule } from './entities/entities.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, CategoriesModule, EntitiesModule, ReviewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
