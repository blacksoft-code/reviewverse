import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('entities')
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')

  @Post()
  create(
    @Body() createEntityDto: CreateEntityDto,
  ) {
    return this.entitiesService.create(
      createEntityDto,
    );
  }

@Get()
findAll(
  @Query('page') page = '1',
  @Query('limit') limit = '10',
) {
  return this.entitiesService.findAll(
    Number(page),
    Number(limit),
  );
}

@Get('search')
search(
  @Query('q') query: string,
) {
  return this.entitiesService.search(query);
}

@Get('top-rated')
getTopRated() {
  return this.entitiesService.getTopRated();
}

@Get(':slug')
findOne(
  @Param('slug') slug: string,
) {
  return this.entitiesService.findOne(slug);
}

}