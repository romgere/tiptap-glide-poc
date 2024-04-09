import { Editor, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from "@tiptap/pm/view";

type OnDropCb = (editor: Editor, files: File[], dropPosition: number | undefined) => void;
type OnPastCb = (editor: Editor, files: File[], htmlContent: string) => void;

type Options = {
    onPaste: OnPastCb,
    onDrop: OnDropCb;
    allowedMimeTypes: string[];
}

export default Extension.create<Options>({
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

function pmPlugin ({ editor, onPaste, onDrop, allowedMimeTypes}: { editor: Editor, onPaste: OnPastCb, onDrop: OnDropCb, allowedMimeTypes: string[]}) {
  return new Plugin({
    key: new PluginKey("fileHandler"),
    props: {
        handleDrop(view: EditorView, event: DragEvent) {
       
            if (!onDrop || !event.dataTransfer?.files.length) {
                return false;
            }
            const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY
            });
            let files = [...event.dataTransfer.files];
            if (allowedMimeTypes) {
                files = files.filter(l=> allowedMimeTypes.includes(l.type));
            }
            if (!files.length) {
                return false;
            }
            event.preventDefault();
            event.stopPropagation();
            onDrop(editor, files, pos?.pos);
        },
        handlePaste(_view: EditorView, event: ClipboardEvent) {
            if (!onPaste || !event.clipboardData?.files.length) {
                return false;
            }
            let files = [...event?.clipboardData.files];
            const htmlContent = event.clipboardData.getData("text/html");
            if (allowedMimeTypes) {
                files = files.filter(l=> allowedMimeTypes.includes(l.type));
            }
            if (!files.length) {
                return false;
            }
            event.preventDefault();
            event.stopPropagation();
            
            onPaste(editor, files, htmlContent);
        }
    }
  })
}

