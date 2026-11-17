import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateTaskDto {
    @ApiPropertyOptional({ example: 'Cập nhập tiêu đề mới' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'Cập nhập mô tả mới' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: TaskPriority })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ description: 'Gắn người làm mới', nullable: true })
    @IsOptional()
    @ValidateIf((o) => o.assigneeId !== null)
    @IsUUID('4')
    assigneeId?: string | null;

    @ApiPropertyOptional({ description: 'Hạn chót mới', nullable: true })
    @IsOptional()
    @ValidateIf((o) => o.dueDate !== null)
    @IsDateString()
    dueDate?: string | null;
}
