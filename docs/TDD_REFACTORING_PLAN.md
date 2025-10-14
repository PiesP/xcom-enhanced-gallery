# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 54 완료 ✅

## 프로젝트 상태

- **빌드**: dev 817.81 KB / prod **316.29 KB** ✅
- **테스트**: 662 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 718 dependencies) ✅
- **번들 예산**: **316.29 KB / 325 KB** (8.71 KB 여유) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-54 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 최근 완료 작업

### Phase 54: 디자인 토큰 일관성 개선 (2025-10-14) ✅

**완료된 모든 Sub-Phases**:

- ✅ **Phase 54.0**: 컴포넌트 토큰 재정의 제거 (6개 제거, -0.22 KB)
- ✅ **Phase 54.1**: 다크 모드 토큰 통합 (1개 @media 블록 제거)
- ✅ **Phase 54.3**: 레거시 Alias 정리 (23개 토큰 제거, -2.37 KB)

**종합 효과**:

- 토큰 건강도: 126개 → 100개 (23개 제거, 18% 감소)
- 번들 크기: 318.88 KB → 316.29 KB (-2.59 KB, 0.81% 감소)
- 디자인 일관성 향상 + 유지보수성 개선
- 자동 검증 체계 구축 (TDD 정책 테스트 + 토큰 분석 도구)

**세부 내용**: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 다음 작업 계획

현재 활성 Phase 없음. 다음 작업 후보:

### Phase 55 후보: 추가 최적화

**잠재적 개선 영역**:

1. **토큰 추가 정리**
   - 현재: 100개 토큰 (3개 unused 남음)
   - 목표: Underused 토큰 검토 (≤2회 사용: 55개)
   - 예상: ~10-15개 추가 제거 가능

2. **CSS 최적화**
   - 중복 스타일 규칙 제거
   - 미사용 CSS 클래스 정리
   - 예상: -1~2 KB

3. **이미지/아이콘 최적화**
   - SVG 최적화
   - 아이콘 번들 검토
   - 예상: -0.5~1 KB

**권장 순서**: 프로젝트 우선순위에 따라 결정

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
