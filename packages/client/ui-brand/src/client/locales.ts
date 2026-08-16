/** Copy for the brand preference rows. */

export const zh = {
  'settings.brand.title': '品牌展示',
  'settings.brand.description': '自定义页面左上角显示的名称与 Logo；全部留空则恢复默认品牌。',
  'settings.brand.nameLabel': '品牌名称',
  'settings.brand.namePlaceholder': '输入自定义名称',
  'settings.brand.logoChoose': '选择图片',
  'settings.brand.logoChange': '更换图片',
  'settings.brand.logoClear': '清除',
  'settings.brand.logoTooLarge': '图片大小不能超过 256KB，请更换后重试。',
  'settings.hero.title': '主标题',
  'settings.hero.description': '自定义空会话页面中间显示的标题；留空则恢复默认。',
  'settings.hero.label': '主标题',
  'settings.hero.placeholder': '输入自定义标题',
} satisfies Record<string, string>

export type BrandKey = keyof typeof zh

export const en: Record<BrandKey, string> = {
  'settings.brand.title': 'Brand',
  'settings.brand.description': 'Customize the name and logo shown at the top-left of the page; leave both empty to restore the default brand.',
  'settings.brand.nameLabel': 'Brand name',
  'settings.brand.namePlaceholder': 'Enter a custom name',
  'settings.brand.logoChoose': 'Choose image',
  'settings.brand.logoChange': 'Change image',
  'settings.brand.logoClear': 'Clear',
  'settings.brand.logoTooLarge': 'The image must be 256KB or smaller. Choose another one.',
  'settings.hero.title': 'Headline',
  'settings.hero.description': 'Customize the headline shown in the middle of an empty session; leave empty for the default.',
  'settings.hero.label': 'Headline',
  'settings.hero.placeholder': 'Enter a custom headline',
}
