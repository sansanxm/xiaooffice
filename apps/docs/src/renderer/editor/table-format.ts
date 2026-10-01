import type { Editor } from '@tiptap/core'
import type { EditorState } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'

export interface TableCellRange {
  from: number
  to: number
}

/**
 * Returns ranges for all cells if the current selection is a CellSelection
 * or a whole-table NodeSelection. Otherwise returns null.
 */
export function getSelectedTableRanges(state: EditorState): TableCellRange[] | null {
  const sel = state.selection
  if (sel instanceof CellSelection) {
    const ranges: TableCellRange[] = []
    sel.forEachCell((cellNode, cellPos) => {
      ranges.push({ from: cellPos + 1, to: cellPos + cellNode.nodeSize - 1 })
    })
    return ranges.length > 0 ? ranges : null
  }
  if (sel instanceof NodeSelection && sel.node.type.name === 'docTable') {
    const ranges: TableCellRange[] = []
    const start = sel.from + 1
    sel.node.descendants((child, pos) => {
      if (child.type.name === 'docTableCell' || child.type.name === 'docTableHeader') {
        ranges.push({ from: start + pos + 1, to: start + pos + child.nodeSize - 1 })
        return false
      }
    })
    return ranges.length > 0 ? ranges : null
  }
  return null
}

/**
 * Formats mark (bold, italic, underline, strike, etc.) across the selection.
 * If the selection covers multiple cells or a whole table, all cells are updated.
 */
export function formatTableOrSelectionMark(
  editor: Editor,
  markName: string,
  attrs?: Record<string, unknown>,
  forceToggle = true,
): boolean {
  const ranges = getSelectedTableRanges(editor.state)
  if (!ranges) {
    if (forceToggle) {
      return editor.chain().focus().toggleMark(markName, attrs).run()
    }
    return editor.chain().focus().setMark(markName, attrs).run()
  }

  const markType = editor.schema.marks[markName]
  if (!markType) return false

  const tr = editor.state.tr
  let allHaveMark = true
  let hasAnyText = false

  if (forceToggle) {
    for (const { from, to } of ranges) {
      tr.doc.nodesBetween(from, to, (node) => {
        if (node.isText && node.text && node.text.trim()) {
          hasAnyText = true
          if (!node.marks.some((m) => m.type.name === markName)) {
            allHaveMark = false
          }
        }
      })
    }
  }

  const shouldAdd = !forceToggle || !hasAnyText || !allHaveMark

  for (const { from, to } of ranges) {
    if (shouldAdd) {
      tr.addMark(from, to, markType.create(attrs))
    } else {
      tr.removeMark(from, to, markType)
    }
  }

  editor.view.dispatch(tr)
  return true
}

/**
 * Formats docTextStyle attributes (font family, font size, color, highlight, etc.)
 * across the selection. If the selection covers multiple cells or a whole table,
 * all cells are updated.
 */
export function formatTableOrSelectionTextStyle(
  editor: Editor,
  patch: Record<string, unknown>,
): boolean {
  const ranges = getSelectedTableRanges(editor.state)
  if (!ranges) {
    return editor.chain().focus().setMark('docTextStyle', patch).run()
  }

  const markType = editor.schema.marks.docTextStyle
  if (!markType) return false

  const tr = editor.state.tr

  for (const { from, to } of ranges) {
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText) return
      const existing = node.marks.find((m) => m.type.name === 'docTextStyle')
      const nextAttrs = { ...(existing?.attrs ?? {}), ...patch }
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined) delete nextAttrs[k]
      }
      const mark = markType.create(nextAttrs)
      const nodeFrom = Math.max(from, pos)
      const nodeTo = Math.min(to, pos + node.nodeSize)
      if (existing) tr.removeMark(nodeFrom, nodeTo, existing.type)
      tr.addMark(nodeFrom, nodeTo, mark)
    })
  }

  editor.view.dispatch(tr)
  return true
}

/**
 * Clears all marks across the selection (supports multiple cells and whole table).
 */
export function formatTableOrSelectionClear(editor: Editor): boolean {
  const ranges = getSelectedTableRanges(editor.state)
  if (!ranges) {
    return editor.chain().focus().unsetAllMarks().run()
  }

  const tr = editor.state.tr
  for (const { from, to } of ranges) {
    for (const markName of Object.keys(editor.schema.marks)) {
      tr.removeMark(from, to, editor.schema.marks[markName])
    }
  }

  editor.view.dispatch(tr)
  return true
}
