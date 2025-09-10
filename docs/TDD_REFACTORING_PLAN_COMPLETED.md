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

- 2025-09-10: Core/로깅·Result 패턴 정착
  - `Result`/`AsyncResult`/`safeAsync` 유틸 반영, 타입 안전성 강화
  - 중앙 로깅(`@shared/logging/logger`) 확립: level/timestamp/scoped
    logger/measurePerformance/logError
  - ErrorHandler 통합(AppError/코드/심각도/글로벌 핸들러)

- 2025-09-10: MediaProcessor 파이프라인 완성
  - `collectNodes` → `extractRawData` → `normalize` → `dedupe` → `validate` 구현
    및 테스트 통과
  - `processMedia()` 헬퍼 제공, 실패 경로 메시지 표준화

- 2025-09-10: BulkDownloadService 도입(간소화)
  - ZIP(fflate via getter), 진행률 콜백, AbortSignal 취소, 제한적 동시성/재시도
    옵션
  - 단건/대용량 모두 지원, Userscript/브라우저 동작

- 2025-09-10: 갤러리 부트스트랩 정리
  - 즉시 초기화 및 PC 전용 핫키 구성, 비핵심은 백그라운드 초기화

- 2025-09-10: 빌드/메타데이터 강화
  - Vite 플러그인으로 Userscript 헤더 자동화, 소스맵(dev) 생성
  - 빌드 검증 스크립트에 gzip 사이즈 예산(경고≥300KB, 차단>450KB) 추가

- 2025-09-10: Userscript 현대화 1차 마일스톤 정리
  - Core/Result/로깅/에러 핸들러 표준화 완료
  - MediaProcessor 파이프라인 및 테스트 완료
  - DownloadService(기본 ZIP/진행률/취소/동시성·재시도) 1차 구현 완료
  - Bootstrap(PC-only 핫키/즉시 초기화) 정비 완료
  - Build(헤더/소스맵/사이즈 예산) 구성 완료

- 2025-09-10: IconButton/Action Controls 통일
  - Toolbar 내 아이콘 전용 버튼 전량 IconButton로 교체, 사이즈/토큰/ARIA 일관화
  - 닫기 버튼은 intent='danger' 매핑으로 시각 의미 유지

- 2025-09-10: Overlay/Modal/Surface 토큰 일관화(1차)
  - ModalShell.module.css의 surface 그림자 하드코딩 제거 →
    `var(--xeg-comp-modal-shadow)` 사용
  - 단위 테스트 추가: `ModalShell.tokens.test.ts`로 토큰 준수 회귀 방지

- 2025-09-10: Overlay/Modal/Surface 토큰 일관화(Toast 완료)
  - Toast.module.css의 surface 배경/보더/그림자 토큰을 semantic으로 통일
    (`--xeg-surface-glass-*`)하여 컴포넌트 전용 토큰 의존 제거
  - 결과: 빌드/전체 테스트 그린, surface 일관성 가드와 충돌 없음

- 2025-09-10: Overlay/Modal/Surface 토큰 일관화(최종 정리)
  - ModalShell/ToolbarShell 그림자·배경·보더 토큰 사용 검증, Toast까지 포함해
    표면 계층의 semantic 토큰 일관화 완료
  - 가드 테스트: `ModalShell.tokens.test.ts`, `ToolbarShell.tokens.test.ts`,
    theme/surface 커버리지 테스트 통과 확인

- 2025-09-10: 문서 업데이트(PC 전용 이벤트, README 배지 정리)
  - README의 설치/브라우저 배지와 PC 전용 이벤트 설명 정리
  - 잘못된 마크다운 중단 문자열(배지) 수정, 오타 교정

- 2025-09-10: 애니메이션 토큰 정책(1차)
  - xeg-spin 하드코딩 지속시간 제거 → `var(--xeg-duration-*)` 사용으로 통일
  - 유닛 테스트 추가: `animation-tokens-policy.test.ts`로 회귀 방지

- 2025-09-10: ToolbarShell 컴포넌트 그림자 토큰 정책
  - ToolbarShell elevation 클래스의 raw oklch 및 하드코딩 제거 →
    `var(--xeg-comp-toolbar-shadow)` 사용
  - 유닛 테스트 추가: `ToolbarShell.tokens.test.ts`로 회귀 방지

