import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma/prisma.service';

export interface JwtPayload {
    sub: string;
    email: string;
    systemRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                systemRole: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
        }

        return user;
    }
}