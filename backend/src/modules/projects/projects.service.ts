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
