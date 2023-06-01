<script>
/**
 * Ensure that a given value is a positive value.
 * @param value The value to check.
 * @param defaultValue The default value which is used if the `value` is undefined.
 * @returns The positive value as the result.
 */
function ensurePositiveInt(value, defaultValue) {
  return Math.max(1, (value !== undefined ? value : defaultValue) | 0)
}

/**
 * Computes the key string from the given marker.
 * @param marker marker
 * @returns the key string
 */
function computeKey(marker) {
  const code =
    (typeof marker.code === 'string'
      ? marker.code
      : marker.code && marker.code.value) || ''
  return `[${marker.startLineNumber},${marker.startColumn},${marker.endLineNumber},${marker.endColumn}]-${code}`
}

/**
 * Create quickfix code action.
 * @returns CodeAction
 */
function createQuickfixCodeAction(title, marker, model, fix) {
  const start = model.getPositionAt(fix.range[0])
  const end = model.getPositionAt(fix.range[1])
  /**
   * @type {import('monaco-editor').IRange}
   */
  const editRange = {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  }
  return {
    title,
    diagnostics: [marker],
    kind: 'quickfix',
    edit: {
      edits: [
        {
          resource: model.uri,
          textEdit: {
            range: editRange,
            text: fix.text,
          },
          versionId: model.getVersionId(),
        },
      ],
    },
  }
}
</script>

<script setup>
import { computed, reactive, ref, watch, toRaw, markRaw } from 'vue'
import MonacoEditor from './monaco-editor.vue'

