import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { SearchService } from './search.service';

import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Search users and entities',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'john',
    description:
      'Search query for users and entities',
  })
  @ApiResponse({
    status: 200,
    description:
      'Users and entities matching the search query',
  })
  search(
    @Query('q') query: string,
  ) {
    return this.searchService.search(query);
  }
}