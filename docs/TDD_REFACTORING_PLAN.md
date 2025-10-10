# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 8 Fast 테스트 안정화 작업 진행 중 (우선순위 1-2 완료)
>
> **최종 업데이트**: 2025-10-12

---

## Phase 8: Fast 테스트 안정화 🔄 진행 중

> Fast 테스트 통과율을 100%로 달성하여 품질 게이트를 강화합니다.

### 현황 점검

- **Fast 테스트**: 541/553 통과 (97.8%, +0.5%p 개선)
- **해결된 케이스**: Import 경로 4건, ARIA 속성 3건
- **남은 실패 케이스**: 10개 테스트
- **주요 남은 실패 유형**:
  1. ~~Import 경로 해결 실패~~ ✅ 완료
  2. ~~ARIA/접근성 속성 회귀~~ ✅ 완료
  3. Gallery 통합 테스트 (10건) 🔄

### ~~우선순위 1: Import 경로 수정~~ ✅ 완료

**해결 내역**:

- `vitest.config.ts`에 `@test` 별칭 추가
- ~20개 테스트 파일의 import 경로를 `@test/utils/testing-library`로 통일
- Import 관련 4개 테스트 실패 완전 해소

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-12, Phase 8) 참조

---

### ~~우선순위 2: ARIA 접근성 속성 복원~~ ✅ 완료

**해결 내역**:

- `Button.tsx`, `primitive/Button.tsx`에 `mergeProps`로 `role="button"` 복원
- IntersectionObserver 등 DOM 전역 객체에 `globalThis` 접두사 추가
- ARIA 관련 3개 테스트 실패 해소

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-12, Phase 8) 참조

---

### 우선순위 3: Gallery 통합 테스트 안정화 🟡 높음

#### 문제 상황

- GalleryApp activation 테스트 3개 실패
- PC-only 이벤트 정책 테스트 실패
- 원인: Solid.js 전환 후 이벤트 핸들러 등록/해제 타이밍 변경

#### 솔루션 옵션

| 옵션 | 접근                                     | 장점             | 단점                  |
| ---- | ---------------------------------------- | ---------------- | --------------------- |
| A    | `createEffect`로 이벤트 등록 시점 명확화 | 반응성 추적 정확 | 기존 로직 재구성 필요 |
| B    | 테스트에서 `waitFor` + `flush` 추가      | 테스트만 수정    | 근본 원인 미해결      |
| C    | 이벤트 관리자를 비동기 초기화로 변경     | 안정적 초기화    | API 변경 영향 큼      |

**선택 솔루션**: B (단기). 테스트에서 타이밍 조정하여 안정화, 장기적으로 A 검토.

#### TDD 구현 계획

1. [ ] `gallery-app-activation.test.ts`에 `waitFor` 추가로 초기화 대기
2. [ ] `gallery-pc-only-events.test.ts`에 이벤트 flush 추가
3. [ ] `vendor-initialization-error.test.ts` 재검토
4. [ ] 3개 테스트 GREEN 확인

---

## 작업 우선순위 정리

### 즉시 착수 (P0)

1. ~~🔴 **Import 경로 수정**~~ ✅ 완료 (Phase 8)
2. ~~🔴 **ARIA 접근성 복원**~~ ✅ 완료 (Phase 8)

### 2순위 (P1)

1. 🟡 **Gallery 통합 테스트 안정화** — 10개 테스트 (예상 1시간)
2. Phase 5-5: 테스트 타입 안정화 (1,383개 오류) — 장기 작업

### 이후 작업 (P2)

- 성능 최적화 및 번들 크기 감소 검토
- 추가 UX 개선 사항 수집

---

## 현재 작업 중인 Phase

> **Phase 8 진행 중** (우선순위 1-2 완료): Fast 테스트 안정화
>
> - ✅ 우선순위 1: Import 경로 수정 (4개 테스트)
> - ✅ 우선순위 2: ARIA 접근성 복원 (3개 테스트)
> - 🔄 우선순위 3: Gallery 통합 테스트 (10개 남음)
>
> **Phase 7 완료**: 4개 핵심 UX 회귀 복원 완료 (툴바 인디케이터, 휠 스크롤, 설정
> 모달, 이미지 크기 버튼)
>
> 상세 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 개발 가이드라인

### TDD 접근

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서
- RED → GREEN → REFACTOR 사이클 준수

### 코딩 규칙 준수

- Solid.js Signals 사용: `getSolid()`, `getSolidStore()` getter 경유
- PC 전용 이벤트만 사용: click, keydown/up, wheel, contextmenu, mouse\*
- CSS Modules + 디자인 토큰만 사용 (하드코딩 금지)
- 경로 별칭 사용: `@`, `@features`, `@shared`, `@assets`

### 검증 절차

각 작업 완료 후:

```powershell
npm run typecheck  # TypeScript 타입 체크
npm run lint:fix   # ESLint 자동 수정
npm test:smoke     # 핵심 기능 스모크 테스트
npm run build      # dev/prod 빌드 검증
```

---

## 코드 품질 현황

### 마이그레이션 완료 현황

- ✅ **Phase 1-6**: Solid.js 전환, 테스트 인프라, 문서 정비 완료
- ✅ **빌드**: dev 711.28 KB / prod 성공
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 1개 정보 메시지 (비크리티컬)

### 현재 테스트 상황

- ✅ Smoke 테스트: **15/15 통과** (100%)
- 🟡 Fast 테스트: **541/553 통과** (97.8%, +0.5%p 개선)
- 🟡 테스트 타입: 1,383개 오류 (테스트 파일만, src/ 코드는 0 오류)

### 기술 스택

- **UI**: Solid.js 1.9.9
- **상태**: Solid Signals (내장)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM

---

## 품질 게이트
