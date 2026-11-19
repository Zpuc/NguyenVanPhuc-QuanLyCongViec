import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
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
    @Patch('profile/avatar')
    @ApiOperation({ summary: 'Tải lên và cập nhật ảnh đại diện' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    const uploadPath = join(process.cwd(), 'uploads');
                    if (!existsSync(uploadPath)) {
                        mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (_req, file, cb) => {
                    const uniqueSuffix = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/i)) {
                    return cb(new BadRequestException('Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp, gif)'), false);
                }
                cb(null, true);
            },
        }),
    )
    uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        return this.authService.updateAvatar(req.user.id, file);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('change-password')
    @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
    changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }
}