- 2025-09-10: 애니메이션 유틸리티/컴포넌트 정책 고도화
  - `design-tokens.semantic.css`의 유틸리티(.xeg-anim-\*) duration/ease 토큰화
  - `src/assets/styles/components/animations.css`의 .xeg-animate-\* 클래스
    duration 하드코딩 제거 → 토큰화
  - 유닛 테스트 추가:
    - `test/unit/styles/animation-utilities.tokens.test.ts`
    - `test/unit/styles/components-animations.tokens.test.ts`
  - 갤러리 피처 CSS 스피너/등장 애니메이션 토큰화 완료
    - 파일: `src/features/gallery/styles/Gallery.module.css`,
      `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css`
    - 가드 테스트: `test/unit/styles/gallery-animations.tokens.test.ts` 통과

- 2025-09-10: 접근성 시각 피드백 일관성(Toast/SettingsModal)
  - 새로운 가드 테스트 추가:
    `test/unit/styles/a11y-visual-feedback.tokens.test.ts`
  - CSS 반영: `Toast.module.css`에 focus-visible 토큰/토큰화된 lift 추가,
    `SettingsModal.module.css` focus-visible 토큰 적용 및 hover lift는 em 단위
    유지(레거시 단위 테스트 호환)
  - 결과: 전체 테스트 그린

- 2025-09-10: 테마 커버리지(Glass Surface 토큰)
  - 새로운 가드 테스트 추가:
    `test/unit/styles/theme-glass-surface.coverage.test.ts`
  - design-tokens.css에서 light/dark/system(prefers-color-scheme) 오버라이드
    보장
  - 결과: 테스트 통과

  - ZIP 내 파일명 충돌 자동 해소: 동일 기본 이름 시 `-1`, `-2` 순차 접미사 부여
  - 실패 요약 수집: 부분 실패 시 `{ url, error }[]`를
    `DownloadResult.failures`로 포함
  - 적용 범위: `BulkDownloadService`와 `MediaService`의 ZIP 경로
  - 테스트: `test/unit/shared/services/bulk-download.filename-policy.test.ts`
    추가, GREEN 확인

- Extraction 규칙 유틸 통합
  - DOMDirectExtractor가 media-url.util의
    isValidMediaUrl/extractOriginalImageUrl을 사용하도록 리팩토링
  - PNG 등 원본 포맷 유지 + name=orig 승격 규칙 일원화
  - 회귀 테스트 추가: dom-direct-extractor.refactor.test.ts(GREEN)

- 2025-09-10: 의존성 그래프 위생(Dependency-Cruiser 튜닝)
  - 테스트 전용/과도기 모듈을 orphan 예외로 화이트리스트 처리
  - 결과: dependency-cruiser 위반 0건(에러/경고 없음)
  - 문서 갱신: docs/dependency-graph.(json|dot|svg) 재생성

- 2025-09-10: 애니메이션 토큰/감속 정책 정규화
  - transition/animation에 `--xeg-duration-*`, `--xeg-ease-*`로 통일
  - reduce-motion 대응 확인, 하드코딩 지속시간 제거
  - 가드 테스트: animation-utilities.tokens.test.ts,
    components-animations.tokens.test.ts

- 2025-09-10: 테마 커버리지 감사(Audit)
  - 갤러리/툴바/버튼 표면 토큰 적용 및 라이트/다크 전환 리그레션 없음 확인
  - 가드 테스트: theme-glass-surface.coverage.test.ts 등 통과

  - focus-visible 링/hover lift/그림자 토큰 표준화
  - 가드 테스트: a11y-visual-feedback.tokens.test.ts 통과

  - 애니메이션 토큰 정규화, 테마 커버리지, 접근성 피드백 등 일반 현대화 작업을

- 2025-09-10: 설정 모달 ↔ 툴바 정합(Green) 완료
  - `SettingsModal.tsx` 닫기 버튼을 IconButton(intent='danger', size='md')로
    교체
  - `SettingsModal.module.css`에서 헤더/타이틀/라벨/셀렉트 토큰화 및 툴바
    포커스/호버 체계 정렬
  - 빌드/타입/린트 전부 통과 확인 (Userscript 빌드 검증 포함) 집중하도록
    간결화했습니다.

- 2025-09-10: 모달 레이어/색상 토큰 정합 최종화
  - SettingsModal `z-index`를 `var(--xeg-z-modal)`로 정규화(툴바보다 위 레이어
    보장)
  - CODING_GUIDELINES에 모달↔툴바 배경/텍스트/보더/포커스/레이어 통합 정책 추가
