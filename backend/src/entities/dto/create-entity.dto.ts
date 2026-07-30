import { IsNotEmpty } from 'class-validator';

export class CreateEntityDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  slug: string;

  @IsNotEmpty()
  categoryId: string;
}