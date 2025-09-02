// 테스트 전용 전역 타입 보강
// process.__xegCafPatched 플래그 선언
declare namespace NodeJS {
  interface Process {
    __xegCafPatched?: boolean;
  }
}

// 공용 MediaInfo 생성 헬퍼 타입 선언 (테스트에서 string literal 안전성 확보)
import type { MediaInfo } from '@shared/types/media.types';

declare global {
  function __xegCreateImageMedia(id: string): MediaInfo;
}

export {};
