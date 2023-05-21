declare module '*.vue' {
  import type { defineComponent } from 'vue'

  let Component: ReturnType<typeof defineComponent>
  export default Component
}
