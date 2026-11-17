import { lstat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import crossSpawn from 'cross-spawn';
import { InstallerError } from './errors.mjs';

function npm(args, context) {
  return new Promise((resolve, reject) => {
    const child = crossSpawn('npm', args, {
      cwd: context.cwd, env: context.env, stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000,
    });
    let output = '';
    child.stdout.on('data', chunk => { if (output.length < 16_384) output += chunk; });
    child.once('error', () => reject(new InstallerError('Could not start npm. Integration cleanup is complete; run npm uninstall -g @machinal/mcp to remove the CLI.')));
    child.once('close', code => {
      if (code !== 0) reject(new InstallerError('npm package removal could not be completed. Integration cleanup is complete; retry npm uninstall -g @machinal/mcp. Check npm permissions; no sudo/admin command was run.'));
      else resolve(output.trim());
    });
  });
}

export async function uninstallGlobalPackage(context, { runNpm = npm } = {}) {
  const root = await runNpm(['root', '--global'], context);
  if (!isAbsolute(root)) throw new InstallerError('npm did not return a valid global package directory. The CLI was not removed; check npm configuration.');
  try { await lstat(join(root, '@machinal', 'mcp', 'package.json')); } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  await runNpm(['uninstall', '--global', '--ignore-scripts', '--no-audit', '--no-fund', '@machinal/mcp'], context);
  return true;
}
