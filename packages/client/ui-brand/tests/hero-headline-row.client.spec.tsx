// @vitest-environment jsdom
/** HeroHeadlineRow: the General-settings hero headline preference row. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react'
import { HeroHeadlineRow, type HeroHeadlineRowComponentProps } from '../src/client/HeroHeadlineRow.tsx'
import type { BrandSnapshot } from '../src/client/index.ts'
import { en } from '../src/client/locales.ts'

const t: HeroHeadlineRowComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key
const neverHook = (() => { throw new Error('row must not read global hooks') }) as never

afterEach(cleanup)

function mountRow(headline = '') {
  const store = createSnapshotStore<BrandSnapshot>({ name: '', logo: '', headline })
  const setHeroHeadline = vi.fn()
  render(
    <HeroHeadlineRow
      useSessions={neverHook} useWorkspaces={neverHook}
      useBrand={bindSnapshotSelector(store)}
      setHeroHeadline={setHeroHeadline} t={t}
    />,
  )
  return { setHeroHeadline }
}

describe('HeroHeadlineRow', () => {
  it('writes the typed headline through the preference', () => {
    const b = mountRow()
    const input = screen.getByRole('textbox', { name: 'Headline' })
    expect(input.getAttribute('placeholder')).toBe('Enter a custom headline')
    fireEvent.change(input, { target: { value: 'Into the Deep' } })
    expect(b.setHeroHeadline).toHaveBeenCalledWith('Into the Deep')
  })

  it('renders the standing headline value', () => {
    mountRow('Acme')
    expect(screen.getByRole('textbox', { name: 'Headline' }).getAttribute('value')).toBe('Acme')
  })
})
