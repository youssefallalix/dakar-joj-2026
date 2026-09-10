import type { TFunction } from "i18next";
import type { CategoryConfig } from "./PlacesList";

export function translateCategoryLabel(
  category: CategoryConfig,
  t: TFunction,
): string {
  const key = `placeCategory.${category.id}`;
  if (!key) return category.label;

  try {
    const translated = t(key, { defaultValue: category.label });
    // react-i18next returns the key itself when missing; fall back in that case.
    return translated && translated !== key ? translated : category.label;
  } catch (err) {
    console.error(
      `[categoryTranslations] Failed to translate category "${category.id}":`,
      err,
    );
    return category.label;
  }
}

export function getLocalizedCategory(
  category: string,
  t: TFunction,
): string {
  if (!category) return category;

  const key = `placeCategory.${category}`;
  const translated = t(key, { defaultValue: category });

  return translated !== key ? translated : category;
}

export function withTranslatedCategoryLabels(
  categories: CategoryConfig[],
  t: TFunction,
): CategoryConfig[] {
  // Avoid mutating the original configuration array.
  return categories.map((category) => ({
    ...category,
    label: translateCategoryLabel(category, t),
  }));
}
