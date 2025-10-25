# 접근성 체크리스트 (Accessibility Checklist)

> **목적**: WCAG 2.1 Level AA 준수를 위한 프로젝트 접근성 상태 추적 및 개선 계획
>
> **최종 업데이트**: 2025-10-21
>
> **준수 기준**:
> [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aa)

---

## 📊 현재 구현 상태 요약

### ✅ 구현 완료

- **Live Region 관리**: polite/assertive 모드 지원 (`LiveRegionManager`)
- **포커스 복원**: 모달 닫힘 시 원래 포커스로 복원 (`FocusRestoreManager`)
- **색상 대비**: WCAG AA/AAA 검증 유틸리티 (`color-contrast.ts`)
- **키보드 내비게이션**: PC 전용 키보드 이벤트 지원 (`keyboard-navigation.ts`)
- **ARIA 헬퍼**: 공통 ARIA 패턴 유틸리티 (`aria-helpers.ts`)
- **자동화 테스트**: axe-core 기반 34개 테스트 (Playwright)

### ⚠️ 부분 구현

- **갤러리 키보드 내비게이션**: 기본 Arrow/Home/End/Escape 지원, 고급 기능 부족
- **스크린 리더 지원**: Live Region은 있으나 전체 흐름 검증 필요
- **ARIA 레이블**: 일부 컴포넌트에만 적용

### 🔜 미구현

- **고대비 모드 지원**: Windows High Contrast Mode 대응 없음
- **텍스트 크기 조절**: 200% 확대 시 레이아웃 검증 필요
- **애니메이션 제어**: prefers-reduced-motion 부분 지원
- **터치 타겟 크기**: 모바일은 지원 범위 외 (PC 전용)

---

## 🎯 WCAG 2.1 Level AA 체크리스트

### 1. 인식 가능 (Perceivable)

#### 1.1 텍스트 대체 (Text Alternatives)

- [x] **1.1.1 비텍스트 콘텐츠 (Level A)**
  - ✅ 이미지: `<img>` 태그에 alt 속성 사용
  - ✅ 버튼: `aria-label` 적용 (Toolbar, 설정 버튼)
  - ⚠️ 갤러리 아이템: 미디어 타입별 설명 개선 필요
  - **테스트**: `test/unit/shared/components/ui/IconButton.test.tsx`

#### 1.2 시간 기반 미디어 (Time-based Media)

- [x] **1.2.1 오디오 전용 및 비디오 전용 (Level A)**
  - ✅ 비디오: 사용자 제어 가능 (play/pause)
  - ⚠️ 자막/캡션: 트위터 원본 의존 (프로젝트 범위 외)
  - **구현**: `src/shared/services/media/video-control-service.ts`

#### 1.3 적응 가능 (Adaptable)

- [x] **1.3.1 정보 및 관계 (Level A)**
  - ✅ 시맨틱 HTML: `<button>`, `<nav>`, `role="dialog"` 사용
  - ✅ ARIA 관계: `aria-labelledby`, `aria-describedby` 적용
  - ⚠️ 갤러리 구조: 리스트 의미론 개선 필요
  - **구현**: `src/features/gallery/components/`, `src/features/settings/`

- [x] **1.3.2 의미 있는 순서 (Level A)**
  - ✅ DOM 순서: 논리적 읽기 순서 유지
  - ✅ Tab 순서: 키보드 내비게이션 순서 일치
  - **테스트**: `playwright/smoke/toolbar.spec.ts`

- [x] **1.3.3 감각적 특성 (Level A)**
  - ✅ 색상만으로 정보 전달 안함
  - ✅ 텍스트 레이블 병행 (Toast 아이콘 + 메시지)
  - **구현**: `src/shared/components/ui/Toast/`

- [ ] **1.3.4 방향 (Level AA)** 🔜
  - ⚠️ 세로/가로 모드: 데스크톱 전용으로 제약 없음
  - **검토**: 향후 반응형 지원 시 고려

- [x] **1.3.5 입력 목적 식별 (Level AA)**
  - ✅ 입력 필드: `type="text"`, `type="number"` 적절히 사용
  - ✅ autocomplete 속성: 설정 입력 필드에 적용
  - **구현**: `src/features/settings/components/SettingsModal.tsx`

#### 1.4 구별 가능 (Distinguishable)

- [x] **1.4.1 색상 사용 (Level A)**
  - ✅ 색상만으로 정보 전달 안함
  - ✅ 아이콘 + 텍스트 병행 (Toast, 버튼)
  - **테스트**: `test/unit/shared/Toast-Icons.test.tsx`

- [x] **1.4.2 오디오 제어 (Level A)**
  - ✅ 비디오 자동재생 없음
  - ✅ 사용자 명시적 제어 필요
  - **구현**: `src/shared/services/media/video-control-service.ts`

