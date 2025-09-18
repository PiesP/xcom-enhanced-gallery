# 테스트 가이드

X.com Enhanced Gallery의 새로운 테스트 아키텍처 가이드입니다.

## 🎯 핵심 원칙

### 1. 테스트 프레임워크

- **Vitest** 사용 (describe, it, expect, vi)
- TypeScript 지원
- 빠른 실행 속도

### 2. DOM 시뮬레이션

- `document.body.innerHTML`을 사용하여 실제 X.com 페이지 구조 모방
- 실제 브라우저 환경과 유사한 테스트 환경 제공

### 3. API 모의(Mocking)

- 모든 유저스크립트 API (GM\__, chrome._ 등) 완전 모의 처리
- 실제 API 호출 금지 → 안전하고 예측 가능한 테스트

### 4. 행위 중심 테스트

- 사용자 관점에서 "무엇을 해야 하는가" 검증
- 내부 구현이 아닌 결과와 행동에 집중

## 📁 디렉토리 구조

```
test/
├── __mocks__/                    # Mock 구현체들
│   ├── userscript-api.mock.ts   # GM_* API 모의
│   ├── twitter-dom.mock.ts      # X.com DOM 구조 모의
│   └── browser-environment.mock.ts # 브라우저 환경 모의
├── utils/
│   └── helpers/
│       └── test-environment.ts  # 테스트 환경 설정 헬퍼
├── unit/                        # 단위 테스트
│   ├── shared/
│   │   └── services/
│   │       └── MediaExtractionService.test.ts
│   └── features/
├── integration/                 # 통합 테스트
│   └── full-workflow.test.ts
├── behavioral/                  # 행위 중심 테스트
│   └── user-interactions.test.ts
└── setup.ts                    # 전역 테스트 설정
```

## 🛠️ 사용법

### 기본 테스트 실행

```bash
# 모든 테스트 실행
npm run test

# 특정 카테고리만 실행
npx vitest test/unit           # 단위 테스트만
npx vitest test/integration    # 통합 테스트만
npx vitest test/behavioral     # 행위 테스트만

# 감시 모드로 실행
npm run test:watch

# 커버리지와 함께 실행
npm run test:coverage
```

### 테스트 환경 설정

각 테스트에서 필요한 환경을 설정할 수 있습니다:

```typescript
import { setupTestEnvironment } from '../utils/helpers/test-environment';

beforeEach(async () => {
  // 환경 타입 선택
  await setupTestEnvironment('minimal'); // 기본 DOM만
  await setupTestEnvironment('browser'); // DOM + 브라우저 API
  await setupTestEnvironment('component'); // DOM + Twitter 구조
  await setupTestEnvironment('full'); // 모든 환경 + 샘플 데이터
});
```

## 📝 테스트 작성 가이드

### 1. 행위 중심 테스트 예시

```typescript
describe('트윗 이미지 클릭 시', () => {
  it('갤러리가 열려야 한다', async () => {
    // Given: 이미지가 포함된 트윗이 있을 때
    const container = setupTwitterDOM();
    const tweet = addTweetWithImages(container);
    const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

    // When: 사용자가 이미지를 클릭하면
    simulateClick(imageElement);

    // Then: 갤러리 모달이 나타나야 한다
    await wait(100);
    const galleryModal = document.querySelector('[data-testid="photoModal"]');
    expect(galleryModal).toBeTruthy();
  });
});
```

### 2. 단위 테스트 예시

```typescript
describe('extractImageUrls', () => {
  it('트윗에서 이미지 URL들을 정확히 추출해야 한다', () => {
    // Given: 이미지가 포함된 트윗 데이터
    const tweetData = {
      entities: {
        media: [
          {
            type: 'photo',
            media_url_https: 'https://pbs.twimg.com/media/test1.jpg',
          },
        ],
      },
    };

    // When: 이미지 URL을 추출하면
    const result = extractImageUrls(tweetData);

    // Then: 모든 이미지 URL이 추출되어야 한다
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('test1.jpg:large');
  });
});
```

### 3. 통합 테스트 예시

```typescript
describe('기본 이미지 다운로드 워크플로우', () => {
  it('사용자가 트윗 이미지를 클릭하여 갤러리를 열고 다운로드까지 완료해야 한다', async () => {
    // Given: 설정된 환경
    setMockStorageValue('downloadPath', '/test/downloads');

    // When: 사용자 액션 시뮬레이션
    const container = setupTwitterDOM();
    const tweet = addTweetWithImages(container);
    const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

    simulateClick(imageElement);
    await wait(100);
    simulateKeypress('d');
    await wait(100);

    // Then: 전체 플로우 검증
    expect(mockUserscriptAPI.GM_download).toHaveBeenCalled();
  });
});
```

