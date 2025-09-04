# TDD 기반 | Phase | 작업 | 상태 | 완료일 |

|-------|------|------|--------| | 0 | 기본 환경 정리 | ✅ | 2024-12-XX | | 1 |
디자인 토큰 3계층 시스템 | ✅ | 2024-12-XX | | 2 | UI 프리미티브 컴포넌트 | ✅ |
2024-12-XX | | 3 | MediaProcessor 도입 | ✅ | 2024-12-XX | | 4 | 애니메이션
규격화 | ✅ | 2024-12-XX | | 5 | Result 패턴 도입 | ✅ | 2024-12-XX | | 6 |
의존성 격리 검증 | ✅ | 2024-12-XX | | 7 | 레거시 정리 | ✅ | 2024-12-XX |

## 🎉 TDD 리팩토링 완료!

모든 Phase가 성공적으로 완료되었습니다. 각 단계에서 RED-GREEN-REFACTOR 사이클을
따라 안전하게 리팩토링을 진행했습니다.코드 현대화 리팩토링 계획

> 목적: UI/스타일/미디어 처리 관련 코드를 **간결 · 현대적 · 일관성 있게**
> 정비하면서 안정성을 TDD로 확보

---

## 1. 범위 & 우선순위

| Phase | 작업                     | 상태 | 완료일     |
| ----- | ------------------------ | ---- | ---------- |
| 0     | 기본 환경 정리           | ✅   | 2024-12-XX |
| 1     | 디자인 토큰 3계층 시스템 | ✅   | 2024-12-XX |
| 2     | UI 프리미티브 컴포넌트   | ✅   | 2024-12-XX |
| 3     | MediaProcessor 도입      | ✅   | 2024-12-XX |
| 4     | 애니메이션 규격화        | �    | -          |
| 5     | Result 패턴 도입         | 🟡   | -          |
| 6     | 의존성 격리 검증         | �    | -          |
| 7     | 레거시 정리              | �    | -          |

---

## 2. 현재 상태 요약 (압축)

- 네이밍/구조 간소화 1차 완료 (cleanup/\*.test.ts 확인)
- CSS 기반 애니메이션 전환 진행 (`animations.ts` → `css-animations` 위임)
- 전역 스타일: `globals.ts` 에서 토큰/리셋/격리 스타일 개별 import (구조
  양호하나 토큰 계층 의미 구분 부족)
- 서비스 초기화 흐름 명확하나 디자인/미디어 추출 로직 분리도 추가 개선 여지 있음

---

## 3. 리팩토링 원칙

1. TDD: 모든 변경은 실패하는 테스트 → 최소 구현 → 리팩토링
2. 타입 안정성: strict + 명시적 반환 타입 + Result 패턴
3. 격리: 외부 라이브러리는 getter (e.g. `getPreact()`)를 통한 접근만 허용
4. 점진성: 기능 단위 커밋, 번들 사이즈/리그레션 모니터링
5. 하위 호환: Deprecated 단계 (Warn) → Soft Removal → Removal (테스트로 보호)
6. PC 전용 입력만 (키보드/마우스) 유지

---

## 4. 영역별 옵션 분석 (요약)

### 4.1 디자인 토큰 구조

| 옵션                               | 설명                                                        | 장점                 | 단점                   | 결정    |
| ---------------------------------- | ----------------------------------------------------------- | -------------------- | ---------------------- | ------- |
| 단일 CSS 변수 파일                 | 현행 유지                                                   | 단순                 | 의미 계층 불명확       | ❌      |
| 2단 (primitive/semantic)           | 색/간격 primitive + semantic                                | 적정 복잡도          | 컴포넌트 재사용성 중간 | ❌      |
| 3단 (primitive/semantic/component) | Primitive(색/타이포/space) → Semantic(role) → Component전용 | 확장성/테마교체 용이 | 초기 정의 비용         | ✅ 채택 |

### 4.2 스타일 적용 방식

| 옵션 | 장점 | 단점 | 결정 | | CSS Modules (+토큰) | 트리쉐이킹, 명확한 scope |
클래스 생성 오버헤드 | ✅ | | CSS-in-JS (런타임) | 동적 테마 쉬움 | 런타임
비용/번들증가 | ❌ | | Utility 클래스 (Tailwind류) | 빠른 개발 |
종속성/학습/난독화 | ❌ |

### 4.3 컴포넌트 구조

- Primitive (Button, IconButton, Surface/Panel, Separator, VisuallyHidden)
- Compound (Toolbar, GalleryGrid, ToastContainer)
- 컨벤션: `ui/primitive/`, `ui/composite/`

