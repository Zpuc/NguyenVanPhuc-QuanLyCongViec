import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";
import { ProjectRole } from "@prisma/client";


export class AddMemberDto {
    @ApiProperty({ example: 'thanhvien@gmail.com', description: 'Email của người muốn mời vào dự án' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty()
    email: string;

    @ApiProperty({ enum: ProjectRole, default: ProjectRole.MEMBER })
    @IsEnum(ProjectRole, { message: 'Quyền không hợp lệ ' })
    role: ProjectRole;
}