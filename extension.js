const vscode = require('vscode');
const fs = require('fs');

function activate(context) {
    // BEM classes in TSX/HTML
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            [
                { language: 'typescriptreact' },
                { language: 'javascriptreact' },
                { language: 'html' },
                { language: 'typescript' },
            ],
            { provideDefinition: provideClassDefinition }
        )
    );

    // Mixins in SCSS
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            [{ language: 'scss' }],
            { provideDefinition: provideMixinDefinition }
        )
    );
}

async function provideClassDefinition(document, position) {
    const range = document.getWordRangeAtPosition(position, /[\w][\w-]*(__[\w-]+)?(--[\w-]+)?/);
    if (!range) return null;

    const className = document.getText(range);
    if (!className.includes('-')) return null;

    const files = await vscode.workspace.findFiles(
        '**/*.scss',
        '**/{.next,node_modules,dist,.git}/**'
    );

    const locations = [];
    for (const file of files) {
        locations.push(...findClassInFile(file.fsPath, className));
    }

    return locations.length ? locations : null;
}

async function provideMixinDefinition(document, position) {
    const line = document.lineAt(position.line).text;

    // Get word under cursor
    const wordRange = document.getWordRangeAtPosition(position, /[\w-]+/);
    if (!wordRange) return null;
    const word = document.getText(wordRange);

    // Check the word is the mixin name in an @include on this line
    const includeMatch = line.match(/@include\s+([\w-]+)/);
    if (!includeMatch || includeMatch[1] !== word) return null;

    const mixinName = word;

    const files = await vscode.workspace.findFiles(
        '**/*.scss',
        '**/{.next,node_modules,dist,.git}/**'
    );

    const locations = [];
    for (const file of files) {
        locations.push(...findMixinInFile(file.fsPath, mixinName));
    }

    return locations.length ? locations : null;
}

function findMixinInFile(filePath, mixinName) {
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { return []; }

    const lines = content.split('\n');
    const results = [];

    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(new RegExp(`@mixin\\s+${mixinName}\\s*[({]`));
        if (match) {
            results.push(new vscode.Location(
                vscode.Uri.file(filePath),
                new vscode.Position(i, lines[i].indexOf(`@mixin`))
            ));
        }
    }

    return results;
}

function findClassInFile(filePath, className) {
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { return []; }

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

                if (full === className) {
                    results.push(new vscode.Location(
                        vscode.Uri.file(filePath),
                        new vscode.Position(i, Math.max(0, line.search(/[&.]/)))
                    ));
                }

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
        return parent + current.slice(1);
    }
    if (current.startsWith('.')) {
        return current.slice(1);
    }
    return current;
}

module.exports = { activate };
