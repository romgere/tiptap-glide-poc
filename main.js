import './style.css';
import './wc.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import content from './initial-content.js';
// import Image from '@tiptap/extension-image'
import Image from './image-node.js'
import FileHandler from './file-handler-plugins.js';
import BubbleMenu from '@tiptap/extension-bubble-menu'
import FontFamily from '@tiptap/extension-font-family'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'

import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Gapcursor from '@tiptap/extension-gapcursor'

import WCNode from './wc-node.js';

const editor = new Editor({
  element: document.querySelector('.element'),
  extensions: [
    StarterKit,
    Color,
    TextStyle,
    FontFamily,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'image'],
    }),
    WCNode,
    Image,
    TaskItem,
    TaskList,
    Table.configure({
      resizable: true,
    }),
    TableCell,
    TableHeader,
    TableRow,
    Gapcursor,
    FileHandler.configure({
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
      ],
      onDrop: (currentEditor, files, pos) => {
        files.forEach(file => {
          const fileReader = new FileReader()

          fileReader.readAsDataURL(file)
          fileReader.onload = () => {
            currentEditor.chain().insertContentAt(pos, {
              type: 'image',
              attrs: {
                src: fileReader.result,
              },
            }).focus().run()
          }
        })
      },
      onPaste: (currentEditor, files, htmlContent) => {
        files.forEach(file => {
          if (htmlContent) {
            // if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
            // you could extract the pasted file from this url string and upload it to a server for example
            console.log(htmlContent) // eslint-disable-line no-console
            return false
          }

          const fileReader = new FileReader()

          fileReader.readAsDataURL(file)
          fileReader.onload = () => {
            currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
              type: 'image',
              attrs: {
                src: fileReader.result,
              },
            }).focus().run()
          }
        })
      },
    }),
    BubbleMenu.configure({
      element: document.querySelector('.bubblemenu1'),
      tippyOptions: {
        onShown: attachBubbleButtonEvent
      },
      shouldShow: ({ editor, view, state, oldState, from, to}) =>  {
        return !(editor.isActive('wc') || editor.isActive('image') || (editor.isActive('table') && from === to))
      },
    }),
    BubbleMenu.configure({
      element: document.querySelector('.bubblemenu2'),
      shouldShow: ({ editor}) =>  editor.isActive('image'),
    }),
    BubbleMenu.configure({
      element: document.querySelector('.bubblemenu3'),
      shouldShow: ({ editor}) =>  editor.isActive('wc'),
    }),
    BubbleMenu.configure({
      element: document.querySelector('.bubblemenu4'),
      shouldShow: ({ editor, view, state, oldState, from, to}) =>  {
        return editor.isActive('table') && from === to;
      },
      tippyOptions: {
        onShown: attachTableBubbleMenu
      },      
    }),

    

  ],
  content,
  update: ({ editor }) => updateToolBarState(editor),
  onSelectionUpdate: ({ editor }) => updateToolBarState(editor),
});



function updateToolBarState(editor) {
  for (const t of ['bold', 'italic', 'strike', 'code', 'wc']) {
    const btn = document.getElementById(`${t}-btn`);
    btn.setAttribute('variant', editor.isActive(t) ? 'primary' : 'default');
  }

  // Typo bar
  const pMenu = document.getElementById('typo-paragraph');
  if (editor.isActive('paragraph')) {
    pMenu.setAttribute('checked', '');
  } else {
    pMenu.removeAttribute('checked');
  }
  for (const h of [1,2,3,4,5,6]) {
    const menu = document.getElementById(`typo-h${h}`);
    if (editor.isActive('heading', { level: h })) {
      menu.setAttribute('checked', '');  
    } else {
      menu.removeAttribute('checked');
    }    
  }

  // List btn
  const ulBtn = document.getElementById('ul-btn')
  const olBtn = document.getElementById('ol-btn')
  ulBtn.setAttribute('variant', editor.isActive('bulletList') ? 'primary' : 'default');
  olBtn.setAttribute('variant', editor.isActive('orderedList') ? 'primary' : 'default');

  // undo/redo
  const undoBtn = document.getElementById('undo-btn')
  const redoBtn = document.getElementById('redo-btn')
  if (!editor.can().chain().focus().undo().run()) {
    undoBtn.setAttribute('disabled', '');  
  } else {
    undoBtn.removeAttribute('disabled');
  }  
  if (!editor.can().chain().focus().redo().run()) {
    redoBtn.setAttribute('disabled', '');  
  } else {
    redoBtn.removeAttribute('disabled');
  }  

  const colorBtn = document.getElementById('color-picker-btn')
  const colorPicker = document.getElementById('color-picker')
  const color = editor.getAttributes('textStyle').color ?? null;
  colorBtn.setAttribute('variant', color ? 'primary' : 'default');
  colorPicker.value = color ?? '#000000';

  for (const align of ['left', 'center', 'right']) {
    const btn = document.getElementById(`align-${align}-btn`);
    btn.setAttribute('variant', editor.isActive({ textAlign: align }) ? 'primary' : 'default');
  }

  const fontSelect = document.getElementById('font-select')
  const fontFamily = editor.getAttributes('textStyle').fontFamily ?? null;
  fontSelect.value = fontFamily ? fontFamily.replace('_', ' ') : 'default';
}

