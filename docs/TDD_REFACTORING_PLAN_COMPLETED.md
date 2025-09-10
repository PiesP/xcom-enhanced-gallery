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

- 2025-09-10: 애니메이션 토큰 통합 완료
  - AnimationService/BrowserService/VerticalImageItem의 하드코딩된
    transition/easing → `--xeg-duration-*`, `--xeg-ease-*` 토큰으로 치환

- 2025-09-10: preact/compat 직접 타입 import 제거
  - VerticalGalleryView에서 `MouseEvent` 타입 외부 import 제거(브라우저 DOM 타입
    사용)

- 2025-09-10: vendors getter 강제(리포지토리 레벨)
  - ESLint에 vendors 디렉터리만 직접 import 허용 예외 추가
  - 코드 검색 기준 vendors 외 직접 import 없음(테스트/벤더 레이어 제외)

- 2025-09-10: Component↔Semantic alias 문서화 강화
  - CODING_GUIDELINES에 중앙 alias 매핑 예시 추가(툴바/모달)
  - 인라인/주입 CSS에도 토큰 규칙 동일 적용 명시

- 2025-09-10: ModalShell/ToolbarShell 토큰 정리
  - radius/ease/duration/focus-ring 토큰 사용으로 통일
  - 배경/보더는 semantic(alias) 토큰으로 교체

- 2025-09-10: CSS 네이밍/토큰 미세 조정
  - SettingsModal radius 구 토큰→xeg 토큰 교체
  - component 토큰 파일의 radius 변수들을 xeg 토큰으로 정규화
