import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { Editor } from '@tiptap/core'
import {
  splitCellAtPos,
  mergeTwoCells,
  findAdjacentCellPos,
  setCellBorderNone,
} from './table-ops'
import { insertTableAt } from '../components/ribbon-tabs'

export const tableInteractionPluginKey = new PluginKey('tableInteractionPlugin')

export type TableTool = 'draw' | 'eraser' | null

let activeTableTool: TableTool = null
const toolListeners = new Set<(tool: TableTool) => void>()

export function getActiveTableTool(): TableTool {
  return activeTableTool
}

export function setActiveTableTool(tool: TableTool) {
  activeTableTool = tool
  toolListeners.forEach((fn) => fn(tool))
  if (tool) {
    document.body.classList.add(`table-tool-${tool}-active`)
  } else {
    document.body.classList.remove('table-tool-draw-active', 'table-tool-eraser-active')
  }
}

export function onActiveTableToolChange(fn: (tool: TableTool) => void): () => void {
  toolListeners.add(fn)
  return () => toolListeners.delete(fn)
}

function findParentCell(dom: HTMLElement | null): HTMLTableCellElement | null {
  while (dom && dom.nodeName !== 'TD' && dom.nodeName !== 'TH') {
    if (dom.classList && dom.classList.contains('ProseMirror')) return null
    dom = dom.parentElement
  }
  return dom as HTMLTableCellElement | null
}

function getCellPosFromDOM(view: EditorView, cellDom: HTMLTableCellElement): number | null {
  try {
    const pos = view.posAtDOM(cellDom, 0)
    const $pos = view.state.doc.resolve(pos)
    for (let d = $pos.depth; d > 0; d--) {
      const name = $pos.node(d).type.name
      if (name === 'docTableCell' || name === 'docTableHeader') {
        return $pos.before(d)
      }
    }
  } catch {
    // fallback
  }
  return null
}

function getRowPosFromDOM(view: EditorView, cellDom: HTMLTableCellElement): { pos: number; node: any } | null {
  try {
    const tr = cellDom.closest('tr')
    if (!tr) return null
    const pos = view.posAtDOM(tr, 0)
    const $pos = view.state.doc.resolve(pos)
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d)
      if (node.type.name === 'docTableRow') {
        return { pos: $pos.before(d), node }
      }
    }
  } catch {
    // fallback
  }
  return null
}

/**
 * Creates the ProseMirror plugin that handles:
 * 1. Horizontal row height dragging with real-time visual guide line
 * 2. Vertical column width dragging real-time visual guide line
 * 3. Draw Table tool (drawing lines to split cells or create tables)
 * 4. Eraser tool (clicking lines to merge cells or erase borders)
 */
