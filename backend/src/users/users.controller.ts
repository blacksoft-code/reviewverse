import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { UsersService } from './users.service';

import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get public user profile',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns public user profile with reviews',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  findPublicProfile(
    @Param('id') id: string,
  ) {
    return this.usersService.findPublicProfile(id);
  }
}