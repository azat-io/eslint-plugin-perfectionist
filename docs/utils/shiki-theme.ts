import { createCssVariablesTheme } from 'shiki'

export let colorTheme = createCssVariablesTheme({
  variablePrefix: '--color-code-',
  name: 'css-variables',
  variableDefaults: {},
  fontStyle: true,
})
