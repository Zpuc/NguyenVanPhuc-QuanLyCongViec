import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator'

export class MoveTaskDto {
    @ApiProperty({ description: 'Id của 1 cột mới hoặc cột hiện tại' })
    @IsUUID('4')
    @IsNotEmpty()
    columnId: string;

    @ApiProperty({ example: '1500', description: 'Vị trí thứ tự mới sau khi kéo thả ' })
    @IsNumber()
    @IsNotEmpty()
    newPositionOrder: number;

}