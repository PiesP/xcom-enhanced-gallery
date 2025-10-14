# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 64 완료 ✅

## 프로젝트 상태

- **빌드**: dev 836.28 KB / prod **319.32 KB** ✅
- **테스트**: 755 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**258 modules**, **712 dependencies**) ✅
- **번들 예산**: **319.32 KB / 325 KB** (5.68 KB 여유) ✅

## 최근 완료 작업

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

없음 - 현재 모든 계획된 리팩토링 완료

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
