import { mergeAttributes, Node, NodeViewRenderer, NodeViewRendererProps } from "@tiptap/core";
import { PageOptions } from "./types";
import { NodeView } from "@tiptap/pm/view";
import { getId } from '../../utils/id';

export const Page = Node.create<PageOptions>({
  priority: 2,
  name: 'page',
  content: `block*`,
  group: "block",
  isolating: true,
  selectable: false,
  addOptions() {
    return {
      footerHeight: 100,
      headerHeight: 100,
      bodyHeight: 0,
      bodyWidth: 0,
      bodyPadding: 0,
      isPaging: false,
      design: false,
      SystemAttributes: {}
    };
  },
  addAttributes() {
    return {
      HTMLAttributes: {},
      pageNumber: {
        default: 1
      },
      // id: {
      //   parseHTML: (element) => element.getAttribute("id"),
      //   renderHTML: (attributes) => {
      //     if (!attributes.id) {
      //       return {};
      //     }
      //     return {
      //       id: attributes.id
      //     };
      //   }
      // }
    };
  },

  parseHTML() {
    return [
      {
        tag: "page"
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {   
    return ["page", mergeAttributes(HTMLAttributes), 0];
  },
  addNodeView() {
    const options = this.options;
    return defaultPageViewRenderer(options);
  }
});

export function defaultPageViewRenderer(options: PageOptions): NodeViewRenderer {
  return (props: NodeViewRendererProps) => {
    return new PageView(props, options);
  };
}

/**
 * The default implementation of the paging component PageView
 * For implementation using the vue framework, please refer to VueNodeViewRenderer(PageComponet)
 */
export class PageView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  options: PageOptions;
  props: NodeViewRendererProps;
  constructor(props: NodeViewRendererProps, options: PageOptions) {
    this.options = options;
    this.props = props;
    this.dom = document.createElement("div");
    this.contentDOM = document.createElement("div");
    this.buildDom();
    this.buildCorners();
    this.buildContentDOM();
  }
  buildDom() {
    const { node } = this.props;
    this.dom.setAttribute("class", "Page text-editor relative");
    this.dom.setAttribute("style", "max-width:" + this.options.bodyWidth + "px;width:" + this.options.bodyWidth + "px;");
    this.dom.setAttribute("id", node.attrs.id);
    this.dom.oncontextmenu = () => false;
  }
  buildHeaderAndFooter() {
    //TODO Implementation of headers and footers
  }
  buildCorners() {
    const corners = ["corner-top-left", "corner-top-right", "corner-bottom-left", "corner-bottom-right"];
    corners.forEach((corner) => {
      const cornerDiv = document.createElement("div");
      cornerDiv.setAttribute("class", corner);
      this.dom.append(cornerDiv);
    });
  }
  buildContentDOM() {
    this.contentDOM.classList.add("PageContent"); // This class is also used for calculations and cannot be changed at will.
    this.contentDOM.setAttribute("style", "min-height: " + this.options.bodyHeight + "px;padding:" + this.options.bodyPadding + "px");
    this.dom.append(this.contentDOM);
  }
}