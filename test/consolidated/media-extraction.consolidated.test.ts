/**
 * @fileoverview (DEPRECATED) 미디어 추출 서비스 통합 테스트 (레거시 통합 스위트)
 * @description behavior / feature 중심 테스트로 이관 중. 중복 커버리지 제거됨.
 *   MIGRATION STATUS
 *   - 페이지 타입 매트릭스: test/features/media-extraction.page-matrix.behavior.test.ts 로 이동 ✅
 *   - 기본 추출 / 빈 DOM / 에러 내성 / URL / 타입 식별: behavior 테스트로 이동 ✅
 *   - Cross-Page / 성능: behavior 매트릭스 테스트로 이동 ✅
 *   - 접근성: behavior 매트릭스 테스트로 이동 ✅
 *   - 설정 기반 동작(URL 품질 등): 충분한 회귀 가치 낮아 제거 ✅
 *   - 남은 회귀 가치: 사용자 상호작용(갤러리 활성화) + 브라우저 UA 호환성(간단 존재 확인)
 *
 *   제거 예정: Interaction & Compatibility behavior 테스트 도입 완료 → 최종 삭제 대기
 *   제안 제거 타겟: 2025-08-31 (이 날짜 이후 제거 예정)
 *
 * @version 1.1.0 - Slimmed Legacy (Do not add new tests here)
 */

import { describe, beforeEach, afterEach } from 'vitest';
import { PageTestEnvironment } from '../utils/helpers/page-test-environment';

describe.skip('미디어 추출 서비스 - 통합 테스트 (LEGACY - slimmed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    PageTestEnvironment.cleanup();
  });

  // NOTE: 모든 시나리오가 behavior 테스트로 이관됨. 이 파일은 삭제만 남은 상태.

  // (빈 파일 유지) -> CI에서 삭제 후보 검출 용도. 예정일 이후 제거.
});
