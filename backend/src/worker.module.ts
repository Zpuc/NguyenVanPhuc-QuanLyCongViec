import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './database/prisma/prisma.module';
import { NotificationsService } from './modules/notifications/notifications.service';
import { DeadlineReminderService } from './modules/notifications/deadline-reminder.service';
import { VaultModule } from './common/vault/vault.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VaultModule,
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [NotificationsService, DeadlineReminderService],
})
export class WorkerModule {}