### 4.4 MediaProcessor 설계 옵션

| 옵션 | 설명 | 장점 | 단점 | 결정 | | 파싱 함수 집합 | 여러 util 함수 조합 |
단순 | 상태/정책 분산 | ❌ | | 클래스 + 전략 | 규칙별 전략 객체 | 확장성 | 초기
과설계 위험 | ❌ | | 순수 함수 + 파이프라인 | 입력 DOM → 정규화 단계 배열 |
테스트 용이, 함수 합성 | 조건 분기 많을 시 주의 | ✅ |

### 4.5 에러 처리

| 전략 | 장점 | 단점 | 결정 | | throw 기반 | 간단 | 흐름 예측 어려움 | ❌ | |
Result<T,E> 유니온 | 타입 주도 제어 | 래핑 비용 | ✅ | | Either 모나드
라이브러리 | 선언적 | 외부 의존 증가 | ❌ |

### 4.6 애니메이션

- 현행 CSS 전환 유지
- 규칙: 진입 <= 300ms / 퇴장 <= 220ms / Easing 통일 `cubic-bezier(0.4,0,0.2,1)`
- Micro Interaction: Hover/Active 상태는 transform + opacity만 사용 (GPU
  friendly)

### 4.7 테스트 전략

| 레벨 | 대상 | 도구 | 비고 | | Unit | 토큰 파서, MediaProcessor 단계 함수 |
Vitest + JSDOM | 빠른 피드백 | | Component | Primitive/Composite 렌더 | Vitest +
@testing-library | 접근성 role 검사 | | Integration | 서비스 + MediaProcessor
연동 | 기존 integration suite 확장 | 실제 DOM 스냅샷 | | Contract | Deprecated
API 경고 유지 | 스냅샷/Spy | 제거 일정 관리 |

---

## 5. 선택된 아키텍처 개요

```mermaid
graph TD;
A[HTML DOM] --> B[MediaProcessor Pipeline];
B --> C[MediaDescriptor[]];
C --> D[State Signals];
D --> E[UI Components];
Tokens --> E;
AnimationUtils --> E;
Logger --> B;
```

### MediaDescriptor (초안)

```ts
interface MediaDescriptor {
  readonly id: string;
  readonly type: 'image' | 'video' | 'gif';
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly variants?: ReadonlyArray<{
    quality: 'orig' | 'large' | 'small';
    url: string;
  }>;
  readonly alt?: string;
}
```

---

## 6. TDD 단계별 구체 계획

### Phase 1: 디자인 토큰 계층화

1. 실패 테스트: `design-tokens.test.ts`
   - Primitive 변수 존재 (`--color-base-bg` 등)
   - Semantic 변수 → primitive fallback(resolve 함수) 검사
   - Component 변수 (예: `--gallery-toolbar-bg`)가 semantic 참조
2. 구현: 세 파일
   - `design-tokens.primitive.css`
   - `design-tokens.semantic.css`
   - `design-tokens.component.css`
3. 리팩터: 기존 `design-tokens.css` → index re-export + Rollup(or Vite) order
   보장
4. Metric: 중복 변수 < 3%, 사용되지 않는 토큰 0 (테스트에서 import 후 정규식
   매칭)

### Phase 2: UI Primitive

Tests (순서):

- `button.primitive.test.ts`: role=button, keyboard activation (Enter/Space)
  작동
- `icon-button.a11y.test.ts`: aria-label 필수 경고
- `panel.surface.test.ts`: class 네임스페이스 `xeg-` prefix 보장 Implementation
  최소화 후 스타일 토큰 적용 → variant 시스템 (size, intent) 추가 TDD 확장

### Phase 3: MediaProcessor

Pipeline 단계 (각 단계 개별 유닛테스트):

1. `collectNodes(root: HTMLElement): Element[]`
2. `extractRawData(el): RawCandidate` (data-\* / attr 파싱)
3. `normalize(raw[]): MediaDescriptor[]` (중복/품질 variant 정리)
4. `dedupe(list): list` (id+url 기준)
5. `validate(list): Result<MediaDescriptor[]>` Edge Cases:

- 빈 DOM → []
- 손상된 URL → 제외 + Logger warn
- 중복 variant 화질 선택 규칙: orig > large > small Integration Test:
  `media-processor.integration.test.ts`

### Phase 4: Animation 규칙 테스트

