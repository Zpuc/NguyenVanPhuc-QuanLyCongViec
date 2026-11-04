import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projectsService: ProjectsService,
    ) { }


    async create(userId: string, dto: CreateTaskDto) {

        await this.projectsService.verifyProjectMember(dto.projectId, userId);


        const column = await this.prisma.boardColumn.findFirst({
            where: { id: dto.columnId, projectId: dto.projectId },
        });
        if (!column) {
            throw new BadRequestException('Cột trạng thái không tồn tại trong dự án này');
        }

        return this.prisma.$transaction(async (tx) => {

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

        await this.projectsService.verifyProjectMember(task.projectId, userId);

        const oldColumnId = task.columnId;

        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                columnId: dto.columnId,
                positionOrder: dto.newPositionOrder,
            },
        });

        if (oldColumnId !== dto.columnId) {
            await this.prisma.activityLog.create({
                data: {
                    projectId: task.projectId,
                    taskId: task.id,
                    userId,
                    action: 'MOVED_COLUMN',
                    oldValue: { columnId: oldColumnId },
                    newValue: { columnId: dto.columnId },
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

        await this.projectsService.verifyProjectMember(task.projectId, userId);

        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                title: dto.title,
                description: dto.description,
                priority: dto.priority,
                assigneeId: dto.assigneeId,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            },
        });
    }

    async remove(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        await this.projectsService.verifyProjectMember(task.projectId, userId);

        await this.prisma.task.delete({
            where: { id: taskId },
        });

        return { message: 'Đã xóa công việc thành công' };
    }
}