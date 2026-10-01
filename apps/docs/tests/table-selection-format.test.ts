import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { CellSelection } from '@tiptap/pm/tables'
import { NodeSelection } from '@tiptap/pm/state'
import { editorExtensions } from '../src/renderer/editor/extensions'
import {
  formatTableOrSelectionMark,
  formatTableOrSelectionTextStyle,
} from '../src/renderer/editor/table-ops'
import { setSelectionAlign } from '../src/renderer/editor/direction'

function createTableDoc(editor: Editor) {
  editor.commands.setContent({
    type: 'doc',
    content: [
      {
        type: 'docTable',
        content: [
          {
            type: 'docTableRow',
            content: [
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'Cell 1' }] }],
              },
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'Cell 2' }] }],
              },
            ],
          },
          {
            type: 'docTableRow',
            content: [
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'Cell 3' }] }],
              },
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'Cell 4' }] }],
              },
            ],
          },
        ],
      },
    ],
  } as never)
}

describe('table multi-cell formatting', () => {
  it('formats ALL cells with bold when whole table is selected via CellSelection', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    createTableDoc(editor)

    // Select all cells via CellSelection: cell 1 to cell 4
    // cell positions in doc:
    // doc -> table (pos 0) -> row 1 (pos 1) -> cell 1 (pos 2)
    const doc = editor.state.doc
    const cells: number[] = []
    doc.descendants((node, pos) => {
      if (node.type.name === 'docTableCell') {
        cells.push(pos)
      }
    })
    expect(cells.length).toBe(4)

    // Set CellSelection covering all 4 cells
    const cellSel = CellSelection.create(doc, cells[0], cells[3])
    editor.view.dispatch(editor.state.tr.setSelection(cellSel))

    // Apply bold
    formatTableOrSelectionMark(editor, 'bold', undefined, true)

    // Check all text nodes in the table: ALL must have 'bold' mark!
    let textNodeCount = 0
    let boldTextNodeCount = 0
    editor.state.doc.descendants((node) => {
      if (node.isText) {
        textNodeCount++
        if (node.marks.some((m) => m.type.name === 'bold')) {
          boldTextNodeCount++
        }
      }
    })

    expect(textNodeCount).toBe(4)
    expect(boldTextNodeCount).toBe(4)

    editor.destroy()
  })

  it('formats font size and font family across all cells in CellSelection', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    createTableDoc(editor)

    const doc = editor.state.doc
    const cells: number[] = []
    doc.descendants((node, pos) => {
      if (node.type.name === 'docTableCell') cells.push(pos)
    })

    const cellSel = CellSelection.create(doc, cells[0], cells[3])
    editor.view.dispatch(editor.state.tr.setSelection(cellSel))

    // Set font family and size
    formatTableOrSelectionTextStyle(editor, { fontAscii: 'Arial', sizeHalfPoints: 32 })

    let verifiedCount = 0
    editor.state.doc.descendants((node) => {
      if (node.isText) {
        const ts = node.marks.find((m) => m.type.name === 'docTextStyle')
        expect(ts).toBeDefined()
        expect(ts?.attrs.fontAscii).toBe('Arial')
        expect(ts?.attrs.sizeHalfPoints).toBe(32)
        verifiedCount++
      }
    })

    expect(verifiedCount).toBe(4)
    editor.destroy()
  })

  it('formats alignment across all cells when whole table is selected via NodeSelection', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    createTableDoc(editor)

    // Whole table NodeSelection
    const tableSel = NodeSelection.create(editor.state.doc, 0)
    editor.view.dispatch(editor.state.tr.setSelection(tableSel))

    // Align center
    const res = setSelectionAlign(editor, 'center')
    expect(res).toBe(true)

    let pCount = 0
    const tableNode = editor.state.doc.child(0)
    tableNode.descendants((node) => {
      if (node.type.name === 'docParagraph') {
        expect(node.attrs.align).toBe('center')
        pCount++
      }
    })

    expect(pCount).toBe(4)
    editor.destroy()
  })
})
