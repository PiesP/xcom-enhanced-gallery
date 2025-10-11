# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 12 완료 - 모든 E2E 테스트 안정화 및 CI 통합 완료
>
> **최종 업데이트**: 2025-10-11
>
> **빌드**: ✅ dev (727.39 KB) / prod (325.05 KB gzip: 88.24 KB)
>
> **테스트**: ✅ Vitest 538/538 (100%, 23 skipped) | ✅ E2E 8/8 (100%)

---

## 활성 작업

### 휠 스크롤 네이티브 동작 복원 & Legacy 코드 정리 (우선순위: 높음)

**브랜치**: `refactor/wheel-scroll-and-legacy-cleanup`

#### 목표 1: 휠 스크롤 속도 제어 제거

**현재 문제**:

- `useGalleryScroll` 훅에서 `preventDefault()`로 휠 이벤트를 가로채고 있음
- 브라우저/OS의 네이티브 스크롤 속도 설정을 무시
- 사용자 경험에 부자연스러운 동작 발생 가능

**솔루션 옵션**:

1. **Option A: preventDefault 제거 (권장)**
   - 장점: 브라우저/OS 기본 동작 완전 준수, 코드 단순화
   - 단점: 트위터 페이지와의 스크롤 충돌 처리 필요
   - 구현: `handleGalleryWheel`에서 `preventDefault()` 제거, passive 리스너 사용

2. **Option B: 조건부 preventDefault**
   - 장점: 필요시에만 브라우저 동작 차단
   - 단점: 복잡도 증가, 엣지 케이스 관리 필요
   - 구현: 갤러리 내부 스크롤만 네이티브로 처리

**선택**: Option A (브라우저 기본 동작 완전 준수)

#### 목표 2: Legacy/Deprecated 코드 정리

**정리 대상**:

- `src/shared/components/ui/Toolbar/toolbarConfig.ts` - 전체 deprecated
- `src/shared/components/ui/Toast/Toast.tsx` - LegacyToastProps 인터페이스
- `src/shared/utils/events.ts` - deprecated EventRegistry 클래스
- `src/shared/services/MediaService.ts` - deprecated wrapper 메서드
- `src/shared/services/ServiceManager.ts` - deprecated getServiceStatus
- `src/shared/services/UnifiedToastManager.ts` - deprecated 별칭
- `src/shared/utils/styles/index.ts` - Legacy style utils 주석
- `src/shared/utils/performance/index.ts` - Legacy signal optimization 주석

**처리 방침**:

1. **완전 제거**: 더 이상 사용되지 않는 코드/파일
2. **마이그레이션 가이드 추가**: 대체 방법이 있는 경우
3. **주석 정리**: Legacy 언급이 있지만 현재 활성 코드인 경우

#### 구현 단계

**Step 1**: 휠 스크롤 네이티브 동작 복원

```powershell
# 테스트 작성 (RED)
# test/features/gallery/hooks/useGalleryScroll.test.ts 수정
# - passive 리스너 사용 검증
# - preventDefault 호출 안 됨 검증

# 구현 (GREEN)
# src/features/gallery/hooks/useGalleryScroll.ts
# - handleGalleryWheel에서 preventDefault() 제거
# - 이벤트 리스너를 passive: true로 변경

# 리팩토링
# - preventTwitterScroll 함수 검토 및 필요시 수정
```

**Step 2**: Deprecated 코드 제거

```powershell
# toolbarConfig.ts 사용처 확인 후 제거
# Legacy 인터페이스/주석 정리
# 테스트 수정
```

#### 검증

```powershell
npm run typecheck     # 타입 오류 없음
npm run lint:fix      # 린트 통과
npm test:smoke        # 스모크 테스트 통과
npm test:fast         # 단위 테스트 통과
npm run build         # 빌드 성공
```

#### 예상 효과

- ✅ 브라우저/OS 네이티브 스크롤 속도 설정 준수
- ✅ 코드베이스 약 200-300줄 감소
- ✅ 유지보수 복잡도 감소
- ✅ 사용자 경험 개선 (자연스러운 스크롤)

---

## 다음 단계 제안

### 문서 정리 (우선순위: 중간)

- [x] CODING_GUIDELINES.md 간결화 (1552줄 → ~300줄)
- [x] TDD_REFACTORING_PLAN_COMPLETED.md 요약 (4441줄 → ~100줄)
- [ ] 백업 파일 제거 (.backup 파일들)

#### 성능 최적화 (우선순위: 낮음)

- 번들 크기 분석 및 최적화
- 런타임 성능 프로파일링
- 메모리 사용량 모니터링

#### Vitest Skipped 테스트 정리 (우선순위: 중간)

- E2E로 대체 완료된 8개 skip 테스트 제거 또는 참조 주석 추가
- 나머지 15개 skipped 테스트 검토 및 정리

---

## 완료된 Phase

모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어
있습니다:

- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-10-11
- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-10-11
- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ - 2025-01-10
- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅
- **Phase 8**: Fast 테스트 안정화 (우선순위 1-2) ✅ - 2025-01-10
- 이전 Phase들... (COMPLETED 문서 참조)

---

## 개발 가이드라인

### TDD 접근

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서
- RED → GREEN → REFACTOR 사이클 준수
- 테스트 우선 작성으로 명확한 수용 기준 설정

### 코딩 규칙 준수

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용
- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import 금지
- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용
- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용
- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`

### 검증 절차

각 작업 완료 후:

```powershell
npm run typecheck  # TypeScript 타입 체크
npm run lint:fix   # ESLint 자동 수정
npm test:smoke     # 핵심 기능 스모크 테스트
npm test:fast      # 빠른 단위 테스트
npm run build      # dev/prod 빌드 검증
```

---

## 코드 품질 현황

### 마이그레이션 완료 현황

- ✅ **Phase 1-12**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정, UX 가드,
  E2E 통합 완료
- ✅ **빌드**: dev 727.39 KB / prod 325.05 KB (gzip: 88.24 KB)
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 0 위배

### 현재 테스트 상황

- ✅ **Smoke 테스트**: 15/15 통과 (100%)
- ✅ **Fast 테스트**: 538/538 통과 (100%, 23 skipped)
- ✅ **E2E 테스트**: 8/8 통과 (100%)
- 🔵 **Skip된 테스트**: 23개 (정리 권장)

### 기술 스택

- **UI 프레임워크**: Solid.js 1.9.9
- **상태 관리**: Solid Signals (내장, 경량 반응형)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)

- **디자인 시스템**: CSS Modules + 디자인 토큰

---

## 품질 게이트

모든 PR은 다음 기준을 충족해야 합니다:

- [ ] TypeScript: 0 에러 (src/)
- [ ] ESLint: 0 에러, 0 경고
- [ ] Smoke 테스트: 100% 통과
- [ ] Fast 테스트: 100% 통과 (skip 제외)
- [ ] 빌드: dev/prod 성공
- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수
- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수
- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

---

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙
- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

---

**마지막 업데이트**: 2025-01-10

**다음 단계**: E2E 테스트 프레임워크 도입 (Playwright/Cypress 선택)
