import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateNotificationPayload,
  REDIS_CHANNELS,
  REDIS_QUEUES,
} from '../../common/redis/redis.constants';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Optional() private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  async create(data: CreateNotificationPayload) {
    const isApiContext = Boolean(this.notificationsGateway);
    if (isApiContext && (await this.redisService.hasActiveWorker())) {
      const queued = await this.redisService.enqueue(
        REDIS_QUEUES.NOTIFICATIONS,
        data,
      );
      if (queued) {
        return { queued: true };
      }
    }

    return this.persistAndEmit(data);
  }

  async persistAndEmit(data: CreateNotificationPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        title: data.title,
        content: data.content,
        type: data.type,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    const published = await this.redisService.publish(
      REDIS_CHANNELS.NOTIFICATION_REALTIME,
      {
        recipientId: data.recipientId,
        notification,
      },
    );

    if (!published) {
      this.notificationsGateway?.sendNotificationToUser(
        data.recipientId,
        notification,
      );
    }

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
