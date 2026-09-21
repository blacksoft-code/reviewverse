import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        'Parent category not found.',
      );
    }

    return this.prisma.subCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        categoryId: dto.categoryId,
      },
    });
  }

  // categoryId দিলে শুধু সেই category-র subcategory, না দিলে সব
  async findAll(categoryId?: string) {
    return this.prisma.subCategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async update(
    id: string,
    dto: UpdateSubCategoryDto,
  ) {
    const subCategory =
      await this.prisma.subCategory.findUnique({
        where: { id },
      });

    if (!subCategory) {
      throw new NotFoundException(
        'Subcategory not found.',
      );
    }

    return this.prisma.subCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        categoryId: dto.categoryId,
      },
    });
  }

  async remove(id: string) {
    const subCategory =
      await this.prisma.subCategory.findUnique({
        where: { id },
        include: {
          _count: { select: { entities: true } },
        },
      });

    if (!subCategory) {
      throw new NotFoundException(
        'Subcategory not found.',
      );
    }

    if (subCategory._count.entities > 0) {
      throw new ConflictException(
        `Cannot delete "${subCategory.name}" — ${subCategory._count.entities} business(es) are still using this subcategory.`,
      );
    }

    await this.prisma.subCategory.delete({
      where: { id },
    });

    return { message: 'Subcategory deleted successfully.' };
  }
}