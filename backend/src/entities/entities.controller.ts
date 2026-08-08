import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Entities')
@Controller('entities')
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new entity',
  })
  @ApiResponse({
    status: 201,
    description: 'Entity created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Only admins can create entities',
  })
  create(
    @Body() createEntityDto: CreateEntityDto,
  ) {
    return this.entitiesService.create(
      createEntityDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all entities with pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of entities per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of entities',
  })
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
  @ApiOperation({
    summary: 'Search entities by name',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'burger',
    description: 'Search keyword',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching entities',
  })
  search(
    @Query('q') query: string,
  ) {
    return this.entitiesService.search(query);
  }

  @Get('top-rated')
  @ApiOperation({
    summary: 'Get top-rated entities',
  })
  @ApiResponse({
    status: 200,
    description: 'Entities sorted by average rating',
  })
  getTopRated() {
    return this.entitiesService.getTopRated();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get an entity by slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity details with reviews',
  })
  @ApiResponse({
    status: 404,
    description: 'Entity not found',
  })
  findOne(
    @Param('slug') slug: string,
  ) {
    return this.entitiesService.findOne(slug);
  }
}