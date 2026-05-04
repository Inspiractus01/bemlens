# BEM SCSS Navigator

Tiny VS Code plugin.

## What it does

Ctrl+click (Cmd on Mac) a class name in your component → jumps straight to the SCSS file where that class is defined.

Example: in your `.tsx` you have `<div className="card__title--large">`. Ctrl+click on `card__title--large` → opens the SCSS at the line where it's styled.

Also works when the SCSS is written like this (CSS Peek can't handle this):

```scss
.card {
  &__title {
    &--large { ... }
  }
}
```

Bonus: inside SCSS, Ctrl+click on `@include something` → jumps to `@mixin something`.

## Install

```bash
git clone https://github.com/Inspiractus01/bem-scss-nav.git ~/.vscode/extensions/local.bem-scss-nav-0.0.1
```

Restart VS Code.

## License

MIT
