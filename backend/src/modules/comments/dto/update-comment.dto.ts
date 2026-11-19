import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateCommentDto {
    @ApiProperty({ example: 'Cập nhật nội dung bình luận' })
    @IsString()
    @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
    content: string;
}
