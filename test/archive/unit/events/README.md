# test/archive/unit/events

<<<<<<< Updated upstream
**이벤트 시스템 테스트 아카이브** (Phase 181 통합)
=======
**이벤트 시스템 테스트 아카이브** (Phase 186 완료)
>>>>>>> Stashed changes

---

## 📋 파일 목록

### 1. `event-lifecycle.abort-signal.deprecated.test.ts`

<<<<<<< Updated upstream
**상태**: 🔴 DEPRECATED (중복)
=======
**상태**: 🔴 DEPRECATED (중복, Phase 186에서 원본도 제거됨)
>>>>>>> Stashed changes

**이동 사유**

- AbortSignal 테스트가 `test/unit/shared/utils/events-coverage.test.ts`에 이미
  존재
- 2개의 동일한 테스트 케이스 (line 81, 101)
  - `"should handle AbortSignal - auto removal on abort"`
  - `"should skip adding listener if signal is pre-aborted"`
<<<<<<< Updated upstream
=======
- Phase 181: 이 deprecated 버전을 archive로 이동
- Phase 186: 원본 `test/unit/events/event-lifecycle.abort-signal.integration.test.ts`도 제거
  (중복 확인됨)
>>>>>>> Stashed changes
- 테스트 수 감소 및 중앙화로 유지보수 부담 경감

**활성 버전**

- `test/unit/shared/utils/events-coverage.test.ts` (line 81-117)

---

<<<<<<< Updated upstream
## 마이그레이션 가이드

이 테스트를 다시 활성화하고 싶다면

1. 중복 제거 (AbortSignal 섹션 제외)
2. `test/unit/events/` 디렉토리 재생성
3. 파일 이름 정규화: `event-lifecycle.abort-signal.integration.test.ts`
=======
## 정책 통합 사항 (Phase 186)

### Wheel Listener 정책

- **파일**: `test/unit/lint/wheel-listener-direct-use.policy.red.test.ts`
- **상태**: ✅ 활성 (lint 프로젝트에 포함)
- **정책**: 모든 wheel 이벤트는 중앙화된 `src/shared/utils/events.ts` 또는
  `src/shared/utils/scroll/scroll-utils.ts`를 통해서만 등록 가능
- **이유**: addEventListener('wheel', ...) 직접 사용 금지로 passive 옵션과
  이벤트 소비 규칙 일관성 보장

---

## Phase 186 정리 요약

### 제거된 파일

1. `test/unit/events/event-lifecycle.abort-signal.integration.test.ts`
   - 이유: 활성 테스트가 `events-coverage.test.ts`에 이미 존재
   - 중복 확인됨

2. `test/unit/events/wheel-listener.policy.red.test.ts`
   - 이유: 더 명확한 이름의 정책 테스트가 `test/unit/lint/`에 이미 존재
   - `wheel-listener-direct-use.policy.red.test.ts`로 통합

### 제거된 디렉토리

- `test/unit/events/` (완전 제거 - 모든 테스트 통합/아카이브됨)

### 아키텍처 개선

- **이벤트 테스트 중앙화**: `test/unit/shared/utils/events-coverage.test.ts`
- **정책 검증 중앙화**: `test/unit/lint/` (예: `wheel-listener-direct-use.policy.red.test.ts`)
- **명확성 향상**: 파일 이름이 목적을 더 명확하게 반영

---

## 마이그레이션 가이드 (참고용)

이 테스트를 다시 활성화하고 싶다면

1. `test/unit/shared/utils/events-coverage.test.ts`에서 필요한 부분을 복사
2. `test/unit/events/` 디렉토리 재생성 (필요시)
3. 새 테스트 파일 작성
>>>>>>> Stashed changes
4. vitest.config.ts에 경로 추가

## 통합된 기능

<<<<<<< Updated upstream
모든 기능이 `events-coverage.test.ts`에 이미 포함되어 있습니다:

```typescript
// events-coverage.test.ts (line 81-117)
describe('addListener', () => {
  it('should handle AbortSignal - auto removal on abort', () => { ... });
  it('should skip adding listener if signal is pre-aborted', () => { ... });
});
```
=======
모든 기능이 아래 파일에 포함되어 있습니다:

- **AbortSignal 테스트**: `test/unit/shared/utils/events-coverage.test.ts` (line 81-117)
- **Wheel 이벤트 정책**: `test/unit/lint/wheel-listener-direct-use.policy.red.test.ts`
>>>>>>> Stashed changes

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
