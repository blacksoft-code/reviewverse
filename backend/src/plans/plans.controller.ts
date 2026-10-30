import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PlansService } from './plans.service';
import { PLANS } from './plans.config';
import { SetPlanDto } from './dto/set-plan.dto';
import { SetBadgeDto } from './dto/set-badge.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly entityMemberships: EntityMembershipsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'All plans with prices and limits (public)' })
  list() {
    return Object.values(PLANS);
  }

  @Get('entity/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Current plan and offering usage of a business (owner/manager only)',
  })
  async usage(
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    const ok = await this.entityMemberships.hasAccess(
      entityId,
      req.user.userId,
    );

    if (!ok) {
      throw new ForbiddenException(
        'Only the business owner or manager can see the plan.',
      );
    }

    // Plan ব্যবহার + Blue badge-এর অবস্থা (verified থাকা শুধু এই business জানে)
    const [usage, badge] = await Promise.all([
      this.plansService.getUsage(entityId),
      this.plansService.getBadgeState(entityId),
    ]);

    return { ...usage, badge, isVerified: badge.isVerified };
  }

  @Get('admin/entities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Admin] Businesses with their plan, verified status and blue badge state',
  })
  adminEntities(@Query('q') q?: string) {
    return this.plansService.adminListEntities(q);
  }

  @Patch('admin/entity/:entityId/badge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Admin] Give (FORCE_ON), turn off (FORCE_OFF) or reset (AUTO) the blue badge',
  })
  setBadge(
    @Param('entityId') entityId: string,
    @Body() dto: SetBadgeDto,
  ) {
    return this.plansService.setBadgeMode(entityId, dto.mode);
  }

  @Put('admin/entity/:entityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Admin] Set the plan of a business by hand (until payment is added)',
  })
  setPlan(
    @Param('entityId') entityId: string,
    @Body() dto: SetPlanDto,
  ) {
    return this.plansService.setPlan(
      entityId,
      dto.plan,
      dto.billingCycle,
    );
  }
}
