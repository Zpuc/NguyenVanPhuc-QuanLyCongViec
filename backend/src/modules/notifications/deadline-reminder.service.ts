import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class DeadlineReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkDueAndOverdueTasks() {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: { not: null },
        dueDate: { lte: next24Hours },
      },
      include: {
        project: { select: { id: true, key: true } },
        column: { select: { title: true } },
      },
    });

    let sentCount = 0;

    for (const task of tasks) {
      if (!task.assigneeId || !task.dueDate) continue;

      const columnTitle = task.column.title.toLowerCase();
      if (columnTitle.includes('done') || columnTitle.includes('hoàn thành')) {
        continue;
      }

      const isOverdue = task.dueDate < now;
      const type = isOverdue ? 'TASK_OVERDUE' : 'TASK_DUE_SOON';

      const alreadySent = await this.prisma.notification.findFirst({
        where: {
          recipientId: task.assigneeId,
          type,
          createdAt: { gte: last24Hours },
          metadata: {
            path: ['taskId'],
            equals: task.id,
          },
        },
        select: { id: true },
      });

      if (alreadySent) continue;

      await this.notificationsService.create({
        recipientId: task.assigneeId,
        title: isOverdue ? 'Công việc đã quá hạn' : 'Công việc sắp đến hạn',
        content: isOverdue
          ? `Công việc "${task.title}" (${task.project.key}-${task.taskNumber}) đã quá hạn hoàn thành.`
          : `Công việc "${task.title}" (${task.project.key}-${task.taskNumber}) sắp đến hạn trong vòng 24 giờ tới.`,
        type,
        metadata: { projectId: task.projectId, taskId: task.id },
      });

      sentCount++;
    }

    return { checked: tasks.length, sent: sentCount };
  }
}
