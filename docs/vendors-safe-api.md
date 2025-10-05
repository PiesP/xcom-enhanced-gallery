# Vendors Safe API 가이드 (getter/adapter)

> 외부 라이브러리/플랫폼 API를 안전하게 캡슐화하고 테스트에서 쉽게 모킹하기 위한
> 규약

**최근 업데이트**: 2025-10-06 **버전**: 0.2.4 **목표**: TDZ-safe 초기화, 경계
강화, 테스트 용이성

---

## 핵심 원칙

### ✅ 필수 패턴

- **항상 getter 사용**: `@shared/external/vendors`에서 `getSolidCore()`,
  `getSolidStore()`, `getSolidWeb()` 사용
- **Userscript는 adapter 경유**: `@shared/external/userscript/adapter`의
  `getUserscript()` 사용
- **테스트 모킹**: getter/어댑터 경유로 Vitest에서 간단히 모킹

### ❌ 금지 패턴

- `solid-js`, `fflate` 등 직접 import ❌
- `GM_*` API 직접 참조 ❌ (테스트/Node 환경 붕괴)
- TDZ 이전 벤더 API 접근 ❌

---

## SolidJS Native 패턴 (권장)

### Signal 생성 및 사용

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();

// ✅ Signal 생성 (네이티브 패턴)
const [count, setCount] = solid.createSignal(0);
const doubled = solid.createMemo(() => count() * 2);

// ✅ 부작용/구독
solid.createEffect(() => {
  console.log('Count:', count()); // 함수 호출로 값 읽기
});

// ✅ 업데이트
setCount(prev => prev + 1); // 함수로 업데이트
```

### Store 사용

```typescript
import { getSolidStore } from '@shared/external/vendors';

const store = getSolidStore();

// ✅ Store 생성
const [state, setState] = store.createStore({ value: 0 });

// ✅ 업데이트
setState('value', v => v + 1);
```

### 컴포넌트 렌더링

```typescript
import { getSolidWeb } from '@shared/external/vendors';

const web = getSolidWeb();

const App = () => <div>Count: {count()}</div>;

web.render(() => <App />, document.body);
```

---

## ⚠️ 레거시 패턴 (신규 코드 금지)

### createGlobalSignal (제거 예정)

```typescript
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

// ❌ 레거시 패턴 - 신규 코드에서 사용 금지
// Epic SOLID-NATIVE-001 완료 후 제거 예정
const countSignal = createGlobalSignal(0);

// Preact Signals 스타일 (호환성 유지 중)
countSignal.value = 42; // ❌ .value setter
const current = countSignal.value; // ❌ .value getter
countSignal.subscribe(cb); // ❌ .subscribe()
```

**신규 코드 작성 시**:

- `createGlobalSignal` → `getSolidCore().createSignal()` 사용
- `.value` → 함수 호출 `signal()` 사용
- `.subscribe()` → `createEffect()` 사용

---

## Userscript API 사용

### 다운로드

```typescript
import { getUserscript } from '@shared/external/userscript/adapter';

async function download(url: string, name: string) {
  await getUserscript().download(url, name); // GM_download 또는 폴백
}
```

### XHR 요청

```typescript
const response = await getUserscript().xhr({
  url: 'https://example.com/api',
  method: 'GET',
});
```

### 폴백 전략

- `GM_download` 미지원 시 → `getNativeDownload()` 사용
- XHR: 동일 출처 → `fetch`, 교차 출처 → `getUserscript().xhr` 우선

---

## 네트워크/도메인 정책

### @connect 정합성

- 교차 출처 요청 도메인은 Userscript 헤더 `@connect`에 명시
- 런타임 로깅/통계로 실제 접근 호스트 추적
- 예시: `x.com`, `api.twitter.com`, `pbs.twimg.com`, `video.twimg.com`

---

## 테스트 모킹 패턴

### Vitest 모킹

```typescript
import { vi } from 'vitest';

vi.mock('@shared/external/vendors', async orig => {
  const actual = await orig();
  return {
    ...actual,
    getSolidCore: () => ({
      createSignal: vi.fn(() => [vi.fn(), vi.fn()]),
      createEffect: vi.fn(),
      createMemo: vi.fn(),
      onCleanup: vi.fn(),
    }),
  };
});
```

### Feature Detection

```typescript
import { getSolidCore } from '@shared/external/vendors';

export function ensureSolidAvailable(): boolean {
  try {
    const solid = getSolidCore();
    return (
      typeof solid.createSignal === 'function' &&
      typeof solid.createEffect === 'function'
    );
  } catch {
    return false; // graceful degrade
  }
}
```

---

## Anti-Patterns 요약

### ❌ 직접 Import

```typescript
// ❌ 금지
import { createSignal } from 'solid-js';
import { zip } from 'fflate';

// ✅ 권장
import { getSolidCore } from '@shared/external/vendors';
const solid = getSolidCore();
const { createSignal } = solid;
```

### ❌ .value 접근

```typescript
// ❌ 금지 (Preact 스타일)
const count = createSignal(0);
count.value = 42;
console.log(count.value);

// ✅ 권장 (SolidJS Native)
const [count, setCount] = createSignal(0);
setCount(42);
console.log(count());
```

### ❌ .subscribe() 사용

```typescript
// ❌ 금지
signal.subscribe(value => console.log(value));

// ✅ 권장
createEffect(() => console.log(signal()));
```

---

## 체크리스트

- [ ] 외부 라이브러리 직접 import 없음
- [ ] `initializeVendors()` 호출 후 getter 사용
- [ ] Userscript API는 `getUserscript()` 경유
- [ ] Feature detection/에러 경계 구현
- [ ] 테스트에서 모킹으로 경계 가드
- [ ] SolidJS Native 패턴 사용 (`createGlobalSignal` 금지)

---

## 참조 문서

**필독**:

- [아키텍처 설계서](ARCHITECTURE.md) - 레이어 경계/외부 통합 계약
- [코딩 가이드라인](CODING_GUIDELINES.md) - 벤더 getter/PC 전용 입력 규칙
- [실행 가이드](../AGENTS.md) - 로컬/CI 워크플로

**테스트**:

- `test/integration/vendor-tdz-resolution.test.ts` - TDZ 안전성 검증
- `test/unit/shared/external/userscript-adapter.contract.test.ts` - 어댑터 계약

---

본 가이드는 외부 의존성 통합의 단일 소스입니다. 새로운 외부 라이브러리 추가 시
반드시 getter 패턴을 따르고, 테스트에서 모킹 가능하도록 설계하세요.
