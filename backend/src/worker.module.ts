import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './database/prisma/prisma.module';
import { NotificationsService } from './modules/notifications/notifications.service';
import { DeadlineReminderService } from './modules/notifications/deadline-reminder.service';
import { NotificationQueueConsumer } from './modules/notifications/notification-queue.consumer';
import { VaultModule } from './common/vault/vault.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VaultModule,
    RedisModule,
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [
    NotificationsService,
    DeadlineReminderService,
    NotificationQueueConsumer,
  ],
})
export class WorkerModule {}
