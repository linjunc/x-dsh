// @vitest-environment jsdom
/** BrandRow: the General-settings brand preference row. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react'
import { BrandRow, type BrandRowComponentProps } from '../src/client/BrandRow.tsx'
import { MAX_LOGO_BYTES } from '../src/brand-settings.ts'
import type { BrandSnapshot } from '../src/client/index.ts'
import { en } from '../src/client/locales.ts'

const t: BrandRowComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key
const neverHook = (() => { throw new Error('row must not read global hooks') }) as never

afterEach(cleanup)

function mountRow(brand: Partial<BrandSnapshot> = {}) {
  const store = createSnapshotStore<BrandSnapshot>({ name: '', logo: '', headline: '', ...brand })
  const setBrandName = vi.fn()
  const setBrandLogo = vi.fn()
  render(
    <BrandRow
      useSessions={neverHook} useWorkspaces={neverHook}
      useBrand={bindSnapshotSelector(store)}
      setBrandName={setBrandName} setBrandLogo={setBrandLogo} t={t}
    />,
  )
  return { setBrandName, setBrandLogo }
}

function pickLogo(file: File): void {
  fireEvent.change(screen.getByTestId('brand-logo-picker'), { target: { files: [file] } })
}

describe('BrandRow', () => {
  it('writes the typed name through the preference', () => {
    const b = mountRow()
    const input = screen.getByRole('textbox', { name: 'Brand name' })
    expect(input.getAttribute('placeholder')).toBe('Enter a custom name')
    fireEvent.change(input, { target: { value: 'Acme' } })
    expect(b.setBrandName).toHaveBeenCalledWith('Acme')
  })

  it('offers Choose image while no logo stands, and swallows a cancelled pick', () => {
    const b = mountRow()
    const choose = screen.getByRole('button', { name: 'Choose image' })
    const picker = screen.getByTestId('brand-logo-picker')
    const opened = vi.spyOn(picker, 'click')
    fireEvent.click(choose)
    expect(opened).toHaveBeenCalledOnce()
    fireEvent.change(picker, { target: { files: [] } })
    expect(b.setBrandLogo).not.toHaveBeenCalled()
  })

  it('reads a picked image into the preference as a data URL', async () => {
    const b = mountRow()
    pickLogo(new File(['x'], 'logo.png', { type: 'image/png' }))
    await waitFor(() => { expect(b.setBrandLogo).toHaveBeenCalledWith('data:image/png;base64,eA==') })
  })

  it('rejects an oversized image and reports the limit', () => {
    const b = mountRow()
    pickLogo(new File([new Uint8Array(MAX_LOGO_BYTES + 1)], 'logo.png', { type: 'image/png' }))
    expect(b.setBrandLogo).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('256KB')
  })

  it('previews a standing logo and clears it through the preference', () => {
    const b = mountRow({ logo: 'data:image/png;base64,bG9nbw==' })
    expect(screen.getByRole('button', { name: 'Change image' })).toBeTruthy()
    expect(document.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,bG9nbw==')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(b.setBrandLogo).toHaveBeenCalledWith('')
  })
})
