import mod from '../index'

export default {
  rules: mod.configs['recommended-natural'].rules,
  plugins: {
    perfectionist: mod,
  },
}
