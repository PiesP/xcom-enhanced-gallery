# TDD 리팩토링 활성 계획(슬림)

목적: 유저스크립트에 적합한 “낮은 복잡성”을 유지. 완료 항목은 항상
`TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다. (최종 수정: 2025-09-15)

## 운영 원칙(불변 요약)

- TypeScript strict, 공개 표면 최소화(배럴은 필요한 심볼만)
- 외부 라이브러리는 안전 getter 경유만 사용(preact/signals/fflate/GM\_\*)
- PC 전용 입력만 허용(click/keydown 등), 터치/포인터 금지(가드 테스트 유지)
- 스타일/애니메이션은 디자인 토큰만 사용(px/hex/ms/transition: all 금지)

## 활성 계획(차기 스프린트 후보, TDD)

1. P11 — Barrel 표면 하드닝(dom/services) [완료]
   - 목표: 외부 소비층에서 EventManager 어댑터만 사용하도록 배럴 표면 축소.
     `@shared/dom`의 DOMEventManager 재노출 제거(또는 type-only로 축소) 및 외부
     런타임 import 금지 스캔 강화.
   - 대안/장단점
     - A. 재노출 제거: 오용 방지(+), 잠재적 내부 참조 수정 필요(–)
     - B. @deprecated 유지 + 스캔 강화: 점진적 이전 용이(+), 표면은 남음(–)
   - 선택: A(Breaking이 없도록 내부 참조 경로만 교정 후 제거)
   - TDD
     - RED: test/unit/lint/dom-deprecated-removal.scan.red.test.ts(외부에서
       `@shared/dom/DOMEventManager` 런타임 import 금지)
     - GREEN: 내부 사용처는 상대 경로 또는 서비스 어댑터로 교체 후 통과

2. P12 — Toolbar 애니메이션 토큰 정리 [완료]
   - 목표: CSS에 남아있는 `toolbar-slide-*` 계열 키프레임/변수를 제거하고 JS API
     `toolbarSlideDown/Up` 단일 경로만 사용.
   - 대안/장단점
     - A. 토큰·키프레임 일괄 삭제: 즉시 일관성(+), 회귀 위험(–)
     - B. 2단계 제거(미사용 탐지 → 제거): 위험 분산(+), 작업 2회(–)
   - 선택: B(1차 스캔/가드 RED → 정리 → 최종 삭제)
   - TDD
     - RED:
       test/unit/lint/toolbar-animation-legacy.scan.red.test.ts(`toolbar-slide-`
       문자열 금지)
     - GREEN: CSS/TSX 전역에서 미사용 확인 후 삭제

3. P13 — Postbuild Validator 확장(배포 안전성) [완료]
   - 목표: dist 산출물에서 위험 표면 문자열을 추가 스캔(예: `DOMEventManager`,
     동적 VendorManager, `vendor-api.ts`).
   - 대안/장단점
     - A. 문자열 스캔만: 구현 쉬움(+), 오탐/누락 가능성(–)
     - B. 심볼 맵 기반 스캔: 정확도(+), 구현 복잡/속도(–)
   - 선택: A(기존 스캐너에 식별자 추가, 오탐은 allowlist 주석 관리)
   - TDD
     - RED: test/final/build-artifacts.runtime-surface.red.test.ts
     - GREEN: postbuild 스캐너 업데이트로 통과(빌드 검증 GREEN 확인)

4. P14 — 타입 전용 import 예외 정책 강화
   - 목표: 런타임 import 금지는 유지하되 type-only import는 허용 규칙을 테스트로
     명확화하고, 배럴 표면에서 타입 재수출을 일관적으로 제공합니다.
   - 대안/장단점
     - A. 모든 타입을 배럴에서 재수출: 사용 편의(+), 표면 증가(–)
     - B. 필요한 타입만 점진 제공: 표면 최소(+), 누락 가능성(–)
   - 선택: B(요구되는 타입만 추가, 가드 테스트 동반)
   - TDD
     - RED: test/unit/lint/type-only-imports.policy.red.test.ts
     - GREEN: 배럴에 필요한 타입만 재수출하고 규칙 통과

## DoD / 품질 게이트

- 타입/린트/테스트/빌드/포스트빌드(소스맵·데드 프리로드) 모두 GREEN
- dist에 금지 문자열(동적 VendorManager, vendor-api.ts, DOMEventManager 런타임
  표면) 없음
- PC 전용 입력/토큰/접근성/벤더 getter 가드 테스트 통과

## 메모(가정)

- 현재 마스터는 스모크 테스트 기준 GREEN이며, 계획 항목은 호환 범위 내에서 점진
  적용이 가능합니다. 필요 시 refactor 전용 프로젝트에 RED 테스트부터 추가합니다.
