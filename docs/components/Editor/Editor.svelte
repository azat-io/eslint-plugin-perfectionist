<script lang="ts">
  import * as monaco from 'monaco-editor'
  import { formatHex } from 'culori'
  import { onMount } from 'svelte'

  import { colorTheme } from '../../utils/shiki-theme'
  import Button from '../Button.svelte'

  let editor: monaco.editor.IStandaloneCodeEditor | null = null

  let toRgb = (color: string): string => {
    if (!color) {
      return color
    }
    let hex = formatHex(color)
    if (!hex) {
      throw new Error(`Could not convert ${JSON.stringify(color)} to RGB`)
    }
    return hex
  }

  let resolveCssVariable = (variable: string): string => {
    if (!variable) {
      return variable
    }
    let styles = getComputedStyle(document.documentElement)
    let cleanVariable = variable.replace(/^var\(/u, '').replace(/\)$/u, '')
    return styles.getPropertyValue(cleanVariable).trim()
  }

  let defineMonacoTheme = (themeName: string): void => {
    monaco.editor.defineTheme(themeName, {
      rules: colorTheme.tokenColors
        ?.flatMap(token =>
          (Array.isArray(token.scope) ? token.scope : [token.scope]).map(
            scope => ({
              foreground: toRgb(
                resolveCssVariable(
                  token.settings.foreground ??
                    colorTheme.colors!['editor.foreground']!,
                ),
              ),
              fontStyle: token.settings.fontStyle ?? 'normal',
              token: scope,
            }),
          ),
        )
        .filter(
          ({ foreground }) => !!foreground,
        ) as monaco.editor.ITokenThemeRule[],
      colors: Object.fromEntries(
        Object.entries(colorTheme.colors!)
          .map(([key, value]) => [key, toRgb(resolveCssVariable(value))])
          .filter(([_, value]) => !!value),
      ),
      base: 'vs-dark',
      inherit: false,
    })
  }

  onMount(() => {
    let container: HTMLElement | null = document.querySelector('.monaco')
    if (container) {
      defineMonacoTheme('css-variables')

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
      })

      editor = monaco.editor.create(container, {
        minimap: {
          enabled: false,
        },
        // @ts-ignore
        'bracketPairColorization.enabled': false,
        fontFamily: 'var(--font-family-code)',
        language: 'typescript',
        matchBrackets: 'never',
        automaticLayout: true,
        value: 'const a = 3',
        lineHeight: 1.7,
        fontSize: 15,
      })

      monaco.editor.setTheme('css-variables')

      editor.onDidChangeModelContent(() => {})
    }
  })
</script>

<div class="wrapper">
  <Button color="primary" content="Fix ESLint problems" />
  <div class="monaco" />
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  .monaco {
    inline-size: 100%;
    block-size: 600px;
    overflow: hidden;
    border-radius: var(--border-radius);
  }
</style>
