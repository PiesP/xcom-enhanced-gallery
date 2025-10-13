# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 54 진행 중 (54.0✅, 54.1✅, 54.3
> 진행 예정)

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

**진행 중 Phase**:

#### Phase 54.3: 레거시 Alias 정리

**목표**: 사용되지 않는 alias 토큰 및 중복 제거

**현재 문제**:

- 126개 토큰 중 28개 사용되지 않음
- 26개 토큰이 중복 정의됨 (일부는 8번까지 중복)
- 불필요한 복잡도 증가

**솔루션**:

1. Unused 토큰 28개 제거
2. 중복 정의 26개 정리 (최종 정의만 유지)
3. 결과: 126개 → ~70개 (54개 제거)

**예상 작업량**: 2-3시간 **예상 영향**: -0.5 KB ~ -1.0 KB

---

### Phase 54 종합

**완료**: Phase 54.0, 54.1 **진행 중**: Phase 54.3 (Alias 정리) **예상 총
소요**: 3-5시간 **예상 총 효과**: 디자인 일관성 + 번들 -1.0~-2.0 KB

**권장 순서**: Phase 54.3 완료 → Phase 55 계획

---

## 디자인 토큰 가이드라인

### 토큰 사용 원칙

1. **컴포넌트는 semantic 토큰만 참조**

   ```css
   /* ✅ 권장 */
   .component {
     background: var(--xeg-bg-toolbar);
   }

   /* ❌ 금지 */
   .component {
     --local-bg: var(--xeg-bg-toolbar);
     background: var(--local-bg);
   }
   ```

2. **토큰 재정의는 semantic 레이어에만**
   - Primitive → Semantic: 허용
   - Semantic → Component: 금지

3. **테마별 토큰은 semantic 레이어에서 정의**

   ```css
   [data-theme='dark'] {
     --xeg-bg-toolbar: rgba(30, 30, 30, 0.95);
   }
   ```

### 검증 방법

```bash
# 자동 검증
npm test -- test/styles/component-token-policy.test.ts

# 수동 검증
grep -rn "^\s*--xeg-[a-z-]*:\s*var(--xeg-" src/**/components/**/*.module.css
```

---

## 백로그

### 테스트 파일 정리

**정리 완료**:

- JSDOM 제한으로 제거: Toolbar Settings 테스트 (11개)
- E2E 커버: `playwright/smoke/toolbar-settings.spec.ts`
- Glassmorphism 테스트 디렉터리 제거

### 접근성 개선 (향후)

- 키보드 네비게이션 개선
- 스크린 리더 지원 강화
- 고대비 모드 최적화

---

## 이전 Phase 요약

세부 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조:

- **Phase 53** (2025-10-14): Button Fallback 제거
- **Phase 51-52** (2025-01-14): Settings/Toast 토큰화
- **Phase 44-50** (2025-01-13): SettingsModal → Toolbar 전환
- **Phase 1-43** (2025-01 이전): 아키텍처 정립
