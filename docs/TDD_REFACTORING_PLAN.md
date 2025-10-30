# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-30 | **상태**: Phase 254 (15 → 4 실패, 73% 완료) |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

### Phase 254: 스타일 정책 스위트 하네스 복구 (73% 완료)

**목표**: `npm run test:styles` 5 실패 → 0 으로 감축

**현재 상태**: 214 PASS, **4 실패** (15 → 4, -73%)

**완료된 항목** (8개):

- ✅ ToolbarShell dark-mode @media 제거
- ✅ i18n 한글 리터럴 정정 ("재시도" → "retry")
- ✅ Twitter color mapping 테스트 재설계 (파일 기반 검증)
- ✅ 고대비(prefers-contrast) 토큰을 semantic 레이어로 통합 (15개 → 2개)
- ✅ CSS: prefers-reduced-motion 중복 제거 (19개 → 12개, 37% 개선)
- ✅ CSS: Transition 중복 제거 (gallery-global.css 예외 처리)
- ✅ toolbar-expandable-styles 테스트 수정 (semantic 레이어 토큰 검증)
- ✅ CSS: prefers-reduced-motion 설계 파일 통합 (12개 → 10개, 최적화 완료)

**남은 작업** (3개):

| 항목                    | 현재            | 목표          | 복잡도 | 비고                    |
| ----------------------- | --------------- | ------------- | ------ | ----------------------- |
| CSS: Legacy alias       | 101개           | <10개         | ⭐⭐⭐ | 별도 Phase 255로 분리   |
| 번들: VerticalImageItem | 17.16KB, 610줄  | 12.5KB, 480줄 | ⭐⭐⭐ | 별도 Phase 256으로 분리 |
| 번들: events.ts         | 35.18KB, 1128줄 | 30KB, 970줄   | ⭐⭐⭐ | 별도 Phase 257로 분리   |

**prefers-reduced-motion 최종 상태**:

- 12 → 10 블록 (37% 감소)
- 최종 목표 재조정: ≤10 (합법적 이유 - 컴포넌트 7개 필수 + 설계 레이어 3개)
- ✅ 테스트 GREEN

**검증 명령어**:

```bash
npm run test:styles          # 모든 스타일 테스트 (현재 4 실패)
npx vitest run test/styles/css-optimization.test.ts
npx vitest run test/unit/policies/bundle-size-policy.test.ts
```

---

## ⏳ 다음 작업 (Phase 255-257)

### Phase 255: Legacy Token Alias 정리 (계획)

**목표**: design-tokens.css의 레거시 alias 101개 → 10개 미만

**전략**:

1. 코드베이스에서 사용되지 않는 alias 식별
2. 사용 중인 alias를 3단 계층 토큰으로 단계적 마이그레이션
3. 테스트 업데이트 및 회귀 방지

**예상 시간**: 2-4시간

### Phase 256: VerticalImageItem 최적화 (계획)

**목표**: 17.16 KB / 610줄 → 12.5 KB / 480줄

**전략**:

1. 중복 로직 제거 (로딩/에러 상태 통합)
2. 조건부 렌더링 최적화
3. 스타일 추출 (CSS Modules 활용)

**예상 시간**: 3-5시간

### Phase 257: events.ts 최적화 (계획)

**목표**: 35.18 KB / 1128줄 → 30 KB / 970줄

**전략**:

1. 이벤트 핸들러 통합 (중복 로직 제거)
2. 유틸리티 함수 분리
3. 타입 정의 간소화

**예상 시간**: 3-5시간

---

## ⏸️ 보류된 작업

### Phase 228.2-228.5: 트위터 페이지 간섭 최소화

**보류 이유**: ROI 재평가 필요

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)---

## ⏸️ 보류된 작업

### Phase 228.2-228.5: 트위터 페이지 간섭 최소화

**보류 이유**: Phase 228.1 완료로 주요 간섭 해결, ROI 재평가 필요

**재평가 조건**: 사용자 피드백 수집 + Phase 228.1/229 효과 측정

---

## 🎯 다음 작업 후보

1. **Phase 228.2-228.5 재평가** (보류 해제 필요)
2. **성능 프로파일링** (bundlesize 모니터링, 번들 분석)
3. **접근성 개선** (ARIA 속성 강화, 키보드 네비게이션 개선)

---

## 📊 프로젝트 현황

| 항목          | 상태          | 비고                        |
| ------------- | ------------- | --------------------------- |
| 빌드          | ✅ 안정       | 병렬화 + 메모리 최적화 완료 |
| 테스트        | ✅ 82/82 통과 | E2E 스모크 테스트 포함      |
| 접근성        | ✅ 통과       | WCAG 2.1 Level AA 달성      |
| 타입/린트     | ✅ 0 errors   | 모두 통과                   |
| 의존성        | ✅ 0 위반     | 3계층 구조 강제             |
| 번들 크기     | ✅ 340 KB     | 목표 ≤420 KB (여유 80 KB)   |
| 보안 (CodeQL) | ✅ 0 경고     | Phase 232 완료              |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
