import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

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
    @ApiOperation({ summary: 'Đăng nhập nhạn JWT Access Token' })
    loggin(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Lấy thông tin người dùng đăng nhập' })
    getProfile(@Req() req: any) {
        return req.user
    }

}

