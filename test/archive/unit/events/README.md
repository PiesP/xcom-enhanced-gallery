# test/archive/unit/events

**이벤트 시스템 테스트 아카이브** (Phase 181 통합)

---

## 📋 파일 목록

### 1. `event-lifecycle.abort-signal.deprecated.test.ts`

**상태**: 🔴 DEPRECATED (중복)

**이동 사유**

- AbortSignal 테스트가 `test/unit/shared/utils/events-coverage.test.ts`에 이미
  존재
- 2개의 동일한 테스트 케이스 (line 81, 101)
  - `"should handle AbortSignal - auto removal on abort"`
  - `"should skip adding listener if signal is pre-aborted"`
- 테스트 수 감소 및 중앙화로 유지보수 부담 경감

**활성 버전**

- `test/unit/shared/utils/events-coverage.test.ts` (line 81-117)

---

## 마이그레이션 가이드

이 테스트를 다시 활성화하고 싶다면

1. 중복 제거 (AbortSignal 섹션 제외)
2. `test/unit/events/` 디렉토리 재생성
3. 파일 이름 정규화: `event-lifecycle.abort-signal.integration.test.ts`
4. vitest.config.ts에 경로 추가

## 통합된 기능

모든 기능이 `events-coverage.test.ts`에 이미 포함되어 있습니다:

```typescript
// events-coverage.test.ts (line 81-117)
describe('addListener', () => {
  it('should handle AbortSignal - auto removal on abort', () => { ... });
  it('should skip adding listener if signal is pre-aborted', () => { ... });
});
```

---

## Phase 181 작업 요약

**목표**: test/unit/events 정리 및 통합

**작업 내용**

- ✅ `wheel-listener.policy.red.test.ts` →
  `test/unit/lint/wheel-listener-direct-use.policy.red.test.ts`
- ✅ `event-lifecycle.abort-signal.integration.test.ts` → 아카이브 (중복)
- ✅ 문서 업데이트 (lint/README.md, unit/README.md, TDD_REFACTORING_PLAN.md)
- ✅ test/unit/events 디렉토리 삭제

**결과**

- 활성 테스트: 변화 없음 (이미 events-coverage.test.ts에 포함)
- 아카이브: +1 파일
- 정책 테스트: +1 파일 (lint로 중앙화)

---

## 📝 참고 문서

- `test/unit/lint/README.md`: 정책 검증 테스트 중앙화
- `test/unit/shared/utils/events-coverage.test.ts`: 활성 이벤트 테스트
- `docs/TESTING_STRATEGY.md`: 테스트 분류 가이드
