import {
  Body,
  Controller,
  Get,
  Headers,
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

import { EntityQuestionsService } from './entity-questions.service';
import { CreateEntityQuestionDto } from './dto/create-entity-question.dto';
import { AnswerEntityQuestionDto } from './dto/answer-entity-question.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Entity Questions')
@Controller('entity-questions')
export class EntityQuestionsController {
  constructor(
    private readonly entityQuestionsService: EntityQuestionsService,
  ) {}

  @Get('entity/:entityId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Public Q&A list of a business. meta.canAnswer = true if the logged-in user is its owner/manager',
  })
  findAll(@Param('entityId') entityId: string, @Req() req: any) {
    return this.entityQuestionsService.findAll(
      entityId,
      req.user?.userId ?? null,
    );
  }

  @Post('entity/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Logged-in user] Ask a question (max 500 chars)',
  })
  create(
    @Param('entityId') entityId: string,
    @Body() dto: CreateEntityQuestionDto,
    @Req() req: any,
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.entityQuestionsService.create(
      entityId,
      req.user.userId,
      dto,
      actingEntityId,
    );
  }

  @Patch(':questionId/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Owner/Manager of this business only] Answer (or edit answer of) a question (max 2000 chars)',
  })
  @ApiResponse({
    status: 403,
    description: 'Not the owner/manager of this business',
  })
  answer(
    @Param('questionId') questionId: string,
    @Body() dto: AnswerEntityQuestionDto,
    @Req() req: any,
    @Headers('x-acting-entity-id') actingEntityId?: string,
  ) {
    return this.entityQuestionsService.answer(
      questionId,
      req.user.userId,
      dto,
      actingEntityId,
    );
  }
}
