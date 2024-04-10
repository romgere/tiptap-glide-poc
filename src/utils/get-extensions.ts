import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'

import FontFamily from '@tiptap/extension-font-family'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Gapcursor from '@tiptap/extension-gapcursor'


// Custom Nodes
import Image from '../nodes/image.js'
import WCNode from '../nodes/wc.js';

// PAge
import { PageExtension } from '../extensions/page.js';

import { UnitConversion } from "../nodes/page/core";

const unitConversion = new UnitConversion();
const pageW = unitConversion.mmConversionPx(210);
const pageH = unitConversion.mmConversionPx(297);


export default function getExtensions() {


  return [
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

    // Page
    PageExtension.configure({
      bodyPadding: 10,
      bodyWidth: pageW,
      headerHeight: 100,
      footerHeight: 60,
      bodyHeight: pageH,
      // headerData: headerlist,
      // footerData: footerlist
      
    }),
  ];
}