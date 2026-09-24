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

@ApiTags('Offerings')
@Controller('offerings')
export class OfferingsController {
  constructor(
    private readonly offeringsService: OfferingsService,
  ) {}

  // PUBLIC — সবাই দেখতে পাবে

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Public offering list for a business' })
  findByEntity(@Param('entityId') entityId: string) {
    return this.offeringsService.findByEntity(entityId);
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
}
