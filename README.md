# BEMLens

Tiny VS Code extension for BEM + SCSS projects.

VS Code already lets you Ctrl+click (Cmd on Mac) a function or variable to jump to where it's defined — that's built in. But a class name like `"card__title--large"` in your JSX is just a string to VS Code, so that same click does nothing. BEMLens makes classes and mixins work the same way, so your markup, styles, and logic are all one click apart.

## Features

**Class name → SCSS definition.** Ctrl+click a class name in your component → jumps straight to the SCSS rule that styles it. Understands nested BEM syntax (`&__element`, `&--modifier`), which CSS Peek can't resolve.

```scss
.card {
  &__title {
    &--large { ... } // Ctrl+click "card__title--large" in your JSX lands here
  }
}
```

**`@include` → `@mixin` definition.** Ctrl+click a mixin name after `@include` in SCSS → jumps to where that `@mixin` is defined.

**Usage count CodeLens.** Above every class in SCSS, a small "N usages in TSX/JSX" lens shows how many places use it — click it to see them all, same as the built-in "N references" you get on functions.

## Install

Download the latest `.vsix` from [Releases](https://github.com/Inspiractus01/bemlens/releases), then:

```bash
code --install-extension bemlens.vsix
```

Or, one line:

```bash
curl -sL -o /tmp/bemlens.vsix https://github.com/Inspiractus01/bemlens/releases/latest/download/bemlens.vsix && code --install-extension /tmp/bemlens.vsix
```

## License

MIT
