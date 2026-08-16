/** ui-brand apply wiring: service provision, dictionaries, and the two
 * preference rows registered into the General item slot. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { stubSettingsScope } from '@deepseek-ai/dsh-client-test-runtime'
import { apply, inject, SETTINGS_NS } from '@deepseek-ai/dsh-client-ui-brand/client'
import type { BrandRuntime } from '@deepseek-ai/dsh-client-ui-brand/client'
import { BrandRow } from '../src/client/BrandRow.tsx'
import { HeroHeadlineRow } from '../src/client/HeroHeadlineRow.tsx'
import type { BrandSettings } from '../src/brand-settings.ts'

const SLOT = 'settings.general.item'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.provide('locale', new LocaleRuntime(ctx))
  ctx.provide('connection', { api: { settings: {} }, isLoopback: false })
  ctx.provide('remote', { $on: () => () => {} })
  ctx.provide('settingsScope', { bind: () => stubSettingsScope<BrandSettings>().scope } as never)
  const slots = ctx.get('slots') as SlotRegistry
  slots.register(
    { name: 'root', children: { [SLOT]: { kind: 'list', scope: 'root' } } } as never,
    () => null,
  )
  return { ctx, slots }
}

describe('ui-brand apply', () => {
  it('declares the services it uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'connection', 'remote', 'settingsScope'])
  })

  it('provides the brand service and registers both preference rows', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const brand = b.ctx.get('brand') as BrandRuntime
    expect(brand.getBrand()).toEqual({ name: '', logo: '', headline: '' })
    // Copy rides the standard locale seat.
    const brandRow = b.slots.entries(SLOT).find(e => e.component === BrandRow)!
    const heroRow = b.slots.entries(SLOT).find(e => e.component === HeroHeadlineRow)!
    expect(brandRow.options).toMatchObject({ id: 'brand', order: 30 })
    expect(heroRow.options).toMatchObject({ id: 'hero-headline', order: 25 })
    expect(brandRow.locale).toBe(SETTINGS_NS)
    expect(heroRow.locale).toBe(SETTINGS_NS)
  })

  it('routes row face writes back into the runtime and mirrors the snapshot', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const brand = b.ctx.get('brand') as BrandRuntime
    const brandRow = b.slots.entries(SLOT).find(e => e.component === BrandRow)!
    const heroRow = b.slots.entries(SLOT).find(e => e.component === HeroHeadlineRow)!
    const brandFace = brandRow.inject!() as { setBrandName(name: string): void; hooks: { brand: { getSnapshot(): { name: string } } } }
    const heroFace = heroRow.inject!() as { setHeroHeadline(h: string): void }
    brandFace.setBrandName('Acme')
    heroFace.setHeroHeadline('Into the Deep')
    expect(brand.getBrand()).toEqual({ name: 'Acme', logo: '', headline: 'Into the Deep' })
    // Both rows share one mirror store fed by the change stream.
    expect(brandFace.hooks.brand.getSnapshot().name).toBe('Acme')
  })

  it('teardown removes the rows', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries(SLOT)).toHaveLength(2)
    await fiber.dispose()
    expect(b.slots.entries(SLOT)).toHaveLength(0)
  })
})
