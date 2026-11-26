import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';

export function stateDirectory({ home, env = process.env, platform = process.platform } = {}) {
  const base = home ?? (platform !== 'win32' && env.HOME && isAbsolute(env.HOME) ? env.HOME : homedir());
  const config = env.XDG_CONFIG_HOME;
  return join(config && isAbsolute(config) ? config : join(base, '.config'), 'machinal');
}

export function endpointFiles(url, context, { local = false } = {}) {
  const id = createHash('sha256').update(url).digest('hex').slice(0, 24);
  const root = stateDirectory(context);
  const catalogFile = join(root, 'catalogs', local ? `${id}.local.json` : `${id}.json`);
  return { catalogFile, localConfig: join(root, 'local', id, 'providers.env') };
}
