# TDD 리팩토링 활성 계획 (경량)

본 문서는 “유저스크립트에 적합한 복잡성”을 유지하기 위한 현재 활성 계획만
담습니다. 완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

업데이트: 2025-09-14 — 활성 Phase: P6–P10 실행 순서(권장): P6 → P10

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API는 명시적 타입
- 외부 의존성은 안전 getter 경유만 사용(preact/@preact/signals/fflate/GM\_\*)
- PC 전용 입력만 사용, 터치/포인터 금지(테스트 가드 유지)
- 디자인/모션/spacing/z-index는 전부 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델 통일: 'success' | 'partial' | 'error' | 'cancelled'

## 현재 진단 요약(현행 기준)

- 테스트 하네스 잔존: AppContainer는 테스트 전용으로 축소되었으나, 완전 제거 및
  전역 DEV 키 폐기는 아직 미착수(최종 단일 컨테이너화를 목표).
- 다운로드 경로 분산: `BulkDownloadService`/`GalleryDownloadService`의 책임이
  일부 중첩 가능 — 동시성/재시도/ZIP 경로의 정책을 중앙화 필요.
- 파일명 규칙 중복: `MediaFilenameService`와 소비처의 패턴 처리 로직이 중복될
  여지가 있어 단일 소스화 필요. \- (해결) 벤더 레거시 API: 동적
  VendorManager/API 표면을 제거/차단했고, prod 번들 문자열 누출 가드를
  강화했습니다.

## 옵션 비교와 결정(핵심 주제: 컨테이너 단일화)

- A) ServiceManager로 최종 통일(AppContainer 제거)
  - 장점: 런타임 경로 단순, Userscript 번들 표면 최소화, 기존 접근자 재사용
  - 단점: 테스트 DI 유연성 일부 축소(하네스 대체 설계 필요)
- B) AppContainer로 최종 통일(ServiceManager 브리지화)
  - 장점: 명시적 DI, 테스트 편의 최상
  - 단점: 마이그레이션 대규모 + 기존 가드와 충돌(직접 import 금지 등)
- C) 하이브리드 지속 유지
  - 장점: 위험 최소
  - 단점: 이중 개념 지속으로 복잡성 상수 비용 발생

결정: A 채택 — 런타임·테스트 모두 ServiceManager + 접근자 패턴으로 통일하고,
테스트는 `ServiceHarness`(경량 팩토리)로 대체.

## 활성 Phase (TDD)

P6 — 컨테이너 단일화(최종)

- 목표: AppContainer 완전 제거(테스트 포함), DEV 전역 키 폐기. 서비스 접근은
  `service-accessors`만 사용.
- RED: 스캔 테스트 추가
  - test/unit/lint/runtime-appcontainer.imports.red.test.ts(확장) — 전 경로 금지
  - test/unit/lint/global-keys.prod-scan.red.test.ts — prod 번들 문자열 누수 0건
- GREEN: 접근자 이행 및 테스트 하네스 `ServiceHarness` 도입
- DoD: 전 스위트 GREEN, dev/prod 빌드 및 postbuild validator PASS

진행 현황(부분):

- settings-access가 레거시 전역 어댑터 의존을 제거하고 ServiceManager 브리지로
  전환됨

<!-- P7 — 다운로드 오케스트레이션 일원화 (완료: Completed Log 참조) -->

P10 — 플레이스홀더/고아 코드 최종 정리

- 목표: types-only/placeholder(예: EnhancedSettingsModal 등) 제거. 참조 0건 보장
  후 삭제.
- RED: 참조 스캔 테스트
- GREEN: 파일 제거 및 배럴/테스트 정리
- DoD: 타입/테스트 GREEN, postbuild validator PASS

## DoD / 게이트

- 타입/린트/테스트/빌드/포스트빌드(소스맵·데드 프리로드) GREEN
- prod 번들 전역 키/레거시 별칭 문자열 스캔 0건
- 기존 가드(벤더 getter/PC-only/토큰/접근성)와 충돌 없음

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 본 문서에서 제거하고 완료 로그에 1줄 요약 추가.

— 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
