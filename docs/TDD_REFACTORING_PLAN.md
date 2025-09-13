# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-13 — 활성 Phase: R1–R2, R5 활성화 (dist/dev 번들 감사 결과
반영)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

R1 — 전역 표면 정리(글로벌 누수 제거)

- 목적: 프로덕션 번들에서 `globalThis.registerServiceFactory` 등 디버그용 전역
  노출 제거
- 구현 방향: 서비스 접근은 배럴/헬퍼로만 노출, 전역은 DEV 빌드에서만 게이트
- TDD: `global-surface.no-leak.red.test.ts` (prod build에 전역 키 미존재), E2E
  스모크로 동일 키 접근 실패 확인

R2 — Wheel 리스너 정책 하드닝(passive 사용 기준 명시)

- 목적: wheel 핸들러의 `passive: false` 사용을 필요한 경로로만 제한(스크롤 충돌
  방지 목적일 때)
- 구현 방향: `ensureWheelLock(target, handler)` 유틸 도입, 직접
  addEventListener('wheel', …) 사용 금지 스캔
- TDD: `wheel-listener.policy.red.test.ts`(직접 바인딩 금지 스캔),
  `ensureWheelLock.contract.test.ts`(preventDefault 분기 검증)

R5 — Source map/번들 메타 무결성 가드

- 목적: dev/prod 소스맵에 sources/sourcesContent가 포함되어 역추적 가능,
  \_\_vitePreload 데드 브랜치 제거 검증
- 구현 방향: vite 설정에서 `sourcemap: true`(dev) + `sourcesContent` 보장,
  define 플래그로 프리로드 코드 제거 확인 스크립트
- TDD: `build-artifacts.sourcemap.guard.test.ts`(map 구조 검증),
  `bundle-deadcode.preload-scan.test.ts`

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

## 참고 링크

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
