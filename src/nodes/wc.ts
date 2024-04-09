//Inpired from https://github.com/ueberdosis/tiptap/blob/main/packages/extension-youtube/src/youtube.ts
import { Node } from '@tiptap/core';

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wc: {
      /**
       * Set media
       */
      addCustomWC: (options: { foo?: string, bar?: string }) => ReturnType;
    };
  }
}

const WC = Node.create({
  name: 'wc',

  addAttributes() {
    return {
      foo: {
        default: undefined,
      },
      bar: {
        default: 'default bar value',
      },
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-my-custom-element] my-custom-element',
      },
    ];
  },

  addCommands() {
    return {
      addCustomWC:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-my-custom-element': '' },
      ['my-custom-element', HTMLAttributes],
    ];
  },
});

export default WC;
