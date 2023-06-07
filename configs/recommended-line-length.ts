import mod from '../index'

export default {
  rules: mod.configs['recommended-line-length'].rules,
  plugins: {
    perfectionist: mod,
  },
}
