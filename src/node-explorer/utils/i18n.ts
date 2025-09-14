// Language type is imported from LanguageContext
type Language = 'en' | 'ar';

export interface I18nText {
  fallback: string;
  key?: string;
}

export function getLocalizedText(text: I18nText | string, language: Language = 'en'): string {
  if (typeof text === 'string') {
    return text;
  }
  
  if (typeof text === 'object' && text !== null) {
    // In a full implementation, you would lookup translations by key
    // For now, we'll just return the fallback
    return text.fallback || '';
  }
  
  return '';
}

export function isRTL(language: Language): boolean {
  return language === 'ar';
}

export function getTextDirection(language: Language): 'ltr' | 'rtl' {
  return isRTL(language) ? 'rtl' : 'ltr';
}

export function getTextAlign(language: Language): 'left' | 'right' {
  return isRTL(language) ? 'right' : 'left';
}

export function getFlexDirection(language: Language, reverse: boolean = false): string {
  const isRtl = isRTL(language);
  
  if (reverse) {
    return isRtl ? 'flex-row' : 'flex-row-reverse';
  }
  
  return isRtl ? 'flex-row-reverse' : 'flex-row';
}

export function getMarginDirection(language: Language): {
  ml: (size: string) => string;
  mr: (size: string) => string;
  pl: (size: string) => string;
  pr: (size: string) => string;
} {
  const isRtl = isRTL(language);
  
  return {
    ml: (size: string) => isRtl ? `mr-${size}` : `ml-${size}`,
    mr: (size: string) => isRtl ? `ml-${size}` : `mr-${size}`,
    pl: (size: string) => isRtl ? `pr-${size}` : `pl-${size}`,
    pr: (size: string) => isRtl ? `pl-${size}` : `pr-${size}`,
  };
}

export const nodeExplorerTranslations = {
  en: {
    loading: 'Loading...',
    error: 'Error',
    notFound: 'Node not found',
    nodeExplorer: 'Node Explorer',
    nodeType: 'Type',
    version: 'Version',
    updated: 'Updated',
    dependencies: 'Dependencies',
    actions: 'Actions',
    children: 'Children',
    noChildren: 'No children found',
    noDependencies: 'No dependencies',
    noActions: 'No actions',
    rawJson: 'Raw JSON',
    showJson: 'Show JSON',
    hideJson: 'Hide JSON',
    required: 'Required',
    optional: 'Optional',
    group: 'Group',
    form: 'Form',
    media: 'Media',
    currentVersion: 'Current Version',
    width: 'Width',
    height: 'Height',
    size: 'Size',
    duration: 'Duration',
    mimeType: 'MIME Type',
    includeDescendants: 'Include Descendants',
    maxDepth: 'Max Depth',
    filterByTypes: 'Filter by Types',
    ancestors: 'Ancestors',
    descendants: 'Descendants'
  },
  ar: {
    loading: 'جاري التحميل...',
    error: 'خطأ',
    notFound: 'العقدة غير موجودة',
    nodeExplorer: 'مستكشف العقد',
    nodeType: 'النوع',
    version: 'الإصدار',
    updated: 'محدث',
    dependencies: 'التبعيات',
    actions: 'الإجراءات',
    children: 'العقد الفرعية',
    noChildren: 'لا توجد عقد فرعية',
    noDependencies: 'لا توجد تبعيات',
    noActions: 'لا توجد إجراءات',
    rawJson: 'JSON خام',
    showJson: 'إظهار JSON',
    hideJson: 'إخفاء JSON',
    required: 'مطلوب',
    optional: 'اختياري',
    group: 'مجموعة',
    form: 'نموذج',
    media: 'وسائط',
    currentVersion: 'الإصدار الحالي',
    width: 'العرض',
    height: 'الارتفاع',
    size: 'الحجم',
    duration: 'المدة',
    mimeType: 'نوع MIME',
    includeDescendants: 'تضمين المتفرعات',
    maxDepth: 'أقصى عمق',
    filterByTypes: 'تصفية حسب الأنواع',
    ancestors: 'الأسلاف',
    descendants: 'المتفرعات'
  }
};

export function t(key: string, language: Language = 'en'): string {
  const translations = nodeExplorerTranslations[language];
  return translations[key as keyof typeof translations] || key;
}