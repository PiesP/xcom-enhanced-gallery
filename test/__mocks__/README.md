# 테스트 모킹 모듈 가이드# 테스트 모킹 모듈 가이드

테스트 환경에서 외부 의존성을 안전하게 모의하는 모킹 모듈들입니다.테스트
환경에서 외부 의존성을 안전하게 모의하는 모킹 모듈들입니다.

## 📁 모듈 구조## 📁 모듈 구조

### Storage Mocking#### `in-memory-storage-adapter.ts`

#### in-memory-storage-adapter.ts테스트 격리를 위한 인메모리 저장소 구현

테스트 격리를 위한 인메모리 저장소 구현**특징:**

- `StorageAdapter` 인터페이스 구현

**특징:**- 메모리 기반 저장 (격리된 테스트 환경)

- 테스트 헬퍼 메서드: `size()`, `has()`, `getAll()`

- `StorageAdapter` 인터페이스 구현

- 메모리 기반 저장 (격리된 테스트 환경)**사용 예시:**

- 테스트 헬퍼 메서드: `size()`, `has()`, `getAll()`

````typescript

**사용 예시:**import { InMemoryStorageAdapter } from '@test/__mocks__/in-memory-storage-adapter';



```typescriptit('should store and retrieve values', async () => {

import { InMemoryStorageAdapter } from '@test/__mocks__/in-memory-storage-adapter';  const storage = new InMemoryStorageAdapter();

  await storage.setItem('key', 'value');

it('should store and retrieve values', async () => {  const result = await storage.getItem('key');

  const storage = new InMemoryStorageAdapter();  expect(result).toBe('value');

  await storage.setItem('key', 'value');});

  const result = await storage.getItem('key');```

  expect(result).toBe('value');

});### Environment Mocking

````

#### `test-environment.ts`

### Environment Mocking

테스트 환경 설정 및 정리 헬퍼

#### test-environment.ts

**주요 함수:**

테스트 환경 설정 및 정리 헬퍼

- `setupTestEnvironment(mode?)`: 테스트 환경 초기화

**주요 함수:** - `'minimal'`: 기본 설정만

- `'full'`: 전체 기능 활성화

- `setupTestEnvironment(mode?)`: 테스트 환경 초기화
  - `'minimal'`: 기본 설정만- `cleanupTestEnvironment()`: 환경 정리

  - `'full'`: 전체 기능 활성화

- `getTestEnvironmentState()`: 현재 환경 상태 조회 (디버깅용)

- `cleanupTestEnvironment()`: 환경 정리

- `isTestEnvironmentReady()`: 초기화 여부 확인

- `getTestEnvironmentState()`: 현재 환경 상태 조회 (디버깅용)

**사용 예시:**

- `isTestEnvironmentReady()`: 초기화 여부 확인

````typescript

**사용 예시:**import {

  setupTestEnvironment,

```typescript  cleanupTestEnvironment,

import {} from '@test/__mocks__/test-environment';

  setupTestEnvironment,

  cleanupTestEnvironment,describe('My test suite', () => {

} from '@test/__mocks__/test-environment';  beforeEach(async () => {

    await setupTestEnvironment('full');

describe('My test suite', () => {  });

  beforeEach(async () => {

    await setupTestEnvironment('full');  afterEach(async () => {

  });    await cleanupTestEnvironment();

  });

  afterEach(async () => {

    await cleanupTestEnvironment();  it('should work', () => {

  });    // test code

  });

  it('should work', () => {});

    // test code```

  });

});### Userscript API Mocking

````

#### `userscript-api.mock.ts`

### Userscript API Mocking

브라우저 확장 API (GM\_\*) 모의 구현

#### userscript-api.mock.ts

**API 범주:**

브라우저 확장 API (GM\_\*) 모의 구현

| 범주 | 함수 |

**API 범주:**|------|------|

| **Storage** | `GM_getValue`, `GM_setValue`, `GM_deleteValue`, `GM_listValues`
|

| 범주 | 함수 || **Network** | `GM_xmlhttpRequest`, `GM_download` |

|------|------|| **UI** | `GM_notification`, `GM_openInTab` |

| **Storage** | `GM_getValue`, `GM_setValue`, `GM_deleteValue`, `GM_listValues`
|| **Menu** | `GM_registerMenuCommand`, `GM_unregisterMenuCommand`,
`GM_setClipboard` |

| **Network** | `GM_xmlhttpRequest`, `GM_download` || **Info** | `GM_info` |

| **UI** | `GM_notification`, `GM_openInTab` |

| **Menu** | `GM_registerMenuCommand`, `GM_unregisterMenuCommand`,
`GM_setClipboard` |**주요 함수:**

| **Info** | `GM_info` |

- `setupGlobalMocks()`: 글로벌 스코프에 Mock API 설정

**주요 함수:**

- `resetMockApiState()`: Mock 상태 초기화 (호출 기록, 큐 등)

- `setupGlobalMocks()`: 글로벌 스코프에 Mock API 설정

