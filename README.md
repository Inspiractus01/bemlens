# BEM SCSS Navigator

Tiny VS Code extension for BEM + SCSS projects.

## What it does

- Ctrl+click (Cmd on Mac) a class name in your component → jumps to the SCSS file where that class is defined. Works with nested BEM syntax (`&__element`, `&--modifier`), which CSS Peek can't resolve.
- Ctrl+click `@include something` in SCSS → jumps to `@mixin something`.
- Above every class in SCSS, a small CodeLens shows how many times it's used in your TSX/JSX, click it to see them all.

Example: in your `.tsx` you have `<div className="card__title--large">`. Ctrl+click on `card__title--large` → opens the SCSS at the line where it's styled, even though the SCSS is written like:

```scss
.card {
  &__title {
    &--large { ... }
  }
}
```

## Install

Download the latest `.vsix` from [Releases](https://github.com/Inspiractus01/bem-scss-nav/releases), then:

```bash
code --install-extension bem-scss-nav-0.0.2.vsix
```

Or, one line:

```bash
curl -sL -o /tmp/bem-scss-nav.vsix https://github.com/Inspiractus01/bem-scss-nav/releases/latest/download/bem-scss-nav.vsix && code --install-extension /tmp/bem-scss-nav.vsix
```

## License

MIT
