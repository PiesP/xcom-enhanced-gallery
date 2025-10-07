# Phase 10 분석 보고서 (xcom-enhanced-gallery)

> **작업 일시**: 2025-10-07 **작업자**: GitHub Copilot AI Agent **상태**: ✅
> 계획 수립 완료

---

## 요약 (Executive Summary)

Preact → Solid.js 전환(Phase 9)이 완료된 후, 프로젝트 전반을 점검하여 **추가
최적화가 필요한 영역**을 식별하고 **Phase 10-12 리팩토링 계획**을 수립했습니다.

### 주요 발견사항

1. ✅ **소스 코드**: Preact 직접 import 완전 제거됨 (Phase 9 완료)
2. ⚠️ **테스트 코드**: Preact 관련 유틸리티 5개 파일 + 다수 테스트 잔존
3. ⚠️ **Orphan 모듈**: `focusScope-solid.ts` (dependency-cruiser 경고)
4. ⚠️ **TODO 주석**: KeyboardHelpOverlay Solid 버전 필요 (3곳)
5. ⚠️ **Deprecated 코드**: 20개 항목 발견 (일부는 실사용 중)

### 수립된 계획

- **Phase 10** (높은 우선순위): 테스트 Preact 잔재 제거, Orphan 모듈 정리, TODO
  주석 해결
- **Phase 11** (중간 우선순위): Deprecated 항목 정리, 테스트 구조 개선
- **Phase 12** (낮은 우선순위): 성능 최적화, 문서 갱신

---

## 1. 프로젝트 현황 분석

### 1.1 빌드 메트릭 (Phase 9 완료 시점)

| 메트릭          | 값          | 비고                |
| --------------- | ----------- | ------------------- |
| Dev 빌드        | 1,029.24 KB | sourcemap 포함      |
| Prod 빌드       | 330.05 KB   | minified + terser   |
| gzip 압축       | 88.33 KB    | 최종 전송 크기      |
| 모듈 수         | 484         | transformed         |
| 의존성          | 699         | dependency-cruiser  |
| Orphan 모듈     | 1           | focusScope-solid.ts |
| TypeScript 에러 | 0           | strict 모드         |

### 1.2 아키텍처 상태

**✅ 잘 유지되고 있는 부분**:

- 3계층 구조 (Features → Shared → External) 준수
- Vendors getter 패턴 100% 적용 (Phase 9)
- PC 전용 이벤트 정책 준수
- 디자인 토큰 시스템 활용
- TDD 워크플로 유지

**⚠️ 개선 필요 영역**:

- 테스트 코드의 Preact 의존성
- 사용되지 않는 모듈 (focusScope-solid.ts)
- 미완성 기능 (KeyboardHelpOverlay)
- Deprecated 항목 누적

---

## 2. Preact 잔재 분석

### 2.1 소스 코드 (✅ 완료)

Phase 9에서 모든 소스 코드의 Preact 직접 import를 제거하고 vendors getter로
전환했습니다.

```bash
# 소스 코드 Preact import 검색 결과
grep -r "from 'preact" src/**/*.{ts,tsx}
# 결과: 0건
```

### 2.2 테스트 코드 (⚠️ 잔존)

**제거 대상 파일** (5개):

1. `test/utils/vendor-testing-library.ts` (55 lines)
   - `getPreact()` 사용
   - `@testing-library/preact` 래핑

2. `test/utils/render-with-vendor-preact.tsx` (44 lines)
   - Preact 렌더링 유틸리티
   - vendor manager의 Preact 인스턴스 사용

3. `test/__mocks__/vendor.mock.js` (95 lines)
   - `mockPreactAPI`, `mockPreactSignalsAPI`, `mockPreactCompatAPI`
   - Preact Hooks 모킹

4. `test/__mocks__/vendor.mock.ts` (중복, 93 lines)
   - vendor.mock.js와 동일한 내용

5. `test/__mocks__/vendor-mock-clean.js` (79 lines)
   - Preact Hooks/Signals 모킹

**수정 대상 테스트** (~10개):

- `test/unit/vendors/*.test.ts` - getPreact 참조
- `test/unit/shared/runtime-vendor-initialization.test.ts` - getPreactCompat
- `test/unit/ui/toolbar.icon-accessibility.test.tsx` - Preact 모킹
- 기타 테스트 파일들

**예상 영향**:

- 총 제거 라인: ~366 lines
- 수정 테스트: ~10개 파일
- 테스트 복잡도 감소

---

## 3. Orphan 모듈 분석

### 3.1 focusScope-solid.ts 상세

**파일 정보**:

- 경로: `src/shared/primitives/focusScope-solid.ts`
- 크기: 53 lines
- 기능: Focus scope ref 관리를 위한 Solid.js 패턴

