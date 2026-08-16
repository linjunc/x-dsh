/** BrandRuntime: the durable brand mirror and its change stream. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { stubSettingsScope } from '@deepseek-ai/dsh-client-test-runtime'
import type { BrandSettings } from '../src/brand-settings.ts'
import { BrandRuntime, type BrandSnapshot } from '../src/client/index.ts'

const DEFAULT: BrandSnapshot = { name: '', logo: '', headline: '' }

function bench() {
  const ctx = new Context()
  const host = stubSettingsScope<BrandSettings>()
  const runtime = new BrandRuntime(ctx, host.scope)
  return { ctx, host, runtime }
}

describe('BrandRuntime', () => {
  it('holds the shipped brand until the scope accepts a section', () => {
    const { host, runtime } = bench()
    expect(runtime.getBrand()).toEqual(DEFAULT)
    host.publish({ status: 'ready', value: { brandName: 'Acme', brandLogo: '', heroHeadline: '' } })
    expect(runtime.getBrand()).toEqual({ name: 'Acme', logo: '', headline: '' })
  })

  it('adopts the section already standing at construction', () => {
    const ctx = new Context()
    const host = stubSettingsScope<BrandSettings>()
    host.publish({ status: 'ready', value: { brandName: '', brandLogo: 'data:image/png;base64,eA==', heroHeadline: '' } })
    const runtime = new BrandRuntime(ctx, host.scope)
    expect(runtime.getBrand().logo).toBe('data:image/png;base64,eA==')
  })

  it('writes a name live, persists it, and emits brand/change', () => {
    const { ctx, host, runtime } = bench()
    const changed = vi.fn()
    ctx.on('brand/change', changed)
    runtime.setBrandName('Acme')
    expect(runtime.getBrand().name).toBe('Acme')
    expect(host.set).toHaveBeenCalledWith('brandName', 'Acme')
    expect(changed).toHaveBeenCalledWith(runtime.getBrand())
  })

  it('clears a name override through unset when empty', () => {
    const { host, runtime } = bench()
    runtime.setBrandName('Acme')
    runtime.setBrandName('')
    expect(runtime.getBrand().name).toBe('')
    expect(host.unset).toHaveBeenCalledWith('brandName')
  })

  it('writes and clears a logo and a headline through their own fields', () => {
    const { host, runtime } = bench()
    runtime.setBrandLogo('data:image/png;base64,eA==')
    expect(host.set).toHaveBeenCalledWith('brandLogo', 'data:image/png;base64,eA==')
    runtime.setHeroHeadline('Into the Deep')
    expect(host.set).toHaveBeenCalledWith('heroHeadline', 'Into the Deep')
    runtime.setHeroHeadline('   ')
    expect(host.unset).toHaveBeenCalledWith('heroHeadline')
  })

  it('ignores a rewrite of the standing value', () => {
    const { ctx, host, runtime } = bench()
    const changed = vi.fn()
    ctx.on('brand/change', changed)
    runtime.setBrandName('Acme')
    host.set.mockClear()
    changed.mockClear()
    runtime.setBrandName('Acme')
    expect(host.set).not.toHaveBeenCalled()
    expect(changed).not.toHaveBeenCalled()
  })

  it('ignores an echo of the adopted section', () => {
    const { host, runtime } = bench()
    runtime.setBrandName('Acme')
    const snapshot = runtime.getBrand()
    host.publish({ status: 'ready', value: { brandName: 'Acme', brandLogo: '', heroHeadline: '' } })
    expect(runtime.getBrand()).toBe(snapshot)
  })
})
