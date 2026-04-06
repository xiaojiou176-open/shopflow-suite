export const appLocaleValues = ['en', 'zh-CN'] as const;

export type AppLocale = (typeof appLocaleValues)[number];

export type LocaleDictionary<T extends Record<string, unknown>> = {
  en: T;
  'zh-CN'?: Partial<T>;
};

export function resolveLocaleDictionary<T extends Record<string, unknown>>(
  dictionary: LocaleDictionary<T>,
  locale: AppLocale = 'en'
) {
  return {
    ...dictionary.en,
    ...(locale === 'zh-CN' ? dictionary['zh-CN'] ?? {} : {}),
  } as T;
}
