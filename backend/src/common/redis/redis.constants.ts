export const REDIS_CHANNELS = {
  NOTIFICATION_REALTIME: 'taskmaster:pubsub:notifications',
} as const;

export const REDIS_QUEUES = {
  NOTIFICATIONS: 'taskmaster:queue:notifications',
} as const;

export const REDIS_KEYS = {
  WORKER_HEARTBEAT: 'taskmaster:worker:heartbeat',
} as const;

export interface CreateNotificationPayload {
  recipientId: string;
  title: string;
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface RealtimeNotificationEvent {
  recipientId: string;
  notification: unknown;
}
