import { dirname, resolve } from 'node:path';
import { chooseClient, chooseEndpoint, chooseSkillOptions } from './setup-options.mjs';
import { planConfiguration, saveConfiguration } from './configuration.mjs';
import { planSkills, saveSkills } from './skills.mjs';
import { readKey, offerKeyStorage } from './keys.mjs';
import { checkConnection } from './connection.mjs';
import { cacheCatalog, MCPBridge } from './bridge.mjs';
import { endpointFiles, installRuntime } from './runtime.mjs';
import { prepareIndependentLocal } from './local-setup.mjs';
import { backupSummary } from './presentation.mjs';
import { compactCreditSummaryLines, creditSummaryLines } from './credits.mjs';
import { InstallerError } from './errors.mjs';
import { planOpenCodeUpgrade, saveOpenCodeUpgrade } from './opencode-upgrade.mjs';
import { VERSION } from './version.mjs';
import { saveSettings } from './settings.mjs';
import { recordInstallation } from './installations.mjs';

async function approveConflict(conflict, allowed, message, context) {
  if (!conflict || allowed) return;
  if (!context.interactive || !await context.ui.confirm({ message, default: false })) {
    throw new InstallerError('Existing settings were preserved. Use --replace for the named server or --replace-skills for changed bundled skills.');
  }
}

async function serverCredentials(values, context) {
  if (values['defer-login']) return null;
  let saved;
  if (!values['session-key'] && !context.env.MACHINAL_API_KEY && !context.env.DIRECTION_API_KEY) {
    try { saved = await context.credentialStore?.read(); } catch {
      context.log('Credential storage unavailable; configure Login required or use hidden entry. The saved credential was not deleted.');
    }
  }
  const available = context.env.MACHINAL_API_KEY || context.env.DIRECTION_API_KEY || saved;
  if (!available && !context.interactive) return null;
  if (!available && !await context.ui.confirm({ message: 'Enter your Machinal API key now? Choose no to configure with Login required.', default: true })) return null;
  return readKey(context, { sessionOnly: values['session-key'] });
}

