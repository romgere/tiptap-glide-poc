import { Extension } from '@tiptap/core'
import { Page } from "../nodes/page/page";
import { buildComputedHtml } from "../nodes/page/core";
import { PageOptions } from "../nodes/page/types";
import { pagePlugin } from "../nodes/page/pagePlugn";
import { getId } from '../utils/id';

export const PageExtension = Extension.create<PageOptions>({
  name: "PageExtension",
  onBeforeCreate() {
    buildComputedHtml(this.options);    
  },
  addProseMirrorPlugins() {
    return [
      pagePlugin(this.editor, this.options)
    ];
  },

  // This add ID on all nodes,
  // it need extra work, mainly for new node created that does not receive any ID
  // usage of "onTransaction" call back seem needed.
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'image', 'wc','orderedList','bulletList','listItem','tableRow','table','heading','taskList'],
        attributes: {
          id: {
            isRequired: true,
            default: () => getId(),
            parseHTML: (element) => element.getAttribute("id") || getId(),
            renderHTML: (attributes) => {
              if (!attributes.id) {
                return {};
              }
              return {
                id: attributes.id
              };
            }
          },
        },
      },
    ]
  },
  addStorage() {
    let headerData: any[] = [];
    let footerData: any[] = [];
    if (this.options) {
      if (this.options.headerData) {
        headerData = this.options.headerData;
      }
      if (this.options.footerData) {
        footerData = this.options.footerData;
      }
    }
    return {
      headerData: headerData,
      footerData: footerData
    };
  },
  /*添加自定义组件*/
  addExtensions() {
    const extensions: any[] = [];
    extensions.push(Page.configure(this.options));
    return extensions;
  }
});
