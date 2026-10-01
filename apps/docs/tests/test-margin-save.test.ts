import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { buildBlankDocx, parseDocx, readSectionSettings, readSections, saveDocx } from '@genoffice/docx-engine'
import { blocksToPmDoc, pmDocToSavePlan, type PmNode } from '../src/renderer/editor/convert'
import { editorExtensions } from '../src/renderer/editor/extensions'

import { insertTableAt } from '../src/renderer/components/ribbon-tabs'

describe('blank docx margin test', () => {
  it('saves custom margins after editing text in blank doc', async () => {
    const bytes = await buildBlankDocx()
    const parsed = await parseDocx(bytes)
    const sec = readSectionSettings(parsed)
    console.log('original sec:', sec)

    const editor = new Editor({
      element: document.createElement('div'),
      extensions: editorExtensions,
    })
    editor.commands.setContent(blocksToPmDoc(parsed.blocks) as never)
    insertTableAt(editor, 2, 2)

    const plan = pmDocToSavePlan(editor.getJSON() as PmNode, parsed.blocks)
    console.log('plan with table saveBlocks:', plan.saveBlocks.map(b => b.kind))

    const edited = { ...sec, marginLeft: 500, marginRight: 500, marginTop: 500, marginBottom: 500 }
    const saved = await saveDocx(parsed, plan.saveBlocks, { section: edited })
    const reparsed = await parseDocx(saved)
    const sectBlock = reparsed.blocks.find((b) => b.hidden && b.originalXml?.includes('<w:sectPr'))
    console.log('sectBlock with table:', sectBlock)
    const repSec = readSectionSettings(reparsed)
    console.log('reparsed sec with table:', repSec)
    editor.destroy()
    expect(repSec.marginLeft).toBe(500)

    // Second save: user types something or presses Command+S again (sectionDirty is false)
    const plan2 = pmDocToSavePlan(editor.getJSON() as PmNode, reparsed.blocks)
    const saved2 = await saveDocx(reparsed, plan2.saveBlocks, { section: undefined })
    const reparsed2 = await parseDocx(saved2)
    const repSec2 = readSectionSettings(reparsed2)
    console.log('reparsed2 sec with section: undefined:', repSec2)
    expect(repSec2.marginLeft).toBe(500)
    editor.destroy()
  })

  it('multi-section margin save when editing section 0', async () => {
    // Build 2 sections doc
    const bytes = await buildBlankDocx()
    const parsed = await parseDocx(bytes)
    // Add section break
    // Let's see what readSections produces
    const sections = readSections(parsed)
    console.log('parsed sections count:', sections.length)
  })
})



