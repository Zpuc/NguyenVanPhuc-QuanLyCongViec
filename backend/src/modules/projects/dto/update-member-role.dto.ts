import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ProjectRole, example: ProjectRole.ADMIN })
  @IsEnum(ProjectRole, { message: 'Vai trò không hợp lệ' })
  @IsNotEmpty()
  role: ProjectRole;
}
