# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 8 Fast 테스트 안정화 작업 진행 중
>
> **최종 업데이트**: 2025-10-12

---

## Phase 8: Fast 테스트 안정화 🔄 진행 중

> Fast 테스트 통과율을 100%로 달성하여 품질 게이트를 강화합니다.

### 현황 점검

- **Fast 테스트**: 537/552 통과 (97.3%)
- **실패 케이스**: 13개 테스트, 4개 스위트
- **주요 실패 유형**:
  1. Import 경로 해결 실패 (4건)
  2. ARIA/접근성 속성 회귀 (6건)
  3. Gallery 통합 테스트 (3건)

### 우선순위 1: Import 경로 수정 🔴 긴급

#### 문제 상황

```
Error: Failed to resolve import "../../../utils/testing-library"
from "test/unit/shared/components/isolation/GalleryContainer.inline-style.tokens.test.tsx"
```

- 영향 받는 파일:
  - `test/unit/shared/components/isolation/GalleryContainer.inline-style.tokens.test.tsx`
  - `test/unit/features/settings/settings-controls.tokens.test.ts`
  - `test/unit/ui/toolbar.icon-accessibility.test.tsx`
  - `test/unit/shared/utils/accessibility/focus-trap-standardization.test.ts`

#### 솔루션 옵션

| 옵션 | 접근                                              | 장점                 | 단점                     |
| ---- | ------------------------------------------------- | -------------------- | ------------------------ |
| A    | 절대 경로로 변경 (`@/test/utils/testing-library`) | 일관성, 명확함       | tsconfig 설정 필요       |
| B    | 상대 경로 수정                                    | 빠른 수정            | 깊은 중첩 시 가독성 저하 |
| C    | 테스트 유틸 배럴 재구성                           | 장기적 유지보수 개선 | 작업 범위 큼             |

**선택 솔루션**: A. `vitest.config.ts`의 `resolve.alias`에 `@test` 추가하고
import 경로 통일.

#### TDD 구현 계획

1. [ ] `vitest.config.ts`에 `@test` 별칭 추가 (`test/` 폴더)
2. [ ] 영향 받는 4개 파일의 import 경로를 절대 경로로 변경
3. [ ] `npm run test:fast`로 Import 오류 해소 확인
4. [ ] 린트/타입 체크 통과 확인

---

### 우선순위 2: ARIA 접근성 속성 복원 🔴 긴급

#### 문제 상황

- `Button`, `IconButton` 컴포넌트에서 `role="button"` 속성 누락
- Solid.js 전환 시 props 전달 방식 변경으로 인한 회귀
- 영향 받는 테스트:
  - `test/unit/shared/components/ui/aria-contract.test.tsx`
  - `test/unit/shared/components/ui/Button-icon-variant.test.tsx`
  - `test/unit/shared/components/ui/IconButton.test.tsx`
  - `test/unit/shared/components/ui/settings-modal-focus.test.tsx`

#### 솔루션 옵션

| 옵션 | 접근                                 | 장점               | 단점                        |
| ---- | ------------------------------------ | ------------------ | --------------------------- |
| A    | `mergeProps`로 ARIA 속성 명시적 병합 | Solid.js 권장 패턴 | 모든 컴포넌트 수정 필요     |
| B    | JSX spread로 직접 전달               | 간단한 수정        | 반응성 손실 가능성          |
| C    | HOC에서 ARIA 속성 주입               | 중앙화된 관리      | 컴포넌트별 특수성 고려 필요 |

**선택 솔루션**: A. `mergeProps`로 기본 ARIA 속성과 props를 안전하게 병합.

#### TDD 구현 계획

1. [ ] `Button.tsx`에서 기본 `role="button"` 속성을 `mergeProps`로 병합
2. [ ] `IconButton.tsx`에서 동일하게 적용
3. [ ] `ToolbarHeadless.tsx`의 `children` render prop 타입 수정
4. [ ] 관련 테스트 6개 GREEN 확인

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

1. 🔴 **Import 경로 수정** — 4개 파일, 빠른 해결 (예상 20분)
2. 🔴 **ARIA 접근성 복원** — 6개 테스트, 핵심 품질 (예상 40분)

### 2순위 (P1)

1. 🟡 **Gallery 통합 테스트 안정화** — 3개 테스트 (예상 30분)
2. Phase 5-5: 테스트 타입 안정화 (1,383개 오류) — 장기 작업

### 이후 작업 (P2)

- 성능 최적화 및 번들 크기 감소 검토
- 추가 UX 개선 사항 수집

---

## 현재 작업 중인 Phase

> **Phase 7 완료**: 4개 핵심 UX 회귀 복원 완료 (툴바 인디케이터, 휠 스크롤, 설정
> 모달, 이미지 크기 버튼)
>
> 상세 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-12 항목) 참조

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
- 🟡 Fast 테스트: **516/543 통과** (95.0%)
- 🟡 테스트 타입: 1,383개 오류 (테스트 파일만, src/ 코드는 0 오류)

### 기술 스택

- **UI**: Solid.js 1.9.9
- **상태**: Solid Signals (내장)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM

---

## 품질 게이트
