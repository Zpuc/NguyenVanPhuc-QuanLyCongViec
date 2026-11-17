import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projectsService: ProjectsService,
        private readonly notificationsService: NotificationsService,
    ) { }


    async create(userId: string, dto: CreateTaskDto) {
        const member = await this.projectsService.verifyProjectMember(dto.projectId, userId);

        if (member.role !== 'OWNER' && member.role !== 'ADMIN') {
            throw new ForbiddenException('Chỉ Chủ dự án hoặc Quản trị viên mới có quyền tạo công việc');
        }

        const column = await this.prisma.boardColumn.findFirst({
            where: { id: dto.columnId, projectId: dto.projectId },
        });
        if (!column) {
            throw new BadRequestException('Cột trạng thái không tồn tại trong dự án này');
        }

        const result = await this.prisma.$transaction(async (tx) => {

            const lastTask = await tx.task.findFirst({
                where: { projectId: dto.projectId },
                orderBy: { taskNumber: 'desc' },
                select: { taskNumber: true },
            });
            const nextTaskNumber = (lastTask?.taskNumber || 0) + 1;


            const lastPosition = await tx.task.findFirst({
                where: { columnId: dto.columnId },
                orderBy: { positionOrder: 'desc' },
                select: { positionOrder: true },
            });
            const nextPositionOrder = (lastPosition?.positionOrder || 0) + 1000;


            const task = await tx.task.create({
                data: {
                    projectId: dto.projectId,
                    columnId: dto.columnId,
                    taskNumber: nextTaskNumber,
                    title: dto.title,
                    description: dto.description,
                    priority: dto.priority,
                    assigneeId: dto.assigneeId,
                    reporterId: userId,
                    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                    positionOrder: nextPositionOrder,
                },
                include: {
                    assignee: {
                        select: { id: true, fullName: true, email: true, avatarUrl: true },
                    },
                    reporter: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
            });


            await tx.activityLog.create({
                data: {
                    projectId: dto.projectId,
                    taskId: task.id,
                    userId,
                    action: 'CREATED_TASK',
                    newValue: { title: task.title, taskNumber: task.taskNumber },
                },
            });

            return task;
        });

        if (dto.assigneeId && dto.assigneeId !== userId) {
            const project = await this.prisma.project.findUnique({
                where: { id: dto.projectId },
                select: { name: true, key: true },
            });
            await this.notificationsService.create({
                recipientId: dto.assigneeId,
                title: 'Giao việc mới',
                content: `Bạn được giao công việc "${result.title}" (${project?.key}-${result.taskNumber})`,
                type: 'TASK_ASSIGNED',
                metadata: { projectId: dto.projectId, taskId: result.id },
            });
        }

        return result;
    }

    async findOne(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: { select: { id: true, name: true, key: true } },
                column: { select: { id: true, title: true, color: true } },
                assignee: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                reporter: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                comments: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true, avatarUrl: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    include: {
                        uploadedBy: { select: { id: true, fullName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                activityLogs: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true, avatarUrl: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        await this.projectsService.verifyProjectMember(task.projectId, userId);

        return task;
    }

    async moveTask(taskId: string, userId: string, dto: MoveTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        const member = await this.projectsService.verifyProjectMember(task.projectId, userId);

        const isOwnerOrAdmin = member.role === 'OWNER' || member.role === 'ADMIN';
        const isAssignee = task.assigneeId === userId;

        if (!isOwnerOrAdmin && !isAssignee) {
            throw new ForbiddenException('Bạn chỉ có thể kéo thả công việc được giao cho chính bạn');
        }

        const oldColumnId = task.columnId;

        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                columnId: dto.columnId,
                positionOrder: dto.newPositionOrder,
            },
        });

        if (oldColumnId !== dto.columnId) {
            const [oldCol, newCol] = await Promise.all([
                this.prisma.boardColumn.findUnique({ where: { id: oldColumnId }, select: { title: true } }),
                this.prisma.boardColumn.findUnique({ where: { id: dto.columnId }, select: { title: true } }),
            ]);

            await this.prisma.activityLog.create({
                data: {
                    projectId: task.projectId,
                    taskId: task.id,
                    userId,
                    action: 'MOVED_COLUMN',
                    oldValue: { columnId: oldColumnId, columnTitle: oldCol?.title },
                    newValue: { columnId: dto.columnId, columnTitle: newCol?.title },
                },
            });
        }

        return updatedTask;
    }

    async update(taskId: string, userId: string, dto: UpdateTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        const member = await this.projectsService.verifyProjectMember(task.projectId, userId);
        if (member.role === 'VIEWER') {
            throw new ForbiddenException('Người xem (VIEWER) không có quyền chỉnh sửa công việc');
        }

        const dueDateValue =
            dto.dueDate === undefined ? undefined : dto.dueDate === null ? null : new Date(dto.dueDate);

        const updated = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                title: dto.title,
                description: dto.description,
                priority: dto.priority,
                assigneeId: dto.assigneeId,
                dueDate: dueDateValue,
            },
            include: {
                project: { select: { id: true, name: true, key: true } },
                column: { select: { id: true, title: true, color: true } },
                assignee: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                reporter: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
            },
        });

        if (dto.assigneeId && dto.assigneeId !== userId && dto.assigneeId !== task.assigneeId) {
            await this.notificationsService.create({
                recipientId: dto.assigneeId,
                title: 'Giao việc mới',
                content: `Bạn được giao công việc "${updated.title}" (${updated.project.key}-${updated.taskNumber})`,
                type: 'TASK_ASSIGNED',
                metadata: { projectId: task.projectId, taskId },
            });
        }

        const changedFields: string[] = [];
        if (dto.title !== undefined && dto.title !== task.title) changedFields.push('tiêu đề');
        if (dto.description !== undefined && dto.description !== task.description) changedFields.push('mô tả');
        if (dto.priority !== undefined && dto.priority !== task.priority) changedFields.push('độ ưu tiên');
        if (dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId) changedFields.push('người thực hiện');
        if (dto.dueDate !== undefined) changedFields.push('hạn chót');

        if (changedFields.length > 0) {
            await this.prisma.activityLog.create({
                data: {
                    projectId: task.projectId,
                    taskId,
                    userId,
                    action: 'UPDATED_TASK',
                    newValue: { fields: changedFields },
                },
            });
        }

        return updated;
    }

    async uploadAttachment(taskId: string, userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Vui lòng chọn tệp để tải lên');
        }

        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        const member = await this.projectsService.verifyProjectMember(task.projectId, userId);
        if (member.role === 'VIEWER') {
            throw new ForbiddenException('Người xem (VIEWER) không có quyền tải tệp đính kèm');
        }

        const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        const attachment = await this.prisma.taskAttachment.create({
            data: {
                taskId,
                uploadedById: userId,
                fileName: decodedName,
                fileUrl: `/uploads/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype,
            },
            include: {
                uploadedBy: { select: { id: true, fullName: true } },
            },
        });

        await this.prisma.activityLog.create({
            data: {
                projectId: task.projectId,
                taskId,
                userId,
                action: 'ATTACHED_FILE',
                newValue: { fileName: decodedName },
            },
        });

        return attachment;
    }

    async removeAttachment(attachmentId: string, userId: string) {
        const attachment = await this.prisma.taskAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                task: { select: { projectId: true } },
            },
        });

        if (!attachment) {
            throw new NotFoundException('Không tìm thấy tệp đính kèm');
        }

        const member = await this.projectsService.verifyProjectMember(attachment.task.projectId, userId);
        const isOwnerOrAdmin = member.role === 'OWNER' || member.role === 'ADMIN';
        if (attachment.uploadedById !== userId && !isOwnerOrAdmin) {
            throw new ForbiddenException('Bạn không có quyền xóa tệp đính kèm này');
        }

        const fileName = attachment.fileUrl.replace(/^\/uploads\//, '');
        const filePath = join(process.cwd(), 'uploads', fileName);
        try {
            unlinkSync(filePath);
        } catch {
        }

        await this.prisma.taskAttachment.delete({
            where: { id: attachmentId },
        });

        return { message: 'Đã xóa tệp đính kèm thành công' };
    }

    async remove(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        const member = await this.projectsService.verifyProjectMember(task.projectId, userId);
        if (member.role === 'VIEWER') {
            throw new ForbiddenException('Người xem (VIEWER) không có quyền xóa công việc');
        }

        await this.prisma.task.delete({
            where: { id: taskId },
        });

        return { message: 'Đã xóa công việc thành công' };
    }
}