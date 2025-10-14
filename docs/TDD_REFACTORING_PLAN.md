# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: 모든 활성 작업 완료 ✅

## 프로젝트 상태

- **빌드**: dev 836 KB / prod **319.25 KB** ✅
- **테스트**: 763 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **712 dependencies**) ✅
- **번들 예산**: **319.25 KB / 325 KB** (5.75 KB 여유) ✅

## 최근 완료 작업

- Phase 66 Part 2: Focus Tracker Container Accessor Null 처리 (2025-10-14) ✅
  - useGalleryFocusTracker에서 container accessor null 시 fallback 로직 추가
  - forceClear 옵션으로 명시적/일시적 null 구분
  - Regression 테스트 추가 (컨테이너 일시 null 처리 검증)
  - 테스트: 763 passing (+1 regression test)
  - 번들 크기: 319.25 KB (변화 없음)
  - **안정성 개선**: 스크롤 중 포커스 상태 유지 보장

- Phase 66 Part 1: Toolbar 순환 네비게이션 수정 (2025-10-14) ✅
  - Toolbar.tsx navState() 함수 수정: 경계 조건 체크 제거
  - totalCount > 1이면 항상 버튼 활성화 (prevDisabled/nextDisabled: total <= 1)
  - TDD 테스트 7개 추가 (RED→GREEN 검증)
  - Playwright E2E 테스트 수정 (순환 네비게이션 반영)
  - 테스트 증가: 762 → 769 passing (+7)
  - 번들 크기: 319.32 KB → 319.25 KB (-0.07 KB, 최적화)
  - **버그 수정**: Phase 62에서 구현한 순환 네비게이션이 Toolbar에서 누락되어
    있던 문제 해결

- Phase 65 Step 1: Orphan 파일 정리 (2025-01-27) ✅
  - `twitter.ts` 레거시 normalizer 파일 이동 (src → test)
  - dependency-cruiser: 1 info → 0 violations 달성
  - 모듈 수: 258 → 257 (-1)
  - TDD 테스트 7개 추가 (RED/GREEN 검증)
  - 번들 크기: 319.32 KB (변화 없음)
  - **코드베이스 정리**: 테스트 전용 파일을 적절한 위치로 이동

- Phase 64 Step 3-4: 포커스 트래킹 및 인디케이터 개선 (2025-10-14) ✅
  - useGalleryFocusTracker 전역 동기화 (10개 테스트)
  - Toolbar 인디케이터 focusedIndex 우선 표시 (6개 테스트 추가)
  - 반응성 개선: createMemo로 displayIndex/mediaCounter 래핑
  - 테스트 증가: 744 → 755 passing (+11)
  - 번들 크기: 319.16 KB → 319.32 KB (+0.16 KB)
  - **사용자 경험 개선**: 스크롤 탐색 시 Toolbar가 실시간으로 위치 표시

- Phase 64 Step 1-2: 스크롤 기반 포커스와 버튼 네비게이션 동기화 (2025-01-27) ✅
  - focusedIndex signal 추가 (10개 테스트)
  - navigateNext/navigatePrevious를 focusedIndex 기준으로 변경 (12개 테스트)
  - 핵심 패턴: `focusedIndex ?? currentIndex` fallback
  - 테스트 증가: 722 → 744 passing (+22)
  - 번들 크기: 319.02 KB → 319.16 KB (+0.14 KB)
  - **핵심 버그 수정**: 스크롤 후 버튼 네비게이션 불일치 해결

- Phase 62: 툴바 네비게이션 순환 모드 구현 (2025-01-27) ✅
- Phase 63: 갤러리 인덱스 관리 통합 및 동기화 강화 (2025-10-14) ✅
- Phase 61: 갤러리 스크롤 동작 정리 (2025-10-14) ✅

## 진행 중 작업

없음

## 다음 작업 대기 중

없음

## 추가 백로그 (우선순위 검토 필요)

- 토큰 사용 빈도 분석 후 미사용 토큰 제거 (예상 10-15개 축소)
- CSS 중복 규칙 및 미사용 클래스 정리로 번들 1-2 KB 절감 시도
- SVG/아이콘 최적화(스프라이트/압축)로 추가 0.5-1 KB 절감 검토

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙
- `TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 기록 (Phase 62, 63 포함)
- `TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 상세 계획 (아카이브)
