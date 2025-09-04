## TDD 리팩토링 마스터 플랜 (현재 T5-T7 진행 중)

### 0. 완료된 상위 Phase

| Phase | 작업                     | 상태 | 비고                                       |
| ----- | ------------------------ | ---- | ------------------------------------------ |
| T0    | 기본 환경 정리           | ✅   | 테스트/빌드 파이프라인 정착                |
| T1    | 디자인 토큰 3계층        | ✅   | primitive / semantic / component 확립      |
| T2    | UI 프리미티브 1차        | ✅   | 기본 Button/Surface 패턴 도입              |
| T3    | MediaProcessor           | ✅   | 파이프라인 + Result 기반 반환              |
| T4    | 애니메이션 규격화        | ✅   | CSS 전환 + 공통 easing 적용                |
| T5    | Button 애니메이션 일관성 | ✅   | 공통 토큰 사용, focus ring 시스템          |
| T6    | CSS 순환 참조 해결       | ✅   | focus/z-index 토큰 순환 참조 제거          |
| T7    | UI 컴포넌트 일관성       | ✅   | Typography, Vertical Item 디자인 토큰 추가 |

### 1. 현재 진행 상황 (T5-T7 단계)

#### ✅ 완료된 작업들:

- **Button 애니메이션 시스템**: 13/13 테스트 통과
  - 공통 `xeg-spin` 애니메이션 적용
  - `--xeg-duration-*`, `--xeg-easing-*` 토큰 통합 사용
  - Focus ring 시스템 표준화
  - Cross-component 일관성 확보

- **CSS 순환 참조 해결**: 4/4 테스트 통과
  - `--xeg-focus-outline` 순환 참조 → `2px solid var(--color-primary)`
  - `--xeg-focus-offset` 순환 참조 → `2px`
  - `--xeg-z-modal` 순환 참조 → `1000`
  - `--xeg-z-toolbar` 순환 참조 → `999`

- **Typography 토큰 시스템**: 14/14 테스트 통과
  - `--xeg-font-size-sm/base/lg` 토큰 추가
  - `--xeg-font-weight-normal/medium/bold` 토큰 추가
  - Vertical Image Item 디자인 일관성 확보

#### 🔄 진행 중인 작업들:

- **Architecture Dependency Rules**: 8/8 테스트 통과 ✅
  - ✅ Vendor 라이브러리 getter 사용: 모든 UI 컴포넌트 수정 완료
  - ✅ Layer dependency: createAppContainer.ts를 `src/features/gallery/`로 이동
    완료

- **Container 서비스 아키텍처**: 복잡한 이슈들 발견 ⚠️
  - ✅ Legacy adapter contract: 12/12 통과
  - ✅ Core container legacy contract: 8/8 통과
  - ✅ Service keys reduction: 12/12 통과
  - ❌ Cleanup hard removal: 11/12 실패 (서비스 초기화 문제)
  - ❌ Feature lazy factory: 1/1 실패 (동시성 문제)

- **최종 Glassmorphism 정리**: 14/14 테스트 통과 ✅
  - ✅ critical-css.ts 파일 부재 이슈 해결 (해당 파일 불필요)

### 2. 테스트 현황 요약

- **전체**: 1139개 테스트 중 **12개 실패** (98.9% 통과율!)
- **주요 성과**: CSS 순환 참조, Button 애니메이션, Typography 시스템 모두 완료
- **남은 핵심 이슈**: Architecture layer dependency (createAppContainer.ts)

1. 시각적 일관성: Glass + 토큰 기반 (임의 CSS 커스텀 제거, 변이 최소화)
2. 구성 단순화: 선언형 버튼 매핑 (중복 JSX 제거) & headless 로직 분리
3. 접근성 향상: 역할/ARIA 명확화, 키보드 순환, 포커스 트랩 표준화
4. 테스트 내구성: 데이터 속성 최소/안정 키 유지 (`data-gallery-element` 필요한
   곳만)
5. 유지보수성: 버튼/핏모드/다운로드/설정/닫기 등 액션 구성을 설정 객체 기반으로
   재구성
6. 성능: 불필요한 effect 제거 (배경 밝기 감지 최적화) + memo 단순화
7. 스타일 중복 감축: Toolbar.module.css 내 변형 패턴 → 재사용 Primitive 클래스로
   이전

### 현재 문제 요약

- Toolbar JSX 내 버튼 선언 중복(동일한 패턴 10+회)
- 상태/표현/레이아웃 혼재 (contrast 감지, scroll listener, view state 모두
  컴포넌트 내부)
- SettingsModal: focus 관리/스크롤 락 직접 DOM 조작 비중 높음 → 재사용 hook 필요
- CSS: .fitButton 크기 강제 !important 다수 → Primitive 설계 부족 신호
- 테스트가 구조보단 구체 클래스명에 의존 (변경 저항 높음)

