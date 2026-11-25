import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { loadVaultSecrets } from './common/vault/vault.util';

async function bootstrap() {
  await loadVaultSecrets();
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();
  console.log('TaskMaster Background Worker đã khởi động và đang chạy ngầm...');
}
void bootstrap();
