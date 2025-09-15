/**
 * UsernameSource: utils 레이어가 services를 직접 참조하지 않고도
 * 트윗 작성자 username을 가져올 수 있도록 하는 얇은 헬퍼.
 *
 * - 이 파일은 shared/media 레이어에 위치하므로 services 의존을 가질 수 있습니다.
 * - 테스트에서는 '@shared/services/media/UsernameExtractionService'를 모킹하므로
 *   아래 import가 모킹 대상이 됩니다.
 */

import { parseUsernameFast } from '@shared/services/media/UsernameExtractionService';

/**
 * 가능한 가장 빠른 방식으로 username을 가져옵니다.
 * - DOM에서 추출 실패 시 null 반환
 */
export function getPreferredUsername(element?: HTMLElement | Document): string | null {
  try {
    return parseUsernameFast(element) ?? null;
  } catch {
    return null;
  }
}
