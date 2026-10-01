import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { editorExtensions } from '../src/renderer/editor/extensions'
import {
  splitCellAtPos,
  mergeTwoCells,
  findAdjacentCellPos,
  setCellBorderNone,
} from '../src/renderer/editor/table-ops'

function create2x2TableDoc(editor: Editor) {
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
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'R1C1' }] }],
              },
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'R1C2' }] }],
              },
            ],
          },
          {
            type: 'docTableRow',
            content: [
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'R2C1' }] }],
              },
              {
                type: 'docTableCell',
                content: [{ type: 'docParagraph', content: [{ type: 'text', text: 'R2C2' }] }],
              },
            ],
          },
        ],
      },
    ],
  } as never)
}

describe('table interaction: split, merge, eraser and row height', () => {
  it('splits cell vertically into 2 columns (Draw Table vertical line)', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    create2x2TableDoc(editor)

    // First cell (R1C1) position in table:
    // table starts at 0, row 1 starts at 1, cell 1 starts at 2
    const cellPos = 2
    const success = splitCellAtPos(editor, cellPos, 1, 2)
    expect(success).toBe(true)

    // Now table should have 3 columns in the grid
    let cellCount = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'docTableCell') {
        cellCount++
      }
    })
    // 2x2 originally (4 cells) + 1 extra cell from split = 5 cells (or 6 cells with dummy placeholders)
    expect(cellCount).toBeGreaterThanOrEqual(5)
    editor.destroy()
  })

  it('splits cell horizontally into 2 rows (Draw Table horizontal line)', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    create2x2TableDoc(editor)

    const cellPos = 2
    const success = splitCellAtPos(editor, cellPos, 2, 1)
    expect(success).toBe(true)

    let rowCount = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'docTableRow') {
        rowCount++
      }
    })
    // Splitting a cell into 2 rows expands the table height from 2 rows to 3 rows
    expect(rowCount).toBe(3)
    editor.destroy()
  })

  it('merges adjacent cells (Eraser tool)', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    create2x2TableDoc(editor)

    // Cell 1: pos 2, Cell 2: pos 12
    const cell1Pos = 2
    const rightAdjacent = findAdjacentCellPos(editor.state.doc, cell1Pos, 'right')
    expect(rightAdjacent).not.toBeNull()

    const mergeSuccess = mergeTwoCells(editor, cell1Pos, rightAdjacent!)
    expect(mergeSuccess).toBe(true)

    // Now the first row has merged cell with colspan 2
    let mergedCellFound = false
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'docTableCell' && node.attrs.colspan === 2) {
        mergedCellFound = true
      }
    })
    expect(mergedCellFound).toBe(true)
    editor.destroy()
  })

  it('sets cell border to none on outer boundary (Eraser tool on border)', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    create2x2TableDoc(editor)

    const cell1Pos = 2
    const success = setCellBorderNone(editor, cell1Pos, 'top')
    expect(success).toBe(true)

    const cellNode = editor.state.doc.nodeAt(cell1Pos)
    expect(cellNode?.attrs.borders?.top?.style).toBe('none')
    editor.destroy()
  })

  it('applies row height in twips to docTableRow', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    create2x2TableDoc(editor)

    // Row 1 starts at pos 1
    const tr = editor.state.tr
    const rowNode = tr.doc.nodeAt(1)!
    expect(rowNode.type.name).toBe('docTableRow')

    // Set row height to 720 twips (0.5 inch = 48px)
    tr.setNodeMarkup(1, undefined, {
      ...rowNode.attrs,
      heightTwips: 720,
      heightRule: 'atLeast',
    })
    editor.view.dispatch(tr)

    const updatedRow = editor.state.doc.nodeAt(1)
    expect(updatedRow?.attrs.heightTwips).toBe(720)
    expect(updatedRow?.attrs.heightRule).toBe('atLeast')
    editor.destroy()
  })
})
