/** General Settings row for the hero headline preference. */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { BrandSnapshot } from './index.ts'
import css from './HeroHeadlineRow.module.css'

/** Registration-side hero headline face. */
export interface HeroHeadlineRowInjected {
  hooks: {
    /** Durable brand snapshot bound by the renderer as useBrand. */
    brand: SnapshotStore<BrandSnapshot>
  }
  /** Change the hero headline; empty restores the shipped headline. */
  setHeroHeadline: (headline: string) => void
}

/** Full Settings-row props. */
export type HeroHeadlineRowComponentProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings.brand'>
  & InjectFace<HeroHeadlineRowInjected>

/**
 * Render the hero headline preference input.
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function HeroHeadlineRow({ useBrand, setHeroHeadline, t }: HeroHeadlineRowComponentProps) {
  const brand = useBrand(value => value)
  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('settings.hero.title')}</div>
        <div className={css.desc}>{t('settings.hero.description')}</div>
      </div>
      <input
        className={css.input}
        aria-label={t('settings.hero.label')}
        placeholder={t('settings.hero.placeholder')}
        value={brand.headline}
        onChange={(event) => { setHeroHeadline(event.currentTarget.value) }}
      />
    </div>
  )
}
