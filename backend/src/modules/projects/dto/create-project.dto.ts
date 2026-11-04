import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, Matches, MaxLength } from "class-validator"


export class CreateProjectDto {
    @ApiProperty({ example: 'Hệ Thống Thương mại điện tử', description: 'tên dự án' })
    @IsString()
    @IsNotEmpty({ message: 'tên dự án không để trống' })
    @MaxLength(100)
    name: string;

    @ApiProperty({
        example: 'Ecom',
        description: 'Mã viết tắt dự án gồm 2-10 ký tự chữ in hoa / số',
    })
    @IsString()
    @IsNotEmpty({ message: 'Mã dự án là key không được để trống' })
    @Matches(/^[A-Z0-9]{2,10}$/, {
        message: 'Mã dự án (key) phải từ 2-10 ký tự, chỉ gồm chữ IN HOA và số (VD: WEB, ECOM)',
    })
    key: string;

    @ApiPropertyOptional({ example: 'Dự án xây dựng website bán hàng trực tuyến' })
    @IsOptional()
    @IsString()
    description?: string;

}