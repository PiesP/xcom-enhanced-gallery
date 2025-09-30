# SOLID-NATIVE-001 Phase G-1 인벤토리 결과

> 생성 시각: 2025-09-30
>
> Epic: SolidJS 네이티브 패턴 완전 이행

## 종합 통계

| 항목                         | 개수           |
| ---------------------------- | -------------- |
| `createGlobalSignal` imports | 5 files        |
| `createGlobalSignal` calls   | 6 occurrences  |
| `.value` property access     | 50 occurrences |
| - Setter (`.value =`)        | 31 occurrences |
| - Getter (`.value.`)         | 19 occurrences |
| `.subscribe()` method calls  | 15 occurrences |
| **총 영향받는 파일**         | **11 files**   |

## 1. createGlobalSignal 정의 및 사용처

### Import 파일 (5개)

| 파일                                           | Line | 사용 타입     |
| ---------------------------------------------- | ---- | ------------- |
| `src/shared/services/UnifiedToastManager.ts`   | 8    | import + call |
| `src/shared/state/gallery-store.ts`            | 1    | import + call |
| `src/shared/state/signals/download.signals.ts` | 11   | import + call |
| `src/shared/state/signals/gallery.signals.ts`  | 19   | import + call |
| `src/shared/state/signals/toolbar.signals.ts`  | 12   | import + call |

### Call 위치 (6개)

| 파일                          | Line | 타입 파라미터   | 컨텍스트                        |
| ----------------------------- | ---- | --------------- | ------------------------------- |
| `UnifiedToastManager.ts`      | 57   | `ToastItem[]`   | private 멤버 필드               |
| `gallery-store.ts`            | 28   | `GalleryState`  | 모듈 레벨 변수                  |
| `signals/download.signals.ts` | 64   | `DownloadState` | 모듈 레벨 변수                  |
| `signals/gallery.signals.ts`  | 55   | `GalleryState`  | 모듈 레벨 변수                  |
| `signals/toolbar.signals.ts`  | 37   | `ToolbarState`  | 모듈 레벨 변수                  |
| `state/createGlobalSignal.ts` | 38   | `T`             | 함수 정의 자체 (전환 대상 아님) |

## 2. 파일별 영향도 분석

### High Risk (핵심 상태, 의존성 많음)

**1. `shared/state/signals/gallery.signals.ts` (Score: 39)**

- createGlobalSignal import: 1개
- createGlobalSignal call: 1개
- .value 접근: **15개** (setter 7개, getter 8개)
- .subscribe() 호출: 1개

**의존하는 파일**:

- `features/gallery/GalleryApp.ts` (.value 6회)
- `features/gallery/GalleryRenderer.ts` (.value 1회, .subscribe 1회)
- `features/gallery/solid/SolidGalleryShell.solid.tsx` (.subscribe 1회)
- `shared/state/app-state.ts` (.value 1회)

**전환 전략**:

- 가장 마지막에 전환 (Phase G-3-3)
- 모든 소비자 파일을 먼저 테스트로 보호
- 다단계 전환: signal 정의 → 내부 함수 → export된 getter/setter

---

### Medium Risk (서비스 레이어와 밀접)

**2. `shared/state/signals/download.signals.ts` (Score: 29)**

- createGlobalSignal import: 1개
- createGlobalSignal call: 1개
- .value 접근: **10개** (setter 6개, getter 4개)
- .subscribe() 호출: 1개

**의존하는 파일**:

- 주로 내부에서 사용 (export된 함수 경유)
- 외부 의존성이 상대적으로 적음

**전환 전략**:

- 중간 우선순위 (Phase G-3-2)
- 내부 캡슐화가 잘되어 있어 비교적 안전

---

**3. `shared/services/UnifiedToastManager.ts` (Score: 24)**

- createGlobalSignal import: 1개
- createGlobalSignal call: 1개 (private 필드)
- .value 접근: 3개
- .subscribe() 호출: 4개

**의존하는 파일**:

- `features/notifications/solid/SolidToastHost.solid.tsx` (.subscribe 1회)

**전환 전략**:

- Phase G-3-2와 함께 전환
- private 필드이므로 클래스 내부 변경에 한정

---

### Low Risk (독립적, 사용처 적음)

**4. `shared/state/signals/toolbar.signals.ts` (Score: 17)**

