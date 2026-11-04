import { ConflictException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateProjectDto) {
        const existingKey = await this.prisma.project.findUnique({
            where: { key: dto.key },
        });

        if (existingKey) {
            throw new ConflictException(`Mã dự án "${dto.key}" đã tồn tại, vui lòng chọn mã khác`);
        }

        return this.prisma.$transaction(async (tx) => {

            const project = await tx.project.create({
                data: {
                    name: dto.name,
                    key: dto.key,
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

        return this.prisma.projectMember.create({
            data: {
                projectId,
                userId: userToInvite.id,
                role: dto.role,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
            },
        });
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