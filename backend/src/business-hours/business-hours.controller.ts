import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { BusinessHoursService } from './business-hours.service';
import { SetBusinessHoursDto } from './dto/set-business-hours.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';

@ApiTags('Business Hours')
@Controller('entities/:entityId/business-hours')
export class BusinessHoursController {
  constructor(
    private readonly businessHoursService: BusinessHoursService,
    private readonly entityMemberships: EntityMembershipsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'এই entity-র সব day-র business hours + বর্তমানে খোলা আছে কিনা (isOpenNow)',
  })
  async get(@Param('entityId') entityId: string) {
    const [hours, isOpenNow] = await Promise.all([
      this.businessHoursService.findForEntity(entityId),
      this.businessHoursService.isOpenNow(entityId),
    ]);

    return { hours, isOpenNow };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Owner/Manager/Employee — এক বা একাধিক day-র business hours সেট করা',
  })
  async set(
    @Param('entityId') entityId: string,
    @Req() req: any,
    @Body() dto: SetBusinessHoursDto,
  ) {
    const hasAccess = await this.entityMemberships.hasAccess(
      entityId,
      req.user.userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can edit business hours.',
      );
    }

    return this.businessHoursService.setForEntity(
      entityId,
      dto.hours,
    );
  }
}