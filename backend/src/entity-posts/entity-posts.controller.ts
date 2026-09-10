import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EntityPostsService } from './entity-posts.service';
import { CreateEntityPostDto } from './dto/create-entity-post.dto';
import { UpdateEntityPostDto } from './dto/update-entity-post.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Entity Posts')
@Controller('entity-posts')
export class EntityPostsController {
  constructor(
    private readonly entityPostsService: EntityPostsService,
  ) {}

  // ─────────────────────────────
  // PUBLIC — Facebook Page-এর মতো সবাই দেখতে পাবে,
  // কে (কোন employee) পোস্ট করেছে সেটা দেখাবে না
  // ─────────────────────────────

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Public post feed for a business' })
  findPublic(@Param('entityId') entityId: string) {
    return this.entityPostsService.findPublic(entityId);
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Get a single post (public)' })
  findOnePublic(@Param('postId') postId: string) {
    return this.entityPostsService.findOnePublic(postId);
  }

  // ─────────────────────────────
  // MANAGEMENT — শুধু owner/manager/employee (কোনো EntityMembership role)
  // ─────────────────────────────

  @Get('entity/:entityId/manage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Owner/Manager/Employee] Get posts with author info',
  })
  findForManagers(
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    return this.entityPostsService.findForManagers(
      entityId,
      req.user.userId,
    );
  }

  @Post('entity/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Owner/Manager/Employee] Create a post as this business',
  })
  @ApiResponse({
    status: 403,
    description: 'Not a member of this business',
  })
  create(
    @Param('entityId') entityId: string,
    @Body() dto: CreateEntityPostDto,
    @Req() req: any,
  ) {
    return this.entityPostsService.create(
      entityId,
      req.user.userId,
      dto,
    );
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Owner/Manager/Employee] Edit any post of this business (not author-restricted)',
  })
  update(
    @Param('postId') postId: string,
    @Body() dto: UpdateEntityPostDto,
    @Req() req: any,
  ) {
    return this.entityPostsService.update(
      postId,
      req.user.userId,
      dto,
    );
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Owner/Manager/Employee] Delete any post of this business (not author-restricted)',
  })
  remove(@Param('postId') postId: string, @Req() req: any) {
    return this.entityPostsService.remove(postId, req.user.userId);
  }
}