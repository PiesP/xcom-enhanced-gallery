# ✅ TDD 리팩토링 완료 항목 (간결 로그)

> 완료된 작업만 간단히 기록합니다.

- 2025-09-10: B/C 단계 최종 이관 완료
  - B4 완료: CSS 변수 네이밍/볼륨 재정렬 최종 확정(전역/컴포넌트 반영)
  - C1 완료: fitModeGroup 계약 및 접근성 속성 표준화
  - C2 완료: Radius 정책 전면 반영(`--xeg-radius-*`만 사용)
  - 해당 항목들은 계획 문서에서 제거되고 본 완료 로그로 이동되었습니다.

- 2025-09-10: Userscript 어댑터 도입
  - `getUserscript()`로 GM\_\* API 캡슐화, 테스트/노드 환경 안전 fallback 구현
  - 외부 의존성 격리 원칙(getter 함수) 준수

- 2025-09-10: 테스트 차단 요소 제거
  - UnifiedToolbar 엔트리 스텁 추가(모듈 해상도 실패 해소)
  - vendors getter 강제(ESLint 예외 및 코드모드 적용)
  - TSX 내 'glass-surface' 문자열 제거(효과는 CSS로 유지)
  - Component↔Semantic alias 정리(중앙 파일에서 제공 확인)
  - 애니메이션 토큰 통합(`--xeg-duration-*`, `--xeg-ease-*`,
    `--xeg-button-lift`)

- 2025-09-10: 빌드/ESLint/Prettier 워크플로 안정화(유지 관리 상태)
- 2025-09-10: 외부 의존성 격리 적용(일부)
  - preact/hooks 직접 import 제거 → vendors getter 사용
  - 대상: `useGalleryToolbarLogic`, `useScrollLock`

- 2025-09-10: preact/compat 직접 타입 import 제거
  - VerticalGalleryView에서 `MouseEvent` 타입 외부 import 제거(브라우저 DOM 타입
    사용)

- 2025-09-10: Component↔Semantic alias 문서화 강화
  - CODING_GUIDELINES에 중앙 alias 매핑 예시 추가(툴바/모달)
  - 인라인/주입 CSS에도 토큰 규칙 동일 적용 명시

- 2025-09-10: ModalShell/ToolbarShell 토큰 정리
  - radius/ease/duration/focus-ring 토큰 사용으로 통일
  - 배경/보더는 semantic(alias) 토큰으로 교체

- 2025-09-10: CSS 네이밍/토큰 미세 조정
  - SettingsModal radius 구 토큰→xeg 토큰 교체
  - component 토큰 파일의 radius 변수들을 xeg 토큰으로 정규화

- 2025-09-10: TDD 진행(추가)
  - B4 부분 완료: `Toolbar.module.css`의 비-토큰 색상/변수 → `--xeg-*` 토큰으로
    정규화
  - C2 부분 완료: Toolbar 버튼/다운로드 버튼/미디어 카운터에 radius
    정책(`--xeg-radius-md`) 일괄 적용

- 2025-09-10: 최종 완료(계약/토큰)
  - C1 완료: fitModeGroup 계약 정리
    - 래퍼 제거(white-box), 버튼 독립 배치 유지,
      `data-gallery-element`/`data-selected` 계약 충족
    - Headless(`ToolbarHeadless`) 상태/액션 계약 안정화, Shell 사용 시 접근성
      속성 유지
  - B4 완료: CSS 네이밍/볼륨 최종 점검
    - `ToolbarShell.module.css`의 solid 표면을 semantic
      토큰(`--color-bg-surface`)으로 교정
    - 전역 토큰/하드코딩/중복 관련 테스트 전량 통과로 정책 준수 확인
  - C2 완료: Radius 정책 전면 반영 확인
    - 인터랙션/서피스에 `--xeg-radius-*`만 사용, 하드코딩 px 제거
    - 관련 스타일/리그레션 테스트 전량 통과
