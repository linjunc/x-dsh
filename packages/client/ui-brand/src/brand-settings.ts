/** Product-brand preferences stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'

/** Settings namespace owned by the brand plugin. */
export const UI_BRAND_NAMESPACE = 'ui-brand'

/** Field carrying the custom name shown at the sidebar's top-left. */
export const BRAND_NAME_FIELD = 'brandName'

/** Field carrying the custom logo (a data URL) shown at the top-left and hero. */
export const BRAND_LOGO_FIELD = 'brandLogo'

/** Field carrying the custom hero headline shown on a blank draft. */
export const HERO_HEADLINE_FIELD = 'heroHeadline'

/** Largest logo source file the settings row accepts; stored as a data URL. */
export const MAX_LOGO_BYTES = 256 * 1024

/** Durable brand section shared by the Host schema and the browser scope. */
export interface BrandSettings {
  /** Custom brand name; empty keeps the shipped wordmark. */
  brandName: string
  /** Custom brand logo as a data URL; empty keeps the shipped mark. */
  brandLogo: string
  /** Custom hero headline; empty falls back to the locale's shipped headline. */
  heroHeadline: string
}

/** Brand facts shown while the durable section has no user overrides. */
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: '', brandLogo: '', heroHeadline: '',
}

/** Durable brand schema; also the wire envelope the browser scope validates against. */
export const BrandSettingsSchema: z<BrandSettings> = z.object({
  [BRAND_NAME_FIELD]: z.string().default(''),
  [BRAND_LOGO_FIELD]: z.string().default(''),
  [HERO_HEADLINE_FIELD]: z.string().default(''),
})
