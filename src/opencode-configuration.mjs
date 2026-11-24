import { applyEdits, modify, parse } from 'jsonc-parser';
import { InstallerError } from './errors.mjs';
import { VERSION } from './version.mjs';
import { isDeepStrictEqual } from 'node:util';
import { isManagedRuntimeCommand, sameManagedRuntime } from './runtime.mjs';
import { parseJSONConfiguration } from './formats.mjs';

const installedPackage = /\/node_modules\//.test(import.meta.url);
export const OPENCODE_AUTH_PLUGIN = installedPackage ? `@machinal/mcp@${VERSION}` : new URL('./opencode-plugin', import.meta.url).href;

export function isMachinalPlugin(entry) {
  const name = typeof entry === 'string' ? entry : entry?.package;
  return name === OPENCODE_AUTH_PLUGIN || /^@machinal\/mcp(?:@[\w.+-]+)?$/.test(name ?? '')
    || /^file:\/\/\/.*\/(?:mcp-installer|node_modules\/@machinal\/mcp)\/src\/opencode-plugin\/?$/.test(name ?? '');
}

function companion(config, context = {}) {
  const plugins = config.plugins ?? [];
  if (!Array.isArray(plugins)) throw new InstallerError('OpenCode plugins must be an array. No configuration was changed.');
  const indexes = plugins.flatMap((entry, index) => isMachinalPlugin(entry) ? [index] : []);
  const options = {};
  for (const index of indexes) {
    const entry = typeof plugins[index] === 'string' ? {} : plugins[index].options ?? {};
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new InstallerError('The machinal authentication plugin options are invalid. No configuration was changed.');
    for (const [key, value] of Object.entries(entry)) {
      if (['servers', 'commands', 'localConfigs'].includes(key)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InstallerError('The machinal authentication plugin options are invalid. No configuration was changed.');
        options[key] ??= {};
        for (const [name, setting] of Object.entries(value)) {
          if (Object.hasOwn(options[key], name) && !isDeepStrictEqual(options[key][name], setting)) {
            const previous = options[key][name];
            if (key === 'commands' && sameManagedRuntime(previous, setting, context)) {
              const server = config.mcp?.servers?.[name];
              if (server && (server.type !== 'local' || !sameManagedRuntime(server.command, setting, context))) {
                throw new InstallerError('A Machinal MCP command differs from its approved companion command. No configuration was changed; inspect this override before upgrading.');
              }
              options[key] = { ...options[key], [name]: server?.command ?? setting };
              continue;
            }
            throw new InstallerError('Duplicate Machinal plugins have conflicting server/options settings. Resolve the conflict before upgrading; no configuration was changed.');
          }
          options[key] = { ...options[key], [name]: setting };
        }
        continue;
      }
      if (Object.hasOwn(options, key) && !isDeepStrictEqual(options[key], value)) throw new InstallerError('Duplicate Machinal plugins have conflicting options. No configuration was changed.');
      Object.defineProperty(options, key, { value, enumerable: true, writable: true, configurable: true });
    }
  }
  return { plugins, indexes, options };
}

function writeCompanion(content, { plugins, indexes }, options) {
  const entry = { package: OPENCODE_AUTH_PLUGIN, options };
  const index = indexes[0] ?? -1;
  if (indexes.length === 1 && isDeepStrictEqual(plugins[index], entry)) return content;
  const indent = content.match(/^[ \t]+(?=")/m)?.[0] ?? '  ';
  const formattingOptions = { insertSpaces: !indent.includes('\t'), tabSize: indent.length, eol: content.includes('\r\n') ? '\r\n' : '\n' };
  if (indexes.length > 1) {
    const consolidated = plugins.flatMap((plugin, position) => position === index ? [entry] : indexes.includes(position) ? [] : [plugin]);
    // Deleting individual nested array entries can corrupt compact JSON in jsonc-parser.
    return applyEdits(content, modify(content, ['plugins'], consolidated, { formattingOptions }));
  }
  return applyEdits(content, modify(content, plugins.length ? ['plugins', index < 0 ? -1 : index] : ['plugins'], plugins.length ? entry : [entry], { formattingOptions }));
}

export function removeOpenCodeAuthServer(content, name) {
  const config = parse(content);
  if (!Array.isArray(config.plugins)) return content;
  const plugins = config.plugins.flatMap((entry) => {
    if (!isMachinalPlugin(entry) || !entry.options?.servers?.[name]) return [entry];
    const servers = { ...entry.options.servers };
    const commands = { ...entry.options.commands };
    const localConfigs = { ...entry.options.localConfigs };
    delete servers[name];
    delete commands[name];
    delete localConfigs[name];
    if (!Object.keys(servers).length) return [];
    const nextOptions = { ...entry.options, servers };
    if (Object.keys(commands).length) nextOptions.commands = commands;
    else delete nextOptions.commands;
    if (Object.keys(localConfigs).length) nextOptions.localConfigs = localConfigs;
    else delete nextOptions.localConfigs;
    return [{ ...entry, options: nextOptions }];
  });
  if (JSON.stringify(plugins) === JSON.stringify(config.plugins)) return content;
  return applyEdits(content, modify(content, ['plugins'], plugins, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
}

export function configureOpenCodeAuth(content, name, url, command, context = {}) {
  const config = parse(content);
  const current = companion(config, context);
  const existing = current.options;
  const servers = { ...existing.servers, [name]: url };
  if (name === 'machinal' && servers.directional === url) delete servers.directional;
  const commands = { ...existing.commands };
  if (command) commands[name] = command;
  else delete commands[name];
  const localConfigs = { ...existing.localConfigs };
  if (context.localConfig) localConfigs[name] = context.localConfig;
  else delete localConfigs[name];
  const nextOptions = { ...existing, servers };
  if (Object.keys(commands).length) nextOptions.commands = commands;
  else delete nextOptions.commands;
  if (Object.keys(localConfigs).length) nextOptions.localConfigs = localConfigs;
  else delete nextOptions.localConfigs;
  return writeCompanion(content, current, nextOptions);
}

export function upgradeOpenCodeAuth(content, { script, home, env }) {
  parseJSONConfiguration(content, 'opencode');
  const config = parse(content);
  const current = companion(config, { home, env });
  if (!current.indexes.length) return content;
  const commands = { ...current.options.commands };
  for (const [name, command] of Object.entries(commands)) {
    if (!isManagedRuntimeCommand(command, { home, env })) continue;
    const server = config.mcp?.servers?.[name];
    if (server && (server.type !== 'local' || !sameManagedRuntime(server.command, command, { home, env }))) {
      throw new InstallerError('A Machinal MCP command differs from its approved companion command. No configuration was changed; inspect this override before upgrading.');
    }
    commands[name] = [command[0], script, ...command.slice(2)];
    if (server && !isDeepStrictEqual(server.command, commands[name])) {
      content = applyEdits(content, modify(content, ['mcp', 'servers', name, 'command'], commands[name], { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
    }
  }
  const upgraded = writeCompanion(content, current, { ...current.options, ...(current.options.commands ? { commands } : {}) });
  parseJSONConfiguration(upgraded, 'opencode');
  return upgraded;
}
