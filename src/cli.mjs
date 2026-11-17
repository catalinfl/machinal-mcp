import { parseArgs } from 'node:util';
import { confirm, input, password, select } from '@inquirer/prompts';
import { InstallerError } from './errors.mjs';
import { createCredentialStore } from './credential-store.mjs';
import { manageKey, offerKeyStorage, readKey } from './keys.mjs';
import { launchClient } from './launch.mjs';
import { chooseClient, EDITING_STYLES } from './setup-options.mjs';
import { setup } from './setup.mjs';
import { setupStdio } from './setup-stdio.mjs';
import { serveBridge, MCPBridge } from './bridge.mjs';
import { VERSION } from './version.mjs';
import { createLogger } from './presentation.mjs';
import { createPromptUI } from './prompts.mjs';
import { manageLocal, managePlace, showCredits } from './commands.mjs';
import { readSettings } from './settings.mjs';
import { MACHINAL_SERVER_URL } from './endpoints.mjs';
import { uninstall } from './uninstall.mjs';

const HELP = `Machinal · connect your agent

  machinal setup
  machinal set-key       Verify and save a key (hidden entry)
  machinal getcredit     Show live credits; no spending
  machinal place         Show processing, upload and download locations
  machinal place --downloads /absolute/folder --uploads /absolute/folder
  machinal local status
  machinal local install --docker-dir PATH
  machinal uninstall    Clean integrations, saved keys, runtime and global CLI

Global install: npm install -g @machinal/mcp · then use machinal <command>.
Also available: launch <client>, doctor --url URL, key set, key delete.
Requires Node.js 22.13+ (22.x) or 24+; Local needs Docker/Compose and a source checkout.

Options for setup:
  --client opencode|claude|codex
  --scope project|global           Default: global for Codex, project otherwise
  --mode server|local|custom       Machinal Server | independent Local | custom API
  --mode hosted                    Compatibility alias for server
  --url URL                        Custom server URL or optional local URL override
  --docker-dir PATH                Local: machinal source checkout
  --start-docker                   Local: explicitly allow build/start if needed
  --configure-local                Explicitly replace saved local provider settings
  --defer-login                    Server: install now with Login required
  --transport stdio|http           Default: resilient stdio; http is advanced compatibility
  --name NAME                      Default: machinal
  --replace                        Replace this named server only
  --style STYLE                    Named editorial profile (see below)
  --no-skills                      Do not install the bundled agent skills
  --replace-skills                 Back up and replace changed bundled files
  --yes                            No confirmations; requires --client
  --no-launch                      Configure without launching the agent client
  --verbose                        Show full setup, credit and authentication details
  --help, -h                       Show help
  --version, -v                    Show version

Options for setup/launch:
  --session-key                    Ignore saved keys; do not offer to save

Options for key delete:
  --yes                            Explicitly confirm removal without a prompt

Options for uninstall:
  --yes                            Confirm full cleanup without a prompt
  Cleans recorded installs plus global/current/ancestor client configurations.
  Older installs in other projects: run uninstall from those project folders first.
  Projects/media, Docker volumes, unrelated files and config backups are preserved.

Options for key set:
  --url URL                        Verify MCP access before replacing the saved key

Machinal Server uses https://api.machinal.app/mcp automatically; no URL prompt.
It reads MACHINAL_API_KEY, saved credentials, or hidden entry.
Custom server asks for your own API URL; --url also selects custom mode for legacy scripts.
Windows uses Credential Manager. Linux uses a private plaintext credentials.json (0600).
Local mode asks for OPENROUTER_API_KEY and model settings, builds the source
checkout with Docker, and keeps private provider settings outside the project.
Local requires no Machinal account, subscription, credits or PocketBase.
OpenRouter usage is charged directly to your own key; local rendering uses your CPU.
--yes alone never authorizes Docker startup; use --start-docker explicitly.
The stdio adapter starts even without login or a reachable backend. Its free
connection_status tool reports Login required / Connection unavailable / Connected
and reconnects discovery without retrying jobs. Host MCP badges belong to the client;
native Needs authentication labels require OAuth, not application API keys.
Codex defaults to global config; project settings require a trusted project.
No key is accepted in arguments or chat. Setup never generates media or spends AI credits.
Server keys: https://machinal.app/api-keys (your own website for self-hosting).

Styles: ${EDITING_STYLES.join(', ')}.
`;

function parseOptions(argv) {
  const separator = argv.indexOf('--');
  const forwarded = separator < 0 ? [] : argv.slice(separator + 1);
  let parsed;
  try {
    parsed = parseArgs({
      args: separator < 0 ? argv : argv.slice(0, separator),
      allowPositionals: true,
      options: {
        client: { type: 'string' }, scope: { type: 'string' }, mode: { type: 'string' }, url: { type: 'string' }, name: { type: 'string' },
        replace: { type: 'boolean' }, yes: { type: 'boolean' }, 'no-launch': { type: 'boolean' }, verbose: { type: 'boolean' },
        style: { type: 'string' }, 'no-skills': { type: 'boolean' }, 'replace-skills': { type: 'boolean' },
        'session-key': { type: 'boolean' },
        'docker-dir': { type: 'string' }, 'start-docker': { type: 'boolean' },
        transport: { type: 'string' }, 'defer-login': { type: 'boolean' }, 'configure-local': { type: 'boolean' },
        'local-config': { type: 'string' }, 'catalog-file': { type: 'string' },
        downloads: { type: 'string' }, uploads: { type: 'string' },
        help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
      },
    });
  } catch {
    throw new InstallerError('Invalid options. Run --help. API keys must use MACHINAL_API_KEY or the hidden prompt, never command arguments.');
  }
  return { ...parsed, forwarded };
}

