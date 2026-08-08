import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UseGuards, Get, Req } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

@Get('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
getProfile(@Req() req: any) {
  return req.user;
}
}