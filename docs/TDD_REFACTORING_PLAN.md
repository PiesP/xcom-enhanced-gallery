# TDD 리팩토링 활성 계획

현재 상태: Phase 17 (17.1-17.2) 완료 최종 업데이트: 2025-01-11

---

## 현재 상태

Phase 17.1-17.2 완료. 휠 스크롤 배율 설정이 타입 안전하게 통합됨. Phase 17.3 (UI
컨트롤) 진행 가능.

---

## Phase 17: 휠 스크롤 배율 설정 추가

### 완료: 17.1-17.2 (타입 정의 및 통합)

**성과**:

- ✅ `GallerySettings`에 `wheelScrollMultiplier` 추가 (0.5 ~ 3.0, 기본 1.2)
- ✅ `DEFAULT_SETTINGS`에 기본값 설정
- ✅ VerticalGalleryView에서 `getSetting()` 사용
- ✅ 하드코딩된 상수 제거 및 TODO 해결
- ✅ 테스트 5개 추가 (설정 검증)

#### 17.3: UI 컨트롤 추가

1. **SettingsModal 확장**
   - 갤러리 섹션에 슬라이더 추가
   - 라벨: "휠 스크롤 속도" / "Wheel Scroll Speed"
   - 범위: 0.5 ~ 3.0, 단계: 0.1
   - 현재값 표시: `{value}x`

2. **테스트 추가**
   - `test/unit/features/settings/settings-wheel-scroll-ui.test.tsx` 생성
   - 슬라이더 렌더링 검증
   - 값 변경 시 설정 업데이트 검증

### 예상 산출물

- 타입 변경: 1 file
- 소스 수정: 2 files
- 테스트 추가: 3 files
- 예상 테스트 증가: +12 tests

### 품질 게이트

- ✅ 타입 체크: 0 errors
- ✅ 린트: 0 warnings
- ✅ 테스트: 581/606 passed (20 skipped, 4 POC, 1 todo)
- ✅ 빌드: 크기 변화 최소 (< 1 KB 증가 예상)

### 예상 소요 시간

- 1-2 시간 (단일 세션)

---

## 완료된 Phase (최근 3개)

### Phase 15.2: 스킵 테스트 검토 및 문서화 (2025-01-11)

목표: 모든 스킵 테스트 검토 및 명확한 문서화

작업 내역:

제거된 테스트 (2개):

- toolbar-fit-group-contract.test.tsx (fitModeGroup CSS class 제거됨)
- gallery-pc-only-events.test.ts (E2E 커버리지 존재)

문서화된 스킵 테스트 (20개):

- gallery-app-activation.test.ts (3개) - 모듈 모킹 타이밍 이슈
- settings-modal-focus.test.tsx (4개) - jsdom 포커스 제약
- ToolbarHeadless.test.tsx (9개) - Solid.js 마이그레이션 필요
- error-boundary.fallback.test.tsx (1개) - jsdom ErrorBoundary 제약
- keyboard-help.overlay.test.tsx (1개) - Solid.js 반응성 제약
- toolbar.icon-accessibility.test.tsx (2개) - 복잡한 Solid.js 모킹

향상된 todo 테스트:

- alias-resolution.test.ts (1개) - 플랫폼별 절대 경로 import

결과:

- 스킵 감소: 23 → 20 (-3, 파일 제거로)
- 모든 스킵에 E2E 대안 또는 향후 재작성 계획 명시
- 테스트 명확성 개선 (한국어 문서화)
- 빌드: dev 727.65 KB, prod 327.42 KB

테스트 상태:

- 테스트 파일: 140 (133 passed, 6 skipped, 1 POC)
- 테스트: 594 (569 passed, 20 skipped, 4 POC, 1 todo)

### Phase 15.1: 레거시 테스트 정리 (2025-01-11)

목표: 중복/대체된 테스트 파일 제거

작업 내역:

- direct-imports-source-scan.test.ts 제거
- ui-toast-component.no-local-state.scan.red.test.ts 제거
- ui-toast-barrel.no-state.scan.red.test.ts 제거
- remove-virtual-scrolling.test.ts 제거
- service-diagnostics-integration.test.ts 제거
- event-manager-integration.test.ts 제거
- POC 테스트 문서화

결과:

- 테스트 파일: 143 → 142
- 코드 감소: -546 lines
- 빌드: dev 727.65 KB, prod 327.42 KB (gzip: 89.04 KB)
- 테스트: 569/573 passed

### Phase 16: 문서 정리 (2025-01-11)

- SOLIDJS_OPTIMIZATION_ANALYSIS.md 삭제 (545 lines)
- TDD_REFACTORING_PLAN.md 재생성
- 문서 간결화: -606 lines

### Phase 14: SolidJS 반응성 최적화 (2025-01-11)

14.1: 불필요한 메모이제이션 제거 14.2: Props 접근 패턴 일관성 14.3: 유틸리티
통합

---

## 참고 문서

- AGENTS.md: 개발 환경
- TDD_REFACTORING_PLAN_COMPLETED.md: Phase 1-16 완료 내역
