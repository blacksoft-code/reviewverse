import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findForUser(req.user.userId);
  }

  // গত ৩০ দিনের history — ?limit=20&cursor=<last id>&entityId=<business id>
  @Get('history')
  history(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.notificationsService.findHistory(
      req.user.userId,
      {
        cursor: cursor || undefined,
        limit: limit ? parseInt(limit, 10) || 20 : 20,
        entityId: entityId || undefined,
      },
    );
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  // 'read-all' রুটটা ':id/read'-এর আগে থাকা জরুরি,
  // নাহলে NestJS 'read-all'-কে :id ধরে ফেলবে
  @Patch('read-all')
  markAllRead(
    @Req() req: any,
    @Query('entityId') entityId?: string,
    @Query('scope') scope?: string,
  ) {
    return this.notificationsService.markAllAsRead(
      req.user.userId,
      { entityId: entityId || undefined, scope },
    );
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.userId, id);
  }
}