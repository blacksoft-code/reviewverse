import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { EntityMembershipsService } from './entity-memberships.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Entity Memberships')
@Controller('entity-memberships')
export class EntityMembershipsController {
  constructor(
    private readonly entityMembershipsService: EntityMembershipsService,
  ) {}

  // ─────────────────────────────
  // USER: claim a business
  // ─────────────────────────────

  @Post('claim/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Claim a business (Reviewer flow-এ তৈরি হওয়া business claim করা)',
  })
  @ApiResponse({ status: 201, description: 'Claim submitted, status = PENDING' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'Business already has an owner, or a pending claim already exists',
  })
  claimBusiness(@Param('entityId') entityId: string, @Req() req: any) {
    return this.entityMembershipsService.claimBusiness(
      entityId,
      req.user.userId,
    );
  }

  @Get('my-claims')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get claims submitted by the logged-in user' })
  getMyClaims(@Req() req: any) {
    return this.entityMembershipsService.getMyClaims(req.user.userId);
  }

  @Get('my-memberships')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get businesses the logged-in user has access to (owner/admin/editor)',
  })
  getMyMemberships(@Req() req: any) {
    return this.entityMembershipsService.getMyMemberships(req.user.userId);
  }

  @Get('entity/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all members of a specific business' })
  getEntityMemberships(@Param('entityId') entityId: string) {
    return this.entityMembershipsService.getEntityMemberships(entityId);
  }

  // ─────────────────────────────
  // ADMIN: review claims
  // ─────────────────────────────

  @Get('claims/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Get all pending claims' })
  getPendingClaims() {
    return this.entityMembershipsService.getPendingClaims();
  }

  @Patch('claims/:claimId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Admin] Approve a claim → EntityMembership(role=OWNER) created',
  })
  approveClaim(@Param('claimId') claimId: string) {
    return this.entityMembershipsService.approveClaim(claimId);
  }

  @Patch('claims/:claimId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Reject a claim' })
  rejectClaim(@Param('claimId') claimId: string) {
    return this.entityMembershipsService.rejectClaim(claimId);
  }
}