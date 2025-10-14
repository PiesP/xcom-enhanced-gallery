# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-01-27 **상태**: Phase 64 Step 1-2 완료 ✅

## 프로젝트 상태

- **빌드**: dev 836.28 KB / prod **319.16 KB** ✅
- **테스트**: 744 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**258 modules**, **711 dependencies**) ✅
- **번들 예산**: **319.16 KB / 325 KB** (5.84 KB 여유) ✅

## 최근 완료 작업

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

### Phase 64 Step 3-4: 포커스 트래킹 및 인디케이터 개선 🔴 **MEDIUM**

**배경**: Phase 64 Step 1-2에서 focusedIndex signal과 버튼 네비게이션 통합 완료

**남은 작업**:

#### Step 3: useGalleryFocusTracker를 전역 focusedIndex와 연동

- autoFocusIndex 업데이트 시 전역 `setFocusedIndex()` 호출
- 명시적 네비게이션 시에는 이미 동기화되므로 중복 호출 방지
- 10개 통합 테스트 작성 (스크롤 시 동기화, 버튼 클릭 시 정합성)

#### Step 4: 인디케이터 표시 개선

- Toolbar의 currentIndex 표시를 focusedIndex 우선으로 변경
- 6개 UI 테스트 작성 (인디케이터 정확도)

**예상 영향**:

- 번들 크기: +0.2 KB (훅 업데이트, UI 로직 수정)
- 테스트: +16개
- 모듈: 변경 없음 (기존 파일 수정만)
- 의존성: 변경 없음

**수용 기준**:

- ✅ 스크롤 시 focusedIndex가 전역 signal에 반영
- ✅ 인디케이터가 사용자가 보고 있는 미디어를 정확히 표시
- ✅ 모든 기존 테스트 통과 (744 passing 유지)
- ✅ 번들 예산 내 유지 (325 KB 이하)

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