**함수 시그니처**:

```typescript
export function createFocusScope<
  T extends HTMLElement = HTMLElement,
>(): FocusScopeResult<T>;
```

**사용처 검색 결과**:

```bash
grep -r "createFocusScope" src/**/*.{ts,tsx}
# 결과: 정의만 있고 실제 사용처 0건
```

**관련 파일 비교**:

- `focusTrap-solid.ts`: ✅ 사용 중 (createFocusTrap)
- `focusScope-solid.ts`: ⚠️ 미사용 (createFocusScope)

**분석 결론**:

- Focus trap 기능은 `focusTrap-solid.ts`로 충분
- focusScope는 더 단순한 ref 관리 패턴이지만 현재 미사용
- Solid.js에서는 `let ref!: HTMLElement` 패턴이 더 간단

**권장 조치**: **제거** (Phase 10.2)

---

## 4. TODO 주석 분석

### 4.1 KeyboardHelpOverlay 관련

**파일**:
`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`

**TODO 위치** (3곳):

1. **Line 70** (주석 처리된 코드):

```typescript
// const [isHelpOpen, setIsHelpOpen] = createSignal(false);
// TODO: KeyboardHelpOverlay Solid 버전 필요
```

2. **Line 261** (이벤트 핸들러):

```typescript
// TODO: '?' 키로 KeyboardHelpOverlay 열기 (Solid 버전 필요)
```

3. **Line 430** (JSX):

```tsx
{
  /* 키보드 도움말 오버레이 - TODO: Solid 버전 필요 */
}
```

### 4.2 KeyboardHelpOverlay 현황 조사

**파일 확인**:

```bash
ls src/features/gallery/components/KeyboardHelpOverlay/
# KeyboardHelpOverlay.tsx (Preact 버전으로 추정)
# KeyboardHelpOverlay.module.css
```

**현재 상태**:

- 파일은 존재하나 VerticalGalleryView에서 import되지 않음
- 실제 사용되지 않는 기능

**고려사항**:

- 키보드 네비게이션은 Phase 7에서 이미 완료됨
- 도움말 오버레이는 선택적 기능 (UX 보조)
- 구현 시 추가 복잡도 증가

**권장 조치**: **제거** (Phase 10.3b)

- TODO 주석 및 관련 코드 완전 제거
- KeyboardHelpOverlay 컴포넌트도 제거 고려
- 사용자 가이드는 문서로 대체

---

## 5. Deprecated 코드 분석

### 5.1 발견된 Deprecated 항목 (20개)

| 파일                      | 항목                | 실사용          | 조치            |
| ------------------------- | ------------------- | --------------- | --------------- |
| `events.ts`               | EventManager 클래스 | ⚠️ 확인필요     | Phase 11.1      |
| `ServiceManager.ts`       | getDiagnostics()    | ✅ 사용중       | deprecated 제거 |
| `BrowserService.ts`       | getDiagnostics()    | ✅ 사용중       | deprecated 제거 |
| `UnifiedToastManager.ts`  | 레거시 export       | ✅ 필수         | 유지 (하위호환) |
| `toolbarConfig.ts`        | 전체 파일           | ❌ 테스트전용   | Phase 11.1 제거 |
| `DOMEventManager.ts`      | 전체 클래스         | ⚠️ 확인필요     | Phase 11.1      |
| `Button.tsx`              | variant prop        | ⚠️ 사용여부확인 | Phase 11.2      |
| `tokens.ts`               | xxxl 토큰           | ✅ 사용중       | 유지            |
| `zip/store-zip-writer.ts` | toDOSDateTime       | ✅ 내부사용     | 유지            |

### 5.2 우선순위별 처리 계획

**Phase 11.1 - 완전 미사용 파일 제거**:

- `toolbarConfig.ts` (deprecated, 테스트 전용)
- `DOMEventManager.ts` (UnifiedEventManager로 대체)
- `events.ts` EventManager 클래스 (실사용 확인 후)

**Phase 11.2 - Props/Methods 정리**:

- `Button.tsx` variant prop: 마이그레이션 후 제거
- `getDiagnostics()` 메서드들: deprecated 태그 제거 (정상 API 인정)

---

## 6. 수립된 리팩토링 계획

### Phase 10: Post-SolidJS 전환 잔재 정리 (🔴 높은 우선순위)

**목표**: Solid.js 전환의 완전성 확보

#### 10.1: 테스트 Preact 잔재 제거

- 제거 파일: 5개 (~366 lines)
- 수정 테스트: ~10개
- 예상 시간: 4-6시간

#### 10.2: Orphan 모듈 정리