- createGlobalSignal import: 1개
- createGlobalSignal call: 1개
- .value 접근: 4개
- .subscribe() 호출: 1개

**의존하는 파일**:

- 거의 독립적으로 사용됨
- 외부 참조가 적음

**전환 전략**:

- **최우선 전환 대상** (Phase G-3-1)
- 리스크가 가장 낮고 학습 효과 높음
- 전환 패턴의 reference 구현으로 활용

---

**5. `shared/state/gallery-store.ts` (Score: 21)**

- createGlobalSignal import: 1개
- createGlobalSignal call: 1개
- .value 접근: 6개
- .subscribe() 호출: 1개

**참고**: `gallery-store.ts`는 레거시 파일로 추정됨
(signals/gallery.signals.ts와 중복). Phase G-1 완료 후 제거 또는 deprecated 표시
검토 필요.

---

## 3. 유틸리티 및 간접 사용처

### `shared/utils/signalSelector.ts` (Score: 9)

- .subscribe() 호출: 3개
- createGlobalSignal과의 호환성을 위한 ObservableValue 인터페이스 사용

**전환 전략** (Phase G-2):

- `ObservableValue<T>` → `Accessor<T>` 전환
- `useSignalSelector`, `useCombinedSelector` 리팩토링
- 신규 유틸리티로 순수 SolidJS 패턴 지원

---

### 기타 소비자 파일 (6개)

| 파일                                                 | .value | .subscribe | 비고                          |
| ---------------------------------------------------- | ------ | ---------- | ----------------------------- |
| `features/gallery/GalleryApp.ts`                     | 6      | 0          | 주요 소비자                   |
| `features/gallery/GalleryRenderer.ts`                | 1      | 1          | subscribe 패턴 전환 필요      |
| `features/gallery/solid/SolidGalleryShell.solid.tsx` | 0      | 1          | 이미 Solid 컴포넌트, 우선순위 |
| `features/settings/solid/createParitySnapshot.ts`    | 2      | 0          | DOM element .value와 혼재     |
| `bootstrap/feature-registration.ts`                  | 0      | 1          | settingsService.subscribe     |
| `shared/loader/progressive-loader.ts`                | 1      | 0          | Map entry.value (관계없음)    |

---

## 4. 전환 로드맵

### Phase G-1: 인벤토리 및 영향도 분석 ✅ **완료** (2025-09-30)

- [x] createGlobalSignal 사용처 100% 식별
- [x] .value 속성 접근 패턴 카탈로그 작성
- [x] 우선순위 기반 전환 로드맵 수립

**산출물**:

- `test/architecture/solid-native-inventory.test.ts` (인벤토리 테스트)
- 본 문서 (상세 분석 및 로드맵)

---

### Phase G-2: 유틸리티 레이어 전환 (계획)

**목표**: 공통 유틸리티를 SolidJS 네이티브 패턴으로 전환

**대상 파일**:

1. `shared/utils/signalSelector.ts`
   - `ObservableValue<T>` → `Accessor<T>`
   - `useSignalSelector` → 네이티브 `createMemo()` 기반 재구현
   - `useCombinedSelector` → 네이티브 파생 상태 패턴

2. `shared/state/createGlobalSignal.ts` (단계적 제거)
   - 새로운 `createSharedSignal` 유틸리티 작성 (순수 SolidJS)
   - 마이그레이션 가이드 작성
   - 레거시 호환성 100% 유지 (deprecation 경고 추가)

**예상 소요**: 4-6시간

---

### Phase G-3: State Signals 전환 (계획)

**우선순위 순서**:

#### G-3-1: toolbar.signals.ts (Low Risk)

- 예상 소요: 2-3시간
- RED: 네이티브 패턴 검증 테스트
- GREEN: signal 정의 전환 (`createSignal()` 또는 `createSharedSignal()`)
- REFACTOR: 소비자 코드 업데이트 (`.value` → 함수 호출)

#### G-3-2: download.signals.ts + UnifiedToastManager.ts (Medium Risk)

- 예상 소요: 3-4시간
- 두 파일을 함께 전환 (서비스 레이어 연관성)
- UnifiedToastManager는 private 필드이므로 내부 변경만

#### G-3-3: gallery.signals.ts (High Risk)

- 예상 소요: 4-6시간
- 가장 많은 소비자 파일 (GalleryApp, GalleryRenderer 등)
- 단계별 전환:
  1. 내부 signal 정의 전환
  2. export된 함수들 (openGallery, closeGallery 등) 점진적 업데이트
  3. 모든 소비자 파일 동시 업데이트 (대규모 PR)

