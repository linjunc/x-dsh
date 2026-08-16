/** General Settings row for the product brand: custom name and logo. */
import { useRef, useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { BrandKey } from './locales.ts'
import { MAX_LOGO_BYTES } from '../brand-settings.ts'
import type { BrandSnapshot } from './index.ts'
import css from './BrandRow.module.css'

/** Registration-side brand face. */
export interface BrandRowInjected {
  hooks: {
    /** Durable brand snapshot bound by the renderer as useBrand. */
    brand: SnapshotStore<BrandSnapshot>
  }
  /** Change the custom brand name; empty restores the shipped wordmark. */
  setBrandName: (name: string) => void
  /** Change the custom brand logo (a data URL); empty restores the shipped mark. */
  setBrandLogo: (dataUrl: string) => void
}

/** Full Settings-row props. */
export type BrandRowComponentProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings.brand'>
  & InjectFace<BrandRowInjected>

/**
 * Read one picked image file as a data URL.
 * @param file - the picked image.
 * @param done - receives the data URL once the read finishes.
 */
function readLogo(file: File, done: (dataUrl: string) => void): void {
  const reader = new FileReader()
  reader.onload = () => {
    /* v8 ignore next 3 -- readAsDataURL only ever lands a string result; the
       non-string arm exists for the FileReader typing, not a reachable read. */
    if (typeof reader.result === 'string') done(reader.result)
  }
  reader.readAsDataURL(file)
}

/**
 * Render the brand preference: a name input plus a logo picker with preview.
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function BrandRow({ useBrand, setBrandName, setBrandLogo, t }: BrandRowComponentProps) {
  const brand = useBrand(value => value)
  const [rejected, setRejected] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  const logoTitle: BrandKey = brand.logo === '' ? 'settings.brand.logoChoose' : 'settings.brand.logoChange'

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('settings.brand.title')}</div>
        <div className={css.desc} role={rejected ? 'alert' : undefined}>
          {rejected ? t('settings.brand.logoTooLarge') : t('settings.brand.description')}
        </div>
      </div>
      <div className={css.controls}>
        <input
          className={css.name}
          aria-label={t('settings.brand.nameLabel')}
          placeholder={t('settings.brand.namePlaceholder')}
          value={brand.name}
          onChange={(event) => { setBrandName(event.currentTarget.value) }}
        />
        <div className={css.logoControls}>
          {brand.logo !== '' && <img className={css.preview} src={brand.logo} alt="" />}
          <button
            type="button"
            className={css.selector}
            onClick={() => { picker.current?.click() }}
          >
            {t(logoTitle)}
          </button>
          {brand.logo !== '' && (
            <button
              type="button"
              className={css.clear}
              onClick={() => {
                setRejected(false)
                setBrandLogo('')
              }}
            >
              {t('settings.brand.logoClear')}
            </button>
          )}
          <input
            ref={picker}
            type="file"
            accept="image/*"
            hidden
            data-testid="brand-logo-picker"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (file === undefined) return
              if (file.size > MAX_LOGO_BYTES) {
                setRejected(true)
                return
              }
              setRejected(false)
              readLogo(file, setBrandLogo)
            }}
          />
        </div>
      </div>
    </div>
  )
}
