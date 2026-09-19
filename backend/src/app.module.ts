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
import { EntityMembershipsModule } from './entity-memberships/entity-memberships.module';
import { EntityPostsModule } from './entity-posts/entity-posts.module';

import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { ThrottlerGuard, ThrottlerModule, } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MediaModule } from './media/media.module';

import { ReviewReactionsModule } from './review-reactions/review-reactions.module';
import { ReviewCommentsModule } from './review-comments/review-comments.module';
import { PostReactionsModule } from './post-reactions/post-reaction.module';
import { PostCommentsModule } from './post-comments/post-comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OfferingsModule } from './offerings/offerings.module';

@Module({
  imports: 
  [
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
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    CategoriesModule, 
    EntitiesModule, 
    ReviewsModule, 
    FeedModule, 
    SearchModule, 
    EntityMembershipsModule, 
    EntityPostsModule, 
    MediaModule, 
    ReviewReactionsModule, 
    ReviewCommentsModule, 
    PostReactionsModule, 
    PostCommentsModule,
    NotificationsModule,
    OfferingsModule, 
  ],
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