- 대상: `focusScope-solid.ts`
- 조치: 제거 (1순위)
- 예상 시간: 1시간

#### 10.3: TODO 주석 해결

- 대상: KeyboardHelpOverlay 관련 (3곳)
- 조치: 제거 (권장)
- 예상 시간: 2시간

**예상 메트릭 변화**:

- Dev 빌드: 1,029.24 KB → ~1,025 KB (**-5 KB**)
- Orphan 모듈: 1 → 0 (**-1**)
- TODO 주석: 3 → 0 (**-3**)
- 테스트 파일: 5개 제거

### Phase 11: Deprecated 항목 정리 (🟡 중간 우선순위)

**목표**: 실사용 없는 deprecated 코드 제거

#### 11.1: 완전 미사용 파일 제거

- `toolbarConfig.ts`
- `DOMEventManager.ts`
- `events.ts` EventManager (확인 후)

#### 11.2: Props/Methods 정리

- variant prop 마이그레이션
- getDiagnostics deprecated 태그 제거

**예상 메트릭 변화**:

- Dev 빌드: ~1,025 KB → ~1,020 KB (**-5 KB**)
- Deprecated 파일: 3 → 0-1
- 코드 복잡도: 중간 → 낮음

### Phase 12: 성능 최적화 및 문서 갱신 (🟢 낮은 우선순위)

**목표**: Solid.js 최적화 및 문서 현행화

#### 12.1: createEffect 패턴 최적화

- `signalOptimization.ts` untrack 패턴 검토
- createAsyncSelector generation 추적 개선
- 부수효과 없는 effect → memo 전환

#### 12.2: 테스트 구조 개선

- Solid 테스트 패턴 일관화
- 중복 테스트 제거
- 테스트 속도 개선 (20s timeout 단축)

#### 12.3: 문서 갱신

- `ARCHITECTURE.md` Solid.js 아키텍처 반영
- `CODING_GUIDELINES.md` Solid 패턴 가이드 강화
- `TDD_REFACTORING_PLAN_COMPLETED.md` Phase 10-11 이관
- `COMPLETED.md` 길이 50% 감소 (6,600줄 → 3,000줄)

**예상 메트릭 변화**:

- createEffect 사용: 최적화
- 테스트 시간: 단축
- 문서 길이: -50%

---

## 7. 작업 결과 평가

### 7.1 달성한 목표 ✅

1. **프로젝트 전반 점검 완료**
   - 소스 코드, 테스트, 문서 모두 분석
   - Preact 잔재 식별 (테스트 코드)
   - Orphan 모듈 1개 발견
   - TODO 주석 3개 발견
   - Deprecated 코드 20개 분류

2. **체계적 리팩토링 계획 수립**
   - Phase 10-12 3단계 계획 작성
   - 우선순위별 분류 (높음/중간/낮음)
   - 구체적 작업 범위 및 수용 기준 정의
   - 예상 메트릭 변화 산출

3. **문서 갱신 완료**
   - `TDD_REFACTORING_PLAN.md` Phase 10-12 추가
   - 린트 에러 수정 (MD024, MD032)
   - prettier 포맷팅 적용
   - 일관된 문서 구조 유지

4. **빌드 검증 완료**
   - 모든 문서 변경사항이 빌드에 영향 없음
   - 메트릭 변화 없음 (예상대로)
   - TypeScript 0 에러 유지
   - dependency-cruiser 경고 1개 확인 (focusScope)

### 7.2 발견된 개선 기회

**즉시 실행 가능**:

- focusScope-solid.ts 제거 (사용처 없음)
- TODO 주석 제거 (KeyboardHelpOverlay)
- 테스트 Preact 잔재 제거

**신중한 검토 필요**:

- Deprecated API 실사용 확인
- EventManager 클래스 영향 범위 분석
- DOMEventManager 대체 여부 확인

**장기 개선 항목**:

- createEffect 패턴 최적화
- 문서 길이 축소 (COMPLETED.md 50% 감소)
- 테스트 속도 개선

### 7.3 현재 상태 메트릭

| 항목               | 현재        | 목표 (Phase 12) | 차이   |
| ------------------ | ----------- | --------------- | ------ |
| Dev 빌드           | 1,029.24 KB | ~1,015 KB       | -14 KB |
| Prod 빌드          | 330.05 KB   | ~330 KB         | 유지   |
| gzip               | 88.33 KB    | ~88 KB          | 유지   |
| Orphan 모듈        | 1           | 0               | -1     |
| TODO 주석          | 3           | 0               | -3     |
| Deprecated 파일    | 3+          | 0-1             | -2~3   |
| 테스트 Preact 파일 | 5           | 0               | -5     |

---

## 8. 다음 단계 권장사항

