# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-16 | **상태**: Phase 80.1 완료, Phase 82 활성화 ✅

## 프로젝트 현황

- **빌드**: prod **328.46 KB / 335 KB** (6.54 KB 여유, 98.0%) ✅
- **테스트**: **159개 파일**, 987 passing / 0 failed (100% 통과율) ✅✅✅
- **Skipped**: **23개** (E2E 마이그레이션 대상) → Phase 82에서 처리
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **CSS 린트**: stylelint **0 warnings** (error 강화 완료) ✅✅✅
- **의존성**: 0 violations (261 modules, 727 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅
- **디자인 토큰**: px 0개 (Primitive/Semantic), rgba 0개 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅

## 현재 상태: Phase 82.3 스켈레톤 완료, 상세 구현 준비 🚀

**완료 Phase**: Phase 82.3 스켈레톤 (키보드/성능 E2E 테스트 스켈레톤) -
2025-10-16 완료 ✅ **활성 Phase**: Phase 82.3 상세 구현 **목표**: 10개 E2E
테스트 상세 구현 (keyboard-navigation × 4, keyboard-interaction × 3, performance
× 3)

---

## 주요 개선 영역 검토 완료 ✅

### 1. CSS 최적화 완료 상태

- ✅ **stylelint warnings**: 0개 (Phase 78.8-78.9 완료)
- ✅ **디자인 토큰**: px 하드코딩 0개, rgba 0개
- ✅ **CSS Specificity**: 모든 이슈 해결 완료
- **Phase 78.7 (대규모 CSS 개선)**: 목표 달성으로 건너뛰기
- **Phase 79 (CSS 마이그레이션)**: 목표 달성으로 건너뛰기

### 2. 테스트 최적화 완료 상태

- ✅ **Phase 74**: Skipped 테스트 재활성화 (10→8개)
- ✅ **Phase 74.5**: Deduplication 테스트 구조 개선
- ✅ **Phase 74.6-74.9**: 테스트 최신화 및 정책 위반 수정
- ✅ **Phase 75**: test:coverage 실패 수정, E2E 이관
- ✅ **Phase 76**: 브라우저 네이티브 스크롤 전환

### 3. 버그 수정

- ✅ **Phase 80.1**: Toolbar Settings Toggle Regression (Solid.js 반응성 이슈)

---

## 다음 Phase 계획

### Phase 82: E2E 테스트 마이그레이션 (활성화)

**상태**: 진행 중 **목표**: 스킵된 JSDOM 테스트 23개를 E2E(Playwright)로 단계적
전환 **우선순위**: 높 (신뢰도 향상, 실제 브라우저 검증)

#### 마이그레이션 전략

**Phase 82.3: 키보드 이벤트 & 성능** (다음 활성화)

- **상태**: 준비 대기 (2025-10-16 계획)
- **대상**:
  - 키보드 이벤트 테스트 (ArrowLeft, ArrowRight, Home, End, Space, M 키)
  - 성능 최적화 테스트 (렌더링, 스크롤, 메모리)
  - **합계**: 약 8-10개 테스트
- **난이도**: ⭐⭐⭐ (높음)
- **구현 계획**: `playwright/smoke/keyboard-events.spec.ts`,
  `performance.spec.ts`
- **완료 기준**: 모든 키보드 입력 검증, 성능 메트릭 확인
- **예상 시간**: 5-6시간

#### 검증 기준

- E2E 테스트: Phase 82.2 후 21개 → Phase 82.3 후 30개 (9개 추가)
- 스킵 테스트: Phase 82.2 후 16개 → Phase 82.3 후 ~7개 (9개 이관)
- 테스트 통과율: 100% 유지
- 빌드: 구조 변화 없음, 328 KB 유지

### Phase 81: 번들 최적화 (트리거 대기)

**상태**: 대기 (현재 328.46 KB, 98.0% 사용) **트리거**: 빌드 330 KB (98.5%) 도달
시 **목표**: 7-10 KB 절감으로 14-17 KB 여유 확보 **예상 시간**: 5-8시간
**우선순위**: 중 (여유 6.54 KB 남음)

#### 최적화 전략 (현재 분석 기준)

1. **Tree-Shaking 강화**
   - `events.ts` (15.41 KB): 미사용 exports 제거
   - `MediaClickDetector`, `gallerySignals` 의존성 최소화
   - 예상 절감: 1.5-2 KB

2. **Lazy Loading 도입**
   - `twitter-video-extractor.ts` (12.73 KB): 동영상 tweet에서만 필요
   - 조건부 `import()` 적용
   - 예상 절감: 12 KB (초기 번들에서 제외)

3. **Code Splitting**
   - `media-service.ts` (17.53 KB): extraction/mapping/control 로직 분리
   - 예상 절감: 3-5 KB

4. **검증 기준**
   - 빌드 크기: 320 KB 이하 (95.5%)
   - 테스트: 100% 통과율 유지
   - 타입: 0 errors
   - 성능: 초기 로드 시간 측정 (성능 개선 확인)

---

## 향후 개선 영역 후보

### 1. 접근성 (A11y) 강화

**현황**: axe-core 기본 검증, ARIA 레이블 적용 **제안**: WCAG 2.1 AA 수준 완전
준수 검증 **우선순위**: 낮 (기본 요구사항 충족)

### 2. 성능 모니터링

**현황**: 빌드 크기, 테스트 실행 시간만 추적 **제안**: 런타임 성능 메트릭 수집
(렌더링, 스크롤, 다운로드) **우선순위**: 중 (사용자 경험 개선 기회)

---

## 완료된 Phase 기록

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

- **Phase 78.5** (2025-10-15): Component CSS 점진적 개선, warning 28개 감소 ✅
- **Phase 78** (2025-10-15): 디자인 토큰 통일 (Primitive/Semantic) ✅
- **Phase 75** (2025-10-15): test:coverage 실패 4개 수정, E2E 이관 권장 5개 추가
  ✅
- **Phase 74.9** (2025-10-15): 테스트 최신화 및 수정 ✅
- **Phase 74.8** (2025-10-15): 린트 정책 위반 12개 수정 ✅
- **Phase 74.7** (2025-10-15): 실패/스킵 테스트 8개 최신화 ✅
- **Phase 74.6** (2025-10-14): 테스트 구조 개선 ✅
- **Phase 74.5** (2025-10-13): 중복 제거 및 통합 ✅

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 330 KB (98.5%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 20개 이상 시 즉시 검토 (현재 10개)
- **테스트 통과율**: 95% 미만 시 Phase 74 재활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 상세 기록
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트
