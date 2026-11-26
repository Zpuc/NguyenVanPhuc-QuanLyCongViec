import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_KEYS } from './redis.constants';

type MessageHandler = (payload: string) => void;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subClient: Redis | null = null;
  private ready = false;
  private subReady = false;
  private warnedOffline = false;
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl =
      process.env.REDIS_URL ?? this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return;
    }

    const options = {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (times > 5) {
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    };

    this.client = new Redis(redisUrl, options);
    this.subClient = new Redis(redisUrl, options);

    this.client.on('ready', () => {
      this.ready = true;
      this.warnedOffline = false;
      this.logger.log(`Đã kết nối Redis thành công (${redisUrl})`);
    });

    this.client.on('end', () => {
      this.ready = false;
    });

    this.client.on('error', (err: Error) => {
      this.ready = false;
      if (!this.warnedOffline) {
        this.warnedOffline = true;
        this.logger.warn(
          `Không kết nối được Redis (${err.message}). Tự động chạy chế độ fallback cục bộ`,
        );
      }
    });

    this.subClient.on('ready', () => {
      this.subReady = true;
      const channels = Array.from(this.handlers.keys());
      if (channels.length > 0 && this.subClient) {
        void this.subClient.subscribe(...channels).catch(() => undefined);
      }
    });

    this.subClient.on('end', () => {
      this.subReady = false;
    });

    this.subClient.on('error', () => {
      this.subReady = false;
    });

    this.subClient.on('message', (channel: string, message: string) => {
      const channelHandlers = this.handlers.get(channel);
      if (!channelHandlers) return;
      for (const handler of channelHandlers) {
        try {
          handler(message);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Lỗi xử lý sự kiện Redis kênh ${channel}: ${msg}`);
        }
      }
    });

    await Promise.allSettled([
      this.client.connect(),
      this.subClient.connect(),
    ]);
  }

  async onModuleDestroy(): Promise<void> {
    this.ready = false;
    this.subReady = false;
    const tasks: Promise<unknown>[] = [];
    if (this.client) {
      tasks.push(
        this.client.quit().catch(() => {
          this.client?.disconnect();
        }),
      );
      this.client = null;
    }
    if (this.subClient) {
      tasks.push(
        this.subClient.quit().catch(() => {
          this.subClient?.disconnect();
        }),
      );
      this.subClient = null;
    }
    await Promise.allSettled(tasks);
  }

  isReady(): boolean {
    return this.ready && this.client !== null;
  }

  async publish(channel: string, data: unknown): Promise<boolean> {
    if (!this.client || !this.ready) {
      return false;
    }
    try {
      await this.client.publish(channel, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    let set = this.handlers.get(channel);
    const isNewChannel = !set;
    if (!set) {
      set = new Set<MessageHandler>();
      this.handlers.set(channel, set);
    }
    set.add(handler);

    if (isNewChannel && this.subClient && this.subReady) {
      try {
        await this.subClient.subscribe(channel);
      } catch {
        return;
      }
    }
  }

  async enqueue(queue: string, payload: unknown): Promise<boolean> {
    if (!this.client || !this.ready) {
      return false;
    }
    try {
      await this.client.lpush(queue, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  async dequeue<T>(queue: string): Promise<T | null> {
    if (!this.client || !this.ready) {
      return null;
    }
    try {
      const raw = await this.client.rpop(queue);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async refreshWorkerHeartbeat(ttlSeconds = 15): Promise<void> {
    if (!this.client || !this.ready) {
      return;
    }
    try {
      await this.client.set(
        REDIS_KEYS.WORKER_HEARTBEAT,
        new Date().toISOString(),
        'EX',
        ttlSeconds,
      );
    } catch {
      return;
    }
  }

  async hasActiveWorker(): Promise<boolean> {
    if (!this.client || !this.ready) {
      return false;
    }
    try {
      const exists = await this.client.exists(REDIS_KEYS.WORKER_HEARTBEAT);
      return exists === 1;
    } catch {
      return false;
    }
  }
}
