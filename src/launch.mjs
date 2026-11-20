import crossSpawn from 'cross-spawn';
import { InstallerError } from './errors.mjs';
import { validateAPIKey } from './connection.mjs';

export async function launchClient(client, key, { args = [], cwd = process.cwd(), env = process.env, spawn = crossSpawn, unkeyed = false } = {}) {
  const normalized = client === 'agy' ? 'antigravity' : client;
  if (!['opencode', 'claude', 'codex', 'antigravity'].includes(normalized)) throw new InstallerError('Choose opencode, claude, codex, or antigravity.');
  if (normalized === 'opencode' && args.some((arg) => arg === '--server' || arg.startsWith('--server='))) {
    throw new InstallerError('Launch uses a private OpenCode server so it can inherit the key. --server is not supported.');
  }

  const command = normalized === 'antigravity' ? 'agy' : normalized;
  const commandArgs = normalized === 'opencode' ? ['--standalone', ...args] : args;
  const apiKey = unkeyed ? undefined : validateAPIKey(key);
  const child = spawn(command, commandArgs, {
    cwd,
    env: {
      ...env,
      ...(unkeyed ? {} : { MACHINAL_API_KEY: apiKey,
      DIRECTION_API_KEY: apiKey,
      MACHINAL_MCP_USE_ENV_KEY: '1',
      DIRECTION_MCP_USE_ENV_KEY: '1' }),
    },
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    child.once('error', () => reject(new InstallerError('Could not start the client. Install its CLI and make sure it is on PATH. MCP configuration has not been removed.')));
    child.once('exit', (code, signal) => resolve(code ?? (signal === 'SIGINT' ? 130 : 1)));
  });
}
