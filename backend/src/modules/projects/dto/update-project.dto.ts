import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProjectDto {
    @ApiPropertyOptional({ example: 'Website Thương mại Điện tử v2' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @ApiPropertyOptional({ example: 'Mô tả dự án cập nhật' })
    @IsOptional()
    @IsString()
    description?: string;
}

