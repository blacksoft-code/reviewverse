import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
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
    summary: 'Get personalized, paginated feed',
    description:
      'Priority অনুযায়ী sorted mixed feed (reviews + business posts): Friends > Followed users > Followed entities > Everyone else। ' +
      'সাম্প্রতিক (গত কয়েকদিনের) content আগে দেখানো হয়, পর্যাপ্ত না থাকলে পুরনো content দিয়ে fill করা হয়। ' +
      'Blocked user/entity বাদ যায়।',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    example: 0,
    description: 'কতগুলো item skip করতে হবে (pagination offset)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    example: 30,
    description:
      'কতগুলো item নিতে হবে (প্রথমবার 30, পরে প্রতি লোডে 10)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Feed items + hasMore flag রিটার্ন হয়েছে (priority অনুযায়ী sorted)।',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication token নেই বা invalid।',
  })
  getFeed(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 30;

    return this.feedService.getFeed(
      req.user.userId,
      skipNum,
      takeNum,
    );
  }

  @Get('new-since')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Scroll করার মাঝে friend/followed business-এর নতুন post/review এসেছে কিনা চেক করা (polling)',
  })
  @ApiQuery({
    name: 'since',
    required: true,
    example: '2026-09-12T10:00:00.000Z',
    description: 'এই সময়ের পরের নতুন item কতগুলো এসেছে',
  })
  getNewSince(
    @Req() req: any,
    @Query('since') since: string,
  ) {
    return this.feedService.getNewSince(
      req.user.userId,
      new Date(since),
    );
  }
}