import { isDeepStrictEqual } from 'node:util';
import { applyEdits, findNodeAtLocation, getNodeValue, modify, parseTree } from 'jsonc-parser';
import { getStaticTOMLValue, parseTOML } from 'toml-eslint-parser';
import { InstallerError } from './errors.mjs';
import { fileURLToPath } from 'node:url';

export function bridgeEntry(client, { url, localConfig, catalogFile, command = process.execPath, script = fileURLToPath(new URL('../bin/machinal-stdio.mjs', import.meta.url)) }) {
  const args = [script, 'serve', '--url', url,
    ...(localConfig ? ['--local-config', localConfig] : []), ...(catalogFile ? ['--catalog-file', catalogFile] : [])];
  if (client === 'opencode') return { type: 'local', command: [command, ...args] };
  if (client === 'claude') return { type: 'stdio', command, args };
  if (client === 'codex') return { command, args, env_vars: ['MACHINAL_API_KEY', 'DIRECTION_API_KEY'], startup_timeout_sec: 30, tool_timeout_sec: 930 };
  if (client === 'antigravity') return { command, args };
  throw new InstallerError('Choose opencode, claude, codex, or antigravity.');
}

export function serverEntry(client, url) {
  switch (client) {
    case 'opencode':
      return { type: 'remote', url, oauth: false, headers: { Authorization: 'Bearer {env:MACHINAL_API_KEY}' } };
    case 'claude':
      return { type: 'http', url, headers: { Authorization: 'Bearer ${MACHINAL_API_KEY}' } };
    case 'codex':
      return { url, bearer_token_env_var: 'MACHINAL_API_KEY' };
    case 'antigravity':
      return { url, headers: { Authorization: 'Bearer ${MACHINAL_API_KEY}' } };
    default:
      throw new InstallerError('Choose opencode, claude, codex, or antigravity.');
  }
}

function assertUniqueKeys(node) {
  if (node.type === 'object') {
    const keys = node.children.map((property) => property.children[0].value);
    if (new Set(keys).size !== keys.length) {
      throw new InstallerError('The configuration has duplicate JSON keys. Resolve them before running setup.');
    }
  }
  for (const child of node.children ?? []) assertUniqueKeys(child);
}

export function parseJSONConfiguration(original, client) {
  const bom = original.startsWith('\uFEFF') ? '\uFEFF' : '';
  const source = original.slice(bom.length) || '{}\n';
  const errors = [];
  const tree = parseTree(source, errors, { allowTrailingComma: client === 'opencode', disallowComments: client !== 'opencode' });
  if (errors.length || tree?.type !== 'object') {
    throw new InstallerError('The existing configuration is not a valid JSON object. It was left unchanged.');
  }
  assertUniqueKeys(tree);
  return { bom, source, tree };
}

