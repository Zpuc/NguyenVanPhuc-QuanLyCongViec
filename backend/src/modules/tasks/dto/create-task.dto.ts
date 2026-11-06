import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TaskPriority } from '@prisma/client'
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateTaskDto {
    @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ID của dự án' })
    @IsUUID('4', { message: 'projectId phải là định dạng UUID ' })
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'ID của cột kanban' })
    @IsUUID('4', { message: 'columnId phải là dạng UUID' })
    @IsNotEmpty()
    columnId: string;

    @ApiProperty({ example: 'Thiết kế giao diện trang đăng nhập' })
    @IsString()
    @IsNotEmpty({ message: 'Tiêu đề công việc không được để trống' })
    title: string;

    @ApiPropertyOptional({ example: 'chi tiết công việc' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ example: 'UUID của thành viên ã được giao việc ' })
    @IsOptional()
    @IsUUID('4')
    assigneeId?: string;

    @ApiPropertyOptional({ example: '2026-11-20T17:00:00Z', description: 'hạn chót' })
    @IsOptional()
    @IsDateString({}, { message: 'dueDate phải là chuỗi định dạng ngày ISO-8601' })
    dueDate?: string;

}