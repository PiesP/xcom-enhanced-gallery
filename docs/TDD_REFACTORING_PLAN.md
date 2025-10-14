# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 60 완료 ✅ 다음 Phase 대기 중

## 프로젝트 상태

- **빌드**: dev 836.01 KB / prod **316.71 KB** ✅
- **테스트**: 658 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **709 dependencies**) ✅
- **번들 예산**: **316.71 KB / 325 KB** (8.29 KB 여유) ✅

## 최근 완료 작업

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

## 다음 작업 대기 중

### 🔴 Phase 56: 고대비/접근성 토큰 정비 (대기)

- **문제**: `.galleryToolbar.highContrast` 및 고대비 버튼 상태가 여전히 중립색
  직접 값을 사용하여 모달 고대비 토큰과 괴리가 발생
- **영향 범위**: `Toolbar.module.css`, `ModalShell.module.css`,
  `token-definition-guard.test.ts`
- **TDD 접근**:
  1. RED: 고대비용 `--xeg-toolbar-*` 토큰 존재 여부와 오버라이드 검증을 token
     guard 테스트에 추가
  2. GREEN: `design-tokens.semantic.css`에 고대비 전용
     토큰(`--xeg-toolbar-bg-high-contrast`,
     `--xeg-toolbar-border-high-contrast`,
     `--xeg-toolbar-button-bg-high-contrast` 등)과 라이트/다크 변형 정의
  3. REFACTOR: Toolbar/Modal 고대비 구간이 새 토큰을 참조하도록 정비하고
     문서(`CODING_GUIDELINES.md`)에 접근성 토큰 사용 원칙 추가
- **완료 기준**: 고대비 상태에서도 툴바/모달 배경·경계 토큰이 일치, token guard
  확장 테스트 GREEN, 번들/테스트/빌드 검증 통과

## 추가 백로그 (우선순위 검토 필요)

- 토큰 사용 빈도 분석 후 미사용 토큰 제거 (예상 10-15개 축소)
- CSS 중복 규칙 및 미사용 클래스 정리로 번들 1-2 KB 절감 시도
- SVG/아이콘 최적화(스프라이트/압축)로 추가 0.5-1 KB 절감 검토

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙
- `TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 기록
