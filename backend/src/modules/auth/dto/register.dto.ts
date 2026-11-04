import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'NguyenVanPhuc@gmail.com', description: 'Email đăng ký ' })
    @IsEmail({}, { message: 'không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu tối thiểu 6 ký tự ' })
    @IsString()
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    password: string;

    @ApiProperty({ example: 'Nguyễn Văn Phúc', description: 'Họ và tên' })
    @IsString()
    @IsNotEmpty({ message: 'Họ và tên không được để trống' })
    fullName: string;
}


