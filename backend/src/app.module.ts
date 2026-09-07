import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { EntitiesModule } from './entities/entities.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FeedModule } from './feed/feed.module';
import { SearchModule } from './search/search.module';

import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { ThrottlerGuard, ThrottlerModule, } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),

        JWT_SECRET: Joi.string()
          .min(10)
          .required(),

        PORT: Joi.number().default(3000),
      }),
    }),
    
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),


    PrismaModule, UsersModule, AuthModule, CategoriesModule, EntitiesModule, ReviewsModule, FeedModule, SearchModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
    },
  
  ],
})
export class AppModule {}