- [x] **1.4.3 색상 대비 (Level AA)**
  - ✅ WCAG AA 검증 유틸리티 제공 (`meetsWCAGAA()`)
  - ✅ 디자인 토큰: OKLCH 색상 시스템으로 대비 보장
  - ⚠️ 동적 배경: 자동 대비 조정 필요
  - **구현**: `src/shared/utils/accessibility/color-contrast.ts`
  - **테스트**: `test/unit/components/toolbar.separator-contrast.test.tsx`

- [x] **1.4.4 텍스트 크기 조절 (Level AA)**
  - ✅ 상대 단위 사용 (`rem`, `em`)
  - ⚠️ 200% 확대 테스트 필요
  - **검토**: 현재 CSS에서 고정 `px` 사용 최소화

- [x] **1.4.5 텍스트 이미지 (Level AA)**
  - ✅ 텍스트는 이미지가 아닌 실제 텍스트 사용
  - ✅ 아이콘: SVG 사용 (확대 가능)
  - **구현**: Heroicons 사용

- [ ] **1.4.10 리플로우 (Level AA)** 🔜
  - ⚠️ 반응형 레이아웃: PC 전용으로 제약적
  - **검토**: 향후 반응형 지원 시 고려

- [x] **1.4.11 비텍스트 대비 (Level AA)**
  - ✅ UI 컴포넌트: 3:1 대비 목표 (토큰 시스템)
  - ⚠️ 동적 검증 필요
  - **구현**: `src/styles/tokens/`

- [x] **1.4.12 텍스트 간격 (Level AA)**
  - ✅ 사용자 스타일시트 허용
  - ✅ 고정 높이 최소화
  - **검토**: CSS `line-height`, `letter-spacing` 유연성

- [x] **1.4.13 호버/포커스 콘텐츠 (Level AA)**
  - ✅ Tooltip/Toast: Escape로 닫기 가능
  - ✅ 포커스 손실 없음
  - **구현**: `src/features/gallery/components/KeyboardHelpOverlay.tsx`

---

### 2. 운용 가능 (Operable)

#### 2.1 키보드 접근 (Keyboard Accessible)

- [x] **2.1.1 키보드 (Level A)**
  - ✅ 모든 기능 키보드로 접근 가능
  - ✅ Arrow/Home/End/Escape/Space 지원
  - **구현**: `src/shared/services/keyboard-navigator.service.ts`
  - **테스트**: `test/unit/shared/services/keyboard-navigator.service.test.ts`

- [x] **2.1.2 키보드 트랩 없음 (Level A)**
  - ✅ 모달: Escape로 닫기 가능
  - ✅ 갤러리: Escape로 닫기 가능
  - ✅ 포커스 복원 (`FocusRestoreManager`)
  - **테스트**: `test/unit/accessibility/focus-restore-manager.test.ts`

- [x] **2.1.4 문자 단축키 (Level A)**
  - ✅ 수정자 키 필요 (Shift+?)
  - ✅ 단일 문자 단축키 없음
  - **구현**: `KeyboardNavigator.handleHelp()`

#### 2.2 충분한 시간 (Enough Time)

- [x] **2.2.1 시간 제한 조절 (Level A)**
  - ✅ Toast 자동 닫힘: 5초 (사용자 확장 가능)
  - ✅ 타임아웃 없음 (주요 기능)
  - **구현**: `src/shared/services/unified-toast-manager.ts`

- [x] **2.2.2 일시 정지, 중지, 숨김 (Level A)**
  - ✅ 비디오: 사용자 제어 가능
  - ✅ 애니메이션: prefers-reduced-motion 지원
  - **구현**: `src/shared/services/animation-service.ts`

#### 2.3 발작 및 신체 반응 (Seizures and Physical Reactions)

- [x] **2.3.1 번쩍임 3회 미만 (Level A)**
  - ✅ 번쩍임 콘텐츠 없음
  - ✅ 애니메이션 부드러움 (CSS transition)
  - **구현**: CSS Modules, AnimationService

#### 2.4 내비게이션 (Navigable)

- [x] **2.4.1 블록 건너뛰기 (Level A)**
  - ⚠️ Skip Link 없음 (단순 구조로 필요성 낮음)
  - **검토**: 향후 복잡도 증가 시 추가

- [x] **2.4.2 페이지 제목 (Level A)**
  - ✅ 모달: `aria-labelledby` 사용
  - ✅ 갤러리: `role="dialog"` + 레이블
  - **구현**: `src/features/gallery/components/VerticalGalleryView.tsx`

