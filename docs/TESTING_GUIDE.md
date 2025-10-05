# 테스트 가이드

> TDD 워크플로, 모킹 패턴, 테스트 전략 심화 가이드

**관련 문서**: [아키텍처](ARCHITECTURE.md) | [코딩 규칙](CODING_GUIDELINES.md) |
[실행/CI](../AGENTS.md)

---

## 📋 개요

이 프로젝트는 TDD(Test-Driven Development)를 핵심 원칙으로 삼고 있습니다. 모든
새로운 기능과 버그 수정은 테스트와 함께 진행합니다.

### 테스트 환경

- **프레임워크**: Vitest 3
- **환경**: JSDOM (기본 URL: `https://x.com`)
- **설정**: `test/setup.ts` 자동 로드 (폴리필/GM\_\* 모킹/벤더 초기화)
- **포함 경로**: `test/**/*.{test,spec}.{ts,tsx}`
- **타임아웃**: 테스트 20s, 훅 25s

---

## 🔴 RED → 🟢 GREEN → 🔵 REFACTOR

### Phase 1: RED (실패하는 테스트)

**목적**: 요구사항을 테스트로 명확히 정의

```typescript
// test/unit/services/my-service.contract.test.ts
import { describe, it, expect } from 'vitest';
import { MyService } from '@shared/services/MyService';

describe('MyService Contract', () => {
  it('should extract media URLs from tweet data', () => {
    // Arrange
    const service = new MyService();
    const mockTweetData = {
      media: [
        { url: 'https://pbs.twimg.com/media/abc.jpg' },
        { url: 'https://pbs.twimg.com/media/def.jpg' },
      ],
    };

    // Act
    const result = service.extractMediaUrls(mockTweetData);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('https://pbs.twimg.com');
  });
});
```

**체크리스트**:

- [ ] 테스트가 실제로 실패하는지 확인 (RED)
- [ ] 테스트 이름이 명확히 의도를 드러내는지 확인
- [ ] Arrange-Act-Assert 패턴 준수

### Phase 2: GREEN (최소 구현)

**목적**: 테스트를 통과시키는 최소한의 코드

```typescript
// src/shared/services/MyService.ts
export class MyService {
  extractMediaUrls(data: TweetData): string[] {
    return data.media?.map(m => m.url) ?? [];
  }
}
```

**체크리스트**:

- [ ] 테스트 통과 확인 (GREEN)
- [ ] 과도한 구현 지양 (YAGNI)
- [ ] 타입 안전성 확보

### Phase 3: REFACTOR (개선)

**목적**: 코드 품질 향상 (동작은 변경 없음)

```typescript
// src/shared/services/MyService.ts
import { logInfo, logWarn } from '@shared/logging';
import { isTrustedTwitterMediaHostname } from '@shared/utils/url-safety';

export class MyService {
  extractMediaUrls(data: TweetData): string[] {
    if (!data.media?.length) {
      logWarn('No media found in tweet data', { data });
      return [];
    }

    const urls = data.media
      .map(m => m.url)
      .filter(url => isTrustedTwitterMediaHostname(url));

    logInfo('Extracted media URLs', { count: urls.length });
    return urls;
  }
}
```

**체크리스트**:

- [ ] 테스트 여전히 GREEN
- [ ] 에러 처리 추가
- [ ] 로깅 추가
- [ ] 보안 검증 추가
- [ ] 타입 개선

---

## 🧪 테스트 종류와 전략

### 1. 계약 테스트 (Contract Tests)

**목적**: 인터페이스 계약 준수 검증

```typescript
// test/unit/services/media-service.contract.test.ts
describe('MediaService Contract', () => {
  it('should implement required interface', () => {
    const service = new MediaService();

    expect(service.extractMediaUrls).toBeDefined();
    expect(service.downloadSingle).toBeDefined();
    expect(typeof service.extractMediaUrls).toBe('function');
  });

  it('should return array for valid input', () => {
    const service = new MediaService();
    const result = service.extractMediaUrls(mockData);

    expect(Array.isArray(result)).toBe(true);
  });
});
```

### 2. 단위 테스트 (Unit Tests)

**목적**: 개별 함수/메서드 동작 검증

```typescript
// test/unit/utils/url-safety.test.ts
import { isTrustedTwitterMediaHostname } from '@shared/utils/url-safety';

describe('URL Safety Utils', () => {
  it('should accept valid Twitter media URL', () => {
    const url = 'https://pbs.twimg.com/media/abc.jpg';
    expect(isTrustedTwitterMediaHostname(url)).toBe(true);
  });

  it('should reject malicious URL with path injection', () => {
    const url = 'https://evil.com/twimg.com/malicious.js';
    expect(isTrustedTwitterMediaHostname(url)).toBe(false);
  });
});
```

### 3. 통합 테스트 (Integration Tests)

**목적**: 여러 컴포넌트 간 상호작용 검증

```typescript
// test/integration/gallery-activation.test.ts
import { GalleryRenderer } from '@features/gallery/GalleryRenderer';
import { MediaService } from '@shared/services/MediaService';

describe('Gallery Activation Integration', () => {
  it('should extract and render media items', async () => {
    // Arrange
    const container = document.createElement('div');
    const renderer = new GalleryRenderer();
    const mockData = createMockTweetData();

    // Act
    await renderer.activate(container, mockData);

    // Assert
    const items = container.querySelectorAll('[data-testid="media-item"]');
    expect(items).toHaveLength(2);
  });
});
```