- `animation-presets.test.ts`: duration/easing 상수 규칙
- `micro-interaction.test.ts`: hover 클래스 적용 시 transform only 확인

### Phase 5: Result 기반 에러 처리

- 대상: Media Extraction, SettingsService 일부, GalleryRenderer 핵심 메서드
- 테스트: 이전 throw 경로 → now Result 실패 분기 확인
- 마이그레이션 가이드: `handleX()` 함수 내 `if(!res.success)` 패턴 강제

### Phase 6: Getter 일관화 검증

- 테스트: `external-getters.test.ts` → preact/fflate 등 직접 import 검색
  (정규식) 실패해야 통과
- 구현: 누락된 getter 추가 / 직접 import 제거

### Phase 7: Deprecated 제거

- 테스트: `deprecated-apis.test.ts` 초기에는 warnings spy → 마지막 단계 expect
  모듈 import 실패 (단계적 스냅샷)

---

## 7. 예시 테스트 (MediaProcessor RED 단계 샘플)

```ts
describe('MediaProcessor - 기본', () => {
  it('빈 컨테이너에서 빈 배열 반환', () => {
    const root = document.createElement('div');
    const result = processMedia(root); // 아직 미구현
    expect(result).toEqual([]);
  });
});
```

---

## 8. 커밋 & 브랜치 전략

- 브랜치 네이밍: `refactor/design-tokens`, `feat/media-processor`, ...
- 커밋 prefix:
  - test(...): 실패 테스트 추가
  - feat(...): 최소 구현 (Green)
  - refactor(...): 구조/성능 개선 (Green 유지)
  - chore(deps), docs(...)

---

## 9. 품질 메트릭

| 메트릭                         | 목표                                       |
| ------------------------------ | ------------------------------------------ |
| 디자인 토큰 테스트 커버리지    | 100% (존재/참조)                           |
| Primitive 컴포넌트 a11y 테스트 | 필수 role/키보드 100%                      |
| MediaProcessor 라인 커버리지   | ≥ 90%                                      |
| 번들 크기 감소                 | -15~20KB (dead code 제거 & 중복 토큰 제거) |
| 직접 외부 import 탐지          | 0건                                        |
| Deprecated API 수              | 단계별 100% → 0                            |

---

## 10. 위험 & 대응

| 위험                                     | 설명                      | 대응                                            |
| ---------------------------------------- | ------------------------- | ----------------------------------------------- |
| CSS 로드 순서 역전                       | 토큰 override 실패        | Vite entry 정렬 + 테스트에서 computedStyle 검사 |
| Media 중복 규칙 오류                     | Variant 품질 잘못 선택    | 우선순위 표 테스트화                            |
| Deprecated 제거로 서드파티 스크립트 깨짐 | 외부 사용자 숨어있는 사용 | 2단계 Deprecation 로그 + 문서                   |
| Getter 누락                              | 직접 import 잔존          | 정규식 기반 스캔 테스트                         |

---

## 11. Definition of Done (각 Phase)

- 모든 신규/수정 기능에 실패 테스트 선행
- Lint & TypeCheck 통과
- 관련 Doc 업데이트 (`TDD_REFACTORING_PLAN.md` 반영)
- 번들 분석(`bundle-analysis.js`) diff 검토 첨부 (주요 Phase)
- Deprecated 제거 전 1단계 경고 최소 1 릴리스 유지

---

## 12. 후속 개선 후보 (Out of Scope)

- 다크/라이트 테마 동적 전환 (현재: 정적 토큰)
- 애니메이션 사용성 설정 (Reduce Motion 사용자 설정 반영)
- Pre-render 캐싱 전략 (이미지 프리로드 큐)

---

## 13. 진행 상태 표기 규칙

- ✅ 완료 / 🔄 진행 중 / ⏳ 대기 / ⚠️ 위험 / 🚫 중단

초기 적용: Phase 0 ✅ (테스트 존재). Phase 1 착수 시 `design-tokens.test.ts`
(RED) 추가 후 본 문서 상태 갱신 예정.

---

## 14. 즉시 다음 액션 제안 (Phase 1 착수)

1. 테스트 추가: `test/styles/design-tokens.test.ts` (존재/참조 검사) [RED]
2. CSS 분리: primitives / semantic / component 작성 (빈 변수 선언) [RED 유지]
3. Semantic → primitive 참조 연결 후 GREEN
4. Component 토큰 참조 + UI primitive Button skeleton 적용 → 리팩터

---

본 계획은 리팩토링 진행 시 각 Phase 종료 후 갱신됩니다.
