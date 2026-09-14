import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
      include: {
        entities: true,
      },
    });
  }

  // NEW — [Admin] category আপডেট
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        slug: updateCategoryDto.slug,
      },
    });
  }

  // NEW — [Admin] category ডিলিট (কোনো business এখনো এই
  // category ব্যবহার করলে ডিলিট আটকানো হবে)
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entities: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (category._count.entities > 0) {
      throw new ConflictException(
        `Cannot delete "${category.name}" — ${category._count.entities} business(es) are still using this category. Reassign or remove them first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully.' };
  }
}