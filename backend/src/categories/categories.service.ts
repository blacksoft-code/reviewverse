import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

async create(createCategoryDto: CreateCategoryDto) {
  return this.prisma.category.create({
    data: {
      name: createCategoryDto.name,
      slug: createCategoryDto.slug,
    },
  });
}
async findAll() {
  return this.prisma.category.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async findBySlug(slug: string) {
  return this.prisma.category.findUnique({
    where: {
      slug,
    },
  });
}

}