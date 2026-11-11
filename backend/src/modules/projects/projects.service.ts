import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectRole } from '@prisma/client';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(userId: string, dto: CreateProjectDto) {
        return this.prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    name: dto.name,
                    key: dto.key.toUpperCase(),
                    description: dto.description,
                    ownerId: userId,
                },
            });

            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: userId,
                    role: ProjectRole.OWNER,
                },
            });

            const defaultColumns = [
                { title: 'Cần làm (TODO)', color: '#64748b', positionOrder: 1000 },
                { title: 'Đang thực hiện', color: '#3b82f6', positionOrder: 2000 },
                { title: 'Đang kiểm tra (Review)', color: '#f59e0b', positionOrder: 3000 },
                { title: 'Hoàn thành (Done)', color: '#22c55e', positionOrder: 4000 },
            ];

            await tx.boardColumn.createMany({
                data: defaultColumns.map((col) => ({
                    projectId: project.id,
                    title: col.title,
                    color: col.color,
                    positionOrder: col.positionOrder,
                })),
            });

            return project;
        });
    }

    async findAllMyProjects(userId: string) {
        return this.prisma.project.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            include: {
                owner: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                _count: {
                    select: { members: true, tasks: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(projectId: string, userId: string) {
        await this.verifyProjectMember(projectId, userId);

        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true, avatarUrl: true },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                columns: {
                    orderBy: { positionOrder: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { positionOrder: 'asc' },
                            include: {
                                assignee: {
                                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                                },
                                _count: {
                                    select: { comments: true, attachments: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            throw new NotFoundException('Không tìm thấy dự án');
        }

        return project;
    }

    async addMember(projectId: string, currentUserId: string, dto: AddMemberDto) {
        const currentMember = await this.verifyProjectMember(projectId, currentUserId);

        if (
            currentMember.role !== ProjectRole.OWNER &&
            currentMember.role !== ProjectRole.ADMIN
        ) {
            throw new ForbiddenException('Chỉ Chủ dự án (OWNER) hoặc Quản trị viên (ADMIN) mới được thêm thành viên');
        }

        const userToInvite = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!userToInvite) {
            throw new NotFoundException(`Không tìm thấy người dùng nào có email "${dto.email}"`);
        }

        const alreadyMember = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userToInvite.id,
                },
            },
        });

        if (alreadyMember) {
            throw new ConflictException('Người dùng này đã là thành viên của dự án');
        }

        const newMember = await this.prisma.projectMember.create({
            data: {
                projectId,
                userId: userToInvite.id,
                role: dto.role,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                project: {
                    select: { id: true, name: true, key: true },
                },
            },
        });

        await this.notificationsService.create({
            recipientId: userToInvite.id,
            title: 'Dự án mới',
            content: `Bạn vừa được mời tham gia dự án "${newMember.project.name}" (${newMember.project.key})`,
            type: 'PROJECT_INVITED',
            metadata: { projectId },
        });

        return newMember;
    }

    async updateMemberRole(projectId: string, currentUserId: string, targetUserId: string, newRole: ProjectRole) {
        const currentMember = await this.verifyProjectMember(projectId, currentUserId);

        if (currentMember.role !== ProjectRole.OWNER) {
            throw new ForbiddenException('Chỉ Chủ dự án (OWNER) mới có quyền thay đổi vai trò thành viên');
        }

        const targetMember = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId: targetUserId },
            },
        });

        if (!targetMember) {
            throw new NotFoundException('Không tìm thấy thành viên này trong dự án');
        }

        if (targetMember.role === ProjectRole.OWNER) {
            throw new BadRequestException('Không thể thay đổi vai trò của Chủ dự án');
        }

        return this.prisma.projectMember.update({
            where: {
                projectId_userId: { projectId, userId: targetUserId },
            },
            data: { role: newRole },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
            },
        });
    }

    async removeMember(projectId: string, currentUserId: string, targetUserId: string) {
        const currentMember = await this.verifyProjectMember(projectId, currentUserId);

        const isSelf = currentUserId === targetUserId;
        const isOwnerOrAdmin = currentMember.role === ProjectRole.OWNER || currentMember.role === ProjectRole.ADMIN;

        if (!isSelf && !isOwnerOrAdmin) {
            throw new ForbiddenException('Bạn không có quyền xóa thành viên này khỏi dự án');
        }

        const targetMember = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId: targetUserId },
            },
        });

        if (!targetMember) {
            throw new NotFoundException('Không tìm thấy thành viên này trong dự án');
        }

        if (targetMember.role === ProjectRole.OWNER) {
            throw new BadRequestException('Không thể xóa Chủ dự án ra khỏi dự án');
        }

        await this.prisma.$transaction([
            this.prisma.task.updateMany({
                where: { projectId, assigneeId: targetUserId },
                data: { assigneeId: null },
            }),
            this.prisma.projectMember.delete({
                where: {
                    projectId_userId: { projectId, userId: targetUserId },
                },
            }),
        ]);

        return { message: 'Đã xóa thành viên khỏi dự án thành công' };
    }

    async update(projectId: string, userId: string, dto: UpdateProjectDto) {
        await this.verifyProjectAdmin(
            projectId,
            userId,
            'Chỉ Chủ dự án (OWNER) hoặc Quản trị viên (ADMIN) mới có quyền sửa thông tin dự án',
        );

        return this.prisma.project.update({
            where: { id: projectId },
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }

    async createColumn(projectId: string, userId: string, dto: CreateColumnDto) {
        await this.verifyProjectAdmin(
            projectId,
            userId,
            'Chỉ Chủ dự án (OWNER) hoặc Quản trị viên (ADMIN) mới có quyền thêm cột trạng thái',
        );

        const maxOrder = await this.prisma.boardColumn.aggregate({
            where: { projectId },
            _max: { positionOrder: true },
        });

        const nextOrder = (maxOrder._max.positionOrder ?? 0) + 1000;

        return this.prisma.boardColumn.create({
            data: {
                projectId,
                title: dto.title.trim(),
                color: dto.color || '#64748b',
                positionOrder: nextOrder,
            },
            include: {
                tasks: true,
            },
        });
    }

    async updateColumn(
        projectId: string,
        columnId: string,
        userId: string,
        dto: UpdateColumnDto,
    ) {
        await this.verifyProjectAdmin(
            projectId,
            userId,
            'Chỉ Chủ dự án (OWNER) hoặc Quản trị viên (ADMIN) mới có quyền chỉnh sửa cột trạng thái',
        );

        const column = await this.prisma.boardColumn.findFirst({
            where: { id: columnId, projectId },
        });

        if (!column) {
            throw new NotFoundException('Không tìm thấy cột trạng thái trong dự án');
        }

        const data: { title?: string; color?: string; positionOrder?: number } = {};
        if (dto.title !== undefined) {
            data.title = dto.title.trim();
        }
        if (dto.color !== undefined) {
            data.color = dto.color;
        }
        if (dto.positionOrder !== undefined) {
            data.positionOrder = dto.positionOrder;
        }

        return this.prisma.boardColumn.update({
            where: { id: columnId },
            data,
        });
    }

    async deleteColumn(projectId: string, columnId: string, userId: string) {
        await this.verifyProjectAdmin(
            projectId,
            userId,
            'Chỉ Chủ dự án (OWNER) hoặc Quản trị viên (ADMIN) mới có quyền xóa cột trạng thái',
        );

        const column = await this.prisma.boardColumn.findFirst({
            where: { id: columnId, projectId },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });

        if (!column) {
            throw new NotFoundException('Không tìm thấy cột trạng thái trong dự án');
        }

        const totalColumns = await this.prisma.boardColumn.count({
            where: { projectId },
        });

        if (totalColumns <= 1) {
            throw new BadRequestException('Dự án phải có ít nhất 1 cột trạng thái');
        }

        if (column._count.tasks > 0) {
            throw new BadRequestException(
                'Vui lòng di chuyển hoặc xóa hết công việc trong cột trước khi xóa cột',
            );
        }

        await this.prisma.boardColumn.delete({
            where: { id: columnId },
        });

        return { message: 'Đã xóa cột trạng thái thành công' };
    }

    private async verifyProjectAdmin(projectId: string, userId: string, errorMessage: string) {
        const member = await this.verifyProjectMember(projectId, userId);

        if (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.ADMIN) {
            throw new ForbiddenException(errorMessage);
        }

        return member;
    }

    async remove(projectId: string, userId: string) {
        const member = await this.verifyProjectMember(projectId, userId);

        if (member.role !== ProjectRole.OWNER) {
            throw new ForbiddenException('Chỉ Chủ sở hữu (OWNER) mới có quyền xóa dự án này');
        }

        await this.prisma.project.delete({
            where: { id: projectId },
        });

        return { message: 'Đã xóa dự án thành công' };
    }

    async verifyProjectMember(projectId: string, userId: string) {
        const member = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });

        if (!member) {
            throw new ForbiddenException('Bạn không phải là thành viên của dự án này');
        }

        return member;
    }
}
