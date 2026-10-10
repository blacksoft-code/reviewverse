import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

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
  @UseGuards(OptionalJwtAuthGuard)
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
    @Req() req: any,
  ) {
    return this.searchService.search(
      query,
      req.user?.userId ?? null,
    );
  }
}