# ✅ TDD 리팩토링 완료 항목 (간결 로그)

> 완료된 작업만 간단히 기록합니다.

- 2025-09-10: 빌드/ESLint/Prettier 워크플로 안정화(유지 관리 상태)
- 2025-09-10: 외부 의존성 격리 적용(일부)
  - preact/hooks 직접 import 제거 → vendors getter 사용
  - 대상: `useGalleryToolbarLogic`, `useScrollLock`
- 2025-09-10: Toolbar 변형 통합 준비
  - `UnifiedToolbar`/`ToolbarShell` 최소 스텁 추가(Headless+Shell 패턴 진입점)
- 2025-09-10: 토큰 시스템 호환층 확인
  - component→semantic alias가 `design-tokens.semantic.css`에
    존재(`--xeg-comp-modal-*` ↔ `--xeg-modal-*`)
- 2025-09-10: glass-surface 정책 라우팅
  - TSX 내 클래스 사용 금지 준수(검색 결과 TSX 내 미사용), 효과는 CSS로만 유지
