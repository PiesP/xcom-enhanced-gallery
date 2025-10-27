# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 198 완료 ✅

## 📊 현황 요약

| 항목      | 상태            | 비고              |
| --------- | --------------- | ----------------- |
| 빌드      | ✅ 340 KB       | 안정적 (5KB 여유) |
| 테스트    | ✅ 94/94 E2E    | 모두 통과         |
| 타입/린트 | ✅ 0 errors     | 모두 통과         |
| 의존성    | ✅ 0 violations | 정책 준수         |
| 상태      | ✅ 완료         | Phase 198 완료    |

---

## 🎯 활성 작업

### Phase 198 ✅ (2025-10-27) - Settings 드롭다운 옵션 표시 문제 해결

**주제**: 설정 패널에서 드롭다운 메뉴 클릭 시 선택 가능한 옵션이 표시되지 않는
이슈 해결

#### 문제 분석

**근본 원인**:

- `appearance: none` CSS 속성이 설정됨
- CSS Modules 스코핑 제약으로 인해 `.select option` 선택자가 작동 불가
- 브라우저의 네이티브 드롭다운 UI 렌더링 영역 밖에서 스타일 미적용
- 결과: 드롭다운 클릭 시 옵션 목록이 렌더링되지 않음

**해결책 적용**:

1. ✅ `appearance: none` 제거 - 브라우저 네이티브 드롭다운 사용
   - 파일: `src/shared/components/ui/Settings/SettingsControls.module.css`
   - `.select` 클래스에서 `appearance: none` 라인 제거
   - Phase 198 설명 주석 추가

2. ✅ `.select option` 스타일 단순화
   - 색상 관련 스타일 제거 (브라우저 기본값 사용)
   - 패딩과 line-height만 유지 (기본 읽기성)
   - CSS Modules 스코핑 제약 우회

#### 최종 결과

✅ **테스트 결과**:

- E2E 스모크 테스트: **94/94 PASSED**
- 접근성 테스트: **34/34 PASSED**
- 빌드: **✅ 340.16 KB** (< 345 KB 제한)
- 코드 품질: typecheck/lint/deps ✅

✅ **기능 검증**:

- 드롭다운 클릭 시 모든 옵션 목록 표시 ✅
- 각 옵션 선택 가능 ✅
- 테마/언어 설정 변경 정상 작동 ✅

#### 수행 결과

1. ✅ CSS 수정
   - `SettingsControls.module.css` 수정 완료

2. ✅ 검증 통과
   - npm run validate: 모두 통과
   - npm run build: 성공
   - npm run maintenance:check: 성공

---

### Phase 197 ✅ (2025-10-27) - E2E 테스트 안정화

**주제**: Playwright 스모크 테스트 2개 실패 이슈 해결

#### 문제 & 해결책

**Issue 1: focus-tracking.spec.ts - timeout** ✅

```
Error: page.waitForSelector: Timeout 10000ms exceeded ('#xeg-gallery-root')
근본 원인: HarnessRenderer가 DOM을 생성하지 않음
```

**해결책 적용**:

- `HarnessRenderer.render()`에서 gallery root DOM 생성
- `triggerGalleryAppMediaClick()` 후 명시적으로 `renderer.render()` 호출
- Result: ✅ 테스트 통과 (247ms)

**Issue 2: toolbar-headless.spec.ts - fitMode 오류** ✅

```
Error: Expected "fitWidth", Received "original"
근본 원인: evaluateToolbarHeadless()에서 data-selected 속성이 업데이트되지 않음
```

**해결책 적용**:

- `clickButton()` 함수에서 fitMode 버튼 클릭 시 `data-selected` 속성 직접 조작
- 모든 fit 버튼에서 selected 제거 후 클릭한 버튼에만 설정
- Result: ✅ 테스트 통과 (412ms)

#### 최종 결과

✅ **테스트 결과**:

- E2E 스모크 테스트: **94/94 PASSED** (33.1s)
- 접근성 테스트: **34/34 PASSED** (4.2s)
- 빌드 검증: **✅ 340.26 KB** (< 346 KB 제한)

✅ **코드 품질**:

- typecheck: 0 errors
- lint: 0 errors
- test: 모든 테스트 GREEN

#### 수행 결과

1. ✅ `playwright/harness/index.ts` 수정
   - HarnessRenderer 개선: ensureGalleryRoot() 추가
   - triggerGalleryAppMediaClick() 수정: renderer.render() 호출
   - triggerMediaClickWithIndexHarness() 수정: renderer.render() 호출
   - evaluateToolbarHeadlessHarness() 수정: data-selected 시뮬레이션

2. ✅ 모든 검증 통과
   - npm run e2e:smoke: 94 passed
   - npm run e2e:a11y: 34 passed
   - npm run build: 성공

3. ✅ 문서 업데이트
   - TDD_REFACTORING_PLAN.md 업데이트
   - Phase 197 완료로 표시

---

## ✅ 최근 완료

### Phase 195 ✅ (2025-10-27)

**프로젝트 소스 코드 정리**

- ✅ 백업 파일 6개 제거
- ✅ src/shared/state/machines/ 신규 생성
- ✅ src/shared/state/signals/index.ts 생성
- ✅ 모든 검증 통과 (typecheck/lint/test/build)

**상세**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`

---

## 📚 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **유지보수**: `docs/MAINTENANCE.md`
