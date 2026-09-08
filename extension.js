const vscode = require('vscode');
const fs = require('fs');

// Depth-based BEM resolver (handles multi-brace lines correctly), adapted
// from https://github.com/Inspiractus01/bem-scss-nav — resolves `&__x` /
// `&--x` / `&.x` against the nearest ancestor class selector.
function extractSelectors(content) {
  const lines = content.split('\n');
  const results = [];
  const stack = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    if (opens > 0) {
      const selectorMatch = trimmed.match(/^([&.][\w&_-]+)/);
      if (selectorMatch) {
        const sel = selectorMatch[1];
        const full = resolveSelector(stack, sel);
        const col = Math.max(0, line.search(/[&.]/));
        results.push({ className: full, line: i, startChar: col, length: sel.length });
        stack.push({ resolved: full, depth });
      }
    }

    depth += opens - closes;

    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
  }

  return results;
}

function resolveSelector(stack, current) {
  if (current.startsWith('&')) {
    const parent = stack.length ? stack[stack.length - 1].resolved : '';
    return (parent || '') + current.slice(1);
  }
  if (current.startsWith('.')) {
    return current.slice(1);
  }
  return current;
}

function extractMixins(content) {
  const lines = content.split('\n');
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/@mixin\s+([\w-]+)\s*[({]/);
    if (m) {
      results.push({ name: m[1], line: i, startChar: lines[i].indexOf('@mixin') });
    }
  }
  return results;
}

function findScssFiles() {
  return vscode.workspace.findFiles('**/*.scss', '**/{node_modules,graft,.next,dist,build,.git}/**');
}

function readFile(fsPath) {
  try {
    return fs.readFileSync(fsPath, 'utf8');
  } catch {
    return null;
  }
}

// --- Cached workspace-wide index: class name -> Location[], mixin name -> Location[] ---
// Built once, rebuilt on any .scss create/change/delete. Avoids re-scanning
// every .scss file (and the file-search race that causes it) on every click.

let classIndex = new Map();
let mixinIndex = new Map();
let indexReady = Promise.resolve();

function addLocation(map, key, location) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(location);
}

async function rebuildIndex() {
  const files = await findScssFiles();
  const newClassIndex = new Map();
  const newMixinIndex = new Map();

  for (const uri of files) {
    const text = readFile(uri.fsPath);
    if (!text) continue;

    for (const sel of extractSelectors(text)) {
      addLocation(newClassIndex, sel.className, new vscode.Location(uri, new vscode.Position(sel.line, sel.startChar)));
    }
    for (const mixin of extractMixins(text)) {
      addLocation(newMixinIndex, mixin.name, new vscode.Location(uri, new vscode.Position(mixin.line, mixin.startChar)));
    }
  }

  classIndex = newClassIndex;
  mixinIndex = newMixinIndex;
}

// --- CodeLens: above each SCSS class, "N usages in TSX/JSX" -> native peek ---

async function findUsages(className) {
  const config = vscode.workspace.getConfiguration('scssUsageLens');
  const include = config.get('include');
  const exclude = config.get('exclude');
  const files = await vscode.workspace.findFiles(include, exclude, 1000);
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|['"\`\\s(])${escaped}(?=['"\`\\s)]|$)`, 'g');
  const locations = [];

  for (const uri of files) {
    const text = readFile(uri.fsPath);
    if (!text || !text.includes(className)) continue;

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(lines[i]))) {
        const start = m.index + (m[1] ? m[1].length : 0);
        locations.push(new vscode.Location(uri, new vscode.Range(i, start, i, start + className.length)));
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
  }

  return locations;
}

class ScssUsageCodeLensProvider {
  async provideCodeLenses(document) {
    const selectors = extractSelectors(document.getText());
    const lenses = [];

    for (const sel of selectors) {
      const range = new vscode.Range(sel.line, sel.startChar, sel.line, sel.startChar + sel.length);
      const locations = await findUsages(sel.className);
      const count = locations.length;
      const title = count === 0 ? 'no usages found in TSX/JSX' : `${count} usage${count === 1 ? '' : 's'} in TSX/JSX`;

      lenses.push(
        new vscode.CodeLens(range, {
          title,
          command: count > 0 ? 'editor.action.showReferences' : '',
          arguments: count > 0 ? [document.uri, range.start, locations] : undefined,
        }),
      );
    }

    return lenses;
  }
}

// --- Definition: TSX/JSX/HTML className -> SCSS definition ---

async function provideClassDefinition(document, position) {
  const range = document.getWordRangeAtPosition(position, /[\w][\w-]*(__[\w-]+)?(--[\w-]+)?/);
  if (!range) return null;

  const className = document.getText(range);
  if (!className.includes('-')) return null; // filters out components/vars (PascalCase, camelCase)

  await indexReady;
  return classIndex.get(className) || null;
}

// --- Definition: SCSS @include mixin -> @mixin definition ---

async function provideMixinDefinition(document, position) {
  const line = document.lineAt(position.line).text;
  const wordRange = document.getWordRangeAtPosition(position, /[\w-]+/);
  if (!wordRange) return null;
  const word = document.getText(wordRange);

  const includeMatch = line.match(/@include\s+([\w-]+)/);
  if (!includeMatch || includeMatch[1] !== word) return null;

  await indexReady;
  return mixinIndex.get(word) || null;
}

function activate(context) {
  indexReady = rebuildIndex();

  const watcher = vscode.workspace.createFileSystemWatcher('**/*.scss');
  watcher.onDidChange(() => { indexReady = rebuildIndex(); });
  watcher.onDidCreate(() => { indexReady = rebuildIndex(); });
  watcher.onDidDelete(() => { indexReady = rebuildIndex(); });

  context.subscriptions.push(
    watcher,
    vscode.languages.registerCodeLensProvider({ language: 'scss' }, new ScssUsageCodeLensProvider()),
    vscode.languages.registerDefinitionProvider(
      [{ language: 'typescriptreact' }, { language: 'javascriptreact' }, { language: 'typescript' }, { language: 'javascript' }, { language: 'html' }],
      { provideDefinition: provideClassDefinition },
    ),
    vscode.languages.registerDefinitionProvider([{ language: 'scss' }], { provideDefinition: provideMixinDefinition }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
