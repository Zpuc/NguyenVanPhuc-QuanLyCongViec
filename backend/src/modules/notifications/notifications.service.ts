import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: {
    recipientId: string;
    title: string;
    content: string;
    type: string;
    metadata?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        title: data.title,
        content: data.content,
        type: data.type,
        metadata: data.metadata || {},
      },
    });

    this.notificationsGateway.sendNotificationToUser(
      data.recipientId,
      notification,
    );

    return notification;
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
    return { success: true };
  }
}
