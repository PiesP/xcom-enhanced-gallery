# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 63 완료 ✅

## 프로젝트 상태

- **빌드**: dev 836.01 KB / prod **319.02 KB** ✅
- **테스트**: 718 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**258 modules**, **711 dependencies**) ✅
- **번들 예산**: **319.02 KB / 325 KB** (5.98 KB 여유) ✅

## 최근 완료 작업

- Phase 63: 갤러리 인덱스 관리 통합 및 동기화 강화 (2025-10-14) ✅
  - 이벤트 시스템 추가: `createEventEmitter` 구현 (31줄, 10개 테스트)
  - `galleryIndexEvents` 통합: navigate:start/complete 이벤트 (12개 테스트)
  - trigger 파라미터: 'button' | 'click' | 'keyboard' 타입으로 네비게이션 소스
    구분
  - useGalleryFocusTracker 이벤트 구독: 명시적 네비게이션 시 focusedIndex 즉시
    동기화 (12개 테스트)
  - 호출 지점 업데이트: VerticalGalleryView/GalleryRenderer에 trigger 전달 (8개
    통합 테스트)
  - 테스트 증가: 678 passing → 718 passing (+40 tests)
  - 번들 크기 증가: 318.12 KB → 319.02 KB (+0.90 KB, 예산 내)
  - 모듈 증가: 257 → 258 (+1, event-emitter.ts)
  - 의존성 증가: 709 → 711 (+2)
  - 명시적 네비게이션 시 UX 일관성 향상 및 이벤트 기반 아키텍처 확립

- Phase 62: 툴바 네비게이션 순환 모드 구현 (2025-10-14) ✅
  - 이전/다음 미디어 버튼을 항상 활성화 상태로 변경 (첫↔마지막 순환)
  - `gallery.signals.ts` 순환 로직 이미 구현되어 있음 (검증만 진행)
  - `use-gallery-toolbar-logic.ts` canGoPrevious/canGoNext: 경계 체크 →
    `totalCount > 1` 체크로 변경
  - `Toolbar.tsx` navState 단순화: 경계 조건 제거, totalCount 기반 비활성화
  - 24개 TDD 테스트 작성 (16개 순환 네비게이션 + 8개 툴바 상태)
  - 2개 기존 테스트 수정 (use-gallery-toolbar-logic-props.test.ts 경계 조건)
  - 번들 크기 소폭 개선: 318.19 KB → 318.12 KB (-0.07 KB)
  - 테스트 증가: 662 passing → 678 passing (+16 tests)

- Phase 61: 갤러리 스크롤 동작 정리 (2025-10-14) ✅
  - 휠 이벤트의 scrollBy() 호출 완전 제거, 브라우저 네이티브 스크롤 사용
  - VerticalGalleryView.tsx onScroll 콜백 단순화: 47줄 → 9줄 (81% 감소)
  - 6개 TDD 테스트로 새로운 동작 검증 (use-gallery-scroll.test.ts)
  - 1개 구형 테스트 제거 (VerticalGalleryView.wheel-scroll.test.tsx)
  - 번들 크기 소폭 개선: 318.40 KB → 318.19 KB (-0.21 KB)
  - 테스트: 658 passing → 662 passing (+4 tests)

## 진행 중 작업

없음 (Phase 63 완료)

## 다음 작업 대기 중

(Phase 64 이후 계획 검토 중)

## 추가 백로그 (우선순위 검토 필요)

- 토큰 사용 빈도 분석 후 미사용 토큰 제거 (예상 10-15개 축소)
- CSS 중복 규칙 및 미사용 클래스 정리로 번들 1-2 KB 절감 시도
- SVG/아이콘 최적화(스프라이트/압축)로 추가 0.5-1 KB 절감 검토

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙
- `TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 기록 (Phase 63 포함)
- `TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 상세 계획 (아카이브)
