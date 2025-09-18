/*
  Converts src/editor/examples_raw.js into src/editor/examples_raw.json
  - Evaluates the module in a sandbox to collect examplesArray without executing external imports
  - Stringifies function examples and keeps string examples
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'editor');
const INPUT = path.join(SRC, 'examples_raw.js');
const OUTPUT = path.join(SRC, 'examples_raw.json');
const SHARE_INTERNAL = path.join(SRC, 'share_internal');
const PUBLIC_OUTPUT = path.join(SRC, 'public_examples.json');

function stripImports(src) {
  return src.replace(/^\s*import\s+[^\n]*\n/gm, '');
}

function processExample(key, example) {
  // Remove parcel/ts injected prefixes if present
  let text = (example || '').replace(/0,\s*editor_1\./g, '');
  // Remove function wrapper (first and last line)
  if (text.startsWith('function ') || text.startsWith('(') || text.startsWith('async ')) {
    const lines = text.split(/\r?\n/);
    if (lines.length >= 2) {
      const innerLines = lines.slice(1, lines.length - 1);
      const nonEmpty = innerLines.filter(l => l.trim().length > 0);
      const indentation = nonEmpty.length ? Math.min(...nonEmpty.map(l => l.length - l.trimLeft().length)) : 0;
      const fixedLines = innerLines.map(l => (indentation ? l.substring(indentation) : l));
      return fixedLines.join('\n');
    }
  }
  return text;
}

function listPublicExamples() {
  try {
    const entries = fs.readdirSync(SHARE_INTERNAL, { withFileTypes: true });
    const names = entries
      .filter(e => e.isFile() && e.name.endsWith('.js'))
      .map(e => e.name.replace(/\.js$/i, ''))
      .sort((a, b) => a.localeCompare(b));
    fs.writeFileSync(PUBLIC_OUTPUT, JSON.stringify(names, null, 2));
    console.log(`process-examples: wrote ${names.length} public examples to ${path.relative(ROOT, PUBLIC_OUTPUT)}`);
  } catch (e) {
    console.warn('process-examples: could not list public examples', e && e.message || e);
  }
}

function build() {
  console.log('process-examples: start');
  if (!fs.existsSync(INPUT)) {
    console.error('process-examples: input not found', INPUT);
    process.exit(1);
  }
  const original = fs.readFileSync(INPUT, 'utf8');

  const hasExport = /export\s+const\s+examplesArray\s*=\s*/m.test(original);
  console.log('process-examples: has export =', hasExport);

  // 1) Remove ESM imports
  const noImports = stripImports(original);

  // 2) Transform ESM export to assign to global
  const transformed = noImports.replace(/export\s+const\s+examplesArray\s*=\s*/m, 'globalThis.__examplesArray__ = ');
  const hasGlobalAssign = /globalThis\.__examplesArray__\s*=\s*\[/m.test(transformed);
  console.log('process-examples: has global assign =', hasGlobalAssign);

  const context = vm.createContext({
    console,
    api: {},
    width: 0,
    height: 0,
    param: null,
    canvas: null,
    sourceCanvas: null,
    context: null,
    Math,
    // Do not override globalThis; let VM provide it
  });

  try {
    const script = new vm.Script(transformed, { filename: 'examples_raw.js' });
    script.runInContext(context);
  } catch (e) {
    console.error('process-examples: failed to evaluate examples_raw.js');
    console.error(e && e.stack || e);
    fs.writeFileSync(path.join(SRC, 'examples_raw.transformed.js'), transformed);
    process.exit(1);
  }

  const arr = context.__examplesArray__ || (context.globalThis && context.globalThis.__examplesArray__);
  if (!Array.isArray(arr)) {
    console.error('process-examples: __examplesArray__ not found or not an array');
    fs.writeFileSync(path.join(SRC, 'examples_raw.transformed.js'), transformed);
    process.exit(1);
  }

  const out = {};
  for (const item of arr) {
    if (typeof item === 'function') {
      const key = item.name || 'unnamed_' + Math.random().toString(36).slice(2);
      const code = processExample(key, item.toString());
      out[key] = code;
    } else if (typeof item === 'string') {
      const fullText = item.trim();
      const p = fullText.indexOf(':');
      if (p > -1) {
        const key = fullText.slice(0, p).trim();
        const code = fullText.slice(p + 1).trim();
        out[key] = code;
      }
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2));
  console.log(`process-examples: wrote ${Object.keys(out).length} examples to ${path.relative(ROOT, OUTPUT)}`);

  // Also write public examples list
  listPublicExamples();
}

if (require.main === module) {
  build();
}

module.exports = { build };
