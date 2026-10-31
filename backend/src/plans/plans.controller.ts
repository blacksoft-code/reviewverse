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
      '[Admin] Change the plan of a business by hand (follows billing rules; force=true overrides)',
  })
  async setPlan(
    @Param('entityId') entityId: string,
    @Body() dto: SetPlanDto,
  ) {
    // force = নিয়ম না মেনে এখনই (override)
    if (dto.force) {
      const usage = await this.plansService.setPlan(
        entityId,
        dto.plan,
        dto.billingCycle,
      );

      return { applied: 'NOW', effectiveAt: null, usage };
    }

    // নইলে billing-এর নিয়ম: upgrade সাথে সাথে, downgrade ও মাসিক→বার্ষিক মেয়াদ শেষে
    const result = await this.plansService.changePlan(
      entityId,
      dto.plan,
      dto.billingCycle,
    );

    return {
      ...result,
      usage: await this.plansService.getUsage(entityId),
    };
  }
}