### 4. 접근성 테스트 (Accessibility Tests)

**목적**: WCAG AA 준수 검증

```typescript
// test/accessibility/keyboard-navigation.test.tsx
import { render, fireEvent } from 'solid-testing-library';
import { GalleryShell } from '@features/gallery/SolidGalleryShell';

describe('Keyboard Navigation Accessibility', () => {
  it('should navigate with arrow keys', () => {
    const { container } = render(() => <GalleryShell items={mockItems} />);

    fireEvent.keyDown(container, { key: 'ArrowRight' });

    expect(container.querySelector('[aria-current="true"]')).toHaveAttribute(
      'data-index',
      '1'
    );
  });

  it('should have proper ARIA labels', () => {
    const { container } = render(() => <GalleryShell items={mockItems} />);

    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-label', 'Media gallery');
  });
});
```

---

## 🎭 모킹 패턴

### Vendor Getters 모킹

```typescript
import { vi } from 'vitest';
import * as vendors from '@shared/external/vendors';

describe('Component with SolidJS', () => {
  beforeEach(() => {
    vi.spyOn(vendors, 'getSolidCore').mockReturnValue({
      createSignal: vi.fn(() => [vi.fn(), vi.fn()]),
      createEffect: vi.fn(),
      createMemo: vi.fn(),
      onCleanup: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use mocked SolidJS', () => {
    const solid = vendors.getSolidCore();
    const [signal, setSignal] = solid.createSignal(0);

    expect(solid.createSignal).toHaveBeenCalled();
  });
});
```

### Userscript API 모킹

```typescript
import { vi } from 'vitest';
import * as adapter from '@shared/external/userscript/adapter';

describe('Download Service', () => {
  beforeEach(() => {
    vi.spyOn(adapter, 'getUserscript').mockReturnValue({
      hasGM: true,
      manager: 'tampermonkey',
      download: vi.fn().mockResolvedValue(undefined),
      xhr: vi.fn(),
      info: vi.fn(() => ({ script: { name: 'Test' } })),
    });
  });

  it('should download using mocked GM', async () => {
    const us = adapter.getUserscript();
    await us.download('https://example.com/file.jpg', 'file.jpg');

    expect(us.download).toHaveBeenCalledWith(
      'https://example.com/file.jpg',
      'file.jpg'
    );
  });
});
```

### DOM 모킹

```typescript
import { vi } from 'vitest';

describe('DOM Interaction', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.setAttribute('data-testid', 'test-element');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  it('should find element by test ID', () => {
    const element = document.querySelector('[data-testid="test-element"]');
    expect(element).toBeTruthy();
  });
});
```

---

## 📐 테스트 구조 가이드

### 파일 배치

```text
test/
├─ unit/                    # 단위 테스트
│  ├─ services/
│  ├─ utils/
│  └─ components/
├─ integration/             # 통합 테스트
├─ accessibility/           # 접근성 테스트
├─ architecture/            # 아키텍처 규칙 테스트
├─ security/                # 보안 테스트
└─ __mocks__/               # 공통 모킹 유틸리티
```

### 네이밍 규칙

- **단위 테스트**: `<component-name>.test.ts(x)`
- **계약 테스트**: `<service-name>.contract.test.ts`
- **통합 테스트**: `<feature-name>.integration.test.ts`
- **접근성 테스트**: `<component-name>.accessibility.test.tsx`

### Describe 블록 구조

```typescript
describe('ComponentName', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {});
  });

  describe('user interactions', () => {
    it('should handle click events', () => {});
    it('should handle keyboard events', () => {});
  });

  describe('error handling', () => {
    it('should display error message on failure', () => {});
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {});
  });
});
```

---

## 🔍 커버리지 전략

### 목표

- **전체 커버리지**: ≥80%
- **핵심 서비스**: ≥90%
- **유틸리티**: ≥95%

### 커버리지 실행

```pwsh
npm run test:coverage
```

### 커버리지 예외

```typescript
/* istanbul ignore next */
function legacyFallback() {
  // 레거시 지원 코드 (커버리지 제외)
}
```

---

## 🚨 테스트 실패 디버깅

### 1. 격리 실행

```pwsh
# 특정 파일만
npx vitest run test/unit/services/my-service.test.ts

# 특정 테스트만 (패턴)
npm test -- -t "should extract media URLs"
```

### 2. Watch 모드

```pwsh
npm run test:watch
```

### 3. 디버그 로그

```typescript
import { logDebug } from '@shared/logging';

it('should do something', () => {
  const result = myFunction();
  logDebug('Debug result', { result }); // 테스트 로그 출력
  expect(result).toBe(expected);
});
```

### 4. 스냅샷 업데이트

```pwsh
npm test -- -u
```

---

## 📚 참고 문서

- TDD 백로그: [`TDD_REFACTORING_BACKLOG.md`](TDD_REFACTORING_BACKLOG.md)
- TDD 플랜: [`TDD_REFACTORING_PLAN.md`](TDD_REFACTORING_PLAN.md)
- 완료 로그:
  [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)
- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 보안 가이드: [`SECURITY_GUIDE.md`](SECURITY_GUIDE.md)

---

본 가이드는 테스트 전략의 단일 소스입니다. 새로운 테스트 패턴이나 모범 사례가
발견되면 이 문서를 업데이트하세요.
