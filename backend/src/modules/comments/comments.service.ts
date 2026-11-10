import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projectsService: ProjectsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(taskId: string, userId: string, dto: CreateCommentDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new NotFoundException('không tìm thấy công việc này ');
        }

        await this.projectsService.verifyProjectMember(task.projectId, userId);

        const comment = await this.prisma.taskComment.create({
            data: {
                taskId, userId, content: dto.content,
            },

            include: {
                user: {
                    select: { id: true, fullName: true, avatarUrl: true, email: true },
                },
            },
        });

        await this.prisma.activityLog.create({
            data: {
                projectId: task.projectId, taskId: taskId,
                userId, action: 'COMMENTED', newValue: { commentId: comment.id },
            },
        });

        const targetUser = task.assigneeId && task.assigneeId !== userId ? task.assigneeId : (task.reporterId !== userId ? task.reporterId : null);
        if (targetUser) {
            await this.notificationsService.create({
                recipientId: targetUser,
                title: 'Bình luận mới',
                content: `${comment.user.fullName} đã bình luận: "${dto.content.slice(0, 50)}${dto.content.length > 50 ? '...' : ''}" trong "${task.title}"`,
                type: 'COMMENT_ADDED',
                metadata: { projectId: task.projectId, taskId },
            });
        }

        return comment;
    }

    async remove(commentId: string, userId: string) {
        const comment = await this.prisma.taskComment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('không tìm thấy bình luận');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền xoá bình luận của người khác');
        }

        await this.prisma.taskComment.delete({
            where: { id: commentId },
        });

        return { message: 'xoá bình luận thành công' };
    }



}