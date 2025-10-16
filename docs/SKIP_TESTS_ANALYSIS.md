# 스킵 테스트 분석 보고서 (Phase 82.4)

> **생성일**: 2025-10-16 **상태**: 15개 스킵 (실행 기준), 21개 코드 내 `.skip()`
> (grep 기준)

## 요약

- **실행 스킵**: 15개 (npm test 결과)
- **코드 내 .skip()**: 21개 (grep 결과)
- **차이 이유**: 조건부 스킵, 테스트 내부 동적 결정

## 카테고리별 분류

### 1. JSDOM Limitation (5개) - E2E 이관 필수 ⭐⭐⭐

**1.1. toolbar-settings-toggle.test.tsx** (4개 스킵)

- **파일**: `test/unit/components/toolbar-settings-toggle.test.tsx`
- **스킵 이유**: Solid.js 반응성이 JSDOM에서 제대로 작동하지 않음
- **테스트**:
  1. `설정 버튼 클릭 시 토글이 열려야 함` - Signal 반응성 문제
  2. `다시 클릭 시 토글이 닫혀야 함` - Signal 반응성 문제
  3. `토글 열림 상태에서 Escape 키 입력 시 토글이 닫혀야 함` - 키보드 이벤트 +
     Signal
  4. `토글 외부 클릭 시 토글이 닫혀야 함` - 이벤트 전파 + Signal
- **E2E 이관 우선순위**: 높음 (Phase 82.5)
- **예상 E2E 구현**: Playwright 하네스로 실제 브라우저에서 클릭/키보드 테스트

**1.2. toolbar-expandable-aria.test.tsx** (1개 스킵)

- **파일**: `test/unit/components/toolbar-expandable-aria.test.tsx`
- **스킵 이유**: aria-expanded 속성이 JSDOM에서 업데이트되지 않음
- **테스트**: `설정 버튼의 aria-expanded 속성이 false로 초기화되어야 함`
- **E2E 이관 우선순위**: 중간 (Phase 82.5)
- **예상 E2E 구현**: aria-expanded 속성 DOM 검증

### 2. E2E 이관 - 포커스 추적 (9개) - IntersectionObserver 필요 ⭐⭐

**2.1. use-gallery-focus-tracker-deduplication.test.ts** (3개 스킵)

- **파일**:
  `test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts`
- **스킵 이유**: IntersectionObserver 모킹 불완전
- **테스트**:
  1. `동일 인덱스로 중복 포커스 시도 시 실제 DOM 포커스가 한 번만 발생해야 함`
  2. `다른 인덱스로 전환 후 동일 인덱스로 재진입 시 포커스가 재설정되어야 함`
  3. `빠른 연속 포커스 변경 시 마지막 인덱스만 포커스되어야 함`
- **E2E 이관 우선순위**: 중간 (Phase 82.6)
- **예상 E2E 구현**: 실제 IntersectionObserver로 가시성 기반 포커스 검증

**2.2. use-gallery-focus-tracker-global-sync.test.ts** (3개 스킵)

- **파일**: `test/unit/hooks/use-gallery-focus-tracker-global-sync.test.ts`
- **스킵 이유**: 전역 상태 동기화가 JSDOM에서 불완전
- **테스트**:
  1. `갤러리 초기화 시 전역 포커스 상태가 null이어야 함`
  2. `아이템 포커스 시 전역 상태가 업데이트되어야 함`
  3. `갤러리 정리 시 전역 상태가 초기화되어야 함`
- **E2E 이관 우선순위**: 중간 (Phase 82.6)
- **예상 E2E 구현**: 하네스로 전역 상태 조회 및 검증

**2.3. use-gallery-focus-tracker-events.test.ts** (2개 스킵)

- **파일**: `test/unit/hooks/use-gallery-focus-tracker-events.test.ts`
- **스킵 이유**: 포커스 이벤트 리스너가 JSDOM에서 호출되지 않음
- **테스트**:
  1. `포커스 변경 시 커스텀 이벤트가 발생해야 함`
  2. `포커스 이벤트 리스너가 정확한 인덱스를 수신해야 함`
- **E2E 이관 우선순위**: 낮음 (Phase 82.7)
- **예상 E2E 구현**: 커스텀 이벤트 발생 및 리스너 검증

**2.4. toolbar-focus-indicator.test.tsx** (1개 스킵)

- **파일**: `test/unit/features/toolbar-focus-indicator.test.tsx`
- **스킵 이유**: 포커스 인디케이터 위치 계산이 JSDOM에서 부정확
- **테스트**: `포커스된 아이템에 인디케이터가 정확히 위치해야 함`
- **E2E 이관 우선순위**: 낮음 (Phase 82.7)
- **예상 E2E 구현**: 인디케이터 translateX CSS 속성 검증

### 3. E2E 이관 - 키보드 네비게이션 (4개) - preventDefault 검증 필요 ⭐

**3.1. gallery-keyboard.navigation.test.tsx** (1개 스킵)

