import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private readonly vaultAddr: string | undefined;
  private readonly vaultToken: string;
  private readonly secretPath: string;

  constructor(private readonly configService: ConfigService) {
    this.vaultAddr = this.configService.get<string>('VAULT_ADDR');
    this.vaultToken = this.configService.get<string>('VAULT_TOKEN') ?? 'root';
    this.secretPath = this.configService.get<string>('VAULT_SECRET_PATH') ?? 'secret/data/taskmaster';
  }

  isVaultConfigured(): boolean {
    return Boolean(this.vaultAddr);
  }

  async checkHealth(): Promise<boolean> {
    if (!this.vaultAddr) {
      return false;
    }
    try {
      const url = `${this.vaultAddr.replace(/\/+$/, '')}/v1/sys/health`;
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok || response.status === 429;
    } catch {
      return false;
    }
  }

  async getSecrets(): Promise<Record<string, string> | null> {
    if (!this.vaultAddr) {
      return null;
    }
    try {
      const url = `${this.vaultAddr.replace(/\/+$/, '')}/v1/${this.secretPath.replace(/^\/+/, '')}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Vault-Token': this.vaultToken,
        },
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { data?: { data?: Record<string, string> } };
      return data.data?.data ?? null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Lỗi khi truy vấn secrets từ Vault: ${msg}`);
      return null;
    }
  }

  async setSecrets(secrets: Record<string, string>): Promise<boolean> {
    if (!this.vaultAddr) {
      return false;
    }
    try {
      const url = `${this.vaultAddr.replace(/\/+$/, '')}/v1/${this.secretPath.replace(/^\/+/, '')}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Vault-Token': this.vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: secrets }),
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Lỗi khi lưu secrets lên Vault: ${msg}`);
      return false;
    }
  }
}
