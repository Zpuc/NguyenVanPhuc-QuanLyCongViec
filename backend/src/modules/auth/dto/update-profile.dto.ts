import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({ example: 'Nguyễn Văn Phúc' })
    @IsString()
    @IsNotEmpty({ message: 'Họ và tên không được để trống' })
    @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
    fullName: string;
}

