import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, query: string) {
    const trimmed = query ? query.trim() : '';
    if (!trimmed) {
      return { projects: [], tasks: [] };
    }

    const memberProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberProjects.map((p) => p.projectId);

    if (projectIds.length === 0) {
      return { projects: [], tasks: [] };
    }

    const projects = await this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { key: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
      },
      take: 6,
    });

    const parsedNumber = parseInt(trimmed, 10);
    const taskNumberFilter = !isNaN(parsedNumber) ? [{ taskNumber: parsedNumber }] : [];

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
          ...taskNumberFilter,
        ],
      },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        column: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return { projects, tasks };
  }
}
