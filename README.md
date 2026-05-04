# BEM SCSS Navigator

VS Code extension. Ctrl/Cmd+click a BEM class name in TSX/JSX/HTML/TS or an `@include` mixin in SCSS — jumps straight to its SCSS definition. Works with nested BEM syntax (`&__element`, `&--modifier`) where CSS Peek falls short.

## Features

- Go-to-definition for BEM classes from `.tsx`, `.jsx`, `.html`, `.ts` into `.scss`
- Resolves nested selectors: `.block { &__elem { &--mod {} } }` → `block__elem--mod`
- Go-to-definition for `@mixin` from `@include name` inside SCSS
- Skips `node_modules`, `.next`, `dist`, `.git`

## Install (local)

```bash
git clone https://github.com/Inspiractus01/bem-scss-nav.git ~/.vscode/extensions/local.bem-scss-nav-0.0.1
```

Restart VS Code.

## Usage

Hold Ctrl (Cmd on macOS) and click a BEM class name like `card__title--large` in your component file. Jumps to the matching selector in any `.scss` file in the workspace.

## License

MIT