const props = defineProps({
  linter: {
    type: Object,
    default: null,
  },
  code: {
    type: String,
    default: '',
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  filename: {
    type: String,
    default: 'example.js',
  },
  preprocess: {
    type: Function,
    default: undefined,
  },
  postprocess: {
    type: Function,
    default: undefined,
  },
  fix: Boolean,
  language: {
    type: String,
    default: 'javascript',
  },
})
const emit = defineEmits(['change', 'update:code'])

const linter = ref(null)
const editorValue = ref(props.code)
const messages = ref([])
const fixedCode = ref(props.code)
const fixedMessages = ref([])
const previewFix = ref(false)
const editorMessageMap = reactive(new Map())
const waiting = ref(null)

const monacoEditorRef = ref(undefined)

let editing = null
let requestFix = false

const provideCodeActions = computed(() => (model, _range, context) => {
  const messageMap = editorMessageMap.get(model.uri)
  if (context.only !== 'quickfix' || !messageMap) {
    return {
      actions: [],
      dispose() {
        /* nop */
      },
    }
  }

  const actions = []
  for (const marker of context.markers) {
    const message = messageMap.get(computeKey(marker))
    if (!message) {
      continue
    }
    if (message.fix) {
      actions.push(
        createQuickfixCodeAction(
          `Fix this ${message.ruleId} problem`,
          marker,
          model,
          message.fix,
        ),
      )
    }
    if (message.suggestions) {
      for (const suggestion of message.suggestions) {
        actions.push(
          createQuickfixCodeAction(
            `${suggestion.desc} (${message.ruleId})`,
            marker,
            model,
            suggestion.fix,
          ),
        )
      }
    }
  }

  return {
    actions,
    dispose() {
      /* nop */
    },
  }
})
const markers = computed(() => {
  const editor = monacoEditorRef.value?.getLeftEditor()
  return messagesToMarkers(editor?.getModel() ?? null, messages.value, true)
})
const rightMarkers = computed(() => {
  const editor = monacoEditorRef.value?.getRightEditor()
  return messagesToMarkers(
    editor?.getModel() ?? null,
    fixedMessages.value,
    true,
  )
})

watch(
  () => props.linter,
  () => {
    waiting.value = update()

    async function update() {
      const v = toRaw(await props.linter)
      linter.value = v && markRaw(v)
      return null
    }
  },
  { immediate: true },
)
watch(linter, () => {
  invalidate()
})
watch(
  () => props.code,
  value => {
    editorValue.value = value
  },
)
watch(editorValue, () => {
  emit('update:code', editorValue.value)
  invalidate()
})
watch(previewFix, () => {
  invalidate()
})
watch(
  () => props.config,
  () => {
    invalidate()
  },
  { deep: true },
)
watch(
  () => props.filename,
  () => {
    invalidate()
  },
)
watch(
  () => props.fix,
  () => {
    invalidate()
  },
)

/** init */
function initialize() {
  lint()
  editing = null
}

/** Invalidate */
function invalidate() {
  if (editing != null) {
    clearTimeout(editing)
  }
  editing = setTimeout(() => {
    lint()
    editing = null
  }, 667)
}

/** Execute lint */
function lint() {
  const { config, filename, preprocess, postprocess } = props
  if (linter.value == null) {
    return
  }
  editorMessageMap.clear()
  const code = editorValue.value

  const options = {
    filename,
    preprocess,
    postprocess,
  }
  // Lint
  try {
    messages.value = linter.value.verify(code, config, options)
  } catch (err) {
    messages.value = [
      {
        fatal: true,
        ruleId: null,
        severity: 2,
        message: err.message,
        line: 1,
        column: 0,
      },
    ]
  }

  // Fix
  try {
    const ret = linter.value.verifyAndFix(code, config, options)
    fixedCode.value = ret.fixed ? ret.output : code
    fixedMessages.value = ret.messages
  } catch (err) {
    fixedCode.value = code
    fixedMessages.value = [
      {
        fatal: true,
        ruleId: null,
        severity: 2,
        message: err.message,
        line: 1,
        column: 0,
      },
    ]
  }

  emit('change', {
    code,
    messages: messages.value,
    fixedCode: fixedCode.value,
    fixedMessages: fixedMessages.value,
  })

  if (requestFix) {
    requestFix = false
    if (fixedCode.value !== editorValue.value) {
      editorValue.value = fixedCode.value
    }
  }
}

/** Linter message to monaco editor marker */
function messageToMarker(message) {
  const rule = message.ruleId && linter.value?.getRules().get(message.ruleId)
  const docUrl = rule && rule.meta && rule.meta.docs && rule.meta.docs.url
  const startLineNumber = ensurePositiveInt(message.line, 1)
  const startColumn = ensurePositiveInt(message.column, 1)
  const endLineNumber = ensurePositiveInt(message.endLine, startLineNumber)
  const endColumn = ensurePositiveInt(message.endColumn, startColumn + 1)

  const code = docUrl
    ? { value: message.ruleId, link: docUrl, target: docUrl }
    : message.ruleId || 'FATAL'

  return {
    code,
    severity: 8, // monaco.MarkerSeverity.Error,
    source: 'ESLint',
    message: message.message,
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  }
}

/** Linter message lint to monaco editor marker lint */
function messagesToMarkers(model, lintMessages, storeMessageMap) {
  if (model) {
    editorMessageMap.delete(model.uri)
  }
  const resultMarkers = []
  let messageMap = null
  if (storeMessageMap) {
    messageMap = new Map()
    if (model) {
      editorMessageMap.set(model.uri, messageMap)
    }
  }
  for (const message of lintMessages) {
    const marker = messageToMarker(message)
    resultMarkers.push(marker)
    if (messageMap) {
      messageMap.set(computeKey(marker), message)
    }
  }

  return resultMarkers
}

/** Apply autofix */
function applyAutofix() {
  if (editing) {
    requestFix = true
  } else if (fixedCode.value !== editorValue.value) {
    editorValue.value = fixedCode.value
  }
}
</script>

<template>
  <monaco-editor
    ref="monacoEditorRef"
    v-model="editorValue"
    :right-code="fixedCode"
    :markers="markers"
    :right-markers="rightMarkers"
    :provide-code-actions="provideCodeActions"
    :diff-editor="previewFix"
    :language="language"
    :waiting="waiting"
    @mounted-editor="initialize"
  >
    <template #actions>
      <div v-if="fix" class="eslint-editor-actions">
        <label>
          <input
            v-model="previewFix"
            type="checkbox"
          /><!-- eslint-disable-line @mysticatea/prettier -->
          Preview
        </label>
        <button @click="applyAutofix">Apply</button>
      </div>
    </template>
  </monaco-editor>
</template>

<style scoped>
.eslint-editor-actions {
  display: flex;
  flex-direction: row;
  position: absolute;
  right: 20px;
  bottom: -0.9rem;
  border: 1px solid gray;
  border-radius: 4px;
  opacity: 0.3;
  transition: opacity 0.3s;
}
.eslint-editor-actions:hover {
  opacity: 1;
}
.eslint-editor-actions::before {
  content: '🔧';
  display: inline-block;
  margin: 2px;
  padding: 5px;
  font-size: 1em;
  vertical-align: middle;
}

.eslint-editor-actions,
.eslint-editor-actions button {
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.eslint-editor-actions > * {
  display: inline-block;
  box-sizing: border-box;
  width: 80px;
  margin: 2px;
  padding: 4px 8px;
  border: 1px solid gray;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1em;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
}
.eslint-editor-actions > *:hover {
  background-color: rgba(128, 128, 128, 0.2);
}
.eslint-editor-actions > *:active {
  background-color: rgba(128, 128, 128, 0.4);
}
.eslint-editor-actions input[type='checkbox'] {
  display: none;
}
</style>