- `connectMockAPI()`: 상태 추적 기능 활성화

- `resetMockApiState()`: Mock 상태 초기화 (호출 기록, 큐 등)

- `clearMockStorage()`: 스토리지 전체 초기화

- `connectMockAPI()`: 상태 추적 기능 활성화

- `setMockStorageValue(key, value)`: 저장소 값 설정

- `clearMockStorage()`: 스토리지 전체 초기화

- `setupMockXMLHttpResponse(response)`: HTTP 응답 커스터마이즈

- `setMockStorageValue(key, value)`: 저장소 값 설정

**Mock 상태 추적:**

- `setupMockXMLHttpResponse(response)`: HTTP 응답 커스터마이즈

````typescript

**Mock 상태 추적:**export interface MockApiState {

  downloadQueue: Array<{ url: string; filename: string }>;

```typescript  notifications: Array<unknown>;

export interface MockApiState {  isAutoDownloadEnabled: boolean;

  downloadQueue: Array<{ url: string; filename: string }>;  lastDownloadCall: DownloadCall | null;

  notifications: Array<unknown>;}

  isAutoDownloadEnabled: boolean;```

  lastDownloadCall: DownloadCall | null;

}**사용 예시:**

````

````typescript

**사용 예시:**import {

  setupGlobalMocks,

```typescript  resetMockApiState,

import {  mockApiState,

  setupGlobalMocks,} from '@test/__mocks__/userscript-api.mock';

  resetMockApiState,

  mockApiState,describe('Download feature', () => {

} from '@test/__mocks__/userscript-api.mock';  beforeAll(() => {

    setupGlobalMocks();

describe('Download feature', () => {  });

  beforeAll(() => {

    setupGlobalMocks();  afterEach(() => {

  });    resetMockApiState();

  });

  afterEach(() => {

    resetMockApiState();  it('should track downloads', async () => {

  });    await GM_download('https://example.com/file.jpg', 'file.jpg');

    expect(mockApiState.downloadQueue).toHaveLength(1);

  it('should track downloads', async () => {    expect(mockApiState.lastDownloadCall?.filename).toBe('file.jpg');

    await GM_download('https://example.com/file.jpg', 'file.jpg');  });

    expect(mockApiState.downloadQueue).toHaveLength(1);});

    expect(mockApiState.lastDownloadCall?.filename).toBe('file.jpg');```

  });

});### DOM Mocking

````

#### `twitter-dom.mock.ts`

### DOM Mocking

X.com 페이지의 DOM 구조 모의 구현

#### twitter-dom.mock.ts

**템플릿 상수:**

X.com 페이지의 DOM 구조 모의 구현

- `TWITTER_BASE_DOM`: 기본 X.com 페이지 구조

**템플릿 상수:**- `TWEET_WITH_IMAGES_DOM`: 이미지가 포함된 트윗

- `TWEET_WITH_VIDEO_DOM`: 비디오가 포함된 트윗

- `TWITTER_BASE_DOM`: 기본 X.com 페이지 구조- 기타 다양한 트윗 구조 템플릿

- `TWEET_WITH_IMAGES_DOM`: 이미지가 포함된 트윗

- `TWEET_WITH_VIDEO_DOM`: 비디오가 포함된 트윗**헬퍼 함수:**

- 기타 다양한 트윗 구조 템플릿

- `simulateClick(element)`: PC 클릭 이벤트 시뮬레이션

**헬퍼 함수:**- `simulateKeypress(element, key)`: 키보드 이벤트 시뮬레이션

- `simulateClick(element)`: PC 클릭 이벤트 시뮬레이션**사용 예시:**

- `simulateKeypress(element, key)`: 키보드 이벤트 시뮬레이션

```````typescript

**사용 예시:**import { TWEET_WITH_IMAGES_DOM, simulateClick } from '@test/__mocks__/twitter-dom.mock';



```typescriptit('should handle tweet image gallery', () => {

import {  const container = document.createElement('div');

  TWEET_WITH_IMAGES_DOM,  container.innerHTML = TWEET_WITH_IMAGES_DOM;

  simulateClick,  document.body.appendChild(container);

} from '@test/__mocks__/twitter-dom.mock';

  const images = container.querySelectorAll('img');

it('should handle tweet image gallery', () => {  expect(images).toHaveLength(2); // 프로필 이미지 제외

  const container = document.createElement('div');

  container.innerHTML = TWEET_WITH_IMAGES_DOM;  simulateClick(images[0]);

  document.body.appendChild(container);  // test assertions

});

  const images = container.querySelectorAll('img');```

  expect(images).toHaveLength(2); // 프로필 이미지 제외

## 🔄 테스트 라이프사이클 패턴

  simulateClick(images[0]);

  // test assertions### 기본 패턴

});

``````typescript

import { beforeEach, afterEach, describe, it, expect } from 'vitest';

## 🔄 테스트 라이프사이클 패턴import { setupGlobalMocks, resetMockApiState } from '@test/__mocks__/userscript-api.mock';

import { setupTestEnvironment, cleanupTestEnvironment } from '@test/__mocks__/test-environment';

### 기본 패턴

describe('Feature', () => {

```typescript  beforeEach(async () => {

import { beforeEach, afterEach, describe, it, expect } from 'vitest';    // 환경 설정

import {    await setupTestEnvironment('full');

  setupGlobalMocks,    setupGlobalMocks();

  resetMockApiState,  });

} from '@test/__mocks__/userscript-api.mock';

import {  afterEach(async () => {

  setupTestEnvironment,    // 상태 정리

  cleanupTestEnvironment,    resetMockApiState();

} from '@test/__mocks__/test-environment';    await cleanupTestEnvironment();

  });

describe('Feature', () => {

  beforeEach(async () => {  it('should work', () => {

    // 환경 설정    // test code

    await setupTestEnvironment('full');  });

    setupGlobalMocks();});

  });```



  afterEach(async () => {### 선택적 패턴 (특정 Mock만 사용)

    // 상태 정리

    resetMockApiState();```typescript

    await cleanupTestEnvironment();import { InMemoryStorageAdapter } from '@test/__mocks__/in-memory-storage-adapter';

  });

