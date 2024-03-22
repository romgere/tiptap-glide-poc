import './style.css';
import './wc.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import WCNode from './wc-node.js';

const editor = new Editor({
  element: document.querySelector('.element'),
  extensions: [StarterKit, WCNode],
  content: '<p>Hello World!</p>',
  onSelectionUpdate({ editor }) {
    // The selection has changed.

    for (const t of ['bold', 'italic', 'strike', 'wc']) {
      const btn = document.getElementById(`${t}-btn`);
      if (editor.isActive(t)) {
        btn.setAttribute('class', 'active');

        btn.setAttribute('variant', 'primary');
      } else {
        btn.setAttribute('class', '');

        btn.removeAttribute('variant');
      }
    }
  },
});

document.getElementById('bold-btn').addEventListener('click', function () {
  editor.chain().focus().toggleBold().run();
});

document.getElementById('italic-btn').addEventListener('click', function () {
  editor.chain().focus().toggleItalic().run();
});

document.getElementById('strike-btn').addEventListener('click', function () {
  editor.chain().focus().toggleStrike().run();
});

document.getElementById('wc-btn').addEventListener('click', function () {
  //editor.chain().focus().setNode("wc", ).run();

  // need a more complex logic, but it's just for spike
  if (editor.isActive('wc')) {
    let { foo, bar } = editor.getAttributes('wc');

    foo = prompt(`Update foo (previous: ${foo}, empty to delete)`);
    if (!foo) {
      editor.commands.clearContent(); // Not what we're looking for, just for demo
      return;
    }
    bar = prompt(`Update foo (previous: ${bar}, empty to delete)`);
    if (!bar) {
      editor.commands.clearContent(); // Not what we're looking for, just for demo
      return;
    }

    editor.commands.addCustomWC({ foo, bar });
  } else {
    const foo = prompt('Enter foo');
    if (!foo) return;
    const bar = prompt('Enter bar');
    if (!bar) return;

    editor.commands.addCustomWC({ foo, bar });
  }
});
