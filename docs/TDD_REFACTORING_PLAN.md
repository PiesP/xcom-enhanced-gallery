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

## 활성 목표 (요약)

- U2. 서비스 컨테이너 경량화: 전역 ServiceManager 의존 축소 → 타입 안전
  팩토리/싱글턴
- U3. Preact 컴포넌트 일관화: signals 선택자·메모·PC 전용 이벤트·인라인 스타일
  제거 준수
- U4. 파일/심볼 표면 축소: 배럴 export 정리, 네이밍/경로 케밥 표준화, 죽은 코드
  제거
- U5. 사이즈/성능: 기능 분할 로드 강제, 사이드이펙트 없는 import 가드, 번들 예산
  유지·개선

## Phase 개요 (활성)

### U2 — 서비스 컨테이너 경량화

- 목표: 전역 ServiceManager를 경량 팩토리+캐시로 치환, 등록 함수의 범위 축소.
- 계약/가드:
  - 직접 new 금지, `getXxxService()`만 허용 (existing 계약 테스트 보강)
  - 순환 의존 방지 및 TDZ-safe (게터 주입 유지)
- RED 테스트(추가): `test/unit/shared/services/factory.singletons.red.test.ts`
- 구현 개요:
  - `src/shared/services/factories.ts` 추가: lazy singleton + 명시 타입 반환
  - 전역 `registerServiceFactory` 외부 노출 축소 (내부에서만 사용)
- 리스크/완화: 기존 키 기반 조회 사용처 단계적 마이그레이션 → 배럴 export로 점진
  치환

진행 상황(2025-09-12):

- 추가 가드 GREEN: features 레이어에서 `ServiceManager` 직접 import 금지 테스트
  추가 및 통과
  - 테스트: `test/unit/lint/features-no-servicemanager.imports.red.test.ts`
  - 변경: `VerticalGalleryView`, `GalleryApp`, `createAppContainer`가
    브리지/액세서 사용으로 전환
- 신규 유틸 추가: `@shared/container/service-bridge`,
  `@shared/container/settings-access`
- 다음 단계: main.ts와 features 전반에서 SERVICE_KEYS 의존 축소, 팩토리 경유
  일관화

### U3 — Preact 컴포넌트 일관화

- 목표: signals selector 유틸 사용, memo/forwardRef는 compat getter 경유, 인라인
  스타일 제거 유지.
- 계약/가드:
  - 인라인 px/transition/all 금지 기존 테스트 GREEN 유지
  - PC 전용 이벤트만 사용 (터치/포인터 사용 시 RED)
- RED 테스트(추가): `test/unit/components/pc-only-events.scan.red.test.tsx`
- 구현 개요:
  - 갤러리/설정 주요 컴포넌트에서 selector 훅 일관 적용, 불필요한 re-render 제거
  - compat 필요 지점 한정 및 주석 가이드 추가

### U4 — 파일/심볼 표면 축소

- 목표: 배럴 export 정리, 케밥 네이밍 미준수 정정, 죽은 코드/사용되지 않는
  export 제거.
- 계약/가드:
  - 정적 스캐너로 사용되지 않는 export FAIL (신규 테스트)
  - 경로 별칭 배럴만 통해 접근 (벤더 제외)
- RED 테스트(추가): `test/unit/refactoring/unused-exports.scan.red.test.ts`
- 구현 개요:
  - shared/** 배럴 재구성, features/** 필요 최소 export 유지
  - codemod 스크립트로 임포트 경로 자동 치환 (semi-auto)

### U5 — 사이즈/성능 분할 로드 강화

- 목표: Progressive Loader로 기능 단위 lazy 보장, 사이드이펙트 없는 모듈화 확인.
- 계약/가드:
  - 번들 예산 경고/실패 임계 유지/개선 (scripts/validate-build.js)
  - feature register는 최초 1회, 실패 시 캐시 해제 (기존 로더 계약 유지)
- RED 테스트(추가): `test/unit/loader/feature-side-effect.red.test.ts`
- 구현 개요:
  - main 초기화 경량화와 연계, 갤러리/설정 피처를 registerFeature로만 노출

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

업데이트 일시: 2025-09-11 (U2–U5 활성)
