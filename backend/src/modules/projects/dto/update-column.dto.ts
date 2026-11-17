import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateColumnDto {
    @ApiPropertyOptional({ example: 'Đã hoàn tất', description: 'Tên cột mới' })
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Tên cột không được để trống' })
    @MaxLength(100, { message: 'Tên cột tối đa 100 ký tự' })
    title?: string;

    @ApiPropertyOptional({ example: '#22c55e', description: 'Mã màu HEX mới của cột' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Mã màu không hợp lệ (VD: #22c55e)' })
    color?: string;

    @ApiPropertyOptional({ example: 2500, description: 'Thứ tự hiển thị của cột' })
    @IsOptional()
    @IsNumber()
    positionOrder?: number;
}
