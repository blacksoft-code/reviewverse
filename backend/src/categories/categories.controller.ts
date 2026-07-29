import { Body, Controller, Post, Get, Param, } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(
      createCategoryDto,
    );
  }

@Get()
findAll() {
  return this.categoriesService.findAll();
}

@Get(':slug')
findBySlug(
  @Param('slug') slug: string,
) {
  return this.categoriesService.findBySlug(
    slug,
  );
}

}