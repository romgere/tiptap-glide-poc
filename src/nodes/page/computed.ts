import { ComputedFn, NodesComputed, PageState, SplitParams, SplitInfo } from "./types";
import { Fragment, Node, Slice } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { getAbsentHtmlH, getBreakPos, getContentSpacing, getDefault, getDomHeight } from "./core";
import { getNodeType } from "@tiptap/core";
import { ReplaceStep } from "@tiptap/pm/transform";
import { Editor } from "@tiptap/core/dist/packages/core/src/Editor";
import { getId } from '../../utils/id';

/**
 * @description 默认 table ol ul 列表类型的公共计算逻辑
 * @param splitContex 分割上下文
 * @param node 当前需要计算的节点
 * @param pos   当前节点的位置
 * @param parent 当前节点的父节点
 * @param dom 当前节点的dom
 */
export const sameListCalculation: ComputedFn = (splitContex, node, pos, parent, dom) => {
  const pHeight = getDomHeight(dom);
  //如果列表的高度超过分页高度 直接返回继续循环 tr 或者li
  if (splitContex.isOverflow(pHeight)) return true;
  //没有超过分页高度 累加高度
  splitContex.addHeight(pHeight);
  return false;
};
let count = 1;
/**
 * @description 默认 LISTITEM TABLE_ROW 段落类型的公共计算逻辑
 * @param splitContex 分割上下文
 * @param node 当前需要计算的节点
 * @param pos  当前节点的位置
 * @param parent 当前节点的父节点
 * @param dom 当前节点的dom
 */
export const sameItemCalculation: ComputedFn = (splitContex, node, pos, parent, dom) => {
  const chunks = splitContex.splitResolve(pos);
  if (splitContex.isOverflow(0)) {
    if (count > 1) {
      count = 1;
      splitContex.setBoundary(chunks[chunks.length - 2][2], chunks.length - 2);
    } else {
      splitContex.setBoundary(pos, chunks.length - 1);
      count += 1;
    }
    return false;
  }
  const pHeight = getDomHeight(dom);
  if (splitContex.isOverflow(pHeight)) {
    if (pHeight > splitContex.getHeight()) {
      splitContex.addHeight(pHeight);
      return false;
    }

    //如果当前行是list的第一行并且已经超过分页高度 直接返回上一层级的切割点
    if (parent?.firstChild == node) {
      splitContex.setBoundary(chunks[chunks.length - 2][2], chunks.length - 2);
    } else {
      //如果不是第一行 直接返回当前行的切割点
      splitContex.setBoundary(pos, chunks.length - 1);
    }
  } else {
    splitContex.addHeight(pHeight);
  }
  return false;
};

//Default height calculation method
export const defaultNodesComputed: NodesComputed = {
  orderedList: sameListCalculation,
  bulletList: sameListCalculation,
  listItem: sameItemCalculation,
  tableRow: sameItemCalculation,
  table: sameListCalculation,
  /**
   * h1-h6 Segmentation algorithm: If the height of the heading exceeds the paging height, return the current heading directly.
   */
  heading: (splitContex, node, pos, parent, dom) => {
    const pHeight = getDomHeight(dom);
    if (splitContex.isOverflow(pHeight)) {
      const chunks = splitContex.splitResolve(pos);
      //Return directly to the current paragraph
      splitContex.setBoundary(pos, chunks.length - 1);
    }
    splitContex.addHeight(pHeight);
    return false;
  },
  /**
   * p Segmentation algorithm If the paragraph label does not exceed the default paragraph height, it will directly return the paragraph split point, otherwise continue to calculate the paragraph internal split point
   */
  paragraph: (splitContex, node, pos, parent, dom) => {
    //If the p tag has no sub-tags, the default height is returned directly, otherwise the height is calculated.
    const pHeight = node.childCount > 0 ? getDomHeight(dom) : splitContex.getDefaultHeight();
    if (!splitContex.isOverflow(pHeight)) {
      splitContex.addHeight(pHeight);
      return false;
    }
    /*If the current paragraph has exceeded the page break height, it will be split directly. Skip is set to false and repeated entry is prohibited when looping to the next paragraph.*/
    const chunks = splitContex.splitResolve(pos);
    //Determine whether a paragraph needs to be split
    if (pHeight > splitContex.getDefaultHeight()) {
      const point = getBreakPos(node, dom, splitContex);
      if (point) {
        splitContex.setBoundary(pos + point, chunks.length);
        return false;
      }
    }
    //If the paragraph is the first node of the current block, directly return the cutting point of the previous level.
    if (parent?.firstChild == node) {
      splitContex.setBoundary(chunks[chunks.length - 2][2], chunks.length - 2);
      return false;
    }
    //Return directly to the current paragraph
    splitContex.setBoundary(pos, chunks.length - 1);
    return false;
  },
  /**
   * Page splitting algorithm always returns the last page for splitting
   */
  page: (splitContex, node, pos, parent, dom) => {
    return node == splitContex.lastPage();
  },


  image: sameListCalculation,
  wc: sameListCalculation,
  taskList: sameListCalculation,
};

