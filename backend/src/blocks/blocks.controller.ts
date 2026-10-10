import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Blocks')
@Controller('blocks')
export class BlocksController {
  constructor(
    private readonly blocksService: BlocksService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'যাদের/যে entity-দের আমার কাছ থেকে লুকানো হবে — frontend guard-এর জন্য',
  })
  getMyOverview(@Req() req: any) {
    return this.blocksService.getOverview(req.user.userId);
  }
}
