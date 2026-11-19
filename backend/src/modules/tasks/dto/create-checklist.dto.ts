import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChecklistDto {
  @ApiProperty({ example: 'Tạo bảng trong database' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề việc con không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề không được vượt quá 255 ký tự' })
  title: string;
}
