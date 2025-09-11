# 🎨 TDD 리팩토링 계획 — Userscript 디자인 현대화 2차 사이클

> 목적: 1차 현대화(토큰/애니메이션/접근성/다운로드/추출 등) 완료 이후, "설계
> 일관성 · 관찰 가능성 · 국제화 · 번들 슬림화"를 중심으로 한 2차 개선을 TDD로
> 단계적 수행.

## 공통 가드 (불변)

- TypeScript strict 100%, 모든 공개 함수/서비스 명시적 반환 타입
- 외부 의존성: 전용 getter (preact / signals / fflate / GM\_\*) — 직접 import
  금지
- PC 전용 이벤트만 사용 (click | keydown | wheel | contextmenu)
- 디자인/모션/spacing/z-index는 토큰만 사용 (raw number/hex/ms 금지)
- Result status 모델 `success | partial | error | cancelled` 유지 (회귀 금지)

## 신규 핵심 설계 초점 & 대안 요약

| 주제                       | 선택 (✅)                             | 대안(미채택)                            | 근거                                                     |
| -------------------------- | ------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Result/Error v2            | 코드/원인 체인 + enum 에러코드 (✅)   | 단순 message 문자열                     | 재시도/UX 분기 단순화, 테스트로 코드 존재 여부 가드 가능 |
| MediaProcessor Metrics     | 단계 지연 측정 + 옵셔널 로깅 (✅)     | 브라우저 Performance API 직접 수동 로그 | 오케스트레이터 한정 래핑으로 오버헤드 최소화             |
| Progressive Feature Load   | Idle/Lazy 로더 + 분리 번들 (✅)       | 단일 번들 모든 기능 포함                | 초기 TTI 감소, 사이즈 예산 안정화                        |
| LanguageService 확장       | 다국어 리소스 + Missing-Key Test (✅) | 기존 다운로드 메시지 키만 유지          | 확장성/지역화 준비, 테스트로 누락 예방                   |
| A11y 강화                  | 포커스 복원 + ARIA live 규격화 (✅)   | 기존 trap 유지                          | 재사용/누락 방지, 회귀 가드                              |
| Service Contract Interface | I/F + factory 주입 (✅)               | 암묵적 구현(구조 타이핑)                | 교체 테스트/모킹 단순화                                  |
| CSS Layer/Theming 단려화   | Surface Layer 토큰 계층 표 (✅)       | 현 상태 유지                            | 탐색/리뷰 비용 감소, 회귀 테스트 용이                    |

## Phase 개요

1. Result/Error Model Unification v2
2. MediaProcessor Telemetry & Stage Metrics
3. Progressive Feature Loader & Bundle Slimming
4. LanguageService Expansion & Missing-Key Guard
5. Accessibility Focus & Announcement Hardening
6. Service Contract Interface Extraction (DI 강화)
7. CSS Layer Architecture & Theming Simplification 옵션: (8) Security & URL
   Sanitization Policy, (9) Memory/Listener Leak Harness

---

<!-- Phase 1 (Result/Error Model Unification v2) : 완료되어 활성 계획에서 제거 -->

### Phase 2 — MediaProcessor Telemetry & Stage Metrics

목표: collect→complete 각 단계 latency(ms)/total count 측정 + 옵셔널
로그(`performance.performanceLogging` 설정 true 시). RED 테스트:

- `media-processor.telemetry.red.test.ts` (stage 순서/latency shape 검증) 구현
  스텝: 진행률 옵저버 wrapper → 타임스탬프 diff → telemetry 배열 반환. DoD: 설정
  off 시 오버헤드 ≤ 1 microtask / no global state.

### Phase 3 — Progressive Feature Loader & Bundle Slimming

목표: 비즉시 기능(다운로드 ZIP, 고급 애니메이션, 프리로드, I18N 추가 로케일)을
idle 시점 지연 로딩. 대안: 단일 번들 유지(미채택 — 초기 비용 증가) RED 테스트:

- `bootstrap.progressive-loader.red.test.ts` (초기 start 후 특정 심볼 undefined
  → lazy 호출 시 동적 로딩 확인)
- `bundle-size.threshold.red.test.ts` (사이즈 예산 상향 방지) 구현 스텝: feature
  registry + idle scheduler (requestIdleCallback|setTimeout 폴백) + dynamic
  import 캡슐화(getter). DoD: 초기 번들 gzip < 기존 기준 - N KB (목표 -8% 이상)
  / 기능 호출 시 단 1회 로드.

### Phase 4 — LanguageService Expansion & Missing-Key Guard

목표: 다국어(en, ko) 리소스 구조/키 스캐너 테스트. Fallback: en. RED 테스트:

- `i18n.missing-keys.red.test.ts` (두 로케일 키 mismatch 검출)
- `i18n.language-switch.red.test.ts` DoD: 모든 사용자 facing 문자열 키 변환,
  테스트에서 literal 한글/영문 UI 문구 0건.

### Phase 5 — Accessibility Focus & Announcement Hardening

목표: 갤러리 열림/닫힘 포커스 복원, Toast/Download 중요 이벤트 ARIA live
polite/assertive 분기, 포커스 트랩 회귀 가드. RED 테스트:

- `a11y.focus-restore.red.test.ts`
- `a11y.toast-live-region.red.test.ts` DoD: focus 복원 테스트 pass, 중복
  live-region 생성 없음.

### Phase 6 — Service Contract Interface Extraction

목표: 주요 서비스(MediaService, BulkDownloadService, SettingsService…) I/F
선언 + factory + 주입 경계. 구조 타이핑 축소. RED 테스트:

- `services.contract-interface.red.test.ts` (직접 new 사용 금지 규칙 위반 검출)
  DoD: 서비스 생성은 전부 factory/getService 경유, 테스트 모킹 간소화 예시 추가.

### Phase 7 — CSS Layer Architecture & Theming Simplification

목표: surface/elevation/token 계층 표
정의(`semantic → component alias 최소화 → utility`). 레거시/중복 alias 제거 목록
테스트. RED 테스트:

- `styles.layer-architecture.red.test.ts` (금지 alias 검출) DoD: alias 축소
  목록(N개) → 0; 문서 표 반영.

### (옵션) Phase 8 — Security & URL Sanitization Policy

목표: 추출 URL 화이트리스트 + data:/blob: 허용 정책 테스트.

### (옵션) Phase 9 — Memory/Listener Leak Harness

목표: WeakRef/FinalizationRegistry 기반 이벤트 핸들러 해제 스모크.

## 작업 순서 & 브랜치 전략

1 Phase = 1 feature branch (`phase/<n>-<slug>`), RED 커밋 → GREEN 커밋 →
REFACTOR 커밋 최소 1회. 메인 병합 전 전체 스위트/사이즈/린트/타입 PASS 필수.

## Definition of Done (공통)

- RED → GREEN → REFACTOR 증적 커밋
- 전체 테스트 / 타입 / 린트 / 빌드 / 사이즈 예산 PASS
- 계획/가이드라인 동기화 (추가/변경된 정책 표기)
- 완료 후 본 문서에서 해당 Phase 섹션 제거 & 완료 로그에 1줄 기록

## 추적 & 백로그

- 추가 성능/메모리/보안 심화 항목은 `TDD_REFACTORING_BACKLOG.md` 유지
- 선택 Phase(8,9)는 핵심 1–7 완료 후 우선순위 재평가

## 참고

- 완료 로그: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 백로그: `docs/TDD_REFACTORING_BACKLOG.md`

업데이트 일시: 2025-09-11 (2차 현대화 사이클 초기화)
