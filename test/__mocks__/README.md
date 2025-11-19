# Test Mocking Modules Guide

Mocking modules for safely simulating external dependencies in the test
environment.

## 📁 Module Structure

### Environment Mocking

#### `test-environment.ts`

Test environment setup and cleanup helpers.

**Key Functions:**

- `setupTestEnvironment(mode?)`: Initialize test environment
  - `'minimal'`: Basic settings only
  - `'full'`: Enable full features
- `cleanupTestEnvironment()`: Clean up environment
- `getTestEnvironmentState()`: Get current environment state (for debugging)
- `isTestEnvironmentReady()`: Check initialization status

### API Mocking

#### `userscript-api.mock.ts`

Mock implementation for Tampermonkey APIs (`GM_*`).

**Features:**

- Mocks `GM_setValue`, `GM_getValue`, `GM_download`, etc.
- Tracks API calls for verification.

#### `twitter-dom.mock.ts`

Mock implementation for Twitter (X.com) DOM structure.

**Features:**

- Creates mock Tweets, Images, Videos.
- Simulates DOM structures found on X.com.
- Helper functions for creating complex DOM scenarios.
