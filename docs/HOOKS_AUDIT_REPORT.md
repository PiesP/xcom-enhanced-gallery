# 🔍 src/shared/hooks 감시 보고서

**날짜**: 2025-10-26  
**범위**: `src/shared/hooks/` 전체 파일 감시 및 최적화 제안

---

## 📊 현황 요약

### 디렉터리 구조

```
src/shared/hooks/
├── index.ts                              (활성, 내보내기 관리)
├── use-focus-trap.ts                    (활성, KeyboardHelpOverlay 사용)
├── use-toolbar-state.ts                 (활성, Toolbar 사용)
├── use-gallery-toolbar-logic.ts         (미사용, 훅 제거 후보)
└── toolbar/
    └── use-toolbar-settings-controller.ts  (활성, Toolbar 사용)
```

### 파일 분석

| 파일                               | 줄 수 | 상태      | 사용처                    | 등급        | 검토 필요      |
| ---------------------------------- | ----- | --------- | ------------------------- | ----------- | -------------- |
| use-focus-trap.ts                  | 119   | ✅ 활성   | KeyboardHelpOverlay (1개) | 양호        | 타입 개선      |
| use-toolbar-state.ts               | 226   | ✅ 활성   | Toolbar (1개)             | 양호        | 헬퍼 분리 검토 |
| use-gallery-toolbar-logic.ts       | 212   | ❌ 미사용 | 없음                      | 삭제 대상   | 즉시 제거      |
| use-toolbar-settings-controller.ts | 426   | ✅ 활성   | Toolbar (1개)             | 복잡도 높음 | 단순화 필요    |

---

## ⚠️ 주요 발견 사항

### 1. 미사용 파일: use-gallery-toolbar-logic.ts

**상태**: 전혀 사용되지 않음  
**이유**: Phase 140.2 미사용 훅 제거 이후 export되지 않음

```
index.ts에서 export되지 않음 (주석 처리됨)
// export { useGalleryToolbarLogic } from './use-gallery-toolbar-logic';
```

**액션**: 🗑️ **즉시 삭제 권고**

- 테스트 파일도 archive로 이동되었음 (test/archive/에 있음)
- 120줄 이상의 dead code
- 저장소 정리 방해

---

### 2. 구조적 문제: 3개 훅이 하나의 컴포넌트에 종속

**현황**: `src/shared/components/ui/Toolbar/Toolbar.tsx`에서

- `useToolbarState()` 호출
- `useToolbarSettingsController()` 호출
- 로직이 Toolbar 컴포넌트 자체에 포함됨

**문제점**:

- 훅들이 Toolbar 컴포넌트와 강하게 결합됨
- 재사용성 낮음 (Toolbar 외 다른 곳에서 쓸 수 없음)
- 책임이 흐릿함 (훅 vs 컴포넌트 로직 경계 모호)

**제안**: 아키텍처 리뷰 후

- 상태 관리를 `shared/state`로 이동 고려
- 훅을 컴포넌트별 로컬 로직으로 단순화

---

### 3. 파일 위치 재검토 필요

#### use-toolbar-state.ts (226줄)

**현재 위치**: `src/shared/hooks/use-toolbar-state.ts`  
**검토 사항**:

- 순수 상태 관리 로직 (Signal 생성, 상태 변경)
- 비즈니스 로직이 적음
- **제안**: `shared/state/toolbar-state-machine.ts`로 이동 검토

**근거**:

- `shared/state/`에는 이미:
  - `app-state.ts`
  - `download-state-machine.ts`
  - `navigation-state-machine.ts`
  - `settings-state-machine.ts`
  - `toast-state-machine.ts`

- 패턴 일관성: 상태/상태머신은 `state/` 폴더에

#### use-toolbar-settings-controller.ts (426줄)

**현재 위치**: `src/shared/hooks/toolbar/use-toolbar-settings-controller.ts`  
**검토 사항**:

- 복잡한 이벤트 처리 로직 (scroll, outside-click, keyboard)
- UI 제어 로직이 강함 (포커스, 패널 토글)
- **제안**: 위치는 그대로, 하지만 **단순화** 및 **책임 분리** 필요

**개선 영역**:

1. 고대비 감지 로직 분리 → `shared/services/contrast-detection.ts`
2. 이벤트 핸들러 분리 → 각각 별도 함수로
3. 타입 단순화 → 불필요한 타입 제거

#### use-focus-trap.ts (119줄)

**현재 위치**: `src/shared/hooks/use-focus-trap.ts`  
**검토**: ✅ 적절한 위치

- 재사용 가능한 독립적 훅
- 하나의 책임만 수행
- 통합 유틸(`shared/utils/focus-trap.ts`)에 위임

---

## 🎯 액션 플랜

### Phase 1: 긴급 (1-2일)

- [ ] `use-gallery-toolbar-logic.ts` 삭제
  - 파일 삭제
  - `index.ts` export 제거 (이미 주석 처리됨)
  - 테스트 파일 확인 (archive에 있어야 함)
  - 참조 재검사 (grep)

### Phase 2: 단기 (3-5일)

- [ ] `use-toolbar-state.ts` 헬퍼 함수 분리
  - `getToolbarDataState()`, `getToolbarClassName()` 추출
  - 새 파일: `shared/utils/toolbar-utils.ts` 생성
  - import 경로 업데이트
  - 테스트 업데이트

### Phase 3: 중기 (1주)

- [ ] `use-toolbar-settings-controller.ts` 단순화
  - 고대비 감지 로직 추출
  - 이벤트 핸들러 분리
  - 타입 정리
  - 복잡도 50% 감소 목표

### Phase 4: 아키텍처 검토 (2주)

- [ ] 상태 관리 계층화 검토
  - `use-toolbar-state` → `shared/state/toolbar-state-machine.ts`?
  - 다른 상태머신과의 패턴 일관성 확인
  - ARCHITECTURE.md 업데이트

---

## 📝 문서 업데이트 필요

### ARCHITECTURE.md

- [ ] `shared/hooks/` 폴더 설명 추가/갱신
- [ ] 훅 vs 서비스 vs 상태의 책임 경계 명확화
- [ ] 파일 위치 가이드라인 추가

### CODING_GUIDELINES.md

- [ ] 훅 작성 규칙 섹션 추가
- [ ] 훅의 적절한 크기/복잡도 가이드라인
- [ ] "언제 훅을 쓸까, 언제 서비스를 쓸까" 의사결정 트리

---

## 📌 요약

| 항목      | 현황                           | 우선순위   |
| --------- | ------------------------------ | ---------- |
| 파일 정리 | use-gallery-toolbar-logic 삭제 | 🔴 긴급    |
| 코드 품질 | 헬퍼 함수 분리, 복잡도 감소    | 🟡 중요    |
| 아키텍처  | 상태 관리 계층화 검토          | 🟢 진행 중 |
| 문서화    | 훅 가이드라인 추가 필요        | 🟡 중요    |

---

**작성자**: GitHub Copilot  
**최종 업데이트**: 2025-10-26
