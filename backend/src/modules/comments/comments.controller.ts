import { Body, Controller, Delete, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post('tasks/:taskId/comments')
    @ApiOperation({ summary: 'Thêm bình luận mới vào công việc' })
    create(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Req() req: any,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentsService.create(taskId, req.user.id, dto);
    }

    @Delete('comments/:id')
    @ApiOperation({ summary: 'chỉ tài khoản bình luận mới có thể xoá' })
    remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        return this.commentsService.remove(id, req.user.id);
    }
}



