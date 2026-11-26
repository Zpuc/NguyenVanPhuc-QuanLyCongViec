import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface VaultSecrets {
  [key: string]: string;
}

function preloadDotEnvIfNeeded(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'backend/.env'),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const raw = readFileSync(filePath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      if (!key || process.env[key] !== undefined) continue;
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
    break;
  }
}

export async function loadVaultSecrets(): Promise<boolean> {
  if (process.env.VAULT_LOADED === 'true') {
    return true;
  }

  preloadDotEnvIfNeeded();

  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN ?? 'root';
  const secretPath = process.env.VAULT_SECRET_PATH ?? 'secret/data/taskmaster';

  if (!vaultAddr) {
    return false;
  }

  const url = `${vaultAddr.replace(/\/+$/, '')}/v1/${secretPath.replace(/^\/+/, '')}`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Vault-Token': vaultToken,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(2500),
      });

      if (!response.ok) {
        if (attempt < maxAttempts && response.status >= 500) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        console.warn(
          `[Vault] Phản hồi lỗi từ Vault (${response.status} ${response.statusText}). Tự động fallback sang file .env`,
        );
        return false;
      }

      const payload = (await response.json()) as {
        data?: {
          data?: Record<string, string>;
        };
      };

      const secrets = payload?.data?.data;
      if (secrets && typeof secrets === 'object') {
        let count = 0;
        for (const [key, value] of Object.entries(secrets)) {
          if (value !== undefined && value !== null) {
            process.env[key] = String(value);
            count++;
          }
        }
        process.env.VAULT_LOADED = 'true';
        console.log(
          `[Vault] Đã nạp thành công ${count} bí mật từ HashiCorp Vault (${url})`,
        );
        return true;
      }

      console.warn(
        `[Vault] Không tìm thấy dữ liệu secret hợp lệ tại ${secretPath}. Fallback sang .env`,
      );
      return false;
    } catch (error: unknown) {
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[Vault] Không kết nối được Vault (${message}). Tự động fallback sang file .env`,
      );
      return false;
    }
  }

  return false;
}
