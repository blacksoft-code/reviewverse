import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new category',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Only admins can create categories',
  })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(
      createCategoryDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all categories',
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a category by slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  findBySlug(
    @Param('slug') slug: string,
  ) {
    return this.categoriesService.findBySlug(
      slug,
    );
  }
}