---

### Phase G-4: 컴포넌트 반응성 최적화 (계획)

**목표**: 컴포넌트 레벨에서 SolidJS 네이티브 패턴 활용

**대상**:

- `features/gallery/GalleryApp.ts` (6개 .value 접근)
- `features/gallery/GalleryRenderer.ts` (1개 .value, 1개 .subscribe)
- `features/gallery/solid/SolidGalleryShell.solid.tsx` (1개 .subscribe)

**전환 패턴**:

- `.value` getter → 함수 호출 (`galleryState()`)
- `.subscribe()` → `createEffect(() => { galleryState(); ... })`
- 파생 상태 → `createMemo(() => ...)`

**예상 소요**: 6-8시간

---

### Phase G-5: 테스트 스위트 업데이트 (계획)

**목표**: 모든 테스트를 네이티브 패턴에 맞게 업데이트

**대상**:

- State 관련 unit 테스트 (~20개 파일)
- 컴포넌트 integration 테스트 (~10개 파일)
- E2E 시나리오 검증

**예상 소요**: 8-10시간

---

### Phase G-6: 레거시 제거 및 문서화 (계획)

**목표**: 호환 레이어 제거 및 마이그레이션 완료

**작업**:

1. `createGlobalSignal.ts` 파일 제거 (또는 deprecated)
2. 사용되지 않는 import 제거
3. 문서 업데이트:
   - `CODING_GUIDELINES.md` 네이티브 패턴 예시로 전면 교체
   - `vendors-safe-api.md` SolidJS primitives 가이드 추가
   - 마이그레이션 가이드 작성

**예상 소요**: 3-4시간

---

## 5. 리스크 평가 및 완화 전략

### 주요 리스크

1. **대규모 변경으로 인한 회귀**
   - 완화: 단계별 전환, 각 Phase마다 전체 테스트 실행
   - 롤백: Git 태그 및 체크포인트 활용

2. **타입 오류 폭발**
   - 완화: TypeScript strict 모드 유지, 단계별 타입 수정
   - 도구: `npm run typecheck` 빈번한 실행

3. **성능 저하 가능성**
   - 완화: 각 Phase 완료 시 벤치마크 실행
   - 목표: 렌더링 성능 유지 또는 개선

4. **병렬 개발 충돌**
   - 완화: 한 번에 하나의 Phase만 진행
   - 브랜치 전략: `feature/solid-native-*` 시리즈

### 성공 기준

- [ ] `createGlobalSignal` 사용처 0건
- [ ] `.value` 속성 접근 패턴 0건 (레거시 제외)
- [ ] 품질 게이트: typecheck/lint/format/test/build ALL GREEN
- [ ] 번들 크기: 430-450KB (현재 443KB ± 10KB)
- [ ] 성능: 렌더링 성능 유지 또는 개선
- [ ] 문서: 모든 예시 네이티브 패턴 반영

---

## 6. 다음 단계

**즉시 착수 가능**: Phase G-2 (유틸리티 레이어 전환)

**선행 조건**:

- Phase G-1 완료 ✅
- 테스트 인벤토리 작성 ✅
- 로드맵 수립 ✅

**착수 시점**: 2025-09-30 이후

**담당자**: TypeScript 개발 전문가 (AI Agent)

---

## 부록 A: 패턴 변환 예시

### Before (createGlobalSignal 호환 레이어)

```typescript
// 정의
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

const toolbarState = createGlobalSignal<ToolbarState>(INITIAL_STATE);

// Setter
toolbarState.value = newState;

// Getter
const isOpen = toolbarState.value.isOpen;

// Subscribe
toolbarState.subscribe(listener);
```

### After (SolidJS 네이티브 패턴)

```typescript
// 정의
import { createSignal, createEffect } from 'solid-js';

const [toolbarState, setToolbarState] =
  createSignal<ToolbarState>(INITIAL_STATE);

// Setter
setToolbarState(newState);

// Getter
const isOpen = toolbarState().isOpen;

// Subscribe
createEffect(() => {
  const state = toolbarState();
  listener(state);
});
```

---

**문서 버전**: 1.0 **최종 업데이트**: 2025-09-30 **다음 리뷰**: Phase G-2 시작
시
