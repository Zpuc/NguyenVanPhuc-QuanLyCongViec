export interface VaultSecrets {
  [key: string]: string;
}

export async function loadVaultSecrets(): Promise<boolean> {
  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN ?? 'root';
  const secretPath = process.env.VAULT_SECRET_PATH ?? 'secret/data/taskmaster';

  if (!vaultAddr) {
    return false;
  }

  try {
    const url = `${vaultAddr.replace(/\/+$/, '')}/v1/${secretPath.replace(/^\/+/, '')}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      console.warn(`[Vault] Phản hồi lỗi từ Vault (${response.status} ${response.statusText}). Tự động fallback sang file .env`);
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
      console.log(`[Vault] Đã nạp thành công ${count} bí mật từ HashiCorp Vault (${url})`);
      return true;
    }

    console.warn(`[Vault] Không tìm thấy dữ liệu secret hợp lệ tại ${secretPath}. Fallback sang .env`);
    return false;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Vault] Không kết nối được Vault (${message}). Tự động fallback sang file .env`);
    return false;
  }
}
