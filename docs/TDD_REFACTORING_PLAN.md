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

## Phase 8.4: Deprecated/Legacy 코드 정리 (진행 중)

### 목표

Phase 8.1-8.3에서 preact/fflate 잔재를 제거했으나, 전체 코드베이스에 여전히
deprecated/legacy 항목이 남아 있습니다:

- ✅ @deprecated 유틸리티 (memoization.ts - 제거 완료)
- ⏸️ @deprecated 래퍼 메서드 (MediaService - 실제 사용 중, 유지 필요)
- ⏸️ Legacy 정규화 필요성 검증 (Twitter API legacy 필드 - 실제 필요, 유지)
- ⏸️ 과도하게 긴 문서 (COMPLETED.md 6177줄 - 낮은 우선순위)

### 작업 단계

#### 8.4.1: @deprecated 코드 제거 (완료 ✅)

**대상**:

- ✅ `src/shared/utils/performance/memoization.ts`: memo, useCallback, useMemo
  함수들 제거
  - 제거 근거: src에서 사용 0건, Solid.js는 네이티브 최적화
  - 빌드 크기: 변화 없음 (Prod 329 KB 유지)
  - 커밋: 410ef1e1

**검토 후 유지 결정**:

- MediaService.downloadSingle/downloadMultiple: GalleryRenderer에서 실제 사용 중
  - @deprecated 주석이 있지만 공용 API로 활성 사용됨
  - 단순 위임이 아니라 인터페이스 단순화 목적
  - 유지 결정

#### 8.4.2: Legacy 정규화 필요성 검증 (검증 완료 ✅)

**대상**: Twitter API legacy 필드 정규화 로직

**검증 결과**:

- Twitter GraphQL API는 여전히 `legacy` 필드를 사용
- `extended_entities`, `full_text`, `screen_name` 등이 legacy 객체 내부에 위치
- 정규화 로직 필요 → 유지 결정

#### 8.4.3: 문서 간소화 (낮은 우선순위, 보류)

**사유**: 현재 문서가 길지만 히스토리 보존 가치가 높음. 검색 가능하며 필요 시
점진적 개선 가능.

---

## 다음 단계 (Next Phase)

Phase 8.4 완료 후 옵션:

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
