import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({
  summary: 'Create a new business',
})
@ApiResponse({
  status: 201,
  description: 'Business created successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
create(
  @Body() createEntityDto: CreateEntityDto,
  @Req() req: any,
) {
  // NEW:
  // JWT strategy থেকে authenticated user's information
  // req.user-এর মধ্যে পাওয়া যাচ্ছে।
  //
  // এখান থেকে user.id নিয়ে service-এ পাঠাচ্ছি।
  return this.entitiesService.create(
    createEntityDto,
    req.user.id,
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