- [x] **2.4.3 포커스 순서 (Level A)**
  - ✅ 논리적 Tab 순서
  - ✅ DOM 순서 = 시각적 순서
  - **테스트**: `playwright/smoke/keyboard-help-modal.spec.ts`

- [x] **2.4.4 링크 목적 (Level A)**
  - ✅ 링크 텍스트 설명적
  - ✅ `aria-label` 보완
  - **구현**: 트위터 원본 링크 유지

- [x] **2.4.5 여러 방법 (Level AA)**
  - ✅ 갤러리: 순차/직접 내비게이션 (Arrow/Home/End)
  - **구현**: `KeyboardNavigator.handleNavigation()`

- [x] **2.4.6 제목 및 레이블 (Level AA)**
  - ✅ 설명적 레이블 (`aria-label`, `aria-labelledby`)
  - ✅ 버튼 텍스트 명확
  - **테스트**: `test/unit/shared/components/ui/IconButton.test.tsx`

- [x] **2.4.7 포커스 가시성 (Level AA)**
  - ✅ CSS `:focus-visible` 사용
  - ✅ 포커스 링 디자인 토큰 (`--xeg-focus-ring`)
  - **구현**: `src/styles/tokens/focus.css`

#### 2.5 입력 모달리티 (Input Modalities)

- [x] **2.5.1 포인터 제스처 (Level A)**
  - ✅ PC 전용 (터치 제스처 없음)
  - ✅ 단순 클릭만 사용
  - **정책**: `docs/CODING_GUIDELINES.md` (PC 전용 이벤트)

- [x] **2.5.2 포인터 취소 (Level A)**
  - ✅ Click 이벤트 사용 (mousedown/up 아님)
  - ✅ 드래그 없음
  - **구현**: 표준 이벤트 핸들러

- [x] **2.5.3 레이블 텍스트 (Level A)**
  - ✅ 가시적 레이블 = `aria-label`
  - ✅ 일관성 유지
  - **테스트**: `test/unit/features/gallery/keyboard-help.aria.test.tsx`

- [x] **2.5.4 모션 액추에이션 (Level A)**
  - ✅ 모션 기반 입력 없음 (PC 전용)
  - **정책**: 터치/제스처 금지

---

### 3. 이해 가능 (Understandable)

#### 3.1 가독성 (Readable)

- [x] **3.1.1 페이지 언어 (Level A)**
  - ✅ `lang` 속성 동적 설정 (i18n)
  - ✅ 다국어 지원 (en, ko, ja)
  - **구현**: `src/shared/i18n/`

- [ ] **3.1.2 부분 언어 (Level AA)** 🔜
  - ⚠️ 혼용 언어 부분 표시 없음
  - **검토**: 향후 필요 시 추가

#### 3.2 예측 가능 (Predictable)

- [x] **3.2.1 포커스 시 (Level A)**
  - ✅ 포커스만으로 컨텍스트 변경 없음
  - ✅ 명시적 액션 필요
  - **테스트**: `playwright/smoke/toolbar.spec.ts`

- [x] **3.2.2 입력 시 (Level A)**
  - ✅ 입력만으로 자동 제출 없음
  - ✅ 명시적 버튼 클릭 필요
  - **구현**: `src/features/settings/components/SettingsModal.tsx`

- [x] **3.2.3 일관된 내비게이션 (Level AA)**
  - ✅ 키보드 단축키 일관성
  - ✅ 버튼 위치 일관성
  - **문서**: `src/features/gallery/components/KeyboardHelpOverlay.tsx`

- [x] **3.2.4 일관된 식별 (Level AA)**
  - ✅ 동일 기능 = 동일 레이블
  - ✅ 아이콘 일관성 (Heroicons)
  - **구현**: UI 컴포넌트 재사용

#### 3.3 입력 지원 (Input Assistance)

- [x] **3.3.1 오류 식별 (Level A)**
  - ✅ Toast로 오류 메시지 표시
  - ✅ Live Region으로 스크린 리더 알림
  - **구현**: `src/shared/services/unified-toast-manager.ts`
  - **테스트**: `playwright/accessibility/toast-a11y.spec.ts`

- [x] **3.3.2 레이블 또는 지침 (Level A)**
  - ✅ 입력 필드 레이블 제공
  - ✅ placeholder로 예시 제공
  - **구현**: 설정 모달 입력 필드

- [ ] **3.3.3 오류 제안 (Level AA)** 🔜
  - ⚠️ 자동 수정 제안 없음
  - **검토**: 향후 개선

- [ ] **3.3.4 오류 방지 (Level AA)** 🔜
  - ⚠️ 일괄 다운로드 등 확인 다이얼로그 없음
  - **검토**: 위험 작업에 확인 단계 추가

---

### 4. 견고성 (Robust)