export async function setupStdio(values, context) {
  const { cwd, home, env, interactive, ui, log } = context;
  log('Machinal', 'heading');
  const client = await chooseClient(values.client, context);
  const defaultScope = ['codex', 'antigravity'].includes(client) ? 'global' : 'project';
  const scope = values.scope ?? (client === 'antigravity'
    ? 'global'
    : (interactive ? await ui.select({ message: 'Available in', default: defaultScope, choices: [
      { name: client === 'codex' ? 'All my projects (recommended for Codex discovery)' : 'All my projects', value: 'global' },
      { name: 'This project only', value: 'project' },
    ] }) : defaultScope));
  if (scope === 'project' && dirname(resolve(cwd)) === resolve(cwd)) log('Warning: project setup is running at a drive/filesystem root. Its settings may apply to all descendant projects.');
  const endpoint = await chooseEndpoint(values, context);
  log(`Connection: ${{ server: 'Server Machinal (cloud)', local: 'Local', custom: 'Custom server' }[endpoint.mode]}`);
  const local = endpoint.mode === 'local';
  if (!local && (values['docker-dir'] || values['start-docker'] || values['configure-local'])) throw new InstallerError('Docker/provider setup options require --mode local. Server mode never configures providers or Docker.');
  if (local && (values['session-key'] || values['defer-login'])) throw new InstallerError('Local mode uses an automatically generated device token, not a Machinal login.');
  const files = endpointFiles(endpoint.url, context);
  const script = await installRuntime(context);
  const options = { client, scope, cwd, home, env, url: endpoint.url, name: values.name ?? 'machinal', transport: 'stdio', script,
    catalogFile: files.catalogFile, ...(local ? { localConfig: files.localConfig } : {}) };
  const plan = await planConfiguration(options);
  const related = client === 'opencode' && plan.automaticAuth ? await planOpenCodeUpgrade(plan, options) : [];
  if (related.length) {
    log(`Synchronizing Machinal companion/runtime ${VERSION} in ${related.length + 1} OpenCode configurations (global, project, ancestors and recorded installs).`);
    if (context.verbose) for (const entry of related) log(`Will synchronize: ${entry.file}`);
  }
  if (client === 'codex' && scope === 'global') {
    try {
      const project = await planConfiguration({ ...options, scope: 'project' });
      if (project.conflict) log(`Warning: ${project.file} already defines this server differently and may override global settings in a trusted project. Update that scope explicitly with --scope project --replace; no project settings were changed.`);
    } catch {
      log('Warning: project Codex settings could not be inspected safely. Global setup does not repair a conflicting or invalid .codex/config.toml; inspect the effective client configuration.');
    }
  }
  const skillOptions = await chooseSkillOptions(values, context);
  const skills = skillOptions ? await planSkills({ ...options, ...skillOptions }) : null;
  await approveConflict(plan.conflict, values.replace, 'Replace only this named MCP server with the resilient stdio adapter?', context);
  await approveConflict(skills?.conflict, values['replace-skills'], 'Back up and replace only the changed bundled skill files?', context);
  let credentials;
  let result;
  let connection;
  if (local) {
    log('Local: your hardware and OpenRouter key. No Machinal credits.');
    const profile = await prepareIndependentLocal(values, endpoint.url, files.localConfig, context);
    credentials = { key: profile.key, source: 'local' };
    const verify = () => (context.checkConnection ?? checkConnection)(endpoint.url, profile.key, { local: true });
    try { result = await verify(); } catch (error) {
      if (error.code !== 'network') throw error;
      await profile.start();
      result = await verify();
    }
    if (!result.local) throw new InstallerError('The endpoint is not the independent local profile. No client configuration was written; use Server for an authenticated deployment.');
  } else {
    credentials = await serverCredentials(values, context);
    if (credentials) {
      try { result = await (context.checkConnection ?? checkConnection)(endpoint.url, credentials.key); } catch (error) {
        const diagnostic = new MCPBridge({ url: endpoint.url, env: {}, credentialStore: null });
        diagnostic.failure(error);
        connection = diagnostic.status();
        log(connection.message);
      }
    } else log('Login required. Installing the MCP adapter without credentials; it will remain available for connection diagnostics.');
  }
  if (result?.tools) {
    await cacheCatalog(files.catalogFile, { url: endpoint.url, tools: result.tools, instructions: result.instructions });
  }
  const upgrades = related.length ? await saveOpenCodeUpgrade(plan, related) : [];
  const saved = upgrades.at(-1) ?? await saveConfiguration(plan);
  await recordInstallation(options);
  for (const upgraded of upgrades.slice(0, -1)) {
    if (upgraded.backup) log(`Backup: ${upgraded.backup}`);
  }
  const installed = skills ? await saveSkills(skills) : null;
  await saveSettings({ connection: { mode: endpoint.mode, url: endpoint.url, ...(local ? { localConfig: files.localConfig } : {}) } }, context);
  const backups = backupSummary(saved, installed, skills?.root);
  if (backups) log(backups);
  if (!local && result && credentials) await offerKeyStorage(credentials, context, { sessionOnly: values['session-key'] });
  log('Setup ready', 'heading');
  log(`MCP adapter configured for ${client}: ${plan.file}`);
  log(result ? `Service verified: ${result.toolCount} tools. A running client connection has not been checked.`
    : `Service status: ${connection?.status ?? 'login_required'}. The adapter is installed, not a verified service connection.`);
  if (result?.credits) for (const line of (context.verbose ? creditSummaryLines : compactCreditSummaryLines)(result.credits)) log(line);
  if (result?.creditsWarning) log(result.creditsWarning);
  if (result?.mediaWarning) log(context.verbose ? result.mediaWarning : 'Warning: some media tools are unavailable. Update the API before media work.');
  if (result?.referenceWarning) log(context.verbose ? result.referenceWarning : 'Warning: live editing reference unavailable. Update the API.');
  if (context.verbose && client === 'codex') log(scope === 'global'
    ? 'Codex: global config is visible from every project (CODEX_HOME is respected). Check with codex mcp list, then /mcp in a new session.'
    : 'Codex loads .codex/config.toml only in trusted projects. Trust the project yourself or rerun with --scope global.');
  if (client === 'codex' && scope === 'project') log('Codex: trust this project to load its MCP configuration.');
  if (client === 'claude' && scope === 'project') log('Claude Code: approve project MCP settings if asked.');
  if (context.verbose && client === 'antigravity') log('Antigravity: global config (~/.gemini/config/mcp_config.json) applies across Antigravity CLI (agy), IDE, and App. Check with agy mcp list.');
  if (context.verbose) log('Use connection_status to see Login required, Connection unavailable, or Connected. Client-owned MCP badges cannot be renamed by an API-key adapter.');
  if (!values['no-launch'] && interactive && result && credentials && await ui.confirm({ message: `Start ${client} now?`, default: true })) {
    if (local) return context.launch(client, undefined, { cwd, env, unkeyed: true });
    return context.launch(client, credentials.key, { cwd, env });
  }
  log(local ? 'Next: open your agent. The local device token is loaded automatically.'
    : 'Next: open your agent. Saved keys load automatically; use machinal set-key if login is required.');
  return 0;
}
