/**
 * Product-brand registry and preference owner. The service holds the durable
 * brand facts (custom name, logo, hero headline) and publishes immutable
 * snapshots; the sidebar's top-left mark and the conversation's hero render
 * the resolved snapshot. The Host settings scope loads and stores the section
 * in the user-settings document. The plugin also registers the brand and hero
 * headline preference rows into the settings General section — the brand
 * feature owns its own settings surface. Cross-plugin collaboration goes
 * through the service, never a value import (client bundle purity gate).
 */
import type { Context } from '@deepseek-ai/cordis'
import {
  createSnapshotStore, type ClientContext, type SettingsScope, type SnapshotStore,
} from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the ctx.settingsScope Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { BrandRowInjected } from './BrandRow.tsx'
import { BrandRow } from './BrandRow.tsx'
import type { HeroHeadlineRowInjected } from './HeroHeadlineRow.tsx'
import { HeroHeadlineRow } from './HeroHeadlineRow.tsx'
import { en, zh, type BrandKey } from './locales.ts'
import {
  BRAND_LOGO_FIELD, BRAND_NAME_FIELD, DEFAULT_BRAND_SETTINGS, HERO_HEADLINE_FIELD,
  UI_BRAND_NAMESPACE, type BrandSettings,
} from '../brand-settings.ts'

export type { BrandRowComponentProps, BrandRowInjected } from './BrandRow.tsx'
export type { HeroHeadlineRowComponentProps, HeroHeadlineRowInjected } from './HeroHeadlineRow.tsx'
export type { BrandKey } from './locales.ts'

/** Namespace owning this feature's settings-row copy. */
export const SETTINGS_NS = 'settings.brand'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The brand and hero headline settings rows' copy. */
    'settings.brand': BrandKey
  }
}

/** Immutable brand state published on every change. */
export interface BrandSnapshot {
  /** Custom name shown at the sidebar's top-left (empty → shipped wordmark). */
  name: string
  /** Custom logo as a data URL (empty → shipped mark); shared by the top-left and hero. */
  logo: string
  /** Custom hero headline (empty → locale's shipped headline). */
  headline: string
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    brand: BrandRuntime
  }
  interface Events {
    /**
     * Brand state changed (name, logo, or headline written, or the durable
     * section accepted a remote update).
     * @param snapshot - Current immutable brand snapshot.
     * @mode emit
     */
    'brand/change'(snapshot: BrandSnapshot): void
  }
}

/**
 * Brand preference owner. Reads go through {@link getBrand}; writes only
 * through the three setters; continuous sync only through the `brand/change`
 * event. Clearing a field unsets it so the section re-inherits the
 * composition layer (the shipped brand).
 */
export class BrandRuntime {
  private name = DEFAULT_BRAND_SETTINGS.brandName
  private logo = DEFAULT_BRAND_SETTINGS.brandLogo
  private headline = DEFAULT_BRAND_SETTINGS.heroHeadline
  private snapshot: BrandSnapshot

  /**
   * @param ctx - owning context (change events are emitted on it; the scope
   * listener is released through ctx.effect on dispose).
   * @param host - durable preference scope owned by the same plugin.
   */
  constructor(
    private readonly ctx: Context,
    private readonly host: SettingsScope<BrandSettings>,
  ) {
    this.snapshot = this.buildSnapshot()
    ctx.effect(() => host.subscribe(() => { this.adopt() }), 'ui-brand: settings scope adoption')
    this.adopt()
  }

  /**
   * Read the current immutable brand snapshot.
   * @returns the current snapshot (stable reference until the next change).
   */
  getBrand(): BrandSnapshot {
    return this.snapshot
  }

  /**
   * Show a custom brand name; an empty name restores the shipped wordmark.
   * @param name - the name as typed.
   */
  setBrandName(name: string): void {
    if (this.name === name) return
    this.name = name
    void (name === '' ? this.host.unset(BRAND_NAME_FIELD) : this.host.set(BRAND_NAME_FIELD, name))
    this.publish()
  }

  /**
   * Show a custom brand logo; an empty value restores the shipped mark.
   * @param dataUrl - the logo image as a data URL.
   */
  setBrandLogo(dataUrl: string): void {
    if (this.logo === dataUrl) return
    this.logo = dataUrl
    void (dataUrl === '' ? this.host.unset(BRAND_LOGO_FIELD) : this.host.set(BRAND_LOGO_FIELD, dataUrl))
    this.publish()
  }

  /**
   * Show a custom hero headline; an empty (or whitespace-only) value restores
   * the locale's shipped headline.
   * @param headline - the headline as typed.
   */
  setHeroHeadline(headline: string): void {
    if (this.headline === headline) return
    this.headline = headline
    void (headline.trim() === '' ? this.host.unset(HERO_HEADLINE_FIELD) : this.host.set(HERO_HEADLINE_FIELD, headline))
    this.publish()
  }

  /** Adopt the scope's accepted durable section without writing it back. */
  private adopt(): void {
    const section = this.host.getSnapshot().value
    if (section === undefined) return
    if (this.name === section.brandName && this.logo === section.brandLogo
      && this.headline === section.heroHeadline) return
    this.name = section.brandName
    this.logo = section.brandLogo
    this.headline = section.heroHeadline
    this.publish()
  }

  private buildSnapshot(): BrandSnapshot {
    return Object.freeze({ name: this.name, logo: this.logo, headline: this.headline })
  }

  private publish(): void {
    this.snapshot = this.buildSnapshot()
    this.ctx.emit('brand/change', this.snapshot)
  }
}

/**
 * Required services: settings transport plus slots/locale for the preference
 * rows. `remote` carries the forwarded settings invalidation that
 * `bindSettingsScope` subscribes to on this context.
 */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

/**
 * Client plugin body: provide the brand service and register the
 * feature-owned preference rows into the General section's item slot.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const host = ctx.settingsScope.bind<BrandSettings>({ namespace: UI_BRAND_NAMESPACE })
  const brand = new BrandRuntime(ctx, host)
  ctx.provide('brand', brand)

  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-brand: settings row dictionaries')

  // One reactive store mirrors the snapshot for the preference rows; the rows
  // render the accepted value while the runtime stays the single write entry.
  const store: SnapshotStore<BrandSnapshot> = createSnapshotStore(brand.getBrand())
  ctx.effect(() => ctx.on('brand/change', (snapshot) => { store.set(snapshot) }), 'ui-brand: brand change mirror')

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'brand',
    order: 30,
    locale: SETTINGS_NS,
    inject: (): BrandRowInjected => ({
      hooks: { brand: store },
      setBrandName: (name) => { brand.setBrandName(name) },
      setBrandLogo: (dataUrl) => { brand.setBrandLogo(dataUrl) },
    }),
  }, BrandRow))

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'hero-headline',
    order: 25,
    locale: SETTINGS_NS,
    inject: (): HeroHeadlineRowInjected => ({
      hooks: { brand: store },
      setHeroHeadline: (headline) => { brand.setHeroHeadline(headline) },
    }),
  }, HeroHeadlineRow))
}