describe('Storage feature', () => {

  it('should work', () => {  it('should persist data', async () => {

    // test code    const storage = new InMemoryStorageAdapter();

  });    await storage.setItem('theme', 'dark');

});    expect(await storage.getItem('theme')).toBe('dark');

```  });

});

### 선택적 패턴 (특정 Mock만 사용)```



```typescript## 📊 Mock 상태 디버깅

import { InMemoryStorageAdapter } from '@test/__mocks__/in-memory-storage-adapter';

### Mock API 상태 확인

describe('Storage feature', () => {

  it('should persist data', async () => {```typescript

    const storage = new InMemoryStorageAdapter();import { mockApiState, resetMockApiState } from '@test/__mocks__/userscript-api.mock';

    await storage.setItem('theme', 'dark');

    expect(await storage.getItem('theme')).toBe('dark');it('should debug mock state', () => {

  });  console.log('Current downloads:', mockApiState.downloadQueue);

});  console.log('Notifications:', mockApiState.notifications);

```});



## 📊 Mock 상태 디버깅afterEach(() => {

  resetMockApiState(); // 상태 초기화

### Mock API 상태 확인});

```````

````typescript

import {### 환경 상태 확인

  mockApiState,

  resetMockApiState,```typescript

} from '@test/__mocks__/userscript-api.mock';import {

  getTestEnvironmentState,

it('should debug mock state', () => {  isTestEnvironmentReady,

  console.log('Current downloads:', mockApiState.downloadQueue);} from '@test/__mocks__/test-environment';

  console.log('Notifications:', mockApiState.notifications);

});it('should check environment', () => {

  const state = getTestEnvironmentState();

afterEach(() => {  console.log('Environment initialized:', state.isInitialized);

  resetMockApiState(); // 상태 초기화  console.log('Mode:', state.mode);

});

```  const ready = isTestEnvironmentReady();

  expect(ready).toBe(true);

### 환경 상태 확인});

````

````typescript

import {## ✅ 체크리스트

  getTestEnvironmentState,

  isTestEnvironmentReady,모킹 모듈을 사용할 때 확인할 사항:

} from '@test/__mocks__/test-environment';

- [ ] 적절한 Mock 모듈 import 확인

it('should check environment', () => {- [ ] `beforeEach`에서 초기화, `afterEach`에서 정리 실행

  const state = getTestEnvironmentState();- [ ] Mock 상태 초기화 (중첩 테스트에서 격리 보장)

  console.log('Environment initialized:', state.isInitialized);- [ ] PC 전용 이벤트만 시뮬레이션 (touch/pointer 금지)

  console.log('Mode:', state.mode);- [ ] 디자인 토큰/색상 하드코딩 금지 (mock도 동일)



  const ready = isTestEnvironmentReady();## 🔗 관련 문서

  expect(ready).toBe(true);

});- [TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md): 테스트 전략

```- [CODING_GUIDELINES.md](../../docs/CODING_GUIDELINES.md): 코드 규칙

- [test/README.md](../README.md): 테스트 디렉터리 가이드

## ✅ 체크리스트

모킹 모듈을 사용할 때 확인할 사항:

- 적절한 Mock 모듈 import 확인
- `beforeEach`에서 초기화, `afterEach`에서 정리 실행
- Mock 상태 초기화 (중첩 테스트에서 격리 보장)
- PC 전용 이벤트만 시뮬레이션 (touch/pointer 금지)
- 디자인 토큰/색상 하드코딩 금지 (mock도 동일)

## 🔗 관련 문서

- [TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md): 테스트 전략
- [CODING_GUIDELINES.md](../../docs/CODING_GUIDELINES.md): 코드 규칙
- [test/README.md](../README.md): 테스트 디렉터리 가이드
````
