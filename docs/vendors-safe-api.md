# Vendors Safe API 가이드 (getter/adapter 패턴)

외부 라이브러리/플랫폼 API 접근을 안전하게 캡슐화하고 테스트에서 쉽게 모킹하기
위한 규약을 요약합니다. 목표는 TDZ-safe 초기화, 경계 강화, 테스트 용이성입니다.

## 핵심 원칙

- 직접 import 금지: preact / @preact/signals / fflate / preact/compat 등은
  코드에서 직접 import하지 않습니다.
- 항상 getter 사용: `@shared/external/vendors`의 `initializeVendors()` 및
  `getPreact()`, `getPreactSignals()`, `getFflate()`, `getPreactCompat()`,
  `getNativeDownload()`로만 접근합니다.
- Userscript API는 어댑터 경유: `@shared/external/userscript/adapter`의
  `getUserscript()`만 사용합니다.
- Feature detection: 필수 표면 존재/버전 체크 후 graceful degrade 분기(기능
  축소)를 적용합니다.
- 테스트 모킹 용이성: getter/어댑터 경유라 Vitest에서 모킹이 간단합니다.

## 예시: Preact/Signals 사용

```ts
import {
  initializeVendors,
  getPreact,
  getPreactSignals,
} from '@shared/external/vendors';

initializeVendors(); // TDZ-safe 초기화

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

## Feature detection 스텁

```ts
import { getPreact } from '@shared/external/vendors';

export function ensurePreactAvailable(): boolean {
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
// setup에서 벤더 초기화 이전에 모킹(또는 전용 모듈로 주입)
vi.mock('@shared/external/vendors', async orig => {
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

- `docs/ARCHITECTURE.md` → 1장 레이어 경계, 8장 외부 통합 계약
- `docs/CODING_GUIDELINES.md` → 벤더 getter/PC 전용 입력 규칙
- `test/integration/vendor-tdz-resolution.test.ts`
