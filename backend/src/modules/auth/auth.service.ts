import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email này đã được sử dụng');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                systemRole: true,
                createdAt: true,
            },
        });

        const accessToken = await this.signToken(user.id, user.email, user.systemRole);

        return {
            message: 'Đăng ký tài khoản thành công',
            user,
            accessToken,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
        }

        const isPasswordMatching = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordMatching) {
            throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
        }

        const accessToken = await this.signToken(user.id, user.email, user.systemRole);

        return {
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                systemRole: user.systemRole,
            },
            accessToken,
        };
    }


    async updateProfile(userId: string, dto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { fullName: dto.fullName.trim() },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                systemRole: true,
                createdAt: true,
            },
        });
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy tài khoản');
        }

        const isPasswordMatching = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
        );

        if (!isPasswordMatching) {
            throw new BadRequestException('Mật khẩu hiện tại không chính xác');
        }

        const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        return { message: 'Đổi mật khẩu thành công' };
    }

    private async signToken(userId: string, email: string, systemRole: string) {
        const payload = { sub: userId, email, systemRole };
        return this.jwtService.signAsync(payload);
    }
}