- **파일**: `test/unit/features/gallery/gallery-keyboard.navigation.test.tsx`
- **스킵 이유**: preventDefault()가 JSDOM에서 검증 불가
- **테스트**: `ArrowLeft/Right 키가 기본 스크롤을 방지해야 함`
- **E2E 이관 우선순위**: 높음 (Phase 82.3 연계)
- **예상 E2E 구현**: Playwright 하네스로 keyboard-navigation.spec.ts 확장

**3.2. gallery-video.keyboard.test.tsx** (2개 스킵)

- **파일**: `test/unit/features/gallery/gallery-video.keyboard.test.tsx`
- **스킵 이유**: 비디오 재생 제어가 JSDOM에서 작동하지 않음
- **테스트**:
  1. `Space 키로 비디오 재생/일시정지 토글`
  2. `M 키로 음소거 토글`
- **E2E 이관 우선순위**: 중간 (Phase 82.3 연계)
- **예상 E2E 구현**: keyboard-interaction.spec.ts 확장

**3.3. toolbar-layout-stability.test.tsx** (1개 스킵)

- **파일**: `test/unit/components/toolbar-layout-stability.test.tsx`
- **스킵 이유**: 레이아웃 시프트 측정이 JSDOM에서 불가
- **테스트**: `키보드 네비게이션 시 레이아웃이 안정적이어야 함`
- **E2E 이관 우선순위**: 낮음 (Phase 82.7)
- **예상 E2E 구현**: Layout Shift API 또는 getBoundingClientRect() 추적

### 4. E2E 이관 - 아이콘 최적화 (3개) - 지연 로딩 테스트 ⭐

**4.1. icon-optimization.test.ts** (3개 스킵)

- **파일**: `test/refactoring/icon-optimization.test.ts`
- **스킵 이유**: 동적 import가 JSDOM에서 완전히 지원되지 않음
- **테스트**:
  1. `LazyIcon이 아이콘을 지연 로드해야 함`
  2. `IconRegistry가 아이콘을 캐시해야 함`
  3. `사전 로드된 아이콘은 즉시 렌더링되어야 함`
- **E2E 이관 우선순위**: 낮음 (Phase 82.8)
- **예상 E2E 구현**: 네트워크 요청 추적 및 캐시 검증

## E2E 이관 로드맵

### Phase 82.5: 포커스 & ARIA 테스트 E2E 이관 (우선순위: 높음)

- **대상**: 5개 (toolbar-settings-toggle × 4, toolbar-expandable-aria × 1)
- **난이도**: ⭐⭐⭐ (중간)
- **예상 시간**: 3-4시간
- **하네스 API 필요**:
  - `clickSettingsButton()`: 설정 버튼 클릭
  - `isSettingsPanelVisible()`: 패널 가시성 확인
  - `getAriaExpanded(selector)`: aria-expanded 속성 조회
  - `clickOutside(selector)`: 외부 클릭 시뮬레이션

### Phase 82.6: 포커스 추적 테스트 E2E 이관 (우선순위: 중간)

- **대상**: 9개 (deduplication × 3, global-sync × 3, events × 2, indicator × 1)
- **난이도**: ⭐⭐⭐⭐ (높음)
- **예상 시간**: 5-6시간
- **하네스 API 필요**:
  - `getGlobalFocusedIndex()`: 전역 포커스 상태 조회
  - `waitForFocusStable(timeout)`: 포커스 안정화 대기
  - `getFocusIndicatorPosition()`: 인디케이터 위치 조회

### Phase 82.7: 키보드 & 레이아웃 테스트 E2E 이관 (우선순위: 중간)

- **대상**: 4개 (keyboard.navigation × 1, video.keyboard × 2, layout-stability
  × 1)
- **난이도**: ⭐⭐⭐ (중간)
- **예상 시간**: 3-4시간
- **연계**: Phase 82.3 하네스 API 활용

### Phase 82.8: 아이콘 최적화 테스트 E2E 이관 (우선순위: 낮음)

- **대상**: 3개 (icon-optimization × 3)
- **난이도**: ⭐⭐ (낮음)
- **예상 시간**: 2-3시간
- **하네스 API 필요**:
  - `getNetworkRequests()`: 네트워크 요청 추적
  - `isIconCached(name)`: 아이콘 캐시 여부 확인

## 제거 대상 (E2E 이관 불필요)

**없음** - 모든 스킵 테스트는 E2E로 이관 필요

## 결론

- **15개 스킵 테스트 모두 E2E 이관 필요** ✅
- **총 예상 시간**: 13-17시간
- **우선순위**: Phase 82.5 → 82.6 → 82.7 → 82.8
- **Phase 82.3 연계**: keyboard.navigation, video.keyboard는 기존 하네스 API
  활용 가능
- **최종 목표**: 스킵 테스트 15개 → 0개, E2E 테스트 30개 → 45개

---

**다음 단계**: Phase 82.5 (포커스 & ARIA 테스트 E2E 이관) 계획 수립
