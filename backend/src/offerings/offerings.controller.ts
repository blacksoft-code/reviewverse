import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { OfferingsService } from './offerings.service';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { UpdateOfferingDto } from './dto/update-offering.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SetOfferingVisibilityDto } from './dto/set-offering-visibility.dto';

@ApiTags('Offerings')
@Controller('offerings')
export class OfferingsController {
  constructor(
    private readonly offeringsService: OfferingsService,
  ) {}

  // PUBLIC — সবাই দেখতে পাবে

  @Get('entity/:entityId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Public offering list for a business (locked offerings hidden). ?manage=true as owner/manager returns all.',
  })
  findByEntity(
    @Param('entityId') entityId: string,
    @Query('manage') manage: string | undefined,
    @Req() req: any,
  ) {
    return this.offeringsService.findByEntity(entityId, {
      manage: manage === 'true',
      userId: req.user?.userId ?? null,
    });
  }

    @Get('types/search')
  @ApiOperation({
    summary:
      'Distinct offering type suggestion (search box autocomplete-এর জন্য)',
  })
  searchTypes(@Query('q') q: string) {
    return this.offeringsService.searchTypes(q ?? '');
  }

  // MANAGEMENT — শুধু owner/manager/employee

  @Post('entity/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Owner/Manager/Employee] Add an offering to this business',
  })
  @ApiResponse({
    status: 403,
    description: 'Not a member of this business',
  })
  create(
    @Param('entityId') entityId: string,
    @Body() dto: CreateOfferingDto,
    @Req() req: any,
  ) {
    return this.offeringsService.create(
      entityId,
      req.user.userId,
      dto,
    );
  }

  @Patch(':offeringId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Owner/Manager/Employee] Update an offering',
  })
  update(
    @Param('offeringId') offeringId: string,
    @Body() dto: UpdateOfferingDto,
    @Req() req: any,
  ) {
    return this.offeringsService.update(
      offeringId,
      req.user.userId,
      dto,
    );
  }

  @Delete(':offeringId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Owner/Manager/Employee] Delete an offering',
  })
  remove(
    @Param('offeringId') offeringId: string,
    @Req() req: any,
  ) {
    return this.offeringsService.remove(
      offeringId,
      req.user.userId,
    );
  }

  @Patch(':offeringId/visibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Owner/Manager/Employee] Make an offering public or locked (within the plan limit)',
  })
  setVisibility(
    @Param('offeringId') offeringId: string,
    @Body() dto: SetOfferingVisibilityDto,
    @Req() req: any,
  ) {
    return this.offeringsService.setVisibility(
      offeringId,
      req.user.userId,
      dto.isPublic,
    );
  }
}
