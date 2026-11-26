import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  CreateNotificationPayload,
  REDIS_QUEUES,
} from '../../common/redis/redis.constants';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationQueueConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationQueueConsumer.name);
  private active = true;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.redisService.refreshWorkerHeartbeat();
    this.scheduleNextPoll(100);
  }

  onModuleDestroy(): void {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  @Interval(5000)
  async handleHeartbeat(): Promise<void> {
    await this.redisService.refreshWorkerHeartbeat();
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.active) return;
    this.timer = setTimeout(() => {
      void this.consumeLoop();
    }, delayMs);
  }

  private async consumeLoop(): Promise<void> {
    if (!this.active) return;

    if (!this.redisService.isReady()) {
      this.scheduleNextPoll(1000);
      return;
    }

    let processed = 0;
    while (this.active) {
      const job = await this.redisService.dequeue<CreateNotificationPayload>(
        REDIS_QUEUES.NOTIFICATIONS,
      );
      if (!job) break;

      try {
        await this.notificationsService.persistAndEmit(job);
        processed++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Lỗi xử lý job thông báo từ Redis queue: ${msg}`);
      }
    }

    if (processed > 0) {
      this.logger.log(`Đã xử lý ${processed} job thông báo từ Redis Queue`);
    }

    this.scheduleNextPoll(400);
  }
}
