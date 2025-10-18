# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-19 | **상태**: 유지보수 모드 (모든 활성 Phase 완료)
> ✅

## 프로젝트 현황

### 빌드 및 품질 지표

- **빌드**: 328.88 KB / 335 KB (98.1%, 여유 6.12 KB) ✅
- **경고 기준**: 332 KB (Phase 106에서 상향 조정) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings, Markdown 0 errors ✅
- **CSS 린트**: stylelint 0 warnings ✅
- **CodeQL**: 5/5 쿼리 통과 ✅
- **의존성**: 0 violations (264 modules, 737 dependencies) ✅

### 테스트 현황

- **단위 테스트**: 1081 passing / 10 skipped (99.1% 통과율) ✅
- **E2E 테스트**: 28 passed / 1 skipped (96.6% 통과율) ✅
- **커버리지**: v8로 통일 완료, 45% 기준선 설정 ✅

### 코드 품질

- **로깅 일관성**: console 직접 사용 0건 (logger.ts 경유) ✅
- **디자인 토큰**: px 하드코딩 0개, rgba 0개, oklch 전용 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **타입 단언**: **27개** (설계상 필수 15개 포함) ⚠️

### 완료된 Phase (최근 10개)

| Phase   | 주제                             | 완료일     | 결과                         |
| ------- | -------------------------------- | ---------- | ---------------------------- |
| 116     | Settings 드롭다운 라벨 문자 정리 | 2025-10-19 | 장식 제거 · 라벨 텍스트 검증 |
| 100     | 타입 단언 전수 조사              | 2025-10-17 | 31개 분석, 우선순위 결정     |
| 101     | 즉시 제거 7개                    | 2025-10-17 | 타입 단언 7개 제거 (31→24)   |
| 102     | 검토 후 제거 가능 타입 단언 10개 | 2025-10-18 | 실제 2개 제거 (24→27)        |
| 104     | 큰 파일 재평가                   | 2025-10-18 | 순환 참조 위험으로 현상 유지 |
| 104.5   | 빌드 크기 최적화 시도            | 2025-10-18 | 효과 없음, 종료됨            |
| 106     | 빌드 크기 경고 기준 조정         | 2025-10-18 | 경고 기준 330KB → 332KB 상향 |
| 107-108 | TypeScript 현대화 및 코드 간소화 | 2025-10-18 | 재평가 후 종료               |
| 109     | 설정 UI 디자인 개선              | 2025-10-18 | 흑백 통일, 접근성 개선       |
| 110     | UI 일관성 개선 (접근성 강화)     | 2025-10-18 | 포커스 링 색상, Toast 아이콘 |
| 111.1   | Toast 색상 토큰 흑백 통일        | 2025-10-18 | 11/11 tests, 빌드 -1.59 KB   |
| 112     | Settings 드롭다운 흑백 통일 검증 | 2025-10-19 | 9/9 tests, 검증 완료         |

> 상세 내용:
> [`TDD_REFACTORING_PLAN_COMPLETED.md`](./archive/TDD_REFACTORING_PLAN_COMPLETED.md)

##

## 활성 Phase

### 진행 중 Phase

현재 진행 중인 Phase는 없습니다. 유지 관리 모드 유지 중이며 Phase 111.2는 계속
보류 상태입니다.

### 최근 완료된 작업

**Phase 116: Settings 드롭다운 라벨 문자 정리** ✅ (2025-10-19)

- 사용자 피드백을 반영해 SettingsControls 라벨에서 `/` 및 `▾` 장식 문자를
  제거하고 순수 텍스트만 노출하도록 JSX 구조를 단순화
- 관련 CSS 모듈에서 인디케이터 전용 클래스 삭제로 불필요한 스타일 정리 및
  compact 모드 영향 점검
- 신규 테스트
  `test/unit/shared/components/ui/phase-116-settings-dropdown-text-only.test.tsx`로
  장식 span 유무와 라벨 텍스트 일치 여부를 검증 (GREEN)

**Phase 113: Settings compact 라벨 & Focus Ring 단일톤** ✅ (2025-10-19)

- compact 모드에서도 라벨을 시각적으로 노출하도록 `SettingsControls` 구조 개선
- `design-tokens.css` / semantic/component 토큰에서 focus alias를 gray 기반으로
  재정의
- 테스트: `settings-controls.compact-labels.test.tsx`(2) ·
  `phase-113-focus-ring-alias.test.ts`(4) → 6 GREEN
- 실제 툴바 설정 패널에서 포커스 테두리 회색, 라벨 가시성 확인

**Phase 112: Settings 드롭다운 흑백 통일 검증** ✅ (2025-10-19)

