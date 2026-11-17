#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { serveBridge } from '../src/bridge.mjs';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    url: { type: 'string' }, 'local-config': { type: 'string' }, 'catalog-file': { type: 'string' },
  } });
  if (positionals.length !== 1 || positionals[0] !== 'serve' || !values.url) throw new Error('Invalid configuration');
  process.exitCode = await serveBridge({ url: values.url, localConfig: values['local-config'], catalogFile: values['catalog-file'] });
} catch {
  console.error('Machinal adapter configuration is invalid. Run machinal setup. No credentials were printed.');
  process.exitCode = 1;
}
