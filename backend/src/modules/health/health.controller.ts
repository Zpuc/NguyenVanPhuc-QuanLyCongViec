import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedisService } from '../../common/redis/redis.service';
import { VaultService } from '../../common/vault/vault.service';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái kết nối các service (DB, Vault, Redis, Worker)',
  })
  async check() {
    const [dbUp, vaultReachable, workerActive] = await Promise.all([
      this.checkDatabase(),
      this.vaultService.checkHealth(),
      this.redisService.hasActiveWorker(),
    ]);

    return {
      status: dbUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'up',
        },
        database: {
          status: dbUp ? 'up' : 'down',
        },
        vault: {
          configured: this.vaultService.isVaultConfigured(),
          reachable: vaultReachable,
          secretsLoaded: process.env.VAULT_LOADED === 'true',
        },
        redis: {
          connected: this.redisService.isReady(),
        },
        worker: {
          active: workerActive,
        },
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
