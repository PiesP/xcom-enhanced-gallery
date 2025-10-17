# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-17 | **상태**: Phase 102 준비 📋

## 프로젝트 현황

### 빌드 및 품질 지표

- **빌드**: 330.42 KB / 335 KB (4.58 KB 여유, 98.6%) ⚠️
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings, Markdown 0 errors ✅
- **CSS 린트**: stylelint 0 warnings ✅
- **CodeQL**: 5/5 쿼리 통과, 병렬 실행 73.3초 ✅
- **의존성**: 0 violations (263 modules, 736 dependencies) ✅

### 테스트 현황

- **단위 테스트**: 1066 passing / 10 skipped (99.1% 통과율) ✅
- **E2E 테스트**: 28 passed / 1 skipped (96.6% 통과율) ✅
- **커버리지**: v8로 통일 완료, 45% 기준선 설정 ✅

### 코드 품질

- **로깅 일관성**: console 직접 사용 0건 (logger.ts 경유) ✅
- **디자인 토큰**: px 하드코딩 0개, rgba 0개, oklch 전용 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **타입 단언**: **24개** (Phase 101: 7개 제거, 31→24 감소) ✅

### 완료된 Phase (요약)

| Phase | 주제                      | 완료일     | 결과                                 |
| ----- | ------------------------- | ---------- | ------------------------------------ |
| 97    | Result 패턴 통합          | 2025-10-17 | 중복 코드 60줄 제거                  |
| 98    | Icon Registry 타입 안전성 | 2025-10-17 | 타입 단언 5개 제거                   |
| 99    | Signal 타입 단언 제거     | 2025-10-17 | 타입 단언 7개 제거 (38→31)           |
| 100   | 타입 단언 전수 조사       | 2025-10-17 | 31개 분석, 우선순위 결정             |
| 101   | 즉시 제거 7개             | 2025-10-17 | 타입 단언 7개 제거 (31→24), 22% 감소 |

> 상세 내용:
> [`TDD_REFACTORING_PLAN_COMPLETED.md`](./TDD_REFACTORING_PLAN_COMPLETED.md)

##

## 활성 Phase

## Phase 102: 검토 후 제거 가능한 타입 단언 10개 📋

**우선순위**: 중간 | **위험도**: 중간 | **예상 소요**: 2-3시간

### 목표

Solid.js 이벤트(3개), Settings 서비스 DI(4개), DOM 관련(3개) 타입 단언 10개를
제거합니다.

### 대상 파일

| 카테고리           | 파일                                                                 | 개수 | 패턴                                                 |
| ------------------ | -------------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| Solid.js 이벤트    | useKeyboardNavigation.ts, useVideoControls.ts                        | 3    | `(e) => handler(e as unknown as KeyboardEvent)`      |
| Settings 서비스 DI | SettingsModal.tsx, SettingsHeader.tsx 등                             | 4    | `getSettingsService()` 반환 타입 추론 불가           |
| DOM 관련           | media-extraction-support.ts, vertical-gallery-view-event-handlers.ts | 3    | `computedStyle.backgroundImage as unknown as string` |

### TDD 실행 계획

#### Phase 102.1 (RED): 테스트 작성

- [ ] Solid.js 이벤트 타입 테스트 (3개)
- [ ] Settings 서비스 DI 타입 테스트 (4개)
- [ ] DOM 관련 타입 테스트 (3개)

#### Phase 102.2 (GREEN): 타입 단언 제거

- [ ] Solid.js 이벤트 핸들러 타입 명시
- [ ] SettingsService 타입 추론 개선
- [ ] DOM API 타입 가드 추가

#### Phase 102.3 (REFACTOR): 전체 검증

- [ ] typecheck (0 errors)
- [ ] lint (0 warnings)
- [ ] test (GREEN)
- [ ] build (330.42 KB 유지)

### 성공 기준

- [ ] 타입 단언 10개 제거 (24개 → 14개, 42% 감소)
- [ ] 타입 에러 0개 (TypeScript strict 유지)
- [ ] 테스트 GREEN (Phase 102 테스트 통과)
- [ ] 빌드 크기 영향 없음

##

## Phase 103+: 보류/대안 필요 타입 단언 15개 ⏸️

**우선순위**: 낮음 | **위험도**: 높음 | **예상 소요**: 4-6시간

### 대상 영역 (Phase 100 분류 기준)

| 카테고리                | 개수 | 이유                               |
| ----------------------- | ---- | ---------------------------------- |
| EventListener 타입 변환 | 6    | 브라우저 타입 불일치 (시스템 설계) |
| 브라우저 API 타입 확장  | 6    | GM\_\* API 타입 불완전성           |
| 기타 타입 변환          | 3    | 서드파티 라이브러리 제약           |

> **상세 분석**:
> [`docs/phase-100-type-assertion-analysis.md`](./phase-100-type-assertion-analysis.md)

**재평가 조건**: 타입 시스템 한계 해결 또는 라이브러리 타입 개선 시 검토

##

## 유지 관리 모드 ✅

### 주요 활동

- 사용자 피드백 모니터링
- 버그 리포트 대응
- 의존성 보안 업데이트 (`npm audit`)
- 정기 유지보수 점검 (`npm run maintenance:check`)

### 경계 조건

| 지표           | 임계값     | 현재 상태               | 조치            |
| -------------- | ---------- | ----------------------- | --------------- |
| 번들 크기      | 335 KB     | 330.42 KB (98.6%)       | 4.58 KB 여유 ⚠️ |
| 테스트 Skipped | 20개       | 10개 (단위) + 1개 (E2E) | 정상 범위 ✅    |
| 테스트 통과율  | 95%        | 99.1% / 96.6%           | 우수 ✅         |
| 문서 크기      | 500줄/파일 | PLAN 830줄 → 신규 작성  | 간소화 완료 ✅  |

### 주기별 점검

**주간**: 번들 크기, 테스트 통과율, Skipped 수  
**월간**: 의존성 보안, 문서 최신성, maintenance 점검  
**분기**: 아키텍처 리뷰, 성능 벤치마크, 사용자 피드백 분석

##

## 참고 문서

- **[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)**:
  완료된 Phase 97-101 상세 기록
- **[AGENTS.md](../AGENTS.md)**: 개발 워크플로우, 스크립트 사용법
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: Testing Trophy, E2E 하네스
  패턴
- **[MAINTENANCE.md](./MAINTENANCE.md)**: 유지보수 체크리스트

##

> **유지보수 정책**: 이 문서는 활성 Phase만 포함. 완료 시 즉시
> `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관. 500줄 초과 시 간소화 검토.
