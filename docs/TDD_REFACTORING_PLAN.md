# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13
>
> **브랜치**: master
>
> **상태**: 안정화 단계 🎯

## 프로젝트 상태

- **빌드**: dev 733.19 KB / prod 321.60 KB ✅
- **테스트**: 672+ passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (271 modules, 741 dependencies) ✅
- **번들 예산**: 321.60 KB / 325 KB (3.40 KB 여유) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-39 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 최근 완료 작업

### Phase 39: 하이브리드 설정 UI 전략 (2025-10-13) ✅

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

## 활성 작업

### Phase 39 Step 3: Headless Settings 로직 분리 (진행 중) 🚧

**목표**: 설정 모달의 상태 관리 로직을 UI에서 분리하여 테스트 용이성과 재사용성
향상

**브랜치**: `feature/phase-39-step-3-headless-settings`

**배경**:

- Phase 39 Step 1 (Lazy loading) 완료, 번들 예산 내 유지 (321.60 KB / 325 KB)
- 현재 `SettingsModal`이 ThemeService/LanguageService를 직접 생성하여 결합도
  높음
- 테스트에서 서비스 모킹이 어려움

**가치**:

- ✅ 테스트 용이성: 로직과 UI 분리로 단위 테스트 가능
- ✅ 재사용성: 다른 컴포넌트에서도 설정 로직 사용 가능
- ✅ 유지보수성: 서비스 의존성 주입으로 결합도 감소

**TDD 진행 순서**:

#### Step 3-A: RED - useSettingsModal 훅 테스트 작성

1. 테스트 파일: `test/unit/hooks/use-settings-modal.test.ts`
2. 검증 항목:
   - 초기 테마/언어 상태 설정
   - 테마 변경 핸들러 동작
   - 언어 변경 핸들러 동작
   - 서비스 메서드 호출 확인
   - 서비스 주입 가능 여부

**예상 인터페이스**:

```typescript
interface UseSettingsModalOptions {
  themeService: ThemeService;
  languageService: LanguageService;
  onThemeChange?: (theme: ThemeOption) => void;
  onLanguageChange?: (language: LanguageOption) => void;
}

interface UseSettingsModalReturn {
  currentTheme: Accessor<ThemeOption>;
  currentLanguage: Accessor<LanguageOption>;
  handleThemeChange: (event: Event) => void;
  handleLanguageChange: (event: Event) => void;
}
```

#### Step 3-B: GREEN - useSettingsModal 구현

1. 파일: `src/shared/hooks/use-settings-modal.ts`
2. 구현 내용:
   - ThemeService/LanguageService를 props로 받음
   - createSignal로 상태 관리
   - 핸들러 함수에서 서비스 메서드 호출
   - 테스트 통과 확인

#### Step 3-C: REFACTOR - SettingsModal 리팩토링

1. `SettingsModal.tsx`에서 훅 사용하도록 수정
2. 기존 테스트 모두 통과 확인
3. 번들 크기 영향 확인

**수용 기준**:

- useSettingsModal 훅 테스트 모두 통과 ✅
- 기존 SettingsModal 테스트 모두 통과 ✅
- 번들 크기 325 KB 이하 유지 ✅
- 타입 오류 0개 ✅

**예상 효과**:

- 테스트 커버리지 향상 (+10-15 tests)
- 코드 결합도 감소
- 번들 크기 영향 최소 (+0.5-1 KB 예상)

---

### 단기 개선 후보 (선택적)

#### 1. CSS 최적화 (낮은 우선순위)

- 중복 토큰 제거
- 미사용 CSS 규칙 정리
- **예상 효과**: 2-3 KB 절감
- **필요성**: 현재 번들 예산 내로 즉시 필요하지 않음

#### 2. 문서 간소화 (권장)

- `TDD_REFACTORING_PLAN_COMPLETED.md` 간소화 필요 (현재 상세 내용 과다)
- **목표**: 핵심 결과만 유지
- **예상 효과**: 가독성 향상, 저장소 크기 감소

#### 3. 테스트 커버리지 개선 (권장)

- 24개 skipped 테스트 검토
- 1개 todo 테스트 완료
- **목표**: 670+/686 passing

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
2. 🎯 문서 간소화 (권장)
3. 🎯 테스트 커버리지 향상 (권장)
4. 📊 성능 모니터링 체계 구축 (중기)

**다음 권장 작업**: 문서 간소화 및 테스트 커버리지 개선

---

## 참고: 프로젝트 건강도 지표

- **번들 크기**: 321.60 KB / 325 KB (3.40 KB 여유) ✅
- **테스트 통과율**: 97.9% (672+/686) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 0 violations ✅

**전반적 평가**: 프로젝트는 안정적이며 유지보수 가능한 상태입니다.
