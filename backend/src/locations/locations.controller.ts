import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { MoveLocationDto } from './dto/move-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary:
      'Predictive search — location box-এ টাইপ করার সময় existing location suggest করতে',
  })
  search(
    @Query('q') q: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.locationsService.search(q ?? '', parentId);
  }

  @Get('children')
  @ApiOperation({
    summary:
      'একটা location-এর সরাসরি child list (parentId না দিলে root/country level)',
  })
  getChildren(@Query('parentId') parentId?: string) {
    return this.locationsService.getChildren(
      parentId ?? null,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Get(':id/descendants')
  @ApiOperation({
    summary:
      'এই location আর তার সব descendant-এর id (search scope বানাতে ব্যবহার হয়)',
  })
  getDescendants(@Param('id') id: string) {
    return this.locationsService.getDescendantIds(id);
  }

  @Get(':id/path')
  @ApiOperation({
    summary: 'Breadcrumb — root থেকে এই location পর্যন্ত পুরো chain',
  })
  getPath(@Param('id') id: string) {
    return this.locationsService.getPath(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'নতুন location তৈরি (আগে থেকে থাকলে existing-টাই ফেরত দেয়)',
  })
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }
  @Patch(':id/move')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[Admin] Location-কে (আর তার পুরো subtree-কে) অন্য parent-এর নিচে সরানো',
  })
  move(
    @Param('id') id: string,
    @Body() dto: MoveLocationDto,
  ) {
    return this.locationsService.move(
      id,
      dto.newParentId ?? null,
    );
  }
}

