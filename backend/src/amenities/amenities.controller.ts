import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AmenitiesService } from './amenities.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(
    private readonly amenitiesService: AmenitiesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a new amenity' })
  create(@Body() dto: CreateAmenityDto) {
    return this.amenitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all amenities (master list)' })
  findAll() {
    return this.amenitiesService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Rename an amenity' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAmenityDto,
  ) {
    return this.amenitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete an amenity' })
  remove(@Param('id') id: string) {
    return this.amenitiesService.remove(id);
  }
}