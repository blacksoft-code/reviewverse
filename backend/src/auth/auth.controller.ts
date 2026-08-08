import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists or validation failed',
  })
  register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto,
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getProfile(@Req() req: any) {
    return req.user;
  }
}