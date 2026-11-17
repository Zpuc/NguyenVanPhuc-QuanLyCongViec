import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth(xác thực)')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập nhận JWT Access Token' })
    loggin(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Lấy thông tin người dùng đăng nhập' })
    getProfile(@Req() req: any) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('profile')
    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
    updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('change-password')
    @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
    changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }
}