document.getElementById('bold-btn').addEventListener('click', function () {
  editor.chain().focus().toggleBold().focus().run();
});
document.getElementById('italic-btn').addEventListener('click', function () {
  editor.chain().focus().toggleItalic().focus().run();
});
document.getElementById('strike-btn').addEventListener('click', function () {
  editor.chain().focus().toggleStrike().focus().run();
});
document.getElementById('code-btn').addEventListener('click', function () {
  editor.chain().focus().toggleCode().focus().run();
});


document.getElementById('typo-menu').addEventListener('sl-select', function(event) {
  const { value } = event.detail.item;

  if( value === 'p') {
    editor.chain().focus().setParagraph().focus().run()
  } else {
    editor.chain().focus().toggleHeading({ level: parseInt(value) }).focus().run();
  }
});


document.getElementById('ul-btn').addEventListener('click', function () {
  editor.chain().focus().toggleBulletList().focus().run()
});
document.getElementById('ol-btn').addEventListener('click', function () {
  editor.chain().focus().toggleOrderedList().focus().run()
});

document.getElementById('undo-btn').addEventListener('click', function () {
  editor.chain().focus().undo().run()
});
document.getElementById('redo-btn').addEventListener('click', function () {
  editor.chain().focus().redo().run()
});

document.getElementById('color-picker').addEventListener('sl-change', function (event) {
  const { value } = event.target;
  editor.chain().focus().setColor(value).run()
});

for (const align of ['left', 'center', 'right']) {
  document.getElementById(`align-${align}-btn`).addEventListener('click', function () {  
    editor.chain().focus().setTextAlign(align).run()
  });
}

const dialog = document.getElementById('wc-modal');
const dialogCancel = document.getElementById('modal-btn-cancel');
const dialogOK = document.getElementById('modal-btn-ok');


document.getElementById('wc-btn').addEventListener('click', function () {
  if (editor.isActive('wc')) {
    let { foo, bar } = editor.getAttributes('wc');

    document.getElementById('foo-input').value = foo;
    document.getElementById('bar-input').value = bar;

    dialogOK.innerText = 'Update';
  } else {
    document.getElementById('foo-input').value = '';
    document.getElementById('bar-input').value = '';
    dialogOK.innerText = 'Insert';
  }
  dialog.show();
});

dialogOK.addEventListener('click', function() {
  dialog.hide();

  const foo = document.getElementById('foo-input').value
  const bar = document.getElementById('bar-input').value

  editor.commands.addCustomWC({ foo, bar });  
  editor.chain().focus().run();
})

dialogCancel.addEventListener('click', function() {
  dialog.hide();
  editor.chain().focus().run();
})

// a quick workarround to prevent bubble menu to received multiple time the same event listener
let isBubbleInit = false;
function attachBubbleButtonEvent() {
  if(isBubbleInit) {
    return;
  }
  document.getElementById('bold-b-btn').addEventListener('click', function () {
    editor.chain().focus().toggleBold().run();
  });
  document.getElementById('italic-b-btn').addEventListener('click', function () {
    editor.chain().focus().toggleItalic().run();
  });
  document.getElementById('strike-b-btn').addEventListener('click', function () {
    editor.chain().focus().toggleStrike().run();
  });

  isBubbleInit = true;
}
let isTableBubbleInit = false;

function attachTableBubbleMenu() {
  if( isTableBubbleInit) {
    return;
  }


  document.getElementById('add-row-before').addEventListener('click', function () {
    editor.commands.addRowBefore()
  });
  document.getElementById('add-row-after').addEventListener('click', function () {
    editor.commands.addRowAfter()
  });

  document.getElementById('add-col-before').addEventListener('click', function () {
    editor.commands.addColumnBefore()
  });
  document.getElementById('add-col-after').addEventListener('click', function () {
    editor.commands.addColumnAfter()
  });
  
  

  isTableBubbleInit = true;
}

document.getElementById('font-select').addEventListener('sl-change', function (e) {
  const value = e.target.value;
  if (value !== 'default') {
    editor.chain().focus().setFontFamily(value).run()
  } else {
    editor.chain().focus().unsetFontFamily().run()
  }
});