/**
 * Pagination context class
 */
export class SplitContext {
  #doc: Node; //document
  #accumolatedHeight = 0; //Accumulated height
  #pageBoundary: SplitInfo | null = null; //Returned cutting point
  #height = 0; //Page break height
  #paragraphDefaultHeight = 0; //Default height of p tag
  attributes: Record<string, any> = {};
  /**
   * 构造函数
   * @param doc 文档
   * @param height 分页高度
   * @param paragraphDefaultHeight p标签的默认高度
   */
  constructor(doc: Node, height: number, paragraphDefaultHeight: number) {
    this.#doc = doc;
    this.#height = height;
    this.#paragraphDefaultHeight = paragraphDefaultHeight;
  }
  getHeight() {
    return this.#height;
  }
  /**
   * 获取默认高度
   * @returns 默认高度
   */
  getDefaultHeight() {
    return this.#paragraphDefaultHeight;
  }
  /**
   * 判断是否溢出
   * @param height 增加的高度
   * @returns 是否溢出
   */
  isOverflow(height: number) {
    return this.#accumolatedHeight + height > this.#height;
  }
  /**
   * 增加高度
   * @param height 增加的高度
   */
  addHeight(height: number) {
    this.#accumolatedHeight += height;
  }
  /**
   * 设置切割点
   * @param pos 切割点位置
   * @param depth 切割点深度
   */
  setBoundary(pos: number, depth: number) {
    this.#pageBoundary = {
      pos,
      depth
    };
  }
  /**
   * 获取切割点
   * @returns 切割点
   */
  pageBoundary() {
    return this.#pageBoundary;
  }
  /**
   * 解析切割点
   * @param pos 切割点位置
   * @returns 解析结果
   */
  splitResolve(pos: number) {
    const array = this.#doc.resolve(pos).path;
    const chunks = [];
    if (array.length <= 3) return array;
    const size = 3;
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  /**
   * 获取最后一页
   * @returns 最后一页
   */
  lastPage() {
    return this.#doc.lastChild;
  }
}
let splitCount = 0;
let splitCount1 = 0;
/*
 * PageComputedContext 分页核心计算class
 * */
export class PageComputedContext {
  nodesComputed: NodesComputed;
  state: EditorState;
  tr: Transaction;
  pageState: PageState;
  editor: Editor;
  constructor(editor: Editor, nodesComputed: NodesComputed, pageState: PageState, state: EditorState) {
    this.editor = editor;
    this.nodesComputed = nodesComputed;
    this.tr = state.tr;
    this.state = state;
    this.pageState = pageState;
  }

  //核心执行逻辑
  run() {
    const { selection, doc } = this.state;
    const { inserting, deleting, checkNode, splitPage }: PageState = this.pageState;
    if (splitPage) return this.initComputed();
    if (checkNode) return this.checkNodeAndFix();
    if (!inserting && deleting && selection.$head.node(1) === doc.lastChild) return this.tr;
    if (inserting || deleting) {
      console.log("开始计算");
      this.computed();
      window.checkNode = true;
    }
    return this.tr;
  }

  computed() {
    const tr = this.tr;
    const { selection } = this.state;
    const curNunmber = tr.doc.content.findIndex(selection.head).index + 1;
    if (tr.doc.childCount > 1 && tr.doc.content.childCount != curNunmber) {
      this.mergeDocument();
    }
    splitCount1 = 0;
    splitCount = 0;
    this.splitDocument();
    return this.tr;
  }

  /**
   * 文档开始加载的时候进行初始化分页
   */
  initComputed() {
    splitCount1 = 0;
    splitCount = 0;
    console.log("首次加载初始化分页");
    this.mergeDefaultDocument(1);
    this.splitDocument();
    console.log("首次加载分页结束");
    return this.tr;
  }

  /**
   * @description 递归分割page
   */
  splitDocument() {
    const { schema } = this.state;
    while (true) {
      console.log("第:" + (++splitCount1) + "次计算分割点");
      // 获取最后一个page计算高度，如果返回值存在的话证明需要分割
      const splitInfo: SplitInfo | null = this.getNodeHeight();
      if (!splitInfo) {
        break; // 当不需要分割（即splitInfo为null）时，跳出循环
      }
      const type = getNodeType('page', schema);
      console.log("第:" + (++splitCount) + "次分割");
      this.splitPage({
        pos: splitInfo.pos,
        depth: splitInfo.depth,
        typesAfter: [{ type }],
        schema: schema
      });
    }
  }

