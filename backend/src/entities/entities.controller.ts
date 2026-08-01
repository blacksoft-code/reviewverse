import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';

@Controller('entities')
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
  ) {}

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