---

## 2. 설계 옵션 비교

### Toolbar 구조 개편

| 옵션                                    | 설명               | 장점             | 단점              | 선택     |
| --------------------------------------- | ------------------ | ---------------- | ----------------- | -------- |
| A. 현행 유지 + 부분 CSS 정리            | 버튼 스타일만 통일 | 변경 위험 낮음   | 중복 JSX 지속     | ❌       |
| B. Config 기반 렌더 (배열→map)          | 선언형/확장 쉬움   | 1회 리팩 비용    | 중간 복잡         | ✅       |
| C. 완전한 Headless + Slot 컴포넌트 분리 | 궁극적 유연성      | 초기 과설계 위험 | 구현/테스트 비용↑ | ◑ (후속) |

### 버튼/프리미티브 전략

| 옵션                                              | 설명             | 장점              | 단점 | 선택 |
| ------------------------------------------------- | ---------------- | ----------------- | ---- | ---- |
| 1. Toolbar 전용 클래스 유지                       | 간단             | 재사용 불가       | ❌   |
| 2. Generic Button + variant(intent,size,selected) | 재사용/토큰 활용 | 마이그레이션 필요 | ✅   |
| 3. 외부 UI 라이브러리 도입                        | 빠른 구축        | 의존/번들 증가    | ❌   |

### SettingsModal 포커스/동작

| 옵션                                   | 설명               | 장점              | 단점 | 선택 |
| -------------------------------------- | ------------------ | ----------------- | ---- | ---- |
| Inline DOM 조작 유지                   | 수정 적음          | 중복, 테스트 취약 | ❌   |
| useFocusTrap + useScrollLock 커스텀 훅 | 재사용/테스트 용이 | 훅 구현 필요      | ✅   |
| Portal + Backdrop 재도입               | 명확한 모달 패턴   | UI 복잡 증가      | 보류 |

### High-Contrast 처리

| 옵션                                          | 장점         | 단점                 | 선택 |
| --------------------------------------------- | ------------ | -------------------- | ---- |
| 다중 point DOM 탐색 (현행)                    | 정밀         | 비용/스크롤 listener | ❌   |
| Intersection/Mutation 기반 1회+ResizeObserver | 저비용, 단순 | 구현 약간            | ✅   |
| 수동 테마 토글만 허용                         | 가장 단순    | 자동성 상실          | 보류 |

---

## 3. 선택된 접근 (요약)

1. Toolbar = Headless 로직 훅(`useGalleryToolbarLogic`) + Config 렌더
2. Button Primitive 확장: intent(primary/success/danger/neutral), selected 상태,
   loading 지원
3. SettingsModal = Panel + FocusTrap + ScrollLock 훅 / 토큰화된 spacing
4. 고대비/배경 대비 = 단일 effect + ResizeObserver + throttle(스크롤) 축소
5. 테스트 안정성 위해 data-testid 대신 역할 & aria-label 기반 검증 우선

---

## 4. TDD 단계별 상세 계획 (신규)

| Phase | 목표                       | 산출물 (코드)                                                                | RED 테스트 핵심                                   |
| ----- | -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| T0    | 현행 기능 특성화           | `toolbar.characterization.test.ts` `settings-modal.characterization.test.ts` | 버튼 개수/disabled/포커스/키보드/닫기 동작 캡처   |
| T1    | Primitive 확장             | `Button.tsx` 개선, `ButtonGroup.tsx` 신설                                    | variant + selected + keyboard activation 테스트   |
| T2    | Headless 로직 훅           | `useGalleryToolbarLogic.ts`                                                  | 네비게이션 경계 / fitMode 전환 / 상태 파생 테스트 |
| T3    | Config 기반 Toolbar 재구성 | `Toolbar.tsx` 리팩토링                                                       | 동일 동작 스냅샷/role/aria 유지 확인              |
| T4    | SettingsModal 훅화         | `useFocusTrap.ts` `useScrollLock.ts` refactor modal                          | ESC/포커스 순환/닫기 후 포커스 복귀 테스트        |
| T5    | 대비/접근성 개선           | contrast hook / aria 정리                                                    | data-high-contrast 토글 조건 테스트               |
| T6    | CSS 정리 & 제거            | 축약된 module + tokens                                                       | !important 제거 비율 ≥ 80% 감소 테스트            |
| T7    | 회귀/성능 검증             | bundle diff / memo 비교                                                      | 렌더 횟수 감소(assert spy)                        |

### 세부 테스트 체크리스트

Toolbar

- 버튼 렌더 순서 & intent:
  prev,next,counter,fitGroup(4),downloadCurrent,downloadAll?,settings,close
