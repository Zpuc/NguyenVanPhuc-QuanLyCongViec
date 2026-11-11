import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'MatKhauCu123' })
    @IsString()
    @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
    currentPassword: string;

    @ApiProperty({ example: 'MatKhauMoi123' })
    @IsString()
    @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    newPassword: string;
}

