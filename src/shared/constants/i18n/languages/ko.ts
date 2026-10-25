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
    dlAllCt: '표시된 {count}개 파일을 ZIP으로 다운로드',
    setOpen: '설정 열기',
    cls: '닫기',
    twTxt: '트윗 보기',
    twPanel: '트윗 텍스트 패널',
    twUrl: '원본 트윗 보기',
    fitOri: '원본',
    fitW: '너비 맞춤',
    fitH: '높이 맞춤',
    fitC: '창 맞춤',
    currentFit: '맞춤: {mode}',
    mediaPosition: '미디어 {index}/{total}',
    noMedia: '미디어 없음',
    galleryToolbar: '갤러리 도구 모음',
    navigationGroup: '이동 및 현재 위치',
    fitGroup: '보기 맞춤',
    downloadGroup: '다운로드',
    auxGroup: '기타 작업',
    settingsPanel: '설정 패널',
  },
  st: {
    th: '테마',
    lang: '언어',
    thAuto: '자동',
    thLt: '라이트',
    thDk: '다크',
    langAuto: '자동',
    langKo: '한국어',
    langEn: '영어',
    langJa: '일본어',
    langZhCn: '중국어 간체',
    langEs: '스페인어',
    langAr: '아랍어',
    videoClickMode: '동영상 클릭',
    videoClickNative: '동영상 클릭을 X에서 처리',
    videoClickSurfaces: '동영상 화면에서 갤러리 열기',
    videoClickUnmarked: '적격 재생 버튼에서도 갤러리 열기',
    videoClickHelp:
      '뒤의 두 모드에서는 적격 동영상 화면을 클릭하면 갤러리가 열립니다. 마지막 모드는 확인된 표시 없는 재생 버튼도 포함합니다. 일반 플레이어 컨트롤은 X에서 작동합니다.',
    videoClickSaveError:
      '동영상 클릭 설정을 저장하지 못했습니다. 현재 설정이 계속 적용됩니다. 다시 시도하세요.',
    unsavedSettings: '설정이 현재 세션에만 적용되었으며 저장되지 않았습니다.',
    retrySettingsSave: '다시 저장',
  },
  msg: {
    err: {
      t: '오류가 발생했습니다',
      b: '예상치 못한 오류가 발생했습니다: {error}',
      loadMedia: {
        title: '미디어를 불러오지 못했습니다',
        body: '이미지나 동영상을 찾을 수 없습니다.',
        unsupported:
          '이 동영상에는 HLS 스트리밍 소스만 있습니다. 갤러리에서 재생하거나 저장하려면 확인된 MP4 소스가 필요합니다.',
        noMedia: '이 게시물의 미디어가 반환되지 않았습니다.',
        denied: '미디어 서비스가 요청을 거부했습니다. 나중에 다시 시도해 주세요.',
        unreadable: '미디어 응답을 읽을 수 없습니다. 나중에 다시 시도해 주세요.',
        resourceLimit:
          '이 게시물의 정보가 크기 제한을 초과했습니다. X에서 게시물을 열어 미디어를 확인해 주세요.',
        rateLimited: '미디어 서비스의 요청 제한에 걸렸습니다. 나중에 다시 시도해 주세요.',
        deferred: '미디어 서비스가 대기를 요청했습니다. 나중에 다시 시도해 주세요.',
        providerError:
          '미디어 서비스가 이 게시물을 제공하지 못했습니다. 나중에 다시 시도해 주세요.',
        transport: '미디어 서비스에 연결할 수 없습니다. 나중에 다시 시도해 주세요.',
        ownerUnconfirmed: '선택한 미디어가 어느 게시물에 속하는지 확인할 수 없습니다.',
        mismatch: '받은 미디어가 선택한 항목과 일치하지 않습니다.',
        cancelled: '미디어 불러오기가 취소되었습니다.',
        nativeVideoRecovery:
          'X 동영상의 재생·일시정지 컨트롤을 사용하거나 Alt+Shift+V를 눌러 동영상 클릭을 X에서 처리하세요.',
        nativeVideoControls: '계속 보려면 X 동영상의 재생·일시정지 컨트롤을 사용하세요.',
        nativeVideoEnabled:
          '이제 동영상 클릭은 X에서 처리됩니다. 갤러리를 다시 사용하려면 갤러리 설정의 동영상 클릭을 변경하세요.',
      },
      generic: '오류가 발생했습니다',
      loadGallery: '갤러리를 불러오지 못했습니다',
      settingsUnavailable: {
        title: '설정을 사용할 수 없음',
        body: '설정이 로드될 때까지 기본값이 사용됩니다.',
      },
      retry: '다시 시도',
      noMoreRetries: '더 이상 재시도할 수 없음',
      reset: '초기화',
    },
    kb: {
      t: '키보드 단축키',
      prev: 'ArrowLeft: 이전 미디어',
      next: 'ArrowRight: 다음 미디어',
      cls: 'Escape: 갤러리 닫기',
      toggle: '?: 이 도움말 표시',
    },
    dl: {
      bulkOutcome: {
        titleHandedOff: 'ZIP을 브라우저에 전달함',
        titleFailed: 'ZIP을 브라우저에 전달하지 못함',
        previous: '이전 ZIP 결과',
        scope: '범위: 이 갤러리에 표시된 미디어 {total}개.',
        scopeSupplementary: '범위: 이 갤러리에서 앞서 빠진 항목 {total}개.',
        counts: 'ZIP 포함 {included}개, 제외 {omitted}개.',
        browserHandoff:
          '브라우저가 ZIP 다운로드 요청을 받았습니다. 디스크 저장 완료 여부는 확인되지 않았습니다.',
        noZip: '브라우저에 전달된 ZIP이 없습니다.',
        resourceLimit:
          '다운로드 메모리 한도에 도달했습니다. 진행 중인 다운로드가 끝날 때까지 기다리고, 계속되면 페이지를 새로고침하세요.',
        sourceUnavailable:
          '원본 이미지 출처를 확인할 수 없습니다. 해당 항목은 원래 게시물에서 다시 시도하세요.',
        sourceFetchFailed:
          '미디어 원본 요청에 실패했습니다(HTTP {statuses}). 원래 게시물을 다시 열어 제외된 항목을 재시도하세요.',
        zipSaveFailed: 'ZIP을 준비했지만 브라우저가 저장 요청을 받지 않았습니다.',
        other: '일부 항목을 포함할 수 없습니다. 갤러리를 다시 열어 시도하세요.',
        nextAction:
          '모두 다운로드를 다시 누르면 이미 전달된 항목을 포함해 표시된 모든 항목으로 새 ZIP을 만듭니다. 필요한 경우 게시물을 다시 열고 더 적은 항목으로 시도하세요.',
        nextActionSupplementary:
          '이 ZIP에는 복구된 누락 항목만 있습니다. 나머지 항목이 담긴 이전 ZIP도 보관하세요.',
        recoverMissing: '누락 항목 {count}개를 별도 ZIP으로 다운로드',
        dismiss: 'ZIP 결과 닫기',
      },
      status: {
        working: '다운로드 준비 중…',
        handedOff: '브라우저로 전달됨',
        error: '다운로드 실패',
      },
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
        resourceLimit:
          'ZIP에 {count}개 파일이 포함되었고 {failed}개 파일은 제외되었습니다. 다운로드 메모리 한도에 도달했습니다. 먼저 진행 중인 다운로드가 끝날 때까지 기다리세요. 진행 중인 다운로드가 없는데도 한도가 계속되면 이 페이지를 새로고침하세요. 그런 다음 파일 수를 줄여 다시 시도하세요.',
      },
      noMedia: '선택된 미디어가 없습니다. 갤러리를 다시 열고 시도해 주세요.',
      zipFail: 'ZIP 파일 저장에 실패했습니다',
      sourceUnavailable:
        '원본 이미지 소스를 확인하지 못해 해당 항목을 저장하지 않았습니다. 게시물을 다시 열고 시도해 주세요.',
      resourceLimit:
        '다운로드 메모리 한도에 도달했습니다. 먼저 진행 중인 다운로드가 끝날 때까지 기다리세요. 진행 중인 다운로드가 없는데도 한도가 계속되면 이 페이지를 새로고침하세요. 그런 다음 파일 수를 줄여 다시 시도하세요.',
    },
    gal: {
      video: {
        playbackFallback:
          '다른 화질로 재생합니다. 다운로드에는 사용 가능한 최적의 소스를 사용합니다.',
      },
      observedQuality: {
        title: '복구한 소스의 품질',
        body: '일부 항목의 소스 품질을 확인하지 못했습니다. 원본을 확인하지 못한 이미지는 저장할 수 없으며, 복구한 동영상은 화면에서 관찰한 소스로 저장합니다.',
      },
      partialRecovery: {
        title: '보이는 미디어만 복구했습니다',
        body: '이 타일의 미디어만 복구했습니다. 일괄 다운로드에는 표시된 항목만 포함됩니다.',
      },
      emptyT: '미디어 없음',
      emptyD: '표시할 이미지 또는 동영상이 없습니다.',
      itemLbl: '미디어 {index}: {filename}',
      loadFail: '{type} 로드 실패',
      imageGallery: '이미지 갤러리',
      loading: '로딩 중',
      opening: '갤러리 여는 중…',
      retryLoading: '다시 불러오기',
      retryExhausted: '아직 불러올 수 없습니다. 갤러리를 다시 열거나 원본 게시물에서 시도하세요.',
      openOriginalPost: '원본 게시물 열기',
      videoCount: '동영상 {index}/{total}',
      imageCount: '이미지 {index}/{total}: {alt}',
      hashtagLabel: '해시태그 {value}',
    },
  },
};
