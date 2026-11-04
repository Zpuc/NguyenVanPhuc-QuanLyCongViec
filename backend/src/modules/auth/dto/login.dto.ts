import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'nguyenvanphuc@gmail.com' })
    @IsEmail({}, { message: 'email không hợp lệ' })
    @IsNotEmpty({ message: 'email không được để trống' })
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty({ message: 'mật khẩu không được để trống' })
    password: string;
}