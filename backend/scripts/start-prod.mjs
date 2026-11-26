import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function preloadDotEnv() {
  const envFile = resolve(process.cwd(), '.env');
  if (!existsSync(envFile)) return;
  const raw = readFileSync(envFile, 'utf-8');
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
}

async function fetchSecretsFromVault() {
  preloadDotEnv();
  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN || 'root';
  const secretPath = process.env.VAULT_SECRET_PATH || 'secret/data/taskmaster';

  if (!vaultAddr) return;

  const url = `${vaultAddr.replace(/\/+$/, '')}/v1/${secretPath.replace(/^\/+/, '')}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Vault-Token': vaultToken,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        const secrets = json?.data?.data;
        if (secrets && typeof secrets === 'object') {
          let count = 0;
          for (const [k, v] of Object.entries(secrets)) {
            if (v !== undefined && v !== null) {
              process.env[k] = String(v);
              count++;
            }
          }
          process.env.VAULT_LOADED = 'true';
          console.log(
            `[Vault] Đã nạp thành công ${count} bí mật từ HashiCorp Vault (${url})`,
          );
          return;
        }
      }
    } catch (err) {
      if (attempt === 5) {
        console.warn(
          `[Vault] Không kết nối được Vault (${err.message}). Fallback sang biến môi trường hiện có`,
        );
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function start() {
  await fetchSecretsFromVault();

  if (!process.env.DATABASE_URL) {
    console.error('[Startup] Thiếu cấu hình DATABASE_URL từ cả Vault và môi trường!');
    process.exit(1);
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });

  await import('../dist/main.js');
}

start();