## 🎭 Mock 사용법

### 유저스크립트 API Mock

```typescript
import {
  mockUserscriptAPI,
  setMockStorageValue,
} from '../__mocks__/userscript-api.mock';

// GM_getValue 응답 설정
setMockStorageValue('autoDownload', 'true');

// GM_download 호출 검증
expect(mockUserscriptAPI.GM_download).toHaveBeenCalledWith(
  expect.stringContaining('pbs.twimg.com'),
  expect.stringContaining('.jpg')
);
```

### DOM Mock

```typescript
import {
  setupTwitterDOM,
  addTweetWithImages,
  simulateClick,
} from '../__mocks__/twitter-dom.mock';

// Twitter DOM 구조 설정
const container = setupTwitterDOM();

// 트윗 추가
const tweet = addTweetWithImages(container);

// 사용자 상호작용 시뮬레이션
const imageElement = tweet.querySelector('img');
simulateClick(imageElement, { ctrlKey: true });
```

## 🔍 디버깅 팁

### 1. 테스트 격리 확인

각 테스트는 완전히 격리되어야 합니다:

```typescript
afterEach(async () => {
  await cleanupTestEnvironment(); // 항상 정리
});
```

### 2. 비동기 처리

DOM 변화나 네트워크 요청 후에는 적절한 대기:

```typescript
// DOM 변화 대기
await wait(100);

// 또는 특정 요소 출현 대기
await waitForDOMChange('[data-testid="modal"]');
```

### 3. Mock 상태 확인

```typescript
// Mock 호출 횟수 확인
expect(mockUserscriptAPI.GM_download).toHaveBeenCalledTimes(2);

// Mock 초기화
vi.clearAllMocks();
```

## 🚀 성능 최적화

### 1. 병렬 실행

- Vitest가 자동으로 테스트를 병렬 실행
- 무거운 테스트는 `describe.sequential()` 사용

### 2. 선택적 환경 설정

- 필요한 최소한의 환경만 설정
- 'minimal' → 'browser' → 'component' → 'full' 순으로 무거워짐

### 3. Mock 재사용

- 공통 Mock은 `__mocks__` 디렉토리에 정의
- 테스트별 특별한 설정만 개별 구현

## 📋 체크리스트

### 패턴/이름 기반 부분 실행 (주의 사항)

`npm run test -- -t "pattern"` 형태로 실행할 때 npm이 `-t`를 cli/env config 로
잘못 해석하여 경고(`Unknown cli config "--t"`)와 함께 필터가 적용되지 않는
현상이 관찰되었습니다. 안정적으로 필터를 적용하려면 다음 중 하나를 사용하세요:

```bash
# 1. npx로 직접 vitest 실행 (추천)
npx vitest run -t "toolbar grouping"

# 2. 정확한 파일 경로 지정 (패턴 불필요)
npx vitest run test/toolbar/toolbar-groups.a11y.test.tsx

# 3. 여러 파일 (스페이스 구분)
npx vitest run test/toolbar/toolbar-groups.a11y.test.tsx test/toolbar/toolbar-groups.focus-order.test.tsx

# 4. describe/it 이름 일부 매칭
npx vitest run -t "focus order"
```

NOTE:

- `npm test -- -t pattern`을 꼭 써야 한다면 package.json scripts에 별도 래퍼
  스크립트를 두어(`"test:vitest": "vitest"`) `npm run test:vitest -- -t pattern`
  형태로 우회할 수 있습니다.
- CI에서는 전체 스위트 실행으로 필터 문제를 피합니다.
- 필터가 적용되었는지 확실하지 않다면 vitest 출력 상단의 `filter:` 라벨과
  `No test files found` 메시지 여부를 확인하세요.

새 테스트 작성 시 확인 사항:

- [ ] 적절한 테스트 카테고리 선택 (unit/integration/behavioral)
- [ ] Given-When-Then 구조 사용
- [ ] 실제 API 호출 없이 Mock 사용
- [ ] 사용자 관점의 테스트 시나리오
- [ ] 적절한 환경 설정 및 정리
- [ ] 비동기 처리 대기
- [ ] 의미 있는 테스트 이름

이 가이드를 따라 작성된 테스트는 안정적이고, 빠르며, 유지보수가 쉬운 코드가 될
것입니다.
