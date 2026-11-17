import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';

export function stateDirectory({ home, env = process.env, platform = process.platform } = {}) {
  const base = home ?? (platform !== 'win32' && env.HOME && isAbsolute(env.HOME) ? env.HOME : homedir());
  const config = env.XDG_CONFIG_HOME;
  return join(config && isAbsolute(config) ? config : join(base, '.config'), 'machinal');
}
