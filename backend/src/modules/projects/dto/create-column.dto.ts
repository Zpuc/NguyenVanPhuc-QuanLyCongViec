import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateColumnDto {
    @ApiProperty({ example: 'Đang kiểm thử', description: 'Tên cột trạng thái' })
    @IsString()
    @IsNotEmpty({ message: 'Tên cột không được để trống' })
    @MaxLength(100, { message: 'Tên cột tối đa 100 ký tự' })
    title: string;

    @ApiPropertyOptional({ example: '#8b5cf6', description: 'Mã màu HEX của cột' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Mã màu không hợp lệ (VD: #3b82f6)' })
    color?: string;
}
