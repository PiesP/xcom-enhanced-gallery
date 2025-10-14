# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 58 완료 ✅ 다음 Phase 대기 중

## 프로젝트 상태

- **빌드**: dev 836.01 KB / prod **316.71 KB** ✅
- **테스트**: 662 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 716 dependencies) ✅
- **번들 예산**: **316.71 KB / 325 KB** (8.29 KB 여유) ✅

## 최근 완료 작업

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

## 현재 작업 (대기 중)

현재 진행 중인 Phase가 없습니다. 다음 작업을 계획하거나 사용자의 요청을
기다립니다. - 툴바 border 제거 (또는 `border: none`) - VerticalImageItem
다운로드 버튼 조건 제거 또는 항상 false로 설정 3. REFACTOR: - 사용되지 않는
토큰/스타일 정리 - 다크 모드/고대비 상태 검증 - 주석 추가 및 문서화

- **완료 기준**:
  - mediaCounter가 툴바와 시각적으로 통합됨
  - 툴바 외곽선이 제거되고 다른 컴포넌트와 일관된 패턴 유지
  - 갤러리 아이템에서 다운로드 버튼이 보이지 않음
  - 모든 테스트 통과
  - 번들 크기 영향 최소 (예상 1-2KB 감소)

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
