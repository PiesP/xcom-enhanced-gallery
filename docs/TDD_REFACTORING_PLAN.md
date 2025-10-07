# TDD-driven Refactoring Plan (xcom-enhanced-gallery)

> **Last updated**: 2025-01-25 **Status**: Phase 7 Completed - Ready for New
> Features

## Overview

모든 Phase는 **RED → GREEN → REFACTOR** 사이클로 진행됩니다. 테스트를 먼저
작성하고, 최소 구현으로 GREEN을 달성한 뒤, 품질을 개선합니다.

---

## Phase 7 Completion Summary

### Completed

- **Phase 7.1**: 키보드 네비게이션 구현
  - ArrowLeft/Right로 이미지 이동
  - Home/End로 처음/마지막 이동
  - Escape로 갤러리 닫기
  - focusTrap 통합 및 코드 정리
  - 커밋: 70453d7d (GREEN), af4c3813 (REFACTOR)

- **Phase 7.2**: 접근성 강화 (WCAG 2.1 AA 준수)
  - GalleryContainer ARIA 속성 (role, aria-modal, aria-label)
  - VerticalImageItem 위치 정보 aria-label
  - aria-current로 활성 아이템 표시
  - Screen reader 완전 지원
  - 커밋: 90b6f256 (RED), 397345e6 (GREEN)

- **Phase 7.3-7.5**: 재평가 후 종료
  - 트위터 미디어 최대 8개 제한으로 인해 대부분의 최적화 불필요
  - fflate 이미 제거됨 (Phase 1)으로 Web Worker 불필요
  - 사용자 피드백 기반 재평가 권장

### Metrics (Final)

- **Build Size**: Dev 1,032 KB, Prod 329 KB (gzip 88 KB)
- **TypeScript**: 100% strict, 0 errors
- **Accessibility**: WCAG 2.1 AA 준수 ✅
- **Keyboard Navigation**: 100% 키보드 접근 가능 ✅
- **Test Coverage**: 90%+

### 달성 목표

- ✅ 키보드 전용 사용자 100% 접근 가능
- ✅ Screen reader 완전 지원 (WCAG 2.1 AA)
- ✅ 법적 준수 및 포용적 디자인
- ✅ PC 전용 이벤트 유지 (설계 원칙 준수)

---

## Phase 8.5: 추가 Deprecated 코드 정리 (완료 ✅)

### 목표

Phase 8.4에서 memoization.ts를 제거했으나, 추가로 정리 가능한 deprecated 코드가
발견되었습니다:

- ✅ HOC 디렉토리 완전 제거 (Phase 5.4에서 deprecated)
- ✅ createZipFromItems 및 관련 레거시 함수 제거
- ✅ 사용되지 않는 상수 및 헬퍼 제거

### 완료된 작업

#### 8.5.1: HOC 디렉토리 제거

**제거 대상**: `src/shared/components/hoc/` 전체 디렉토리

- Phase 5.4에서 deprecated, Solid.js로 전환
- src/test 전역 검색: 사용처 0건 확인
- 안전하게 제거

#### 8.5.2: ZIP 레거시 함수 제거

**제거된 항목**:

- `createZipFromItems()` - 레거시 ZIP 생성 함수
- `downloadFilesForZip()` - 파일 다운로드 헬퍼
- `downloadMediaForZip()` - 개별 미디어 다운로드
- `chunkArray()` - 배열 분할 유틸리티
- `generateUniqueFilename()` - 중복 방지 파일명 생성
- `DEFAULT_ZIP_CONFIG` - 미사용 설정 상수
- 미사용 import: `safeParseInt`

**유지된 API**:

- `createZipBytesFromFileMap()` - 현재 활성 ZIP API
- `MediaItemForZip`, `ZipCreationConfig` 타입

#### 8.5.3: Deprecated 메서드 검증 (유지 결정)

**검증 항목**:

- `ServiceManager.getDiagnostics()` → service-diagnostics.ts에서 사용 (진단
  도구)
- `BrowserService.getDiagnostics()` → 브라우저 진단 도구에서 사용
- `UnifiedToastManager` export → ToastController, ToastContainer에서 사용 (하위
  호환성)
- MediaService deprecated 메서드 → Phase 8.4에서 검증 완료 (실사용)
- Legacy Twitter normalizers → Phase 8.4에서 검증 완료 (API 필수)

### 최종 메트릭

| 메트릭     | Phase 8.4 이후 | Phase 8.5   | 변화            |
| ---------- | -------------- | ----------- | --------------- |
| Dev 빌드   | 1,030.40 KB    | 1,025.86 KB | **-4.54 KB** ✅ |
| Prod 빌드  | 329.09 KB      | 329.09 KB   | 변화 없음       |
| gzip       | 87.76 KB       | 87.76 KB    | 변화 없음       |
| 모듈 수    | 252            | 251         | **-1**          |
| 의존성     | 626            | 625         | **-1**          |
| TypeScript | 0 errors       | 0 errors    | ✅              |