export function updateJSON(original, client, name, entry) {
  const { bom, source, tree } = parseJSONConfiguration(original, client);

  const path = client === 'opencode' ? ['mcp', 'servers', name] : ['mcpServers', name];
  for (let depth = 1; depth < path.length; depth++) {
    const node = findNodeAtLocation(tree, path.slice(0, depth));
    if (node && node.type !== 'object') {
      throw new InstallerError('The existing MCP settings must be objects. The configuration was left unchanged.');
    }
  }

  if (client === 'opencode') {
    const mcpNode = findNodeAtLocation(tree, ['mcp']);
    const mcp = mcpNode && getNodeValue(mcpNode);
    if (mcp && Object.values(mcp).some((value) => value?.type === 'local' || value?.type === 'remote')) {
      throw new InstallerError('This file uses OpenCode V1 MCP settings. Migrate its MCP section to V2 before running setup.');
    }
  }

  const currentNode = findNodeAtLocation(tree, path);
  const current = currentNode ? structuredClone(getNodeValue(currentNode)) : undefined;
  const conflict = currentNode !== undefined && !isDeepStrictEqual(current, entry);
  const indent = source.match(/^[ \t]+(?=")/m)?.[0] ?? '  ';
  const options = { formattingOptions: { insertSpaces: !indent.includes('\t'), tabSize: indent.length, eol: source.includes('\r\n') ? '\r\n' : '\n' } };
  let content = source;
  if (!isDeepStrictEqual(current, entry)) content = applyEdits(content, modify(content, path, entry, options));
  if (client === 'opencode' && name === 'machinal') {
    const legacy = findNodeAtLocation(tree, ['mcp', 'servers', 'directional']);
    if (legacy && getNodeValue(legacy)?.url === entry.url) {
      content = applyEdits(content, modify(content, ['mcp', 'servers', 'directional'], undefined, options));
    }
  }
  if (client === 'opencode' && !findNodeAtLocation(tree, ['$schema'])) {
    content = applyEdits(content, modify(content, ['$schema'], 'https://opencode.ai/config.json', options));
  }

  return { content: bom + content, conflict };
}

function parseConfigTOML(source) {
  try {
    const ast = parseTOML(source, { tomlVersion: '1.0.0' });
    return { ast, value: getStaticTOMLValue(ast) };
  } catch {
    throw new InstallerError('The Codex configuration is not valid TOML. It was left unchanged.');
  }
}

function withoutServer(value, name) {
  const copy = structuredClone(value);
  if (copy.mcp_servers) {
    delete copy.mcp_servers[name];
    if (!Object.keys(copy.mcp_servers).length) delete copy.mcp_servers;
  }
  return copy;
}

export function removeJSONServers(original, client, ownsServer) {
  const { bom, source, tree } = parseJSONConfiguration(original, client);
  let content = source;
  const paths = client === 'opencode' ? [['mcp', 'servers'], ['mcp']] : [['mcpServers']];
  for (const path of paths) {
    const node = findNodeAtLocation(tree, path);
    const servers = node ? getNodeValue(node) : {};
    for (const [name, entry] of Object.entries(servers)) {
      if (path.length === 1 && path[0] === 'mcp' && name === 'servers') continue;
      if (!entry || typeof entry !== 'object' || !ownsServer(name, entry)) continue;
      content = applyEdits(content, modify(content, [...path, name], undefined, {
        formattingOptions: { insertSpaces: true, tabSize: 2, eol: original.includes('\r\n') ? '\r\n' : '\n' },
      }));
    }
  }
  parseJSONConfiguration(bom + content, client);
  return bom + content;
}

export function removeTOMLServers(original, ownsServer) {
  const bom = original.startsWith('\uFEFF') ? '\uFEFF' : '';
  let content = original.slice(bom.length);
  const { ast, value } = parseConfigTOML(content);
  const names = Object.entries(value.mcp_servers ?? {}).filter(([name, entry]) => ownsServer(name, entry)).map(([name]) => name);
  if (!names.length) return original;
  const tables = ast.body[0].body.filter(node => node.type === 'TOMLTable'
    && node.resolvedKey[0] === 'mcp_servers' && names.includes(node.resolvedKey[1]));
  if (names.some(name => !tables.some(node => node.resolvedKey[1] === name && node.resolvedKey.length === 2 && node.kind === 'standard'))) {
    throw new InstallerError('Cannot safely uninstall an inline/dotted Codex server. Use standard [mcp_servers.NAME] tables and rerun machinal uninstall.');
  }
  for (const table of tables.toSorted((left, right) => right.range[0] - left.range[0])) {
    content = content.slice(0, table.range[0]) + content.slice(table.range[1]);
  }
  let expected = value;
  for (const name of names) expected = withoutServer(expected, name);
  let actual = parseConfigTOML(content).value;
  for (const name of names) actual = withoutServer(actual, name);
  if (!isDeepStrictEqual(expected, actual) || names.some(name => parseConfigTOML(content).value.mcp_servers?.[name])) {
    throw new InstallerError('Could not preserve unrelated Codex settings. Nothing was removed.');
  }
  return bom + content;
}

export function updateTOML(original, name, entry) {
  const bom = original.startsWith('\uFEFF') ? '\uFEFF' : '';
  const source = original.slice(bom.length);
  const { ast, value } = parseConfigTOML(source);
  const servers = value.mcp_servers;
  if (servers !== undefined && (!servers || typeof servers !== 'object' || Array.isArray(servers))) {
    throw new InstallerError('Codex mcp_servers must be a table. The configuration was left unchanged.');
  }

  const current = servers && Object.hasOwn(servers, name) ? servers[name] : undefined;
  if (isDeepStrictEqual(current, entry)) return { content: original, conflict: false };

  const tables = ast.body[0].body.filter((node) => node.type === 'TOMLTable'
    && node.resolvedKey[0] === 'mcp_servers' && node.resolvedKey[1] === name);
  if (current !== undefined && !tables.some((node) => node.resolvedKey.length === 2 && node.kind === 'standard')) {
    throw new InstallerError('Use a standard [mcp_servers.NAME] table for this server, or choose a new --name. No settings were changed.');
  }

  let content = source;
  for (const table of tables.toSorted((left, right) => right.range[0] - left.range[0])) {
    content = content.slice(0, table.range[0]) + content.slice(table.range[1]);
  }
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const section = [`[mcp_servers.${name}]`, ...Object.entries(entry).map(([key, value]) => `${key} = ${JSON.stringify(value)}`), ''].join(eol);
  content += (content ? `${eol}${eol}` : '') + section;

  let updated;
  try {
    updated = parseConfigTOML(content).value;
  } catch {
    throw new InstallerError('Cannot safely edit inline or dotted MCP tables. Use standard [mcp_servers.NAME] tables, or a new configuration. No settings were changed.');
  }
  if (!isDeepStrictEqual(withoutServer(value, name), withoutServer(updated, name))) {
    throw new InstallerError('Could not preserve unrelated Codex settings. The configuration was left unchanged.');
  }

  return { content: bom + content, conflict: current !== undefined };
}