export async function run(argv = process.argv.slice(2), runtime = {}) {
  const { values, positionals, forwarded } = parseOptions(argv);
  if (values.help) {
    console.log(values.verbose ? HELP : `${HELP.split('Options for setup:')[0]}Setup: --client opencode|claude|codex · --mode server|local|custom\nMore options: machinal --help --verbose\n`);
    return 0;
  }
  if (values.version) { console.log(VERSION); return 0; }
  const command = positionals[0] ?? 'setup';
  if (command === 'serve' || command === 'doctor') {
    const allowed = ['url', 'local-config', 'catalog-file'];
    if (positionals.length !== 1 || forwarded.length || !values.url || Object.keys(values).some((key) => !allowed.includes(key))) throw new InstallerError('serve/doctor require --url and accept only --local-config and --catalog-file.');
    const options = { url: values.url, localConfig: values['local-config'], catalogFile: values['catalog-file'] };
    if (command === 'serve') return serveBridge(options, runtime);
    const bridge = new MCPBridge({ ...options, env: runtime.env ?? process.env, credentialStore: runtime.credentialStore === undefined ? createCredentialStore(runtime) : runtime.credentialStore });
    console.log(JSON.stringify(await bridge.connect(), null, 2));
    return bridge.state.status === 'connected' ? 0 : 1;
  }
  const context = {
    env: process.env, cwd: process.cwd(), launch: launchClient,
    ...runtime,
    interactive: !values.yes && (runtime.interactive ?? (process.stdin.isTTY && process.stdout.isTTY)),
  };
  if (context.credentialStore === undefined) context.credentialStore = createCredentialStore(context);
  context.ui ??= createPromptUI({ confirm, input, password, select }, { env: context.env });
  context.verbose = values.verbose === true;
  context.log ??= createLogger({ env: context.env });
  const only = (allowed) => {
    if (forwarded.length || Object.keys(values).some(key => !allowed.includes(key))) throw new InstallerError('Unsupported options for this command. Run machinal --help.');
  };
  if (command === 'uninstall') {
    only(['yes']);
    if (positionals.length !== 1) throw new InstallerError('Use machinal uninstall or machinal uninstall --yes.');
    return uninstall(values, context);
  }
  if (['set-key', 'getcredit', 'credits', 'place'].includes(command)) {
    if (positionals.length !== 1) throw new InstallerError('Do not pass API keys as arguments. Run machinal --help.');
    if (command === 'set-key') {
      only(['url']);
      const settings = await readSettings(context);
      if (!values.url && settings.connection?.mode === 'local') throw new InstallerError('Local mode uses a device token, not a Machinal key. Select a hosted endpoint explicitly with --url.');
      return manageKey('set', { url: values.url ?? settings.connection?.url ?? MACHINAL_SERVER_URL }, context);
    }
    if (command === 'place') { only(['uploads', 'downloads']); return managePlace(values, context); }
    only(['url', 'verbose']);
    return showCredits(values, context);
  }
  if (command === 'local') {
    const action = positionals[1] ?? 'status';
    if (positionals.length > 2 || !['status', 'install'].includes(action)) throw new InstallerError('Use machinal local status or machinal local install.');
    only(action === 'status' ? ['url'] : ['url', 'docker-dir', 'start-docker', 'configure-local', 'yes', 'verbose']);
    return manageLocal(action, values, context);
  }
  if (values.uploads !== undefined || values.downloads !== undefined) throw new InstallerError('--uploads and --downloads belong to machinal place.');
  if (command === 'key' && positionals.length === 2 && ['set', 'delete'].includes(positionals[1]) && !forwarded.length) {
    const allowed = positionals[1] === 'set' ? ['url'] : ['yes'];
    if (Object.keys(values).some((option) => !allowed.includes(option))) {
      throw new InstallerError('key set accepts only --url; key delete accepts only --yes. Run --help.');
    }
    return manageKey(positionals[1], values, context);
  }
  if (command === 'setup' && positionals.length <= 1 && !forwarded.length) {
    if (values.transport && !['stdio', 'http'].includes(values.transport)) throw new InstallerError('Choose --transport stdio (default) or http (advanced).');
    if (values['local-config'] || values['catalog-file']) throw new InstallerError('Local profile/catalog paths are managed by setup, not provided as setup arguments.');
    if (values.transport === 'http') {
      context.verbose = values.verbose || !context.interactive;
      if (values['defer-login'] || values['configure-local']) throw new InstallerError('--defer-login and --configure-local require the default stdio adapter.');
      if (values.mode === 'local') context.log('Advanced HTTP compatibility mode uses the existing authenticated self-hosted API. Omit --transport http for independent local mode.');
      return setup(values, context);
    }
    return setupStdio(values, context);
  }
  if (command === 'launch' && positionals.length <= 2) {
    if (['scope', 'mode', 'url', 'name', 'replace', 'no-launch', 'style', 'no-skills', 'replace-skills', 'start-docker', 'docker-dir', 'verbose', 'transport', 'defer-login', 'configure-local', 'local-config', 'catalog-file'].some((option) => values[option] !== undefined)) {
      throw new InstallerError('Setup-only options cannot be used with launch. Run --help.');
    }
    if (values.client && positionals[1]) throw new InstallerError('Specify the launch client only once.');
    const client = await chooseClient(positionals[1] || values.client, context);
    const keyOptions = { sessionOnly: values['session-key'] };
    const credentials = await readKey(context, keyOptions);
    await offerKeyStorage(credentials, context, keyOptions);
    const { key } = credentials;
    return context.launch(client, key, { args: forwarded, cwd: context.cwd, env: context.env });
  }
  throw new InstallerError('Use machinal setup, set-key, getcredit, place, local, launch, uninstall, or key delete. Run machinal --help.');
}
