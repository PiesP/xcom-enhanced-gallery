# TDD 리팩토링 활성 계획

아래 항목들은 저장소 현황 점검 결과 도출된 고가치 리팩토링 과제입니다. 모든
항목은 TDD(RED→GREEN)로 진행하며, 완료 즉시
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

## 활성 계획(2025-09-15 갱신)

공통 제약/정책: 벤더는 getter만 사용(@shared/external/vendors), PC 전용
입력만(터치/포인터 금지), 디자인 토큰만 사용, 모듈 임포트 시 부수효과 금지. 모든
항목은 실패하는 테스트 추가 → 최소 구현 → 리팩토링 순서로 수행합니다.

1. CSS-TOKEN-GUARD-01 — 디자인 토큰 사용 가드 확대(잔여: TSX 인라인 스타일)
   - CSS 컴포넌트 레이어에 대한 색상 리터럴 금지 가드는 완료됨 (component CSS
     scan GREEN). 남은 범위: TSX 인라인 style의 color/background/ border-color
     등 색상 속성에서 하드코딩 색상 금지 스캔 추가.

우선순위/순서: 1.
