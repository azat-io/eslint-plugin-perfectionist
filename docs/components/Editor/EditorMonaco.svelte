<script lang="ts">
  import type { Linter } from 'eslint'

  import * as monaco from 'monaco-editor'
  import { formatHex } from 'culori'
  import { dedent } from 'ts-dedent'
  import { onMount } from 'svelte'

  import { colorTheme } from '../../utils/shiki-theme'
  import { eslint } from '../../api'

  export let settings: Record<string, unknown> = {}

  let editor: monaco.editor.IStandaloneCodeEditor | null = null

  let baseValue = dedent`
    import Button from '~/components/Button'
    import type { FC } from 'react'

    import {
      useId,
      useCallback,
      useState,
      useEffect,
    } from 'react'

    import Form from '~/component/Form'

    import './style.css'
    import Input from '~/components/Input'
    import { FormValues } from '~/stores/auth'

    interface Props {
      className?: string
      onSubmit: (values: FormValues) => void
      id: string
      resetFormValues: () => void
      title: string
    }

    export const Auth: FC<Props> = (props) => (
      <Form {...props}>
        <Input
          placeholder="Enter your email"
          full
          name="user-email"
          validation={/^[^s@]+@[^s@]+.[^s@]+$/i}
          type="email"
          label="Email address"
        />
        <Button
          type="submit"
          className="submit-button"
          size="l"
          color="secondary"
        >
          Submit
        </Button>
      </Form>
    )
  `

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

  let lintCode = async (
    codeValue: string,
    settingsValue: Record<string, unknown>,
  ): Promise<Linter.LintMessage[]> => await eslint(codeValue, settingsValue)

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

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowNonTsExtensions: true,
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
        value: baseValue,
        lineHeight: 1.7,
        fontSize: 15,
      })

      monaco.editor.setTheme('css-variables')

      let validateCode = async (): Promise<void> => {
        let code = editor?.getValue() ?? ''

        let lintResults: Linter.LintMessage[] = await lintCode(code, settings)

        let markers = lintResults.map(result => ({
          severity:
            result.severity === 2
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
          endColumn: result.endColumn ?? result.column + 1,
          endLineNumber: result.endLine ?? result.line,
          startLineNumber: result.line,
          startColumn: result.column,
          message: result.message,
        }))

        let model = editor?.getModel()

        if (model) {
          monaco.editor.setModelMarkers(model, 'eslint', markers)
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      validateCode()

      editor.onDidChangeModelContent(validateCode)
    }
  })
</script>

<div class="monaco" />

<style>
  .monaco {
    inline-size: 100%;
    block-size: 600px;
  }
</style>