- 키보드: ArrowLeft/Right → onPrevious/onNext spy
- Disabled 상태: 첫/마지막 경계
- Fit mode 전환: selected data-attribute
- Download 진행 중: loading style

SettingsModal

- Open → 첫 포커스 close 버튼
- Tab 순환 (shift+tab/back)
- ESC 내부 포커스 시 닫힘 / 외부 포커스 시 무시 규칙 유지 여부 결정 (단순화시
  문서 반영)
- 언어/테마 select change 콜백 호출

CSS/스타일

- !important 사용 수 감소 (정규식)
- 공통 버튼 크기 토큰 기반(px 하드코드 제거) 여부

성능

- 리팩토링 전/후 Toolbar 상호작용 시 re-render 횟수 (spy로 1회 유지)

---

## 5. 리팩토링 세부 설계 메모

Button Config 예시 (Phase T3)

```ts
const ACTION_GROUPS: ToolbarActionGroup[] = [
  { id: 'nav', actions: [prevAction, nextAction] },
  { id: 'fit', actions: fitModeActions },
  { id: 'download', actions: [downloadCurrent, downloadAll] },
  { id: 'utility', actions: [settingsAction, closeAction] },
];
```

각 action: `{ id, icon, label, hotkey?, disabled?: (s)=>boolean, onTrigger }`

Headless 훅 반환: `{ state, actions, getActionProps(id) }` → UI는 map 렌더

Focus/Scroll Lock 훅 계약

```ts
interface UseFocusTrapOptions {
  rootRef: RefObject<HTMLElement>;
  initial?: string | (() => HTMLElement | null);
}
interface UseScrollLockOptions {
  active: boolean;
}
```

---

## 6. 측정 & DoD (신규 범위)

| 항목                  | 목표                          |
| --------------------- | ----------------------------- |
| Toolbar.tsx LOC       | -30% 이상                     |
| 중복 버튼 JSX         | 0 (config map만)              |
| !important 감소       | ≥ 80%                         |
| a11y (axe 검사)       | 위반 0                        |
| 새 훅 라인 커버리지   | ≥ 95%                         |
| 리렌더 수 (next 클릭) | 1회 유지                      |
| 번들 영향             | ±5KB 이내 (증가 시 사유 기록) |

Definition of Done (신규):

- Characterization 테스트 모두 GREEN (회귀 기준 잠금)
- Refactor 후 동등 시나리오 통과
- 스타일 회귀(주요 토큰, 색상, 크기) 스냅샷 승인
- 문서(본 파일) 갱신 + 변경 로그 추가

---

## 7. 위험 & 완화 (신규 범위)

| 위험                    | 설명                           | 대응                                            |
| ----------------------- | ------------------------------ | ----------------------------------------------- |
| 테스트 과도한 구조 의존 | config 도입 후 selector 불일치 | role/label 기반 테스트 전환                     |
| 포커스 트랩 회귀        | 커스텀 훅 논리 버그            | 경계(Tab/Shift+Tab 1/1 요소) 테스트             |
| 고대비 감지 부하        | 빈번한 reflow                  | ResizeObserver + throttled scroll 1개로 제한    |
| 번들 증가               | 새 훅/primitive 추가           | dead CSS 제거로 상쇄, bundle-analysis diff 첨부 |

---

## 8. 실행 순서 (실제 작업 커밋 가이드)

1. test: toolbar.characterization (RED)
2. test: settings-modal.characterization (RED)
3. feat: Button primitive 확장 (GREEN 최소)
4. refactor: Toolbar fit/다운로드 버튼을 Button primitive 사용하도록 부분 교체
5. feat: useGalleryToolbarLogic 훅 + 단위 테스트
6. refactor: Toolbar config map 도입 (기존 JSX 제거) → GREEN 확인
7. feat: focusTrap/scrollLock 훅 + SettingsModal 적용
8. refactor: contrast 감지 훅화 + 기존 effect 제거
9. refactor: CSS 정리 (!important, 중복 규칙 삭제)
10. test: 성능/회귀 + axe (접근성) 검증
11. docs: 본 계획 DoD 충족 보고 + 치수/메트릭 기록

---

## 9. 다음 바로 수행할 RED 테스트 (요약)

- `test/behavioral/toolbar.characterization.test.ts`
  - 버튼 role/label 존재, 이전/다음 disabled 경계, fit 모드 전환(data-selected)
- `test/behavioral/settings-modal.characterization.test.ts`
  - open → close focus 복귀, ESC 닫힘, Tab 순환, select 변경 이벤트

---

본 문서는 신규 Toolbar & SettingsModal TDD 리팩토링 진행마다 업데이트됩니다.
