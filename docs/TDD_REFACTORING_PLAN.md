# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13
>
> **브랜치**: master
>
> **상태**: 안정화 단계 🎯

## 프로젝트 상태

- **빌드**: dev 734.31 KB / prod 322.07 KB ✅
- **테스트**: 689 passing, 1 skipped ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (271 modules, 744 dependencies) ✅
- **번들 예산**: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️ 예산 근접

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-39 완료 기록 (최근 간소화됨)
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 최근 완료 작업

### Phase 40: 테스트 커버리지 개선 (2025-10-13) ✅

**목표**: E2E 커버되거나 불필요한 skipped 테스트 제거

**성과**:

- Skipped 테스트: 24개 → 1개 (96% 감소)
- Todo 테스트: 1개 → 0개
- 테스트 파일: -9개 삭제 (유지보수 부담 감소)
- 689/689 passing (100% 통과율) ✅

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 39 Step 3: Headless Settings 로직 분리 (2025-10-13) ✅

**목표**: SettingsModal 상태 관리를 UI에서 분리하여 테스트 용이성과 재사용성
향상

**TDD 단계**:

- **RED**: `test/unit/hooks/use-settings-modal.test.ts` (219 lines, 11 tests)
- **GREEN**: `src/shared/hooks/use-settings-modal.ts` (95 lines) - 11/11 passing
  ✅
- **REFACTOR**: SettingsModal.tsx 통합 (400 lines, -19 중복 코드) - 12/12
  passing ✅

**성과**: 로직/UI 분리로 테스트 용이성↑, 재사용성↑, 결합도↓ / 번들 +0.47 KB

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 39 Step 1-2: 하이브리드 설정 UI 전략 (2025-10-13) ✅

Lazy loading 시도 및 번들 예산 검증 완료.

**결과**: Lazy loading 효과 미미 (+0.31 KB), 현재 번들 크기 예산 내 (321.60 KB /
325 KB)

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 38: 설정 모달 뷰포트 중앙 정렬 개선 (2025-10-13) ✅

CSS flex 기반 backdrop으로 뷰포트 중앙 정렬 개선.

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 37: Gallery 하드코딩 제거 및 PC 전용 정책 준수 (2025-10-13) ✅

Gallery.module.css의 50+ 하드코딩된 px 값을 디자인 토큰으로 교체하고, 모바일
미디어쿼리 제거.

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

---

## 다음 단계

### 우선순위 1: 문서 정리 (권장) ✅

**완료 상태**: `TDD_REFACTORING_PLAN_COMPLETED.md` 간소화 완료 (998줄 → ~240줄)

### 우선순위 2: 테스트 커버리지 개선 (권장) ✅

**완료 상태**: 중복/불필요 테스트 제거 완료

- Skipped: 24개 → 1개 (96% 감소)
- 테스트 파일: -9개
- 통과율: 689/689 (100%)

### 우선순위 3: 번들 크기 최적화 (선택적)

**현재 상황**: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️ 예산 근접

**고려 사항**:

1. CSS 최적화 가능성:
   - 중복 토큰 제거
   - 미사용 CSS 규칙 정리
   - **예상 효과**: 2-3 KB 절감

2. Code splitting 재검토:
   - Phase 39에서 Lazy loading 효과 미미 확인
   - 큰 컴포넌트(>50 KB) 타겟팅 필요

3. Tree-shaking 최적화:
   - 미사용 export 추가 확인
   - barrel export 최소화

**권장 시점**: 번들이 323 KB를 초과하거나 새 기능 추가 전

---

## 단기 개선 후보 (백로그)

### 접근성 개선

- ARIA labels 확장
- 키보드 네비게이션 개선
- 스크린 리더 지원 강화

### 성능 개선

- Intersection Observer 최적화
- 이미지 lazy loading 개선
- 메모리 사용량 프로파일링

### 코드 품질

- 복잡도 높은 함수 리팩토링
- 타입 추론 개선
- 중복 코드 추가 제거

---

**다음 작업 권장 순서**:

1. ✅ 문서 정리 (완료)
2. ✅ 테스트 커버리지 개선 (완료 - 중복 제거)
3. (선택적) 번들 크기 최적화 (예산 근접 시)

## 중기 계획 (향후 1-2주)

1. **성능 모니터링**
   - 번들 크기 추이 관찰
   - 빌드 시간 최적화 검토

2. **E2E 테스트 강화**
   - Playwright 스모크 테스트 확장
   - 주요 사용자 시나리오 커버리지

3. **의존성 정리**
   - 미사용 devDependencies 검토
   - `depcheck` 실행 후 정리

---

## 작업 이력 요약

### Phase 40 (2025-10-13) ✅

테스트 커버리지 개선: 중복/불필요 skipped 테스트 제거. 자세한 내용은
`TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 39 (2025-10-13) ✅ 부분 성공

하이브리드 설정 UI 전략: Lazy loading 인프라 구축 완료, 번들 예산 검증 완료.
자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 38 (2025-10-13) ✅

설정 모달 뷰포트 중앙 정렬 개선. 자세한 내용은
`TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 37 (2025-10-13) ✅

Gallery 하드코딩 제거 및 PC 전용 정책 준수. 자세한 내용은
`TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### 이전 Phase

Phase 1-36 완료 기록은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

---

## 현재 우선순위

1. ✅ 프로젝트 안정화 (달성)
2. ✅ 문서 간소화 (완료)
3. ✅ 테스트 커버리지 향상 (완료 - 중복 제거)
4. 📊 성능 모니터링 체계 구축 (중기)

**다음 권장 작업**: 번들 크기 최적화 또는 신규 기능 개발

---

## 참고: 프로젝트 건강도 지표

- **번들 크기**: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️
- **테스트 통과율**: 100% (689/689) ✅
- **Skipped 테스트**: 1개 (정책 가드, 의도된 skip) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 0 violations ✅

**전반적 평가**: 프로젝트는 안정적이며 유지보수 가능한 상태입니다.
