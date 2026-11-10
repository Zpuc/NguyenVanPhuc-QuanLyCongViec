import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const userProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = userProjects.map((p) => p.projectId);

    if (projectIds.length === 0) {
      return {
        totalProjects: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        myTasks: [],
      };
    }

    const assignedTasks = await this.prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        assigneeId: userId,
      },
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
        column: {
          select: { id: true, title: true, color: true },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const now = new Date();
    const isCompleted = (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('done') || lower.includes('hoàn thành');
    };

    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;

    for (const task of assignedTasks) {
      const completed = isCompleted(task.column.title);
      if (completed) {
        completedTasks++;
      } else {
        inProgressTasks++;
        if (task.dueDate && new Date(task.dueDate) < now) {
          overdueTasks++;
        }
      }
    }

    let myTasks = assignedTasks.slice(0, 10);

    if (myTasks.length === 0) {
      const recentTasks = await this.prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          project: {
            select: { id: true, name: true, key: true },
          },
          column: {
            select: { id: true, title: true, color: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      myTasks = recentTasks;
    }

    return {
      totalProjects: projectIds.length,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      myTasks,
    };
  }
}