export function createTableInteractionPlugin(editorGetter: () => Editor | null): Plugin {
  let isRowDragging = false
  let isColDragging = false
  let guideEl: HTMLDivElement | null = null
  let drawPreviewEl: HTMLDivElement | null = null

  function removeGuide() {
    if (guideEl && guideEl.parentNode) {
      guideEl.parentNode.removeChild(guideEl)
    }
    guideEl = null
  }

  function removeDrawPreview() {
    if (drawPreviewEl && drawPreviewEl.parentNode) {
      drawPreviewEl.parentNode.removeChild(drawPreviewEl)
    }
    drawPreviewEl = null
  }

  return new Plugin({
    key: tableInteractionPluginKey,
    props: {
      handleDOMEvents: {
        keydown: (_view, event) => {
          if (event.key === 'Escape' && activeTableTool !== null) {
            setActiveTableTool(null)
            removeGuide()
            removeDrawPreview()
            return true
          }
          return false
        },
        mousemove: (view, event) => {
          if (isRowDragging || isColDragging) return false

          const target = event.target as HTMLElement
          const cell = findParentCell(target)

          // If Draw Table or Eraser is active, handle cursor and highlight
          if (activeTableTool === 'draw') {
            view.dom.style.cursor = 'crosshair'
            return false
          }
          if (activeTableTool === 'eraser') {
            view.dom.style.cursor = 'cell'
            return false
          }

          // Normal mode: check if mouse is near bottom border for row resizing
          if (cell) {
            const rect = cell.getBoundingClientRect()
            const distFromBottom = Math.abs(event.clientY - rect.bottom)
            const distFromRight = Math.abs(event.clientX - rect.right)

            if (distFromBottom <= 5) {
              cell.style.cursor = 'row-resize'
            } else if (distFromRight <= 5) {
              // col resize handled by prosemirror-tables or col handle
            } else {
              if (cell.style.cursor === 'row-resize') {
                cell.style.cursor = ''
              }
            }
          }

          return false
        },
        mousedown: (view, event) => {
          if (!view.editable) return false
          const editor = editorGetter()
          if (!editor) return false

          const target = event.target as HTMLElement
          const cell = findParentCell(target)

          // -------------------------------------------------------------
          // 1. TOOL: DRAW TABLE
          // -------------------------------------------------------------
          if (activeTableTool === 'draw') {
            event.preventDefault()
            event.stopPropagation()
            const startX = event.clientX
            const startY = event.clientY

            // Create draw preview line
            drawPreviewEl = document.createElement('div')
            drawPreviewEl.className = 'table-draw-preview-line'
            drawPreviewEl.style.position = 'fixed'
            drawPreviewEl.style.zIndex = '999999'
            drawPreviewEl.style.pointerEvents = 'none'
            drawPreviewEl.style.border = '2px dashed #0078d4'
            drawPreviewEl.style.left = `${startX}px`
            drawPreviewEl.style.top = `${startY}px`
            drawPreviewEl.style.width = '0px'
            drawPreviewEl.style.height = '0px'
            document.body.appendChild(drawPreviewEl)

            const onMouseMove = (moveEv: MouseEvent) => {
              if (!drawPreviewEl) return
              const dx = moveEv.clientX - startX
              const dy = moveEv.clientY - startY
              const left = Math.min(startX, moveEv.clientX)
              const top = Math.min(startY, moveEv.clientY)
              const width = Math.abs(dx)
              const height = Math.abs(dy)

              drawPreviewEl.style.left = `${left}px`
              drawPreviewEl.style.top = `${top}px`
              drawPreviewEl.style.width = `${Math.max(1, width)}px`
              drawPreviewEl.style.height = `${Math.max(1, height)}px`
            }

            const onMouseUp = (upEv: MouseEvent) => {
              window.removeEventListener('mousemove', onMouseMove)
              window.removeEventListener('mouseup', onMouseUp)
              removeDrawPreview()

              const dx = upEv.clientX - startX
              const dy = upEv.clientY - startY
              const dist = Math.hypot(dx, dy)

              const cellAtStart = findParentCell(document.elementFromPoint(startX, startY) as HTMLElement)
              if (cellAtStart) {
                const cellPos = getCellPosFromDOM(view, cellAtStart)
                if (cellPos !== null) {
                  if (dist > 12) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                      // Horizontal drag: split into 2 rows (drawing a horizontal line)
                      splitCellAtPos(editor, cellPos, 2, 1)
                    } else {
                      // Vertical drag: split into 2 columns (drawing a vertical line)
                      splitCellAtPos(editor, cellPos, 1, 2)
                    }
                  } else {
                    // Click without drag: split along longer dimension
                    const rect = cellAtStart.getBoundingClientRect()
                    if (rect.width > rect.height) {
                      splitCellAtPos(editor, cellPos, 1, 2)
                    } else {
                      splitCellAtPos(editor, cellPos, 2, 1)
                    }
                  }
                }
              } else {
                // Dragged outside existing table: draw a new table
                if (dist > 25) {
                  const cols = Math.max(2, Math.min(8, Math.round(Math.abs(dx) / 75)))
                  const rows = Math.max(2, Math.min(8, Math.round(Math.abs(dy) / 35)))
                  insertTableAt(editor, rows, cols)
                }
              }
            }

            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
            return true
          }

          // -------------------------------------------------------------
          // 2. TOOL: ERASER
          // -------------------------------------------------------------
          if (activeTableTool === 'eraser') {
            event.preventDefault()
            event.stopPropagation()

            if (!cell) return true
            const cellPos = getCellPosFromDOM(view, cell)
            if (cellPos === null) return true

            const rect = cell.getBoundingClientRect()
            const dTop = Math.abs(event.clientY - rect.top)
            const dBottom = Math.abs(event.clientY - rect.bottom)
            const dLeft = Math.abs(event.clientX - rect.left)
            const dRight = Math.abs(event.clientX - rect.right)

            const min = Math.min(dTop, dBottom, dLeft, dRight)
            let side: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
            if (min === dTop) side = 'top'
            else if (min === dBottom) side = 'bottom'
            else if (min === dLeft) side = 'left'
            else if (min === dRight) side = 'right'

            const adjacentPos = findAdjacentCellPos(view.state.doc, cellPos, side)
            if (adjacentPos !== null) {
              // Merge adjacent cells to remove internal gridline!
              mergeTwoCells(editor, cellPos, adjacentPos)
            } else {
              // Outer border: set border to none
              setCellBorderNone(editor, cellPos, side)
            }
            return true
          }

          // -------------------------------------------------------------
          // 3. ROW HEIGHT RESIZING WITH REAL-TIME GUIDELINE
          // -------------------------------------------------------------
          if (cell) {
            const rect = cell.getBoundingClientRect()
            const distFromBottom = Math.abs(event.clientY - rect.bottom)

            if (distFromBottom <= 5) {
              const rowInfo = getRowPosFromDOM(view, cell)
              const tableEl = cell.closest('table')
              if (rowInfo && tableEl) {
                event.preventDefault()
                event.stopPropagation()
                isRowDragging = true

                const trEl = cell.closest('tr')!
                const initialHeight = trEl.getBoundingClientRect().height
                const startY = event.clientY
                const tableRect = tableEl.getBoundingClientRect()

                // Create horizontal guideline element
                guideEl = document.createElement('div')
                guideEl.className = 'table-resize-guide table-resize-guide-horizontal'
                guideEl.style.position = 'fixed'
                guideEl.style.left = `${tableRect.left}px`
                guideEl.style.width = `${tableRect.width}px`
                guideEl.style.top = `${event.clientY}px`
                guideEl.style.height = '0px'
                guideEl.style.borderTop = '2px dashed #0078d4'
                guideEl.style.pointerEvents = 'none'
                guideEl.style.zIndex = '999999'
                document.body.appendChild(guideEl)

                let finalHeight = initialHeight

                const onMouseMove = (moveEv: MouseEvent) => {
                  if (!isRowDragging || !guideEl) return
                  const deltaY = moveEv.clientY - startY
                  finalHeight = Math.max(16, initialHeight + deltaY)
                  guideEl.style.top = `${moveEv.clientY}px`
                }

                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove)
                  window.removeEventListener('mouseup', onMouseUp)
                  isRowDragging = false
                  removeGuide()

                  // Commit row height in twips
                  const heightTwips = Math.round((finalHeight / 96) * 1440)
                  const tr = view.state.tr
                  const rowNode = tr.doc.nodeAt(rowInfo.pos)
                  if (rowNode && rowNode.type.name === 'docTableRow') {
                    tr.setNodeMarkup(rowInfo.pos, undefined, {
                      ...rowNode.attrs,
                      heightTwips,
                      heightRule: 'atLeast',
                    })
                    view.dispatch(tr)
                  }
                }

                window.addEventListener('mousemove', onMouseMove)
                window.addEventListener('mouseup', onMouseUp)
                return true
              }
            }

            // -------------------------------------------------------------
            // 4. COLUMN RESIZING REAL-TIME GUIDELINE
            // -------------------------------------------------------------
            const distFromRight = Math.abs(event.clientX - rect.right)
            if (distFromRight <= 5) {
              const tableEl = cell.closest('table')
              if (tableEl) {
                isColDragging = true
                const tableRect = tableEl.getBoundingClientRect()

                guideEl = document.createElement('div')
                guideEl.className = 'table-resize-guide table-resize-guide-vertical'
                guideEl.style.position = 'fixed'
                guideEl.style.top = `${tableRect.top}px`
                guideEl.style.height = `${tableRect.height}px`
                guideEl.style.left = `${event.clientX}px`
                guideEl.style.width = '0px'
                guideEl.style.borderLeft = '2px dashed #0078d4'
                guideEl.style.pointerEvents = 'none'
                guideEl.style.zIndex = '999999'
                document.body.appendChild(guideEl)

                const onMouseMove = (moveEv: MouseEvent) => {
                  if (!isColDragging || !guideEl) return
                  guideEl.style.left = `${moveEv.clientX}px`
                }

                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove)
                  window.removeEventListener('mouseup', onMouseUp)
                  isColDragging = false
                  removeGuide()
                }

                window.addEventListener('mousemove', onMouseMove)
                window.addEventListener('mouseup', onMouseUp)
              }
            }
          }

          return false
        },
      },
    },
  })
}
