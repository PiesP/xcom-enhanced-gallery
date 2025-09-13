# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-13 — 활성 Phase: UI-VNEXT-01

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

### UI-VNEXT-01 — Toolbar/Settings Glass Refresh & Density Scale (TDD)

목표(요약)

- 툴바/설정 모달의 유리(glass) 표면/보더/텍스트 대비를 최신 토큰으로 재정렬하고,
  em 기반 밀도(density) 스케일을 도입하여 레이아웃 일관성·가독성을 향상합니다.
- PC 전용 입력·접근성·애니메이션/spacing 토큰 정책을 유지하며, 인라인
  px/하드코딩 색상/키워드 easing 미사용을 엄격히 보장합니다.

대안 검토(결론 포함)

- Option A: Semantic 토큰 직사용 + CSS Modules + alignment 유틸 보강(선택)
  - Pros: 기존 정책과 100% 정합, 테스트/가드와 충돌 최소, 번들/복잡도 증가 없음
  - Cons: 컴포넌트별 세밀한 테마 분기(별도 alias) 유연성은 제한적
- Option B: 컴포넌트 alias 토큰 재확장(컴포넌트 전용 토큰 레이어)
  - Pros: 컴포넌트별 조정 용이
  - Cons: 정책 상 가급적 지양(semantic 우선), 토큰 중복·관리 비용 증가, 테스트
    가드와 긴장
- Option C: CSS-in-JS 런타임 테마(스타일 객체/바인딩)
  - Pros: 동적 테마/상태 스위칭 유연
  - Cons: 모듈 부작용/테스트 복잡·성능 리스크, 현 가이드라인과 불일치

→ 결정: Option A 채택(semantic 토큰 직사용 + CSS Modules 유지, alignment 유틸
보강)

범위/산출물(DoD)

- DoD-1: Toolbar/SettingsModal 표면·보더·텍스트가 semantic 토큰만 사용하며,
  고대비/라이트/다크에서 대비 기준 충족(테스트 GREEN)
- DoD-2: 최소 클릭 타겟 2.5em 유지, 밀도(density) 스케일 토큰에 의한 간격/패딩
  정합(인라인 px 0건; 가드 GREEN)
- DoD-3: hover/active/focus-visible 상태가 토큰 기준으로 일관(transition preset,
  easing/duration 토큰만)
- DoD-4: z-index는 전부 `--xeg-z-*`만 사용(하드코딩 0건)
- DoD-5: 타입/린트/전체 테스트/빌드/산출물 검증 PASS(소스맵/데드코드 가드 포함)

TDD 플랜(RED → GREEN → REFACTOR)

1. RED 추가

- test/unit/styles/toolbar.glass.tokens.red.test.ts — 배경/보더/텍스트 토큰/대비
- test/unit/styles/settings-modal.glass.tokens.red.test.ts — 모달
  표면/보더/레이어
- test/unit/styles/toolbar-density.scale.red.test.ts — 2.5em 유지 + em 기반 간격
- test/unit/styles/toolbar-hover-focus.tokens.red.test.ts — hover/active/focus
  토큰 검증

2. GREEN 구현(최소 변경)

- CSS: Toolbar.module.css/SettingsModal.module.css에서
  spacing/gap/padding/색상/보더/그림자를 semantic 토큰으로 정렬, transition
  preset 반영
- 유틸: alignment.css 필요 시 보강(.xeg-gap-xl 등 확장) — 글로벌 런타임 로더
  경유 유지
- JS: 인라인 스타일 제거/방지 유지, PC 전용 입력/핫키 로직 영향 없음 확인

3. REFACTOR/청소

- 중복/미사용 클래스 정리, 컴포넌트 alias 의존이 남아있다면 semantic 직접
  사용으로 치환
- 테스트 네이밍 정리 및 스냅샷 업데이트(정책 가드 유지)

리스크/롤백

- 테마/고대비 대비 조정으로 미묘한 시각 변화 가능 → 토큰만 조정하여 기능/구조
  영향 최소화, 필요 시 토큰 값 원복으로 빠른 롤백 가능

비범위(Out of Scope)

- 아이콘 라이브러리 변경/재도입, CSS-in-JS 전환, 포인터/터치 입력 추가(정책
  위반)

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

-- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
