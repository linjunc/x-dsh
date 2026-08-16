import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import { UI_BRAND_NAMESPACE, apply } from '../src/index.ts'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

describe('ui-brand host', () => {
  it('registers, validates, and disposes the durable brand section', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    const ns = settingsNamespace(UI_BRAND_NAMESPACE)
    expect(ctx.settings.get(ns)).toEqual({ brandName: '', brandLogo: '', heroHeadline: '' })
    await ctx.settings.update(ns, { brandName: 'Acme', brandLogo: 'data:image/png;base64,eA==', heroHeadline: 'Hi' })
    expect(ctx.settings.get(ns)).toEqual({ brandName: 'Acme', brandLogo: 'data:image/png;base64,eA==', heroHeadline: 'Hi' })
    await expect(ctx.settings.update(ns, { brandName: 42 })).rejects.toThrow()
    await fiber.dispose()
    expect(ctx.settings.describe().map(row => row.ns)).not.toContain(ns)
  })
})
