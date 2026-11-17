import { terminalStyle } from './presentation.mjs';

export function createPromptUI(prompts, options = {}) {
  const style = terminalStyle(options);
  const stream = options.stream ?? process.stdout;
  const theme = {
    prefix: { idle: style('magenta', '?'), done: style('magenta', '-') },
    spinner: { interval: 120, frames: ['-', '\\', '|', '/'] },
    icon: { cursor: '>' },
    style: {
      message: (text, status) => status === 'done' ? text : style('bold', text),
      answer: (text) => text,
      highlight: (text) => style('magenta', text),
      description: (text) => text,
      help: (text) => text,
      disabled: (text) => text,
      defaultAnswer: (text) => `(${text})`,
      confirmDefault: (text) => text.toUpperCase(),
      key: (text) => `<${text}>`,
      error: (text) => `${style('red', 'Error:')} ${text}`,
      keysHelpTip: () => '  Up/down · Enter · Ctrl+C cancels',
    },
  };
  return Object.fromEntries(Object.entries(prompts).map(([name, prompt]) => [name, (config, context) => prompt({
    ...config,
    ...(name === 'select' ? { pageSize: 5, loop: false } : {}),
    ...(name === 'password' ? { toggleMask: false } : {}),
    theme: name === 'password' ? { ...theme, style: { ...theme.style, answer: () => '[hidden]' } } : theme,
  }, context)]));
}
