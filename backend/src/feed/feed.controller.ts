import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get personalized feed',
    description:
      'Priority অনুযায়ী sorted review feed রিটার্ন করে: Friends > Followed users > Followed entities > Everyone else. Blocked user/entity-এর review বাদ যায়।',
  })
  @ApiResponse({
    status: 200,
    description: 'Feed সফলভাবে রিটার্ন হয়েছে (priority অনুযায়ী sorted)।',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication token নেই বা invalid।',
  })
  getFeed(@Req() req: any) {
    return this.feedService.getFeed(
      req.user.userId,
    );
  }
}