  /**
   * 重第count页开始合并page
   * @param count
   */
  mergeDefaultDocument(count: number) {
    const tr = this.tr;
    //把所有的page 合并成一个 page
    while (tr.doc.content.childCount > count) {
      const nodesize = tr.doc.content.lastChild ? tr.doc.content.lastChild.nodeSize : 0;
      let depth = 1;
      //如果 前一页的最后一个node 和后一页的node 是同类 则合并
      if (tr.doc.content.lastChild != tr.doc.content.firstChild) {
        //获取倒数第二页
        const prePage = tr.doc.content.child(tr.doc.content.childCount - 2);
        //获取最后一页
        const lastPage = tr.doc.content.lastChild;
        //如果最后一页的第一个子标签和前一页的最后一个子标签类型一致 或者是扩展类型(是主类型的拆分类型) 进行合并的时候 深度为2

        if (lastPage?.firstChild?.type == prePage?.lastChild?.type && lastPage?.firstChild?.attrs?.extend) {
          depth = 2;
        }
      }
      tr.join(tr.doc.content.size - nodesize, depth);
    }
    this.tr = tr;
  }

  /**
   * @method mergeDocument
   * @description  合并剩余文档 将剩余文档进行分页
   *  深度判断：如果剩余页的 第一个子标签是 扩展类型(是主类型的拆分类型) 进行合并的时候 深度为2
   *  如果第一个标签不是扩展类型 则深度为1
   */
  mergeDocument() {
    const tr = this.tr;
    const { selection } = this.state;
    const count = tr.doc.content.findIndex(selection.head).index + 1;
    //把所有的page 合并成一个 page
    console.log("从第count页开始合并：", count);
    this.mergeDefaultDocument(count);
  }

  /**
   * @description 分页主要逻辑 修改系统tr split方法 添加默认 extend判断 默认id重新生成
   * @author Cassie
   * @method splitPage 分割页面
   * @param pos
   * @param depth
   * @param typesAfter
   * @param schema
   */
  splitPage({ pos, depth = 1, typesAfter, schema }: SplitParams) {
    const tr = this.tr;
    const $pos = tr.doc.resolve(pos);
    let before = Fragment.empty;
    let after = Fragment.empty;
    for (let d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      //新建一个和 $pos.node(d) 一样的节点 内容是 before
      before = Fragment.from($pos.node(d).copy(before));
      const typeAfter = typesAfter && typesAfter[i];
      const n = $pos.node(d);
      let na: Node | null = $pos.node(d).copy(after);
     
      //处理id重复的问题
      if (na && na.attrs.id) {
        let extend = {};
        if (na.attrs.extend == false) {
          extend = { extend: true };
        }
        //重新生成id
        const attr = Object.assign({}, n.attrs, { id: getId(), ...extend });
        na = schema.nodes[n.type.name].createAndFill(attr, after);
      }
      
      after = Fragment.from(
        typeAfter
          ? typeAfter.type.create(
              {
                id: getId(),
                pageNumber: na?.attrs.pageNumber + 1
              },
              after
            )
          : na
      );
    }
    tr.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth)));

    this.tr = tr;
  }

  /**
   * desc 检查并修正分页造成的段落分行问题
   */
  checkNodeAndFix() {
    let tr = this.tr;
    const { doc } = tr;
    const { schema } = this.state;
    let beforeBolck: Node | null = null;
    let beforePos = 0;
    doc.descendants((node: Node, pos: number, parentNode: Node | null, i) => {
      if (node.type === schema.nodes['paragraph'] && node.attrs.extend == true) {
        if (beforeBolck == null) {
          beforeBolck = node;
          beforePos = pos;
        } else {
          console.log("beforeBolck: " + beforeBolck);
          const mappedPos = tr.mapping.map(pos);
          if (beforeBolck.type == schema.nodes['paragraph']) {
          } else {
            tr = tr.step(new ReplaceStep(mappedPos - 1, mappedPos + 1, Slice.empty));
          }
          return false;
        }
      }
    });
    this.tr = tr;
    return this.tr;
  }

  /**
   * @description 获取需要分页的点 然后返回
   * @author Cassie
   * @method getNodeHeight 获取节点高度
   */
  getNodeHeight(): SplitInfo | null {
    const doc = this.tr.doc;
    const { bodyOptions } = this.pageState;
    const splitContex = new SplitContext(doc, bodyOptions?.bodyHeight - bodyOptions?.bodyPadding * 2, getDefault());
    const nodesComputed = this.nodesComputed;
    doc.descendants((node: Node, pos: number, parentNode: Node | null, i) => {
      if (!splitContex.pageBoundary()) {        
        // This DOES not work because, "this.editor.view.nodeDOM" rely on current document position,
        // where "pos" is the new position (after current transition)
        // let dom = this.editor.view.nodeDOM(pos)
        
        let dom = document.getElementById(node.attrs.id);
        if (!dom && node.type.name != 'page') dom = getAbsentHtmlH(node);
        return nodesComputed[node.type.name](splitContex, node, pos, parentNode, dom);
      }
      return false;
    });
    return splitContex.pageBoundary() ? splitContex.pageBoundary() : null;
  }
}