- 사용자 보고에 따른 검증 작업
- 9개 테스트 추가: 모두 GREEN (Phase 109에서 이미 완료된 상태 확인)
- 결과: hover/focus 상태가 이미 gray 기반, 라벨 가시성 정상
- 상세: `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

**Phase 111.1: Toast 색상 토큰 흑백 통일** ✅ (2025-10-18)

- 8개 Toast 색상 토큰 + 2개 shadow → gray 기반 통일
- TDD: 11/11 tests PASSED (155ms)
- 빌드: 328.83 KB (-1.59 KB)
- 상세: `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

### 보류된 Phase

**Phase 111.2: 다른 색상 토큰 검토** (보류)

**검토 대상**: `--color-primary`, `--color-success/error/warning/info`,
`--xeg-color-primary`

1. 실제 사용처 확인 필요 (grep 검색으로 범위 파악)
2. 접근성 영향 평가 필요 (WCAG 2.1 준수 확인)
3. 사용자 경험 평가 필요 (색상이 필수적인 컨텍스트인지 판단)
4. 브랜드 정체성 고려 필요 (Twitter blue가 플랫폼 연관성에 중요한지)

**재개 조건**: 사용자 피드백 수집, 사용 패턴 분석, 대체 UX 전략 수립 완료

##

## 유지 관리 모드 ✅

### 현황 요약

**프로젝트는 모든 품질 지표에서 우수한 상태입니다:**

- ✅ 타입 안전성: TypeScript strict, 0 errors
- ✅ 테스트 커버리지: 99.1% 통과율 (단위), 96.6% 통과율 (E2E)
- ✅ 의존성 정책: 0 violations
- ✅ 빌드 크기: 경고 기준 이하 (332 KB 기준, 328.88 KB)
- ✅ 코드 품질: ESLint, stylelint, CodeQL 모두 통과

### 주요 활동

- 📊 정기 유지보수 점검 (`npm run maintenance:check`)
- 🔒 의존성 보안 업데이트 (`npm audit`)
- 🐛 버그 리포트 대응
- 👥 사용자 피드백 모니터링

### 경계 조건

| 지표           | 임계값     | 현재 상태               | 조치            |
| -------------- | ---------- | ----------------------- | --------------- |
| 번들 크기      | 335 KB     | 328.88 KB (98.1%)       | 여유 6.12 KB ✅ |
| 경고 기준      | 332 KB     | 328.88 KB               | 정상 범위 ✅    |
| 테스트 Skipped | 20개       | 10개 (단위) + 1개 (E2E) | 정상 범위 ✅    |
| 테스트 통과율  | 95%        | 99.1% / 96.6%           | 우수 ✅         |
| 문서 크기      | 500줄/파일 | PLAN 100줄              | 간소화 완료 ✅  |
| 타입 단언      | 20개       | 27개 (15개 필수)        | 정상 범위 ⚠️    |

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, Skipped 수
- **월간**: 의존성 보안, 문서 최신성, maintenance 점검
- **분기**: 아키텍처 리뷰, 성능 벤치마크, 사용자 피드백 분석

##

## 핵심 교훈 (Phase 104-108)

1. **큰 파일의 가치** (Phase 104)
   - 단일 책임을 가진 큰 파일은 오히려 응집도가 높음
   - 파일 크기보다 아키텍처 경계가 우선

1. **현실적 목표 설정** (Phase 106)
   - 0.42 KB를 위해 기능을 제거하는 것은 비합리적
   - 품질 우선: 빌드 크기보다 타입 안전성, 테스트 커버리지

1. **YAGNI 원칙** (Phase 107-108)
   - 실제 문제가 없으면 리팩토링하지 않는다
   - 작업 가치 평가: 작업량 대비 실질적 효과를 먼저 평가

1. **과도한 최적화 경계**
   - 무리한 최적화는 코드 품질을 해칠 수 있음
   - 타입 단언 27개 중 15개는 시스템 설계상 필수

1. **유지보수성 우선**
   - 읽기 쉽고 이해하기 쉬운 코드가 최고의 코드
   - 복잡도 증가는 버그 증가로 이어짐

##

## 재활성화 조건

다음 상황에서만 새로운 Phase를 시작합니다:

1. **실제 문제 발생**
   - 사용자 버그 리포트

1. **품질 지표 저하**
   - 빌드 크기 > 333 KB (경고 기준 1 KB 초과)
   - 의존성 위반 발생

1. **새로운 기능 추가**
   - 필수 기능 개선
   - 플랫폼 업데이트 대응

##

## 참고 문서

- **[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)**:
  완료된 Phase 상세 기록
- **[AGENTS.md](../AGENTS.md)**: 개발 워크플로우, 스크립트 사용법
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: Testing Trophy, E2E 하네스
  패턴
- **[MAINTENANCE.md](./MAINTENANCE.md)**: 유지보수 체크리스트

##

> **유지보수 정책**: 이 문서는 활성 Phase만 포함. 완료 시 즉시
> `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관. **현재 상태**: 모든 활성 Phase
> 완료, 유지보수 모드 진입 ✅
