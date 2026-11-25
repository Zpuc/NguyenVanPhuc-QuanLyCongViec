import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const vaultAddr = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
  const vaultToken = process.env.VAULT_TOKEN || 'root';
  const secretPath = process.env.VAULT_SECRET_PATH || 'secret/data/taskmaster';

  const envPath = resolve(process.cwd(), 'backend/.env');
  const fallbackEnvPath = resolve(process.cwd(), '.env');
  const targetEnv = existsSync(envPath) ? envPath : (existsSync(fallbackEnvPath) ? fallbackEnvPath : null);

  const secrets = {
    DATABASE_URL: 'postgresql://postgres:vanphuc04@postgres:5432/task_management_db?schema=public',
    PORT: '3000',
    JWT_SECRET: 'zpuc',
    JWT_EXPIRES_IN: '7d',
  };

  if (targetEnv) {
    const raw = readFileSync(targetEnv, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        secrets[key] = val;
      }
    }
  }

  const url = `${vaultAddr.replace(/\/+$/, '')}/v1/${secretPath.replace(/^\/+/, '')}`;
  console.log(`Đang đẩy ${Object.keys(secrets).length} secrets lên Vault tại: ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: secrets }),
    });

    if (res.ok) {
      console.log('Khởi tạo secret cho HashiCorp Vault thành công!');
    } else {
      console.error(`Thất bại khi đẩy secret lên Vault: ${res.status} ${res.statusText}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Không thể kết nối đến Vault tại ${vaultAddr}: ${err.message}`);
    process.exit(1);
  }
}

main();
