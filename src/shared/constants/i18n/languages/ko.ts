import type { LanguageStrings } from '@shared/constants/i18n/language-types';

export const ko: LanguageStrings = {
  tb: {
    prev: '이전',
    prevSc: '이전 (왼쪽 화살표)',
    next: '다음',
    nextSc: '다음 (오른쪽 화살표)',
    dl: '다운로드',
    dlCurSc: '현재 파일 다운로드',
    dlAll: 'ZIP 다운로드',
    dlAllCt: '모든 {count}개 파일을 ZIP으로 다운로드',
    set: '설정',
    setOpen: '설정 열기',
    cls: '닫기',
    clsSc: '닫기 (Esc)',
    twTxt: '트윗 텍스트',
    twPanel: '트윗 텍스트 패널',
    fitOri: '원본',
    fitOriT: '원본 크기 (1:1)',
    fitW: '너비 맞춤',
    fitWT: '너비에 맞춤',
    fitH: '높이 맞춤',
    fitHT: '높이에 맞춤',
    fitC: '창 맞춤',
    fitCT: '창에 맞춤',
  },
  st: {
    ttl: '설정',
    th: '테마',
    lang: '언어',
    thAuto: '자동',
    thLt: '라이트',
    thDk: '다크',
    langAuto: 'Auto / 자동 / 自動',
    langKo: '한국어',
    langEn: 'English',
    langJa: '日本語',
    cls: '닫기',
    gal: {
      sec: '갤러리',
    },
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
      retry: {
        act: '다시 시도',
        ok: {
          t: '다시 시도 성공',
          b: '실패했던 모든 항목을 가져왔습니다.',
        },
      },
      cancel: {
        t: '다운로드가 취소되었습니다',
        b: '요청한 다운로드가 취소되었습니다.',
      },
    },
    gal: {
      emptyT: '미디어 없음',
      emptyD: '표시할 이미지 또는 동영상이 없습니다.',
      itemLbl: '미디어 {index}: {filename}',
      loadFail: '{type} 로드 실패',
    },
  },
};
