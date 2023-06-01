/* globals MONACO_EDITOR_VERSION */
async function setupMonaco() {
    if (typeof window !== "undefined") {
        const monacoScript =
            Array.from(document.head.querySelectorAll("script")).find(
                (script) =>
                    script.src &&
                    script.src.includes("monaco") &&
                    script.src.includes("vs/loader"),
            ) || (await appendMonacoEditorScript())

        // @ts-expect-error -- global Monaco's require
        window.require.config({
            paths: {
                vs: monacoScript.src.replace(/\/vs\/.*$/u, "/vs"),
            },
        })
    }
}

function appendMonacoEditorScript() {
    return new Promise((resolve) => {
        const script = document.createElement("script")
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_EDITOR_VERSION}/min/vs/loader.min.js`
        script.onload = () => {
            script.onload = null

            watch()

            function watch() {
                // @ts-expect-error -- global Monaco's require
                if (window.require) {
                    resolve(script)
                    return
                }
                setTimeout(watch, 200)
            }
        }
        document.head.append(script)
    })
}

let setupedMonaco = null
let editorLoaded = null

export function loadMonacoEngine() {
    return setupedMonaco || (setupedMonaco = setupMonaco())
}
export function loadMonacoEditor() {
    if (editorLoaded) {
        return editorLoaded
    }
    return (editorLoaded = (async () => {
        const monaco = await loadModuleFromMonaco("vs/editor/editor.main")
        return monaco
    })())
}

export async function loadModuleFromMonaco(moduleName) {
    await loadMonacoEngine()
    return new Promise((resolve) => {
        if (typeof window !== "undefined") {
            // @ts-expect-error -- global Monaco's require
            window.require([moduleName], (r) => {
                resolve(r)
            })
        }
    })
}
