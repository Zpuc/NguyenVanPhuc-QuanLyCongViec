import {
    Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('Projects (Quản lý Dự án)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo dự án mới ' })
    create(@Req() req: any, @Body() dto: CreateProjectDto) {
        return this.projectsService.create(req.user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách các dự án tôi đang tham gia' })
    findAllMyProjects(@Req() req: any) {
        return this.projectsService.findAllMyProjects(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Xem chi tiết dự án ' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        return this.projectsService.findOne(id, req.user.id);
    }

    @Post(':id/members')
    @ApiOperation({ summary: 'Mời thêm thành viên vào dự án qua Email' })
    addMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
        @Body() dto: AddMemberDto,
    ) {
        return this.projectsService.addMember(id, req.user.id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa dự án (Chỉ OWNER)' })
    remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        return this.projectsService.remove(id, req.user.id);
    }


}