# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

<<<<<<< HEAD
업데이트: 2025-09-12 — UI 감사 결과를 반영한 신규 활성 Phase(N1–N6) 등록
=======
업데이트: 2025-09-12 — UI 감사 결과를 반영한 활성 Phase(A1–A4) 정의
>>>>>>> 9ae57a75f3576eccccbe64ceb4aeef10bd742748

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

<<<<<<< HEAD
N2 — 렌더링 성능 최적화(memo + selector)

- 목표: `VerticalGalleryView`/`VerticalImageItem`에 compat `memo` 적용,
  `useSignalSelector`로 필요한 파생값만 구독
- 장점: 불필요한 재렌더 감소, 큰 리스트 스크롤 체감 개선
- 단점: 메모화 경계 설정에 따른 props 안정성 요구, 테스트 보강 필요
- 테스트(RED):
  - test/unit/features/gallery/render-count.red.test.tsx (아이템 변경 시 재렌더
    횟수 가드)

N5 — 키보드/포커스 흐름 하드닝(오버레이 포커스 복원 포함)

- 목표: KeyboardHelpOverlay 열림 시 최초 포커스 이동, 닫힘 후 트리거로 포커스
  복원; 툴바 탭 이동 경로 재검증
- 장점: 접근성 향상, 예측 가능한 포커스 흐름
- 단점: 포커스 트랩/복원 상호작용 정합성 검토 필요
- 테스트(RED):
  - test/unit/features/gallery/keyboard-help.focus-restore.red.test.tsx
  - test/unit/features/gallery/toolbar.tab-order.red.test.tsx

N6 — 프리로드/프리페치 UX 미세 튜닝

- 목표: `computePreloadIndices` 결과와 `MediaService.prefetchNextMedia`를 뷰포트
  기반으로 동조(현재/다음 구간 가중치)
- 장점: 체감 로딩 시간 추가 단축, 네트워크 효율화
- 단점: 구현 복잡도 소폭 증가, 벤치 변동성 고려 필요
- 테스트(RED):
  - test/unit/performance/gallery-prefetch.viewport-weight.red.test.ts
  - test/unit/performance/media-prefetch.schedule-regression.test.ts
=======
### A1 — 갤러리 프리로드/프리페치 엔진 도입

- 목표: 현재 인덱스를 중심으로 좌/우 이웃 항목을 우선순위대로 프리로드하여 초기
  지연을 최소화합니다.
- 설계:
  - 순수 함수 computePreloadIndices(currentIndex, total, count) 구현 (최대 20,
    경계 클램프, 대칭 우선순위)
  - MediaService.prefetchNextMedia(urls, currentIndex, { prefetchRange,
    maxConcurrent, schedule: 'immediate'|'idle' })
  - 갤러리 렌더링 시 forceVisible/nearby 항목에 우선 반영, idle 예약은 저우선
    작업에만 적용
- TDD:
  - test/unit/features/gallery/preload.compute-indices.test.ts — 경계/비정상
    값/대칭성/중복 제거
  - test/unit/shared/services/media-prefetch.contract.test.ts — 스케줄별
    동작/동시성 제한/캐시 히트
  - test/integration/gallery/preload.integration.test.ts — 스크롤/키 네비게이션
    중 프리로드 지속 보장
- 리스크/완화:
  - 메모리/네트워크 비용 증가 ↔ count 상한 20, idle 스케줄 기본값, 중복 요청
    차단 캐시

### A2 — 비디오 항목 CLS 하드닝(Aspect Ratio & Skeleton)

- 목표: 영상 썸네일/플레이어 컨테이너에 aspect-ratio와 스켈레톤을 적용해
  레이아웃 시프트(CLS)를 추가로 감소시킵니다.
- 설계:
  - VideoItem.module.css: `aspect-ratio` 또는 높이 예약 + 토큰화된 스켈레톤 배경
  - 로딩 상태 클래스(.loading/.loaded)와 토큰화된 transition 사용(transition:
    all 금지)
- TDD:
  - test/unit/features/gallery/video-item.cls.test.ts — 초기 렌더 CLS 0에
    수렴하는지 스냅/측정
  - test/unit/styles/video-skeleton.tokens.test.ts — 색상/라운드/모션 토큰 준수
- 리스크/완화:
  - 스켈레톤 깜빡임 ↔ reduced-motion/빠른 페이드 프리셋 사용, 비디오 메타 확보
    시 즉시 교체

### A4 — SettingsModal 폼 컨트롤 토큰/포커스 링 정합

- 목표: select/input 등 폼 컨트롤의 hover/active/focus 상태를 툴바 버튼과 동일한
  토큰 체계로 일원화합니다.
- 설계:
  - CSS Modules에서 --xeg-focus-ring/offset, --xeg-color-bg-hover 등 사용,
    radius md 규칙 적용
  - IconButton 닫기 intent=neutral 유지, aria-label 필수
- TDD:
  - test/unit/features/settings/settings-controls.tokens.test.ts — 색상/포커스
    링/라운드 토큰 준수
  - test/unit/a11y/settings-modal.focus.test.ts — 탭 순서/포커스 가시성
- 리스크/완화:
  - 브라우저 기본 스타일 차이 ↔ reset 유틸 클래스 도입, Tokens 기반으로 상단
    덮어쓰기
>>>>>>> 9ae57a75f3576eccccbe64ceb4aeef10bd742748

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

## 참고 링크

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
