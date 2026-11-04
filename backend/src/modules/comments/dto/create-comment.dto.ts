import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateCommentDto {
    @ApiProperty({ example: 'Tôi đã làm xong yêu cầu' })
    @IsString()
    @IsNotEmpty({ message: 'Nội dung bình luộn không được để trống' })
    content: string;
}