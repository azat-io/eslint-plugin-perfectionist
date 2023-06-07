import mod from '../index'

export default {
  rules: mod.configs['recommended-alphabetical'].rules,
  plugins: {
    perfectionist: mod,
  },
}
