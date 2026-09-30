import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';

@Injectable()
export class AmenitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAmenityDto) {
    const existing = await this.prisma.amenity.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException(
        `Amenity "${dto.name}" already exists.`,
      );
    }

    return this.prisma.amenity.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.amenity.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateAmenityDto) {
    const amenity = await this.prisma.amenity.findUnique({
      where: { id },
    });

    if (!amenity) {
      throw new NotFoundException('Amenity not found.');
    }

    const duplicate = await this.prisma.amenity.findFirst({
      where: {
        id: { not: id },
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        `Amenity "${dto.name}" already exists.`,
      );
    }

    return this.prisma.amenity.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  // এই amenity যেসব business ব্যবহার করছে, তাদের থেকে link সরিয়ে
  // দিয়েই delete করা হয় — কোনো business break হবে না, শুধু ঐ
  // amenity তাদের list থেকে বাদ পড়ে যাবে।
  async remove(id: string) {
    const amenity = await this.prisma.amenity.findUnique({
      where: { id },
      include: { _count: { select: { entities: true } } },
    });

    if (!amenity) {
      throw new NotFoundException('Amenity not found.');
    }

    await this.prisma.amenity.delete({ where: { id } });

    return {
      message: `Amenity deleted successfully${
        amenity._count.entities > 0
          ? ` (removed from ${amenity._count.entities} business(es))`
          : ''
      }.`,
    };
  }
}