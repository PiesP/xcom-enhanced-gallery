// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Korean language strings for the application
 */
export const ko: LanguageStrings = {
  tb: {
    prev: '이전',
    next: '다음',
    dl: '다운로드',
    dlAllCt: '모든 {count}개 파일을 ZIP으로 다운로드',
    setOpen: '설정 열기',
    cls: '닫기',
    twTxt: '트윗 보기',
    twPanel: '트윗 텍스트 패널',
    twUrl: '원본 트윗 보기',
    fitOri: '원본',
    fitW: '너비 맞춤',
    fitH: '높이 맞춤',
    fitC: '창 맞춤',
    galleryToolbar: '갤러리 도구 모음',
    progress: '진행',
    settingsPanel: '설정 패널',
  },
  st: {
    th: '테마',
    lang: 'Language / 언어 / 言語 / Idioma / اللغة',
    thAuto: '자동',
    thLt: '라이트',
    thDk: '다크',
    langAuto: 'Auto / 자동 / 自動 / Auto / تلقائي',
    langKo: '한국어',
    langEn: '영어',
    langJa: '일본어',
    langZhCn: '중국어 간체',
    langEs: '스페인어',
    langAr: '아랍어',
  },
  msg: {
    err: {
      t: '오류가 발생했습니다',
      b: '예상치 못한 오류가 발생했습니다: {error}',
    },
    kb: {
      t: '키보드 단축키',
      prev: 'ArrowLeft: 이전 미디어',
      next: 'ArrowRight: 다음 미디어',
      cls: 'Escape: 갤러리 닫기',
      toggle: '?: 이 도움말 표시',
    },
    dl: {
      one: {
        err: {
          t: '다운로드 실패',
          b: '파일을 가져올 수 없습니다: {error}',
        },
      },
      allFail: {
        t: '다운로드 실패',
        b: '모든 항목을 다운로드할 수 없었습니다.',
      },
      part: {
        t: '일부 실패',
        b: '{count}개 항목을 가져올 수 없었습니다.',
      },
    },
    gal: {
      emptyT: '미디어 없음',
      emptyD: '표시할 이미지 또는 동영상이 없습니다.',
      itemLbl: '미디어 {index}: {filename}',
      loadFail: '{type} 로드 실패',
      imageGallery: '이미지 갤러리',
    },
  },
};
