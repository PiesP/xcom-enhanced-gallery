# 🧪 Test Infrastructure (Internal)

**Purpose**: Test environment configuration and service factory pattern for
mock/real implementation selection

**Policy**:

- 🔒 Internal implementation (within `src/`, Git tracked)
- 📦 No barrel export (direct imports required)
- 🧬 Test-driven development (TDD) and integration testing
- 🔄 Conditional mock vs real service selection

---

## 📁 File Structure

```
test/
├── test-environment-config.ts   # Test environment configuration management
├── test-service-factory.ts      # Mock/Real service factory pattern
└── README.md                    # This file
```

---

## 🔧 API Guide

### test-environment-config.ts

**Purpose**: Manage global test environment configuration

**Key Functions**:

```typescript
// Test mode control
enableTestMode(options?: TestModeOptions): TestEnvironmentConfig;
disableTestMode(): TestEnvironmentConfig;
isTestModeEnabled(): boolean;

// Configuration management
getTestConfig(): TestEnvironmentConfig;
setTestConfig(config: Partial<TestEnvironmentConfig>): TestEnvironmentConfig;
resetTestConfig(): TestEnvironmentConfig;

// Metadata tracking
setCurrentTest(testName: string): void;
clearCurrentTest(): void;
getTestMetadata(): TestMetadata;
isTestFeatureEnabled(feature: keyof TestModeOptions): boolean;
```

**Usage Example**:

```typescript
import {
  enableTestMode,
  getTestConfig,
} from '@shared/external/test/test-environment-config';

// Enable test mode
enableTestMode({
  mockServices: true,
  autoCleanup: true,
  verbose: true,
});

// Query configuration
const config = getTestConfig();
console.log(config.enabled); // true
console.log(config.options.mockServices); // true
```

---

### test-service-factory.ts

**Purpose**: Conditionally select mock or real service implementations based on
test environment

**Key Functions**:

```typescript
// Implementation selection
getServiceImplementation(
  serviceName: string,
  options?: ServiceFactoryOptions
): 'mock' | 'real';

// Service creation
createConditionalService<T>(
  serviceName: string,
  realImpl: () => T,
  mockImpl: () => T,
  options?: ServiceFactoryOptions
): T;

// Status querying
getServiceStatus(serviceName: string, options?: ServiceFactoryOptions): ServiceStatus;
getAllServiceStatuses(serviceNames: string[]): ServiceStatus[];

// Assertion helpers
assertServiceIsMock(serviceName: string, options?: ServiceFactoryOptions): void;
assertServiceIsReal(serviceName: string, options?: ServiceFactoryOptions): void;
```

**Selection Priority**:

```
1️⃣  Custom selector (highest)
    ↓
2️⃣  forceMock / forceReal
    ↓
3️⃣  Test mode + mockServices option
    ↓
4️⃣  Default: 'real'
```

**Usage Example**:

```typescript
import { createConditionalService } from '@shared/external/test/test-service-factory';
import { enableTestMode } from '@shared/external/test/test-environment-config';

// Enable test mode
enableTestMode({ mockServices: true });

// Conditionally create service
const httpService = createConditionalService(
  'HttpRequestService',
  () => new HttpRequestService(), // Real implementation
  () => new MockHttpRequestService() // Mock implementation
  // options omitted: auto-detects test mode
);

// Or with explicit override
const forceRealService = createConditionalService(
  'StorageService',
  () => new PersistentStorage(),
  () => new MockPersistentStorage(),
  { forceReal: true } // Use real even in test mode
);
```

---

## 📊 Test Configuration Options

### TestModeOptions

```typescript
interface TestModeOptions {
  /** Enable mock services globally */
  mockServices: boolean;

  /** Enable detailed test logging */
  verbose: boolean;

  /** Automatically cleanup after each test */
  autoCleanup: boolean;

  /** Simulate network delays in tests */
  simulateNetworkDelay: boolean;

  /** Network delay in milliseconds */
  networkDelayMs: number;
}
```

**Usage Example**:

```typescript
enableTestMode({
  mockServices: true,
  verbose: true,
  autoCleanup: true,
  simulateNetworkDelay: false,
  networkDelayMs: 0,
});
```

---

## 🔍 Usage Patterns

### Pattern 1: Automatic Test Mode Detection

```typescript
// src/shared/testing/test-setup-helpers.ts
import {
  enableTestMode,
  setCurrentTest,
  clearCurrentTest,
} from '@shared/external/test/test-environment-config';

export function beforeEach(testName: string) {
  enableTestMode({ mockServices: true });
  setCurrentTest(testName);
}

export function afterEach() {
  clearCurrentTest();
}
```

### Pattern 2: Conditional Service Creation

```typescript
// Test code
import { createConditionalService } from '@shared/external/test/test-service-factory';

const storage = createConditionalService(
  'PersistentStorage',
  () => PersistentStorage.getInstance(), // Real
  () => MockPersistentStorage.getInstance() // Mock
  // Test mode: mock | Production mode: real
);
```

### Pattern 3: Mock Enforcement & Validation

```typescript
import {
  createConditionalService,
  assertServiceIsMock,
} from '@shared/external/test/test-service-factory';

describe('Mock service test', () => {
  it('should use mock implementation', () => {
    const service = createConditionalService(
      'HttpService',
      () => new HttpRequestService(),
      () => new MockHttpRequestService(),
      { forceMock: true }
    );

    // Verify: Is mock?
    assertServiceIsMock('HttpService', { forceMock: true });
  });
});
```

---

## �️ Architecture & Policy

### Location & Scope

- **Location**: `src/shared/external/test/`
- **Scope**: Internal source code (Git tracked)
- **Usage**: `src/shared/testing/`, test code only
- **Barrel Export**: None (direct path imports required)

### Principles

1. **Test Helpers Only**: Must not be used in production code
2. **Conditional Creation**: Mock/Real selection controlled by developer
3. **Selection Priority**: custom selector > force flags > testMode > default
4. **Error Handling**: Surface creation errors immediately (no hidden fallback)

### Forbidden Patterns

```typescript
// ❌ WRONG: Using in production code
import { createConditionalService } from '@shared/external/test';

// ❌ WRONG: Barrel import (no barrel export)
import { enableTestMode } from '@shared/external/test';

// ✅ CORRECT: Direct path imports
import { enableTestMode } from '@shared/external/test/test-environment-config';
import { createConditionalService } from '@shared/external/test/test-service-factory';
```

---

## 🔗 Related Documentation

- 📘 **[../README.md](../README.md)** - Parent directory overview
- 📙 **[../../../../docs/ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)** -
  Project architecture
- 📕
  **[../../../../docs/CODING_GUIDELINES.md](../../../../docs/CODING_GUIDELINES.md)** -
  Coding standards

---

**Last Updated**: 2025-11-06 (Phase 371)
