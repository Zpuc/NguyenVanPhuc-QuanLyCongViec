import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';


@ApiTags('Tasks Quản lý công việc và Kanban')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo công việc mới (Tự động đánh số taskNumber và xếp cuối cột)' })
    create(@Req() req: any, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(req.user.id, dto);
    }
    @Get(':id')
    @ApiOperation({ summary: 'Xem chi tiết công việc (Kèm bình luận, tệp đính kèm)' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        return this.tasksService.findOne(id, req.user.id);
    }
    @Patch(':id/move')
    @ApiOperation({ summary: 'Kéo thả công việc trên bảng Kanban (Cập nhật Cột & Vị trí)' })
    moveTask(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
        @Body() dto: MoveTaskDto,
    ) {
        return this.tasksService.moveTask(id, req.user.id, dto);
    }
    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin công việc (Tiêu đề, Người làm, Hạn chót...)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(id, req.user.id, dto);
    }
    @Delete(':id')
    @ApiOperation({ summary: 'Xóa công việc' })
    remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        return this.tasksService.remove(id, req.user.id);
    }
}