#### 4.1 호환성 (Compatible)

- [x] **4.1.1 구문 분석 (Level A)**
  - ✅ 유효한 HTML 구조
  - ✅ 고유 ID (`uuid-generator.ts`)
  - **테스트**: Playwright HTML 검증

- [x] **4.1.2 이름, 역할, 값 (Level A)**
  - ✅ ARIA 역할 명시 (`role="dialog"`, `role="button"`)
  - ✅ 상태 속성 (`aria-hidden`, `aria-expanded`)
  - **구현**: `src/shared/utils/accessibility/aria-helpers.ts`

- [x] **4.1.3 상태 메시지 (Level AA)**
  - ✅ Live Region으로 동적 메시지 알림
  - ✅ polite/assertive 모드 구분
  - **구현**: `src/shared/utils/accessibility/live-region-manager.ts`
  - **테스트**: `test/unit/accessibility/live-region-manager.test.ts`

---

## 🧪 테스트 현황

### 자동화 테스트 (Playwright + axe-core)

- **위치**: `playwright/accessibility/`
- **도구**: `@axe-core/playwright`, `@playwright/test`
- **커버리지**:
  - ✅ Toolbar: WCAG 2A/2AA 검증
  - ✅ Toast: WCAG 2A/2AA 검증
  - ✅ Settings Modal: 키보드 내비게이션
  - ✅ Gallery: 포커스 관리
- **테스트 수**: 34 passed

### 단위 테스트 (Vitest)

- **위치**: `test/unit/accessibility/`
- **커버리지**:
  - ✅ `FocusRestoreManager`: 포커스 복원 로직
  - ✅ `LiveRegionManager`: Live Region 생성/관리
  - ⚠️ 색상 대비: 단위 테스트 없음
- **테스트 수**: 5개

### 수동 테스트 필요

- [ ] 스크린 리더 (NVDA/JAWS): 전체 흐름 검증
- [ ] 키보드 전용 내비게이션: 복잡한 시나리오
- [ ] 200% 텍스트 확대: 레이아웃 깨짐 확인
- [ ] 고대비 모드: Windows High Contrast Mode

---

## 🎯 개선 계획

### 우선순위 P0 (필수)

1. **스크린 리더 전체 흐름 검증**
   - 갤러리 열기 → 이미지 탐색 → 다운로드 → 닫기
   - NVDA/JAWS 테스트
   - 예상 시간: 2-4시간

2. **갤러리 ARIA 레이블 개선**
   - 미디어 아이템: `aria-label="이미지 1/5"` 형식
   - 현재 인덱스 알림 (Live Region)
   - 예상 시간: 2-3시간

### 우선순위 P1 (중요)

1. **200% 텍스트 확대 테스트**
   - 브라우저 확대 시 레이아웃 검증
   - 고정 높이 제거
   - 예상 시간: 3-4시간

2. **색상 대비 동적 검증**
   - 런타임 대비 측정 (개발 모드)
   - 경고 로그 출력
   - 예상 시간: 2-3시간

3. **애니메이션 제어 개선**
   - prefers-reduced-motion 완전 지원
   - 테스트 추가
   - 예상 시간: 2-3시간

### 우선순위 P2 (선택)

1. **Skip Link 추가**
   - "메인 콘텐츠로 건너뛰기"
   - 복잡도 증가 시 필요
   - 예상 시간: 1-2시간

2. **오류 방지 확인 다이얼로그**
   - 일괄 다운로드 등 확인 단계
   - 예상 시간: 2-3시간

---

## 📚 참고 자료

### 외부 문서

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aa)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

### 프로젝트 문서

- **코딩 규칙**: `docs/CODING_GUIDELINES.md` (PC 전용 이벤트 정책)
- **테스트 전략**: `docs/TESTING_STRATEGY.md` (a11y 테스트 섹션)
- **아키텍처**: `docs/ARCHITECTURE.md` (접근성 계층 위치)

### 구현 파일

- **유틸리티**: `src/shared/utils/accessibility/`
- **서비스**: `src/shared/services/unified-toast-manager.ts` (Live Region)
- **컴포넌트**: `src/features/gallery/components/` (ARIA 패턴)
- **테스트**: `playwright/accessibility/`, `test/unit/accessibility/`

---

## 🔄 변경 이력

### 2025-10-21

- 초판 작성
- 현재 구현 상태 평가 (WCAG 2.1 Level AA 기준)
- 34개 자동화 테스트 현황 기록
- 개선 계획 수립 (P0/P1/P2)

---

**유지보수**: 접근성 개선 작업 시 이 문서를 업데이트하세요. 새로운 컴포넌트 추가
시 관련 섹션을 검토하고 테스트를 추가하세요.
