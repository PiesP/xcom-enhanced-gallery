# Vendors Safe API 가이드 (getter/adapter)

외부 라이브러리/플랫폼 API 접근을 안전하게 캡슐화하고 테스트에서 쉽게 모킹하기
위한 규약을 요약합니다. 목표는 TDZ-safe 초기화, 경계 강화, 테스트 용이성입니다.

## 핵심 원칙

- 직접 import 금지: preact / @preact/signals / fflate / preact/compat 등은
  코드에서 직접 import하지 않습니다.
- 항상 getter 사용: `@shared/external/vendors`는 Solid 전용 표면만 노출합니다.
  (`initializeVendors()`, `getSolidCore()`, `getSolidStore()`, `getSolidWeb()`,
  `getNativeDownload()`, `validateVendors()`, `cleanupVendors()` 등)
- Stage D Phase 3부터 Preact 계열 API는 `@shared/external/vendors/preact-legacy`
  네임스페이스로 이동했습니다. 레거시 코드 유지 목적에 한해 사용하고, 신규
  구현은 Solid API로 전환합니다.
- Userscript API는 어댑터 경유: `@shared/external/userscript/adapter`의
  `getUserscript()`만 사용합니다.
  - 금지: 코드에서 `GM_*` API를 직접 참조/호출하지 않습니다.(테스트/Node 환경
    호환성, 폴백 경로 보호)
  - 폴백: GM_download 미지원 시 `getNativeDownload()` 사용. XHR은 동일 출처는
    fetch, 교차 출처는 `getUserscript().xhr` 우선.
- Feature detection: 필수 표면 존재/버전 체크 후 graceful degrade 분기(기능
  축소)를 적용합니다.
- 테스트 모킹 용이성: getter/어댑터 경유라 Vitest에서 모킹이 간단합니다.

## 예시: Solid Core/Store 사용

```ts
import {
  initializeVendors,
  getSolidCore,
  getSolidStore,
} from '@shared/external/vendors';

await initializeVendors(); // TDZ-safe 초기화

const solidCore = getSolidCore();
const solidStore = getSolidStore();

const [count, setCount] = solidCore.createSignal(0);
const [state, setState] = solidStore.createStore({ value: 0 });

setCount(previous => previous + 1);
setState('value', value => value + 1);
```

### 레거시 예시: Preact/Signals 사용 (이관 중)

```ts
import {
  getPreact,
  getPreactSignals,
} from '@shared/external/vendors/preact-legacy';

const { h, render } = getPreact();
const { signal, computed } = getPreactSignals();

const count = signal(0);
const doubled = computed(() => count.value * 2);

function App() {
  return h('div', null, `x2 = ${doubled.value}`);
}

render(h(App, null), document.body);
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
import { getPreact } from '@shared/external/vendors/preact-legacy';

export function ensureLegacyPreactAvailable(): boolean {
  try {
    const { h, render } = getPreact();
    return typeof h === 'function' && typeof render === 'function';
  } catch {
    return false; // graceful degrade 경로로 분기
  }
}
```

## 테스트 모킹 패턴(Vitest)

```ts
// setup에서 레거시 Preact getter를 모킹 (Solid 표면은 그대로 유지)
vi.mock('@shared/external/vendors/preact-legacy', async orig => {
  const actual = await orig();
  return {
    ...actual,
    getPreact: () => ({ h: vi.fn(), render: vi.fn() }),
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

- preact, @preact/signals, fflate 등을 직접 import
- 코드 상단에서 `GM_*`를 직접 참조(테스트/Node 환경 붕괴)
- TDZ 이후에만 접근해야 하는 벤더 API를 모듈 최상위에서 즉시 사용
