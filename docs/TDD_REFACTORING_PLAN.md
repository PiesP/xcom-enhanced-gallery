# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 54.1 완료, Phase 54.2-54.3 진행
> 예정 ✅

## 프로젝트 상태

- **빌드**: dev 838.69 KB / prod **318.66 KB** ✅
- **테스트**: 662 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 718 dependencies) ✅
- **번들 예산**: **318.66 KB / 325 KB** (6.34 KB 여유) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-54.1 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 활성 작업 계획

### Phase 54: 디자인 토큰 일관성 개선

**완료된 Phase**:

- ✅ Phase 54.0: 토큰 재정의 제거 (6개 제거, 디자인 불일치 해결)
- ✅ Phase 54.1: 다크 모드 토큰 통합 (1개 @media 블록 제거, semantic layer
  중앙화)

**진행 예정 Phase**:

#### Phase 54.2: Glassmorphism 유틸리티 (재평가 - Skip)

**재평가 결과**:

- **실제 glassmorphism effect**: 3곳만 사용 중 (VerticalImageItem,
  design-tokens.component, primitive/Panel)
- **이미 토큰화 완료**: `var(--xeg-media-glass-blur)`,
  `var(--glass-backdrop-filter)` 사용
- **대부분은 성능 최적화**: `backdrop-filter: none` (40+ 인스턴스)
- **결론**: 유틸리티 클래스 불필요, 현재 토큰 시스템으로 충분

**Phase 54.2 Skip 사유**:

- 중복이 거의 없음 (3곳, 모두 토큰 사용)
- 추가 추상화는 오히려 복잡도 증가
- 실질적 번들 절감 효과 미미 (<0.1 KB)

---

#### Phase 54.3: 레거시 Alias 정리

**목표**: 사용되지 않는 alias 토큰 제거

**현재 문제**:

- 불필요한 alias 토큰 다수
- 최신 semantic 토큰과 중복

**솔루션**:

1. 사용되지 않는 alias 식별
2. 단계적 제거 (호환성 고려)
3. 최종 목표: 10개 미만

**예상 작업량**: 1-2시간  
**예상 영향**: -0.2 KB ~ -0.5 KB

---

### Phase 54 종합

**완료**: Phase 54.0, 54.1 (디자인 불일치 해결, 다크 모드 중앙화)  
**Skip**: Phase 54.2 (Glassmorphism 유틸리티 - 실제 중복 거의 없음, 이미 토큰화
완료)  
**남은 작업**: Phase 54.3 (Alias 정리)  
**예상 작업량**: 1-2시간  
**예상 영향**: -0.2 KB ~ -0.5 KB

**권장 순서**: Phase 54.3 (Alias 정리) → 완료 후 Phase 55 계획

---

## 백로그

### 테스트 파일 정리

**정리 완료**:

- JSDOM 제한으로 제거된 Toolbar Settings 테스트 (11개)
- E2E로 커버됨: `playwright/smoke/toolbar-settings.spec.ts`

### 접근성 개선

**향후 고려사항**:

- 키보드 네비게이션 개선
- 스크린 리더 지원 강화
- 고대비 모드 최적화

---

## 이전 Phase 요약

세부 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조:

- **Phase 53** (2025-10-14): Button Fallback 제거 - 14개 토큰 추가, 15개
  fallback 제거
- **Phase 51-52** (2025-01-14): Settings/Toast 토큰화
- **Phase 44-50** (2025-01-13): SettingsModal → Toolbar 전환
- **Phase 1-43** (2025-01 이전): 아키텍처 정립 및 기초 리팩토링

---

## 프로젝트 건강도 지표

- **번들 크기**: 318.59 KB / 325 KB (6.41 KB 여유) ✅
- **테스트**: 662 passing / 1 skipped ✅
- **타입 안전성**: TypeScript strict, 0 errors ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 718 deps) ✅

---

## 디자인 토큰 가이드라인 (Phase 54.0 이후 적용)

### 토큰 사용 원칙

1. **컴포넌트는 semantic 토큰만 참조**

   ```css
   /* ✅ 권장: 직접 참조 */
   .component {
     background: var(--xeg-bg-toolbar);
     border: 1px solid var(--color-border-default);
   }

   /* ❌ 금지: 로컬 재정의 */
   .component {
     --local-bg: var(--xeg-bg-toolbar);
     background: var(--local-bg);
   }
   ```

2. **토큰 재정의는 semantic 레이어에만**
   - Primitive → Semantic: 허용
   - Semantic → Component: 금지 (직접 참조만)

3. **테마별 토큰은 semantic 레이어에서 정의**
   ```css
   /* design-tokens.semantic.css */
   [data-theme='dark'] {
     --xeg-bg-toolbar: rgba(30, 30, 30, 0.95);
   }
   ```

### 검증 방법

**자동 검증**: `npm test`로 정책 테스트 실행

```bash
# Phase 54.0 완료 후
npm test -- test/styles/component-token-policy.test.ts
```

**수동 검증**: 컴포넌트 CSS에서 다음 패턴 확인

```bash
# 로컬 토큰 재정의 검색
grep -rn "^\s*--xeg-[a-z-]*:\s*var(--xeg-" src/**/components/**/*.module.css
```

---

## 권장 작업 순서

**Phase 54 진행 순서**:

1. ✅ **Phase 54.0** - 토큰 재정의 제거 (최우선, 1-2시간)
2. **Phase 54.1** - 다크 모드 통합 (2-3시간)
3. **Phase 54.2** - Glassmorphism 유틸리티 (1-2시간)
4. **Phase 54.3** - 레거시 Alias 정리 (1-2시간)

**예상 총 소요**: 5-9시간 **예상 총 효과**: 디자인 일관성 + 번들 -1.0~-2.5 KB

---

## 이전 Phase 요약

세부 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조:

- **Phase 51-52** (2025-01-14): Settings/Toast 토큰화
- **Phase 44-50** (2025-01-13): SettingsModal → Toolbar 전환
- **Phase 1-43** (2025-01 이전): 아키텍처 정립 및 기초 리팩토링

---

## 프로젝트 건강도 지표

- **번들 크기**: 318.59 KB / 325 KB (6.41 KB 여유) ✅
- **테스트**: 662 passing / 1 skipped ✅
- **타입 안전성**: TypeScript strict, 0 errors ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 718 deps) ✅
