import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentMethodDto) {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException(
        `Payment method "${dto.name}" already exists.`,
      );
    }

    return this.prisma.paymentMethod.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    const paymentMethod =
      await this.prisma.paymentMethod.findUnique({
        where: { id },
      });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found.');
    }

    const duplicate = await this.prisma.paymentMethod.findFirst({
      where: {
        id: { not: id },
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        `Payment method "${dto.name}" already exists.`,
      );
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  // এই payment method যেসব business ব্যবহার করছে, তাদের থেকে link
  // সরিয়ে দিয়েই delete করা হয় — কোনো business break হবে না, শুধু ঐ
  // payment method তাদের list থেকে বাদ পড়ে যাবে।
  async remove(id: string) {
    const paymentMethod =
      await this.prisma.paymentMethod.findUnique({
        where: { id },
        include: { _count: { select: { entities: true } } },
      });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found.');
    }

    await this.prisma.paymentMethod.delete({ where: { id } });

    return {
      message: `Payment method deleted successfully${
        paymentMethod._count.entities > 0
          ? ` (removed from ${paymentMethod._count.entities} business(es))`
          : ''
      }.`,
    };
  }
}