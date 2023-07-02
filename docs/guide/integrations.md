---
title: Integrations
---

# Integrations

You can set up the ability to fix linting problems when saving in your editor.

![ESLint Plugin Perfectionist usage demo](/demo.gif)

## 📟 JetBrains IDE

Open Settings (<kbd>⌘</kbd> + <kbd>,</kbd>), then select Languages & Frameworks / Code Quality Tools / ESLint. Check the box next to "Run eslint --fix on save".

## 📟 Vim

If you are using [ALE Vim plugin](https://github.com/dense-analysis/ale) add the following code to your `.vimrc`:

```vim
let g:ale_fix_on_save = 1
```

## 📟 Visual Studio Code

If you are using [ESLint extension](https://github.com/Microsoft/vscode-eslint) for VS Code open your `settings.json` file:

Press <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> and type "Open User Settings (JSON)".

Then add the following code to your `settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```
