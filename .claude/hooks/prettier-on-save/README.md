# Prettier On Save

Automatically formats code files with Prettier after Claude edits or creates them.

## What It Does

Runs Prettier on TypeScript, JavaScript, JSON, Markdown, YAML, CSS, and HTML files immediately after Claude writes or edits them.

## Supported File Types

- TypeScript: `.ts`, `.tsx`
- JavaScript: `.js`, `.jsx`
- JSON: `.json`
- Markdown: `.md`
- YAML: `.yml`, `.yaml`
- CSS/SCSS: `.css`, `.scss`
- HTML: `.html`

## Requirements

- [Prettier](https://prettier.io/) must be installed:
  ```bash
  npm install -g prettier
  # or
  npm install --save-dev prettier
  ```

## How It Works

- **Event**: `PostToolUse` (after file modifications)
- **Triggers On**: `Edit` and `Write` tools
- **Performance**: Runs in background (non-blocking)
- **Safety**: Fails gracefully if Prettier isn't installed

## Installation

```bash
prpm install @prpm/prettier-on-save
```

## Configuration

Configure Prettier using `.prettierrc` in your project root:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## Uninstall

```bash
prpm uninstall @prpm/prettier-on-save
```
