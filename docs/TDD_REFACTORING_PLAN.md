# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-12 — 활성 Phase: N2, N6 (N5 완료 이관)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

N2 — 렌더링 성능 최적화(memo + selector)

- 목표: `VerticalGalleryView`/`VerticalImageItem`에 compat `memo` 적용,
  `useSignalSelector`로 필요한 파생값만 구독
- 장점: 불필요한 재렌더 감소, 큰 리스트 스크롤 체감 개선
- 단점: 메모화 경계 설정에 따른 props 안정성 요구, 테스트 보강 필요
- 테스트(RED):
  - test/unit/features/gallery/render-count.red.test.tsx (아이템 변경 시 재렌더
    횟수 가드)

진행 상황(부분 완료):

- VerticalGalleryView에 compat memo 적용 및 테스트 호환을 위한 toString
  오버라이드 추가.
- VerticalImageItem은 기존 compat memo 유지 확인.
- 남은 작업: useSignalSelector/useCombinedSelector로 상태 파생 구독 최적화(렌더
  수 가드 테스트와 정합).

N6 — 프리로드/프리페치 UX 미세 튜닝

- 목표: `computePreloadIndices` 결과와 `MediaService.prefetchNextMedia`를 뷰포트
  기반으로 동조(현재/다음 구간 가중치)
- 장점: 체감 로딩 시간 추가 단축, 네트워크 효율화
- 단점: 구현 복잡도 소폭 증가, 벤치 변동성 고려 필요
- 테스트(RED):
  - test/unit/performance/gallery-prefetch.viewport-weight.red.test.ts
  - test/unit/performance/media-prefetch.schedule-regression.test.ts

진행 상황(부분 완료):

- MediaService.prefetchNextMedia에서 computePreloadIndices 기반 대칭 이웃
  프리페치 사용으로 동작 정합.
- 남은 작업: 뷰포트 가중치 전략(가까운 이웃 우선 순위/스케줄 최적화) 및 회귀
  가드 보강.

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

## 참고 링크

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
