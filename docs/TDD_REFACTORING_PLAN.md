# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 63 계획 중 ⏳

## 프로젝트 상태

- **빌드**: dev 836.01 KB / prod **318.12 KB** ✅
- **테스트**: 678 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **709 dependencies**) ✅
- **번들 예산**: **318.12 KB / 325 KB** (6.88 KB 여유) ✅

## 최근 완료 작업

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

- Phase 56: 고대비/접근성 토큰 정비 (2025-10-14) ✅
  - 고대비 모드용 툴바 토큰 8개 추가 (`--xeg-toolbar-*-high-contrast-*`)
  - 라이트/다크 변형 및 테마별 오버라이드 완전 지원
  - Toolbar.module.css에서 하드코딩된 중립색 직접 참조 제거
  - token-definition-guard.test.ts에 3개 가드 테스트 추가로 재발 방지
  - CODING_GUIDELINES.md에 접근성 토큰 사용 원칙 추가
  - 번들 크기 미미한 증가 (+1.69 KB, 여전히 예산 내)

- Phase 60: 미사용 유틸리티 및 편의 함수 제거 (2025-10-14) ✅
  - optimization 디렉터리 완전 제거 (memo.ts, bundle.ts, index.ts)
  - GalleryHOC에서 5개 편의 함수 제거 (withGalleryContainer 등)
  - 112+ 줄의 미사용 코드 제거로 코드베이스 단순화
  - 모듈 수 감소: 260 → 257 (-3개), 의존성: 712 → 709 (-3개)
  - 테스트 유지: 658 passing (변화 없음)
  - 번들 크기 유지 (316.71 KB, Dead code elimination 최적화 완료)

- Phase 59: Toolbar 모듈 통폐합 및 명명 규칙 재검토 (2025-10-14) ✅
  - 사용되지 않는 3개 파일 삭제 (ConfigurableToolbar, ToolbarHeadless,
    UnifiedToolbar)
  - 관련 테스트 파일 1개 삭제 (toolbar-headless-memo.test.tsx)
  - Playwright 하네스 코드 정리 (65줄 제거)
  - 177+ 줄의 미사용 코드 제거로 코드베이스 단순화
  - 테스트 감소: 662 → 658 passing (삭제된 테스트로 인한 예상된 감소)
  - 번들 크기 유지 (316.71 KB, 8.29 KB 여유)

- Phase 58: 툴바 UI 일관성 개선 (2025-10-14) ✅
  - mediaCounter 배경 투명화로 툴바와 시각적 통합
  - 툴바 외곽선 제거하여 디자인 패턴 통일
  - 갤러리 아이템 다운로드 버튼 제거로 UI 단순화
  - 9개 TDD 테스트로 일관성 검증
  - 번들 크기 미미한 증가 (+0.42 KB, 8.29 KB 여유 유지)

- Phase 57: 툴바-설정 패널 디자인 연속성 강화 (2025-10-14) ✅
  - 툴바 확장 시 하단 border-radius 제거, 통합 그림자 적용
  - 설정 패널과 시각적 일체감 형성 (PC 전용, 디자인 토큰 기반)
  - 7개 TDD 테스트로 시각적 연속성 검증
  - DOM 구조는 현상 유지 (progressBar overlay 패턴에 최적화됨)

## 진행 중 작업

- **Phase 63: 갤러리 인덱스 관리 통합 및 동기화 강화** ⏳
  - 상세 계획: `docs/TDD_REFACTORING_PLAN_Phase63.md` 참조
  - 목표: currentIndex와 focusedIndex 간 동기화 강화
  - 접근: 이벤트 시스템 추가로 명시적 네비게이션 시 즉시 동기화
  - 예상 효과:
    - 툴바 버튼 클릭 시 focusedIndex 즉시 반영
    - 미디어 아이템 클릭 시 UX 일관성 보장
    - 스크롤 중 자연스러운 불일치는 허용 (기존 정책 유지)
  - 예상 번들 영향: +0.35 KB (event-emitter 추가)
  - 예상 테스트: +45개 (이벤트 10 + signals 12 + hook 15 + 통합 8)

## 다음 작업 대기 중

(Phase 63 완료 후 재평가)

## 추가 백로그 (우선순위 검토 필요)

- 토큰 사용 빈도 분석 후 미사용 토큰 제거 (예상 10-15개 축소)
- CSS 중복 규칙 및 미사용 클래스 정리로 번들 1-2 KB 절감 시도
- SVG/아이콘 최적화(스프라이트/압축)로 추가 0.5-1 KB 절감 검토

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙
- `TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 기록
- `TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 상세 계획
