# TDD 리팩토링 활성 계획 (경량)

본 문서는 "아직 완료되지 않은" 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`에 1줄 요약으로 이동합니다.

## 공통 가드 (불변)

- TypeScript strict 100%, 모든 공개 함수/서비스 명시적 반환 타입
- 외부 의존성: 전용 getter (preact / signals / fflate / GM\_\*) — 직접 import
  금지
- PC 전용 이벤트만 사용 (click | keydown | wheel | contextmenu)
- 디자인/모션/spacing/z-index는 토큰만 사용 (raw number/hex/ms 금지)
- Result status 모델 `success | partial | error | cancelled` 유지 (회귀 금지)

## 접근 전략 (요약: 옵션 평가 → 선택)

- A. 점진 모듈화/DI 강화(현 구조 유지, 서비스 경계 슬림화)
  - 장점: 위험/변경 범위 최소, 기존 테스트 재사용, 빠른 가치 창출
  - 단점: 일부 레거시 흔적 유지, 완전한 재설계 아님
- B. 전면 재작성(엔트리/서비스/컴포넌트 대수술)
  - 장점: 일관성 최고, 기술부채 일괄 청산
  - 단점: 리스크/기간 큼, 회귀 위험/커버리지 갭
- C. 표면 정리(린트/형식/네이밍만)
  - 장점: 매우 안전/빠름
  - 단점: 실질 구조/성능 개선 미미

선택: A (점진 모듈화) — Progressive Loader·벤더 getter·서비스 팩토리 패턴을
기반으로, 소스 간결성/일관성/현대성 확보를 TDD로 단계 적용.

## 외부 라이브러리 평가 결과 (요약)

- 결론(완료): mediabunny 도입 보류 — 옵션 플러그인(기본 Off, Progressive Loader
  경유 lazy)로 향후 재평가. 세부 근거는 완료 로그에 기록됨.

## 활성 목표 (요약)

- U5. 사이즈/성능: 기능 분할 로드 강화, import 부작용 가드 유지, 번들 예산
  유지·개선
- M0. 미디어 처리 경량화(현행 유지) — mediabunny 도입 보류 결론 반영:
  변환/인코딩 미사용 확인, 서비스 표면/유형 정돈, 고급 변환 기능은
  옵션(비활성)로 분리 설계

## Phase 개요 (활성)

<!-- U2는 2025-09-12에 완료되어 완료 로그로 이동되었습니다. -->

<!-- U4는 2025-09-12에 완료되어 완료 로그로 이동되었습니다. -->

### U5 — 사이즈/성능 분할 로드 강화

- 목표: Progressive Loader로 기능 단위 lazy 보장, import 부작용 0, 번들 예산
  유지/개선.
- 계약/가드(DoD):
  - 번들 예산 임계 PASS (scripts/validate-build.js; 경고/실패 임계 준수)
  - feature register 최초 1회, 실패 시 Promise 캐시 해제(재시도 가능)
  - import 시 document/window 이벤트 등록 없음 스캔 GREEN
- RED 테스트(추가):
  - `test/unit/loader/feature-side-effect.red.test.ts`
  - `test/unit/loader/import-side-effect.scan.red.test.ts`
- 구현 개요:
  - main 초기화 경량화와 연계, 갤러리/설정 피처는 registerFeature로만 노출(lazy)
  - 엔트리 cleanup() 경로에서 명시적 정리 API 호출(벤더/이벤트/DOM 리소스)

### M0 — 미디어 처리 경량화(현행 유지, mediabunny 보류 결론 반영)

- 목표: 현재 범위(추출/다운로드/ZIP/간단 메타데이터)에 집중하여 표면을 정리하고,
  고급 변환 기능은 “옵션 플러그인” 설계로 분리(기본 비활성)합니다.
- 계약/가드:
  - 사이즈/의존성 가드: mediabunny 정적 import 금지 스캔(red) → 추후 옵션
    플러그인 도입 시 Progressive Loader 경유 강제
  - 서비스 계약 유지: MediaService 공개 API/Result 타입 변동 없음
- RED 테스트(추가 제안):
  - `test/unit/deps/mediabunny.not-imported.scan.red.test.ts`
  - `test/unit/services/media-service.contract.test.ts` (API 표면 회귀 가드
    강화)
- 구현 개요:
  - MediaService 내 변환/인코딩 관련 표면 노출 금지(추후 플러그인 경유)
  - 옵션 플러그인 구조 초안만 정의(폴더/팩토리/토글), 실제 의존성 추가는
    백로그로 이동. 설정 기본값 Off, lazy 로드, 실패 시 회복 가능하게 설계

---

현재 옵션 Phase 명시 항목 없음 (완료 또는 백로그로 이동).

## 브랜치 & TDD 규칙

1. feature branch: `phase/<n>-<slug>`
2. 커밋 순서: RED (실패 테스트) → GREEN (최소 구현) → REFACTOR (정리/최적화)
3. 병합 전 품질 게이트: 타입/린트/전체 테스트/사이즈 가드 PASS

## Definition of Done

DONE 판정 시 아래를 충족해야 합니다:

- RED → GREEN → REFACTOR 커밋 히스토리
- 전체 테스트 / 타입 / 린트 / 빌드 / 사이즈 예산 PASS
- 문서: 가이드라인/계획 동기화, 완료 로그 기록
- 계획 문서에서 해당 Phase 제거

## 추적 & 백로그

- 추가 성능/메모리/보안 심화 항목은 `TDD_REFACTORING_BACKLOG.md` 유지
- 선택 Phase는 핵심 완료 후 우선순위 재평가

## 참고

- 완료 로그: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 백로그: `docs/TDD_REFACTORING_BACKLOG.md`

업데이트 일시: 2025-09-12 (mediabunny 도입 보류 결론 반영 · U5 계획 정리)
