# TDD 리팩토링 활성 계획 (경량)

본 문서는 “유저스크립트에 적합한 복잡성”을 유지하기 위한 현재 활성 계획만
담습니다. 완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

업데이트: 2025-09-14 — 활성 Phase: P1–P5

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API는 명시적 타입
- 외부 의존성은 안전 getter 경유만 사용(preact/@preact/signals/fflate/GM\_\*)
- PC 전용 입력만 사용, 터치/포인터 금지(테스트 가드 유지)
- 디자인/모션/spacing/z-index는 전부 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델 통일: 'success' | 'partial' | 'error' | 'cancelled'

## 진단 요약 (중복·레거시·위험 신호)

- 컨테이너 이중화: `ServiceManager(CoreService)`와 `AppContainer`가 병존하며,
  전역 브리지(`__XEG_LEGACY_ADAPTER__`)까지 노출됨 → 복잡성/전역 표면 증가.
- 이벤트 유틸: `shared/utils/events.ts` 내부에 CoreService 직접 의존 및 레거시
  별칭(`GalleryEventManager`/`TwitterEventManager`)이 잔존(내부용 @deprecated로
  유지 중).
- 서비스 키 직참조: 일부 경로에서 `SERVICE_KEYS` 직접 사용이 남아 타이핑/경계
  테스트 취약.
- 레거시 어댑터 전역 키: 전역 표면 정책상 프로덕션 번들에서 제거/게이트 필요.

## 옵션 비교와 결정

- A) ServiceManager로 통일, AppContainer 단계적 제거
  - 장점: 런타임 경로 단순, 마이그레이션 비용 낮음
  - 단점: 테스트 유연성/명시적 DI 이점 감소, 브리지 코드 잔존 가능
- B) AppContainer로 통일, ServiceManager를 얇은 브리지로 축소
  - 장점: 명시적 DI/테스트 용이, 사이드이펙트 최소화 구조에 적합
  - 단점: 마이그레이션 범위 큼, 기존 서비스 등록/게터 이행 필요
- C) 하이브리드(단기): 런타임은 ServiceManager 유지, AppContainer는 테스트
  하네스로 범위 축소 + 전역/별칭은 DEV 게이트
  - 장점: 위험 최소·점진 이행, Userscript 복잡성 억제
  - 단점: 이중 체계가 일시 유지됨(단, 전역/별칭은 DEV 한정)

→ 결정: C(단기) 채택, 이후 B로 수렴 여부를 백로그에서 재평가.

## 활성 Phase (TDD)

- P1. Legacy Adapter DEV 게이트 & Prod 누수 차단
  - 목표: `__XEG_LEGACY_ADAPTER__`/`__XEG_GET_SERVICE_OVERRIDE__` 전역 키 DEV
    전용화, prod 번들 미포함 보장
  - RED: `global-surface.no-leak.red.test.ts`에 prod 산출물 문자열 스캔 추가
  - GREEN: DEV 빌드에서만 존재, prod에서 미검출; 기존 레거시 계약 테스트 호환
  - REFACTOR: 문서/주석 정리(테스트 하네스 용도 명시)

- P2. 이벤트 유틸의 CoreService 직접 의존 제거(서비스 어댑터화)
  - 목표: `shared/utils/events.ts`가 서비스 접근 시
    `@shared/container/service-accessors` 경유
  - RED: `event-deprecated-removal.test.ts` 확장(직접 CoreService 참조 금지),
    `lint/service-access-scan.red.test.ts`
  - GREEN: 직접 참조 0건, 기능/테스트 회귀 없음
  - REFACTOR: @deprecated 별칭 유지하되 외부 배럴 재노출 없음 확인

- P3. 컨테이너 범위 재정의(AppContainer=test 전용 하네스)
  - 목표: AppContainer를 런타임 경로에서 제거하고 테스트/샌드박스 하네스로 명시
  - RED: `deps/runtime-path.scan.red.test.ts`로 런타임 엔트리/피처에서
    AppContainer import 금지
  - GREEN: 런타임 사용 0건, 테스트/리팩터링 스위트에서만 사용
  - REFACTOR: 파일 헤더/경로 주석 갱신, 배럴에서 런타임 재노출 제거

- P4. SERVICE_KEYS 직접 사용 축소(타입 안전 액세서)
  - 목표: `SERVICE_KEYS` 직참조를 `service-accessors` 헬퍼로 대체
  - RED: `service-keys.direct-usage.scan.red.test.ts`
  - GREEN: features/shared 일반 경로에서 직참조 0건(서비스 등록/부트스트랩은
    예외)
  - REFACTOR: 관련 호출부 일괄 교체 및 타입 보강

- P5. 레거시/플레이스홀더 정리(테스트 가드 동기)
  - 목표: @deprecated 플레이스홀더를 제거 또는 types-only/노출 축소
  - RED: `unused-exports.scan.red.test.ts` 강화, `orphan-allowlist` 축소
  - GREEN: 런타임 dead 모듈 0건(테스트 전용은 예외)

## DoD / 게이트

- 타입/린트/테스트/빌드/포스트빌드(소스맵·데드 프리로드) GREEN
- prod 번들 전역 키/레거시 별칭 문자열 스캔 0건
- 기존 가드(벤더 getter/PC-only/토큰/접근성)와 충돌 없음

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 본 문서에서 제거하고 완료 로그에 1줄 요약 추가.

— 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
