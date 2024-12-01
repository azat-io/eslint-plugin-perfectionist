import type { HandlerResponse, HandlerEvent, Handler } from '@netlify/functions'
import type { Linter } from 'eslint'

import typescriptParser from '@typescript-eslint/parser'
import { ESLint } from 'eslint'

import type { Settings } from '../../utils/get-settings'

import perfectionist from '../..'

interface RequestBody {
  settings: Settings
  code: string
}

let unknownToString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString()
  }

  if (value === null) {
    return ''
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[object Object]'
    }
  }

  if (typeof value === 'function') {
    return '[Function]'
  }

  return String(value)
}

export let handler: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  let requestBody: RequestBody | null = null
  try {
    requestBody = JSON.parse(event.body ?? '{}')
    if (!requestBody) {
      throw new Error('Missing code')
    }
  } catch (error) {
    return {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error,
      }),
      statusCode: 400,
    }
  }
  let config: Linter.Config[] = [
    {
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          project: '../../tsconfig.json',
          tsconfigRootDir: process.cwd(),
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
        parser: typescriptParser as Linter.Parser,
      },
      files: ['**/*.ts', '**/*.tsx'],
    },
    {
      plugins: {
        perfectionist,
      },
    },
    {
      rules: Object.fromEntries(
        Object.keys(perfectionist.rules).map(ruleName => [
          `perfectionist/${ruleName}`,
          ['error'],
        ]),
      ),
    },
    {
      settings: {
        perfectionist: requestBody.settings,
      },
    },
  ]

  try {
    let eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: config,
    })

    let lintResult = await eslint.lintText(requestBody.code, {
      filePath: 'test.tsx',
    })
    let result = lintResult.at(0)?.messages ?? []

    return {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        result,
      }),
      statusCode: 200,
    }
  } catch (error) {
    console.error(error)
    return {
      body: JSON.stringify({
        message: unknownToString(error),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      statusCode: 400,
    }
  }
}
