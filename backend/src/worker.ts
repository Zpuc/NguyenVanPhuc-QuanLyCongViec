import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();
  console.log('TaskMaster Background Worker đã khởi động và đang chạy ngầm...');
}
void bootstrap();
