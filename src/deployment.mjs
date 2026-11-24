import { MACHINAL_SERVER_URL } from './endpoints.mjs';

export function resolveDeploymentMode({ local = false, url } = {}) {
  if (local) return 'local';
  if (url === MACHINAL_SERVER_URL) return 'cloud';
  return 'custom-server';
}

export function describeDeployment({ local = false, url } = {}) {
  const kind = resolveDeploymentMode({ local, url });
  if (kind === 'local') {
    return Object.freeze({
      kind: 'local',
      label: 'Local (independent Docker / self-hosted profile)',
      auth: 'local-device-token',
      billing: 'byok-provider',
      machinalCreditsRequired: false,
      supportsCreditsTool: false,
      rendering: 'local-hardware',
      storage: 'volume-only',
      supportsS3: false,
      delivery: 'loopback-volume-link',
    });
  }
  return Object.freeze({
    kind,
    label: kind === 'cloud' ? 'Machinal Cloud (hosted server)' : 'Custom hosted Machinal server',
    auth: 'machinal-api-key',
    billing: 'machinal-credits',
    machinalCreditsRequired: true,
    supportsCreditsTool: true,
    rendering: 'server',
    storage: 's3-and-volume',
    supportsS3: true,
    delivery: 'signed-cloud-or-volume-link',
  });
}