### 8.1 즉시 착수 (Phase 10)

1. **Orphan 모듈 제거** (가장 쉬움, 1시간)
   - `focusScope-solid.ts` 삭제
   - dependency-cruiser 경고 0으로 만들기

2. **TODO 주석 해결** (2시간)
   - KeyboardHelpOverlay 관련 코드 제거
   - 또는 Solid 버전 구현 (선택)

3. **테스트 Preact 잔재 제거** (4-6시간)
   - 5개 파일 삭제
   - ~10개 테스트 Solid 전환
   - GREEN 유지 확인

### 8.2 단기 계획 (Phase 11, 1-2주)

1. **Deprecated 파일 실사용 확인**
   - toolbarConfig.ts: 즉시 제거 가능
   - DOMEventManager.ts: 사용처 검색 후 결정
   - events.ts EventManager: 영향 범위 분석

2. **Props/Methods 마이그레이션**
   - Button variant → intent 마이그레이션 가이드
   - getDiagnostics deprecated 태그 제거

### 8.3 중장기 계획 (Phase 12, 1개월)

1. **성능 프로파일링**
   - createEffect 사용 패턴 분석
   - 불필요한 재계산 측정
   - 벤치마크 수립

2. **문서 재작성**
   - COMPLETED.md 핵심 내용만 추출
   - Solid.js 베스트 프랙티스 추가
   - 예시 코드 업데이트

3. **테스트 최적화**
   - 실행 시간 측정
   - 중복 테스트 제거
   - 패턴 일관화

---

## 9. 리스크 및 제약사항

### 9.1 기술적 리스크

**테스트 Preact 제거**:

- 리스크: Solid 테스트 패턴 미숙으로 인한 테스트 누락
- 완화: @solidjs/testing-library 활용, 기존 테스트 참고

**Deprecated 코드 제거**:

- 리스크: 숨겨진 의존성으로 인한 런타임 에러
- 완화: grep 전체 검색, 단계적 제거, 충분한 테스트

**문서 대폭 축소**:

- 리스크: 중요 정보 손실
- 완화: 핵심 내용 보존, 별도 아카이브 생성

### 9.2 일정 리스크

**Phase 10 (1-2일)**:

- 비교적 단순한 제거 작업
- 리스크: 낮음

**Phase 11 (1주)**:

- 실사용 확인 필요
- 리스크: 중간 (예상보다 사용처 많을 수 있음)

**Phase 12 (2-3주)**:

- 최적화 효과 측정 어려움
- 리스크: 중간 (ROI 불확실)

### 9.3 제약사항

1. **TDD 워크플로 유지**
   - 모든 변경은 RED → GREEN → REFACTOR 순서
   - 테스트 없이 코드 변경 금지

2. **PC 전용 이벤트**
   - 터치/포인터 이벤트 추가 금지
   - 기존 정책 엄격히 준수

3. **디자인 토큰**
   - 하드코딩 색상 금지
   - `--xeg-*` 토큰만 사용

4. **Vendors getter**
   - Solid.js 직접 import 금지
   - Phase 9 정책 유지

---

## 10. 결론

### 10.1 주요 성과

1. **Preact → Solid.js 전환 후 잔재 완전 식별**
   - 소스 코드: ✅ 완료 (Phase 9)
   - 테스트 코드: ⚠️ 정리 필요 (Phase 10)

2. **체계적 리팩토링 로드맵 수립**
   - Phase 10-12 3단계 계획
   - 우선순위/범위/메트릭 명확화

3. **문서 품질 개선**
   - 현황 분석 보고서 작성
   - 리팩토링 계획 문서화
   - 린트/포맷팅 일관성 확보

### 10.2 권장사항

**즉시 시작**:

- Phase 10 작업 (1-2일)
- Orphan 모듈 및 TODO 제거

**검토 후 진행**:

- Phase 11 Deprecated 정리
- 실사용 여부 신중히 확인

**장기 계획**:

- Phase 12 최적화 및 문서화
- ROI 평가 후 우선순위 조정

### 10.3 최종 의견

프로젝트는 **Solid.js 전환을 성공적으로 완료**했으며, **코드 품질이 높은
수준**을 유지하고 있습니다.

Phase 10-12를 통해:

- 테스트 코드 Preact 잔재 제거 → **완전한 Solid.js 전환**
- Deprecated 코드 정리 → **유지보수성 향상**
- 성능 최적화 → **사용자 경험 개선**
- 문서 갱신 → **협업 효율성 증대**

를 달성할 수 있을 것으로 예상됩니다.

---

**작성자**: GitHub Copilot AI Agent **검토자**: 프로젝트 관리자 **승인일**:
2025-10-07 **다음 리뷰**: Phase 10 완료 후
