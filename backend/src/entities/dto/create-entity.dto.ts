import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEntityDto {
  @ApiProperty({
    example: 'Burger King',
    description: 'Name of the entity',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'burger-king',
    description: 'Unique URL-friendly slug',
  })
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'dd157393-34c8-4eb5-9346-0dd7da9a78bb',
    description: 'ID of the category this entity belongs to',
  })
  @IsNotEmpty()
  categoryId: string;
}