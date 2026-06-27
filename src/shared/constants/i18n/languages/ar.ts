// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Arabic language strings for the application
 */
export const ar: LanguageStrings = {
  tb: {
    prev: 'السابق',
    next: 'التالي',
    dl: 'تنزيل',
    dlAllCt: 'تنزيل جميع {count} ملفات كـ ZIP',
    setOpen: 'فتح الإعدادات',
    cls: 'إغلاق',
    twTxt: 'عرض التغريدة',
    twPanel: 'لوحة نص التغريدة',
    twUrl: 'عرض التغريدة الأصلية',
    fitOri: 'الأصلي',
    fitW: 'ملاءمة العرض',
    fitH: 'ملاءمة الارتفاع',
    fitC: 'ملاءمة النافذة',
    galleryToolbar: 'شريط أدوات المعرض',
    progress: 'التقدم',
    settingsPanel: 'لوحة الإعدادات',
  },
  st: {
    th: 'المظهر',
    lang: 'Language / 언어 / 言語 / Idioma / اللغة',
    thAuto: 'تلقائي',
    thLt: 'فاتح',
    thDk: 'داكن',
    langAuto: 'Auto / 자동 / 自動 / Auto / تلقائي',
    langKo: 'الكورية',
    langEn: 'الإنجليزية',
    langJa: 'اليابانية',
    langZhCn: 'الصينية المبسطة',
    langEs: 'الإسبانية',
    langAr: 'العربية',
  },
  msg: {
    err: {
      t: 'حدث خطأ',
      b: 'حدث خطأ غير متوقع: {error}',
    },
    kb: {
      t: 'اختصارات لوحة المفاتيح',
      prev: 'ArrowLeft: الوسائط السابقة',
      next: 'ArrowRight: الوسائط التالية',
      cls: 'Escape: إغلاق المعرض',
      toggle: '؟: عرض هذه المساعدة',
    },
    dl: {
      one: {
        err: {
          t: 'فشل التنزيل',
          b: 'تعذر تنزيل الملف: {error}',
        },
      },
      allFail: {
        t: 'فشل التنزيل',
        b: 'فشل تنزيل جميع العناصر.',
      },
      part: {
        t: 'فشل جزئي',
        b: 'فشل تنزيل {count} عناصر.',
      },
      noMedia: 'لا توجد وسائط محددة. يرجى إعادة فتح المعرض والمحاولة مجدداً.',
      zipFail: 'فشل حفظ ملف ZIP',
    },
    gal: {
      emptyT: 'لا توجد وسائط متاحة',
      emptyD: 'لا توجد صور أو مقاطع فيديو لعرضها.',
      itemLbl: 'وسائط {index}: {filename}',
      loadFail: 'فشل تحميل {type}',
      imageGallery: 'معرض الصور',
    },
  },
};