### 제거된 코드 요약

- HOC 디렉토리: 1개 파일 (~15 lines)
- ZIP 레거시 함수: ~120 lines
- 총 제거: ~135 lines
- 번들 크기 감소: 4.54 KB

---

## Phase 9: Toolbar CSS 리팩토링 (진행 중 🚧)

### Phase 9 목표

Toolbar.module.css에서 과도한 `!important` 사용을 최소화하여 코드 유지보수성을
개선합니다.

### 배경

- 현재 상태: 모든 상태(idle, loading, downloading, error)에서 visibility 관련
  속성에 `!important` 사용 (20+ 개소)
- 원인: 과거 X.com의 스타일 충돌로 인한 가시성 버그 수정을 위한 방어적 코딩
- 문제점: CSS 우선순위가 과도하게 강제되어 스타일 확장/수정이 어려움

### 리팩토링 전략

1. **CSS 구체성(Specificity) 증가로 해결**
   - `[data-state="idle"]` →
     `.galleryToolbar[data-state="idle"][data-visibility="visible"]` 등
   - 속성 선택자 추가로 자연스러운 우선순위 확보

2. **!important 보존 기준**
   - X.com 외부 스타일과의 충돌이 실제로 발생하는 경우만 보존
   - 테스트에서 검증 가능한 경우 제거 우선

3. **단계적 접근**
   - Phase 9.1: 가시성 회귀 테스트 작성 (RED → GREEN 확인)
   - Phase 9.2: `!important` 제거 및 구체성 조정 (GREEN 유지)
   - Phase 9.3: 불필요한 중복 제거 및 최종 검증

### Phase 9.1: 가시성 회귀 테스트 작성

**파일**: `test/styles/toolbar-visibility-regression.test.ts`

**테스트 케이스**:

- [ ] 모든 data-state에서 opacity 값 검증
- [ ] 모든 data-state에서 visibility 값 검증
- [ ] 모든 data-state에서 display 값 검증
- [ ] 모든 data-state에서 pointer-events 값 검증
- [ ] z-index 계층 검증 (`--xeg-z-toolbar`)

**수용 기준**: 모든 테스트 GREEN (현재 구현 기준)

### Phase 9.2: CSS 리팩토링 구현

**변경 전략**:

```css
/* 변경 전 */
.galleryToolbar[data-state='idle'] {
  opacity: 1 !important;
  visibility: visible !important;
}

/* 변경 후 */
.galleryToolbar[data-state='idle'] {
  opacity: var(--toolbar-opacity, 1);
  visibility: visible;
}
```

**체크리스트**:

- [ ] idle 상태 `!important` 제거 (4개 속성)
- [ ] loading 상태 `!important` 제거 (2개 속성)
- [ ] downloading 상태 `!important` 제거 (2개 속성)
- [ ] error 상태 `!important` 제거 (2개 속성)
- [ ] CSS 변수 정의 `!important` 제거 (8개)
- [ ] 버튼 크기 `!important` 검토 (유지 가능)

### Phase 9.3: 최종 검증 및 정리

**메트릭 목표**:

- `!important` 사용: 20+ → 5 이하 (75% 감소)
- 번들 크기: 영향 미미 (CSS 압축으로 인해)
- 테스트: 모든 가시성 테스트 GREEN 유지

**검증 항목**:

- [ ] `npm run build` 성공
- [ ] 모든 스타일 테스트 통과
- [ ] 실제 브라우저에서 툴바 가시성 확인 (수동 테스트)

---

## 다음 단계 (Next Phase)

Phase 9 완료 후 옵션:

### 옵션 1: 사용자 피드백 수집

- 실제 사용자 피드백 기반 개선 사항 도출
- Phase 7.3-7.5 우선순위 재조정
- A/B 테스트 또는 사용성 테스트 진행

### 옵션 2: 새로운 기능 개발

- 비디오 지원 (현재 이미지만 지원)
- 고급 필터/정렬 기능
- 커스텀 테마 시스템

### 옵션 3: 코드 품질 개선

- 테스트 커버리지 95%+ 목표
- 성능 프로파일링 (실제 데이터 기반)
- 문서 개선 (사용자 가이드, API 문서)

---

## 개발 원칙 (Development Principles)

1. **TDD 엄수**: RED → GREEN → REFACTOR
2. **PC 전용**: 터치/포인터 이벤트 금지
3. **디자인 토큰**: 하드코딩 색상 금지 (`--xeg-*` 토큰만)
4. **Vendor getter**: Solid.js, heroicons 직접 import 금지
5. **문서 동기화**: 작업 완료 시 COMPLETED.md 이관
