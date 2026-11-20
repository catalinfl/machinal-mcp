import { InstallerError } from './errors.mjs';
import { isLoopbackEndpoint, normalizeEndpoint } from './connection.mjs';
import styleProfiles from '../skills/machinal-editing/references/styles.json' with { type: 'json' };
import { DEFAULT_LOCAL_URL, MACHINAL_SERVER_URL } from './endpoints.mjs';

export { DEFAULT_LOCAL_URL, MACHINAL_SERVER_URL };
export const EDITING_STYLES = styleProfiles.map((profile) => profile.id);

export async function chooseClient(value, { interactive, ui }) {
  const normalized = value === 'agy' ? 'antigravity' : value;
  if (normalized && ['opencode', 'claude', 'codex', 'antigravity'].includes(normalized)) return normalized;
  if (value || !interactive) throw new InstallerError('Specify --client opencode, --client claude, --client codex, or --client antigravity.');
  return ui.select({ message: 'Client', choices: [
    { name: 'OpenCode V2', value: 'opencode' },
    { name: 'Claude Code', value: 'claude' },
    { name: 'Codex', value: 'codex' },
    { name: 'Google Antigravity', value: 'antigravity' },
  ] });
}

export async function chooseEndpoint(values, { env, interactive, ui }) {
  let mode = values.mode === 'hosted' ? 'server' : values.mode;
  if (mode && !['local', 'server', 'custom'].includes(mode)) throw new InstallerError('Choose --mode server (Machinal Server), local or custom (--mode hosted is an alias for server).');
  const customDefault = env.MACHINAL_API_ORIGIN || env.DIRECTION_API_ORIGIN;
  if (!mode && values.url) mode = 'custom';
  if (!mode && interactive && !values.url) {
    mode = await ui.select({ message: 'API location', default: 'server', choices: [
      { name: 'Machinal Server', value: 'server', short: 'Machinal Server', description: 'Official hosted service. Only your Machinal API key is needed.' },
      { name: 'Local', value: 'local', short: 'Local', description: 'Independent Docker backend with your own OpenRouter key.' },
      { name: 'Custom server (advanced)', value: 'custom', short: 'Custom server', description: 'Your own deployment. Enter its API URL.' },
    ] });
  }
  mode ??= customDefault ? 'custom' : 'server';
  // An explicit legacy --url remains a custom deployment, never branded as the official service.
  if (mode === 'server' && values.url && normalizeEndpoint(values.url) !== MACHINAL_SERVER_URL) mode = 'custom';
  if (mode === 'server') return { mode, url: MACHINAL_SERVER_URL };
  let rawURL = values.url || customDefault;
  if (mode === 'local' && !values.url && (!rawURL || !isLoopbackEndpoint(normalizeEndpoint(rawURL)))) rawURL = DEFAULT_LOCAL_URL;
  if (interactive && !values.url) {
    rawURL = await ui.input({
      message: mode === 'local' ? 'Local API URL' : 'Custom server API URL (not the website)',
      ...(rawURL ? { default: rawURL } : {}), required: true,
      validate: (value) => {
        try {
          const url = normalizeEndpoint(value);
          return mode !== 'local' || isLoopbackEndpoint(url) || 'Local mode needs a loopback URL. Choose Custom server for your own remote API.';
        } catch (error) { return error.message; }
      },
    });
  }
  if (!rawURL) throw new InstallerError('Custom server requires --url with your API origin. Use --mode server for Machinal Server without a URL.');
  const url = normalizeEndpoint(rawURL);
  if (mode === 'local' && !isLoopbackEndpoint(url)) {
    throw new InstallerError('Local mode requires a loopback API URL. Use --mode server for a deployed HTTPS API.');
  }
  return { mode, url };
}

export async function chooseSkillOptions(values, { interactive, ui }) {
  if (values['no-skills']) {
    if (values.style || values['replace-skills']) throw new InstallerError('--no-skills cannot be combined with --style or --replace-skills.');
    return null;
  }
  if (values.style && !EDITING_STYLES.includes(values.style)) throw new InstallerError(`Choose --style from: ${EDITING_STYLES.join(', ')}.`);
  if (interactive && !await ui.confirm({ message: 'Install editing, recipe, scene, credit and media skills?', default: true })) return null;
  const style = values.style ?? (interactive ? await ui.select({
    message: 'Default editing style (change per brief)', default: 'auto',
    choices: styleProfiles.map(({ id, label }) => ({ name: id === 'auto' ? 'Auto — adapt to the brief' : label, short: id, value: id })),
  }) : 'auto');
  return { style };
}
