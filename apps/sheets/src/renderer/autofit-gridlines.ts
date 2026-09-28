/**
 * Auto-fit Row Height / Column Width on double-clicking horizontal or vertical gridlines
 * and header dividers, matching Microsoft Excel behavior.
 */
import { IRenderManagerService, Vector2 } from '@univerjs/engine-render'
import { SheetSkeletonManagerService } from '@univerjs/preset-sheets-core'

import { SET_ROW_IS_AUTO_HEIGHT_COMMAND } from './autofit-multi-row'
import { t } from './i18n/locale'
import { pointInRect } from './picture-paste'
import type { UniverRuntime } from './univer-state'

const GRIDLINE_HIT_THRESHOLD_PX = 8

export function installGridlineAutoFit(
  container: HTMLElement,
  runtime: UniverRuntime,
  setMessage: (msg: string) => void,
): { dispose(): void } {
  function handleDoubleClick(e: MouseEvent): void {
    if (e.button !== 0) return
    const workbook = runtime.univerAPI.getActiveWorkbook()
    if (!workbook) return
    const worksheet = workbook.getActiveSheet()
    if (!worksheet) return

    const render = runtime.univer
      .__getInjector()
      .get(IRenderManagerService)
      .getRenderById(workbook.getId())
    const skeleton = render?.with(SheetSkeletonManagerService).getCurrentSkeleton()
    if (!render || !skeleton) return

    const canvas = render.engine.getCanvasElement()
    const bounds = canvas.getBoundingClientRect()
    if (!pointInRect(e.clientX, e.clientY, bounds)) return

    const scene = render.scene
    const relative = scene.getCoordRelativeToViewport(
      Vector2.FromArray([e.clientX - bounds.left, e.clientY - bounds.top]),
    )
    const scrollXY = scene.getScrollXYInfoByViewport(relative)
    const { scaleX, scaleY } = scene.getAncestorScale()

    const headerWidth = skeleton.rowHeaderWidthAndMarginLeft
    const headerHeight = skeleton.columnHeaderHeightAndMarginTop

    // Check if double-clicked inside column headers
    if (relative.y < headerHeight && relative.x >= headerWidth) {
      const { column } = skeleton.getCellIndexByOffset(
        relative.x,
        headerHeight + 5,
        scaleX,
        scaleY,
        scrollXY,
      )
      if (column >= 0) {
        const coord = skeleton.getCellWithCoordByIndex(0, column, false)
        const gridX = relative.x / scaleX + scrollXY.x - headerWidth
        const targetCol =
          coord && Math.abs(coord.startX - gridX) * scaleX <= GRIDLINE_HIT_THRESHOLD_PX && column > 0
            ? column - 1
            : column
        e.preventDefault()
        e.stopPropagation()
        void runtime.univerAPI.executeCommand('sheet.command.set-col-auto-width', {
          ranges: [
            {
              startRow: 0,
              endRow: Math.max(0, worksheet.getMaxRows() - 1),
              startColumn: targetCol,
              endColumn: targetCol,
            },
          ],
        })
        setMessage(t('appAutoFitColDone'))
        return
      }
    }

    // Check if double-clicked inside row headers
    if (relative.x < headerWidth && relative.y >= headerHeight) {
      const { row } = skeleton.getCellIndexByOffset(
        headerWidth + 5,
        relative.y,
        scaleX,
        scaleY,
        scrollXY,
      )
      if (row >= 0) {
        const coord = skeleton.getCellWithCoordByIndex(row, 0, false)
        const gridY = relative.y / scaleY + scrollXY.y - headerHeight
        const targetRow =
          coord && Math.abs(coord.startY - gridY) * scaleY <= GRIDLINE_HIT_THRESHOLD_PX && row > 0
            ? row - 1
            : row
        e.preventDefault()
        e.stopPropagation()
        void runtime.univerAPI.executeCommand(SET_ROW_IS_AUTO_HEIGHT_COMMAND, {
          ranges: [
            {
              startRow: targetRow,
              endRow: targetRow,
              startColumn: 0,
              endColumn: Math.max(0, worksheet.getMaxColumns() - 1),
            },
          ],
        })
        setMessage(t('appAutoFitRowDone'))
        return
      }
    }

    // Double-clicked inside the cell grid
    if (relative.x >= headerWidth && relative.y >= headerHeight) {
      const { row, column } = skeleton.getCellIndexByOffset(
        relative.x,
        relative.y,
        scaleX,
        scaleY,
        scrollXY,
      )
      if (row < 0 || column < 0) return
      const coord = skeleton.getCellWithCoordByIndex(row, column, false)
      if (!coord) return

      const gridX = relative.x / scaleX + scrollXY.x - headerWidth
      const gridY = relative.y / scaleY + scrollXY.y - headerHeight

      const distRight = Math.abs(coord.endX - gridX) * scaleX
      const distLeft = Math.abs(coord.startX - gridX) * scaleX
      const distBottom = Math.abs(coord.endY - gridY) * scaleY
      const distTop = Math.abs(coord.startY - gridY) * scaleY

      // Vertical gridline (resizes column)
      if (distRight <= GRIDLINE_HIT_THRESHOLD_PX) {
        e.preventDefault()
        e.stopPropagation()
        void runtime.univerAPI.executeCommand('sheet.command.set-col-auto-width', {
          ranges: [
            {
              startRow: 0,
              endRow: Math.max(0, worksheet.getMaxRows() - 1),
              startColumn: column,
              endColumn: column,
            },
          ],
        })
        setMessage(t('appAutoFitColDone'))
        return
      }
      if (distLeft <= GRIDLINE_HIT_THRESHOLD_PX && column > 0) {
        e.preventDefault()
        e.stopPropagation()
        void runtime.univerAPI.executeCommand('sheet.command.set-col-auto-width', {
          ranges: [
            {
              startRow: 0,
              endRow: Math.max(0, worksheet.getMaxRows() - 1),
              startColumn: column - 1,
              endColumn: column - 1,
            },
          ],
        })
        setMessage(t('appAutoFitColDone'))
        return
      }

      // Horizontal gridline (resizes row)
      if (distBottom <= GRIDLINE_HIT_THRESHOLD_PX) {
        e.preventDefault()
        e.stopPropagation()
        void runtime.univerAPI.executeCommand(SET_ROW_IS_AUTO_HEIGHT_COMMAND, {
          ranges: [
            {
              startRow: row,
              endRow: row,
              startColumn: 0,
              endColumn: Math.max(0, worksheet.getMaxColumns() - 1),
            },
          ],
        })
        setMessage(t('appAutoFitRowDone'))
        return
      }
      if (distTop <= GRIDLINE_HIT_THRESHOLD_PX && row > 0) {
        e.preventDefault()
        e.stopPropagation()
        void runtime.univerAPI.executeCommand(SET_ROW_IS_AUTO_HEIGHT_COMMAND, {
          ranges: [
            {
              startRow: row - 1,
              endRow: row - 1,
              startColumn: 0,
              endColumn: Math.max(0, worksheet.getMaxColumns() - 1),
            },
          ],
        })
        setMessage(t('appAutoFitRowDone'))
        return
      }
    }
  }

  container.addEventListener('dblclick', handleDoubleClick, { capture: true })
  return {
    dispose(): void {
      container.removeEventListener('dblclick', handleDoubleClick, { capture: true })
    },
  }
}
