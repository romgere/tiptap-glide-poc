import { Attrs, Node, NodeType, Schema } from "@tiptap/pm/model";
import { SplitContext } from "./computed";
import { Transaction } from "@tiptap/pm/state";

/**
 * The computed function for the page extension a node.
 * @param splitContex Split context.
 * @param node The node that currently needs to be calculated.
 * @param pos The position of the current computing node.
 * @param parent The parent node of the current compute node.
 * @param dom DOM of the current computing node.
 * @returns If true is returned, it will enter the calculation of the sub-label of the current node..
 */
export type ComputedFn = (splitContex: SplitContext, node: Node, pos: number, parent: Node | null, dom: HTMLElement) => boolean;
export type NodesComputed = Record<string, ComputedFn>;
export class PageState {
  bodyOptions: PageOptions;
  deleting: boolean;
  inserting: boolean;
  checkNode: boolean;
  splitPage: boolean;
  constructor(bodyOptions: PageOptions, deleting: boolean, inserting: boolean, checkNode: boolean, splitPage: boolean) {
    this.bodyOptions = bodyOptions;
    this.deleting = deleting;
    this.inserting = inserting;
    this.checkNode = checkNode;
    this.splitPage = splitPage;
  }
  transform(tr: Transaction) {
    const splitPage: boolean = tr.getMeta("splitPage");
    const checkNode: boolean = tr.getMeta("checkNode");
    const deleting: boolean = tr.getMeta("deleting");
    const inserting: boolean = tr.getMeta("inserting");
    const splitPage1 = splitPage ? splitPage : false;
    const inserting2 = inserting ? inserting : false;
    const deleting3 = deleting ? deleting : false;
    const checkNode4 = checkNode ? checkNode : false;
    return new PageState(this.bodyOptions, deleting3, inserting2, checkNode4, splitPage1);
  }
}

export type SplitParams = {
  pos: number;
  depth?: number;
  typesAfter?: ({ type: NodeType; attrs?: Attrs | null } | null)[];
  schema: Schema<any, any>;
};

export type PageOptions = {
  footerHeight: number;
  headerHeight: number;
  bodyHeight: number;
  bodyWidth: number;
  bodyPadding: number;
  design?: boolean;
  headerData?: any[];
  footerData?: any[];
  NodesComputed?: NodesComputed;
  SystemAttributes?: Record<string, any>;
};

export type SplitInfo = {
  pos: number;
  depth: number;
  attributes?: Record<string, any>;
};
