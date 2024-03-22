import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export default Extension.create({
  name: "fileHandler",
    addOptions() {
        return {
            onPaste: () => {},
            onDrop: () => {},
            allowedMimeTypes: [],
        }
    },
    addProseMirrorPlugins() {
        return [pmPlugin({
            editor: this.editor,
            allowedMimeTypes: this.options.allowedMimeTypes,
            onDrop: this.options.onDrop,
            onPaste: this.options.onPaste
        })]
    }
})

function pmPlugin ({ editor, onPaste, onDrop, allowedMimeTypes}) {
  return new Plugin({
    key: new PluginKey("fileHandler"),
    props: {
        handleDrop(view, event) {
            var a;
            if (!onDrop || !((a = event.dataTransfer) != null && a.files.length))
                return !1;
            const e = view.posAtCoords({
                left: event.clientX,
                top: event.clientY
            });
            let t = Array.from(event.dataTransfer.files);
            return allowedMimeTypes && (t = t.filter(l=> allowedMimeTypes.includes(l.type))),
            t.length === 0 ? !1 : (event.preventDefault(),
            event.stopPropagation(),
            onDrop(editor, t, (e == null ? void 0 : e.pos) || 0),
            !0)
        },
        handlePaste(view, event) {
            var a;
            if (!onPaste || !((a = event.clipboardData) != null && a.files.length))
                return !1;
            let e = Array.from(event.clipboardData.files);
            const t = event.clipboardData.getData("text/html");
            return allowedMimeTypes && (e = e.filter(l=>allowedMimeTypes.includes(l.type))),
            !(e.length === 0 || (event.preventDefault(),
            event.stopPropagation(),
            onPaste(editor, e, t),
            t.length > 0))
        }
    }
  })
}

