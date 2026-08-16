/** Host registration for the durable product-brand section. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { UI_BRAND_NAMESPACE, BrandSettingsSchema } from './brand-settings.ts'

export {
  BRAND_LOGO_FIELD, BRAND_NAME_FIELD, DEFAULT_BRAND_SETTINGS, HERO_HEADLINE_FIELD,
  MAX_LOGO_BYTES, UI_BRAND_NAMESPACE, BrandSettingsSchema,
} from './brand-settings.ts'
export type { BrandSettings } from './brand-settings.ts'

/** Host service required to own and persist the brand section. */
export const inject = ['settings']

/**
 * Register the durable brand section before the web client can read or mutate
 * it. Brand settings are not optional: the client renders optimistic values,
 * so activating without the Host namespace would make edits appear to work
 * until the next refresh while every wire mutation is rejected.
 * @param ctx - Host context whose settings service owns the section.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(UI_BRAND_NAMESPACE),
      BrandSettingsSchema,
    )
  })
}
