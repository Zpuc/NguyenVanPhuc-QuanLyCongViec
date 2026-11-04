import { ApiPropertyOptional } from '@nestjs/swagger'
import { TaskPriority } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
export class UpdateTaskDto {
    @ApiPropertyOptional({ example: 'Cập nhập tiêu đề mới ' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'cập nhập mô tả mới' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: TaskPriority })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority

    @ApiPropertyOptional({ description: 'Gắn người làm mới' })
    @IsOptional()
    @IsUUID('4')
    assigneeId?: string;

    @ApiPropertyOptional({ description: 'Hạn chót mới ' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}