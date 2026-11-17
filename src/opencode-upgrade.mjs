import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { chooseJSONFile, configurationPath, planTextFile, saveConfiguration } from './configuration.mjs';
import { upgradeOpenCodeAuth } from './opencode-configuration.mjs';
import { InstallerError } from './errors.mjs';
import { readInstallations } from './installations.mjs';

// OpenCode combines plugin arrays from global and ancestor configs, not just the setup target.
export async function planOpenCodeUpgrade(plan, options) {
  const files = new Set([await configurationPath({ ...options, scope: 'global' })]);
  const recorded = await readInstallations(options);
  for (const entry of recorded) {
    if (entry.client !== 'opencode') continue;
    // Do not rewrite registrations belonging to another XDG/state profile.
    if ((entry.env.XDG_CONFIG_HOME ?? '') !== (options.env?.XDG_CONFIG_HOME ?? '')) continue;
    files.add(await configurationPath({ ...options, cwd: entry.cwd, scope: entry.scope }));
  }
  for (let directory = resolve(options.cwd); ; directory = dirname(directory)) {
    for (const root of [directory, join(directory, '.opencode')]) {
      files.add(await chooseJSONFile(root));
    }
    if (dirname(directory) === directory) break;
  }
  const plans = [];
  for (const file of files) {
    if (resolve(file) === resolve(plan.file)) continue;
    const previous = await planTextFile(file, '');
    if (previous.original === null) continue;
    const content = upgradeOpenCodeAuth(previous.original, { ...options, home: options.home ?? homedir() });
    if (content !== previous.original) plans.push({ ...previous, content });
  }
  return plans;
}

export async function saveOpenCodeUpgrade(plan, related) {
  const plans = [...related, plan];
  for (const current of plans) {
    if ((await planTextFile(current.file, '')).original !== current.original) throw new InstallerError('An OpenCode configuration changed during setup. Run setup again; no settings were overwritten.');
  }
  const saved = [];
  try {
    for (const current of plans) saved.push({ file: current.file, ...await saveConfiguration(current) });
  } catch (error) {
    if (saved.some(entry => entry.changed)) throw new InstallerError('OpenCode upgrade stopped while saving multiple configurations. Some files were upgraded and backed up; rerun setup to finish synchronization. No API key was changed.');
    throw error;
  }
  return saved;
}
