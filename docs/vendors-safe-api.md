# Vendors Safe API 가이드 (getter/adapter)

외부 라이브러리/플랫폼 API 접근을 안전하게 캡슐화하고 테스트에서 쉽게 모킹하기
위한 규약을 요약합니다. 목표는 TDZ-safe 초기화, 경계 강화, 테스트 용이성입니다.

## 핵심 원칙

- 직접 import 금지: solid-js / fflate 등은 코드에서 직접 import하지 않습니다.
- 항상 getter 사용: `@shared/external/vendors`는 SolidJS 전용 표면만 노출합니다.
  (`initializeVendors()`, `getSolidCore()`, `getSolidStore()`, `getSolidWeb()`,
  `getNativeDownload()`, `validateVendors()`, `cleanupVendors()` 등)
- Preact 계열 API는 완전히 제거되었습니다. 모든 구현은 SolidJS API를 사용합니다.
- Userscript API는 어댑터 경유: `@shared/external/userscript/adapter`의
  `getUserscript()`만 사용합니다.
  - 금지: 코드에서 `GM_*` API를 직접 참조/호출하지 않습니다.(테스트/Node 환경
    호환성, 폴백 경로 보호)
  - 폴백: GM_download 미지원 시 `getNativeDownload()` 사용. XHR은 동일 출처는
    fetch, 교차 출처는 `getUserscript().xhr` 우선.
- Feature detection: 필수 표면 존재/버전 체크 후 graceful degrade 분기(기능
  축소)를 적용합니다.
- 테스트 모킹 용이성: getter/어댑터 경유라 Vitest에서 모킹이 간단합니다.

## 예시: SolidJS Core/Store 사용 (네이티브 패턴)

```ts
import {
  initializeVendors,
  getSolidCore,
  getSolidStore,
  getSolidWeb,
} from '@shared/external/vendors';

await initializeVendors(); // TDZ-safe 초기화

const solid = getSolidCore();
const store = getSolidStore();
const web = getSolidWeb();

// Signal 생성 (네이티브 패턴)
const [count, setCount] = solid.createSignal(0);
const doubled = solid.createMemo(() => count() * 2);

// 부작용/구독 (네이티브 패턴)
solid.createEffect(() => {
  console.log('Count changed:', count());
});

// Store 생성
const [state, setState] = store.createStore({ value: 0 });

// 업데이트
setCount(previous => previous + 1);
setState('value', value => value + 1);

// 컴포넌트 렌더링
const App = () => {
  return <div>Count x2 = {doubled()}</div>;
};

web.render(() => <App />, document.body);
```

## 레거시 호환 레이어 (신규 코드에서는 사용 금지)

```ts
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

// ⚠️ 레거시 패턴 - 신규 코드에서는 사용하지 마세요
// Epic SOLID-NATIVE-001 완료 후 제거 예정
const countSignal = createGlobalSignal(0);

// Preact Signals 스타일 API (호환성을 위해 유지 중)
countSignal.value = 42; // setter
const current = countSignal.value; // getter
countSignal.subscribe(value => console.log(value)); // 구독
```

## 예시: Userscript 다운로드

```ts
import { getUserscript } from '@shared/external/userscript/adapter';

async function download(url: string, name: string) {
  const us = getUserscript();
  await us.download(url, name); // GM_download 또는 폴백 경유
}
```

## 네트워크/도메인 정책(@connect 정합성)

- 교차 출처 요청 도메인은 Userscript 헤더의 `@connect`에 모두 명시합니다.
- 런타임에서 실제 접근한 호스트를 로깅/통계하여 다음 릴리즈에서 동기화합니다.
- 예시(트위터): `x.com`, `api.twitter.com`, `pbs.twimg.com`, `video.twimg.com`,
  필요 시 `ton.twitter.com`.

## Feature detection 스텁

```ts
import { getSolidCore } from '@shared/external/vendors';

export function ensureSolidAvailable(): boolean {
  try {
    const solid = getSolidCore();
    return (
      typeof solid.createSignal === 'function' &&
      typeof solid.createEffect === 'function'
    );
  } catch {
    return false; // graceful degrade 경로로 분기
  }
}
```

## 테스트 모킹 패턴(Vitest)

```ts
// setup에서 SolidJS getter를 모킹
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

## 체크리스트

- [ ] 외부 라이브러리 직접 import 없음
- [ ] `initializeVendors()` 호출 후 getter 사용
- [ ] Userscript API는 `getUserscript()` 경유
- [ ] feature detection/에러 경계에서 graceful degrade
- [ ] 단위 테스트에서 모킹으로 경계 가드

## 연관 문서/테스트

- `docs/ARCHITECTURE.md` → 레이어 경계/외부 통합 계약
- `docs/CODING_GUIDELINES.md` → 벤더 getter/PC 전용 입력 규칙
- `test/integration/vendor-tdz-resolution.test.ts`

## Anti-Patterns

- solid-js, fflate 등을 직접 import (❌ 직접 import, ✅ getter 사용)
- 코드 상단에서 `GM_*`를 직접 참조(테스트/Node 환경 붕괴)
- TDZ 이후에만 접근해야 하는 벤더 API를 모듈 최상위에서 즉시 사용
- **SolidJS 네이티브 패턴 위반**:
  - `createSignal()`의 반환값을 `.value` 속성으로 접근 (❌ `count.value`, ✅
    `count()`)
  - `.subscribe()` 메서드 사용 (❌ `signal.subscribe(cb)`, ✅
    `createEffect(() => cb(signal()))`)
  - `createGlobalSignal()` 신규 사용 (레거시 호환 레이어 - Epic SOLID-NATIVE-001
    완료 후 제거 예정)
