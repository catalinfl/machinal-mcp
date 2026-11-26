#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { serveBridge } from '../src/bridge.mjs';
import { endpointFiles } from '../src/paths.mjs';
import { readSettings } from '../src/settings.mjs';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    url: { type: 'string' }, 'local-config': { type: 'string' }, 'catalog-file': { type: 'string' },
  } });
  if (positionals.length !== 1 || positionals[0] !== 'serve' || !values.url) throw new Error('Invalid configuration');
  let url = values.url;
  let localConfig = values['local-config'];
  let catalogFile = values['catalog-file'];
  try {
    const settings = await readSettings();
    const override = settings.activeModeOverride;
    if (override?.url) {
      const wantLocal = override.mode === 'local';
      url = override.url;
      const files = endpointFiles(url, {}, { local: wantLocal });
      localConfig = wantLocal ? (override.localConfig ?? files.localConfig) : undefined;
      catalogFile = files.catalogFile;
    }
  } catch { /* Fall back to configured CLI flags if settings cannot be read. */ }
  process.exitCode = await serveBridge({ url, localConfig, catalogFile, followModeOverride: true });
} catch {
  console.error('Machinal adapter configuration is invalid. Run machinal setup. No credentials were printed.');
  process.exitCode = 1;
}
