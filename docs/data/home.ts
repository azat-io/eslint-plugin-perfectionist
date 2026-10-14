export interface Benefit {
  description: string
  title: string
  icon: string
}

export interface CodeStyle {
  paragraphs: [string, string]
  title: string
}

export interface InstallCommand {
  command: string
  name: string
}

export const DESCRIPTION =
  'Automatically sort and organize objects, imports, types, enums, and JSX props. Ensure a clean and maintainable codebase with minimal effort.'

export const TAGLINE = 'Take Your Code to a Beauty Salon'

export const BENEFITS: Benefit[] = [
  {
    description:
      'Automatically fix all errors safely. No manual intervention needed!',
    title: 'Fixable Rules',
    icon: 'tool',
  },
  {
    description:
      'Achieve a consistent code style for better readability and maintenance.',
    title: 'Code Uniformity',
    icon: 'code',
  },
  {
    description:
      'Flexible configuration to match your preferences. Seamless editor integration.',
    title: 'Easy to Use',
    icon: 'rocket-ship',
  },
  {
    description:
      'Enjoy aesthetically pleasing code. Make it look really awesome.',
    title: "It's Just Beautiful",
    icon: 'color-palette',
  },
]

export const INSTALL_COMMANDS: InstallCommand[] = [
  {
    command: 'npm install --save-dev eslint-plugin-perfectionist',
    name: 'npm',
  },
  { command: 'pnpm add --save-dev eslint-plugin-perfectionist', name: 'pnpm' },
  { command: 'yarn add --dev eslint-plugin-perfectionist', name: 'yarn' },
  { command: 'bun install --dev eslint-plugin-perfectionist', name: 'bun' },
]

export const CODE_STYLE: CodeStyle = {
  paragraphs: [
    'Consistent code style fosters collaboration and improves quality. Uniform style makes code readable and manageable, enabling quick understanding and contribution.',
    'Our tool helps enforce these standards, ensuring that your codebase stays neat and organized.',
  ],
  title: 'Identical Code Style',
}
