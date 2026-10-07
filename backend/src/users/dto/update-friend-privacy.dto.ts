import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FriendListVisibility } from '@prisma/client';

export class UpdateFriendPrivacyDto {
  @ApiProperty({
    enum: FriendListVisibility,
    example: 'FRIENDS',
    description:
      'কে friend list দেখতে পাবে — PUBLIC (সবাই), FRIENDS (শুধু friends), PRIVATE (শুধু নিজে)',
  })
  @IsEnum(FriendListVisibility)
  friendListVisibility: FriendListVisibility;
}
