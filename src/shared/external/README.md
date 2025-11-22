# 🔌 External API Layer (Shared)

## 📋 개요

**목적**: 외부 라이브러리(Solid.js) 및 Tampermonkey API에 대한 **통합 배럴
export 계층** 제공

**아키텍처 위치**: Shared Layer의 기반 인프라 (`src/shared/external/`)

**설계 원칙**:

- ✅ 배럴 export만 사용 (`@shared/external`, `@shared/external/vendors`,
  `@shared/external/userscript`)
- ✅ 내부 구현 파일 직접 import 금지 (getter 파일, 관리자 등)
- ✅ Service Layer 패턴 준수 (Phase 309+)
- ✅ 금지 패턴 강제 (ESLint를 통한 자동 감지)

**관리 주기**:

- **내부 구현**: vendor-api-safe.ts → Safe 접미사 자동 제거 후 배럴 export
- **타입 정의**: vendor-types.ts → 배럴 export (공개)
- **Singleton**: vendor-manager-static.ts → @internal 마킹 (테스트/디버깅만)

---

## 📁 디렉토리 구조

```
src/shared/external/
├── 📄 index.ts                 # 최상위 배럴 export (모든 공개 API)
├── 📄 README.md                # 이 문서
│
├── 📂 vendors/                 # Solid.js & 외부 라이브러리 (Getter)
│   ├── 📄 index.ts             # ✅ 공개 배럴 export
│   ├── 📄 vendor-api-safe.ts   # ⛔ 내부: TDZ-safe wrapper (Safe → 제거됨)
│   ├── 📄 vendor-manager-static.ts  # ⛔ 내부: Singleton 관리자
│   └── 📄 vendor-types.ts      # ✅ 공개: 타입 정의
│
├── 📂 userscript/              # Tampermonkey & 환경 감지
│   ├── 📄 index.ts             # ✅ 공개 배럴 export
│   ├── 📄 adapter.ts           # ⛔ 내부: GM_* API getter
│   └── 📄 environment-detector.ts  # ⛔ 내부: 환경 감지 로직
│
├── 📂 zip/                     # ZIP 파일 생성 유틸리티
│   ├── 📄 index.ts             # ✅ 공개 배럴 export
│   ├── 📄 zip-creator.ts       # ⛔ 내부: 핵심 구현
│   ├── 📄 store-zip-writer.ts  # ⛔ 내부: STORE 방식
│   └── 📄 streaming-zip-writer.ts  # ⛔ 내부: 스트리밍 (optional)
│
└── 📂 test/                    # ⛔ 테스트 인프라 (@internal)
    ├── 📄 README.md            # 테스트 헬퍼 상세 가이드
    ├── 📄 test-environment-config.ts  # 테스트 모드 설정
    └── 📄 test-service-factory.ts     # Mock/Real 서비스 팩토리
```

**범례**:

- ✅ 공개 배럴 export (사용 권장)
- ⛔ 내부 구현 (직접 import 금지)
- 📍 우선순위

---

## 📚 사용 가이드

### 🎯 빠른 참조 (3가지 사용 패턴)

#### 패턴 1: Vendor Getter (Solid.js)

```typescript
// ✅ 배럴 export 사용 (권장)
import { getSolid, initializeVendors } from '@shared/external/vendors';

// 초기화
await initializeVendors();

// Solid.js API 사용
const { createSignal, createMemo } = getSolid();
const [count, setCount] = createSignal(0);

// ❌ 금지: 내부 파일 직접 import
import { getSolidSafe } from '@shared/external/vendors/vendor-api-safe'; // 금지!
```

#### 패턴 2: Userscript API (우선순위 순서)

```typescript
// 1️⃣ 우선: Service Layer 사용 (권장)
import { PersistentStorage, NotificationService } from '@shared/services';

const storage = PersistentStorage.getInstance();
await storage.set('user-theme', 'dark');

const notif = NotificationService.getInstance();
notif.success('설정 저장됨');

// 2️⃣ 고급/테스트: Getter 사용
import { getUserscript, detectEnvironment } from '@shared/external/userscript';

const env = detectEnvironment();
if (env.isGMAvailable) {
  const us = getUserscript();
  // 매우 드문 경우: GM_* API 직접 확인
}

// 3️⃣ 절대 금지: 직접 GM 호출
GM_setValue('key', value); // ❌ 금지!
```

#### 패턴 3: ZIP 유틸리티

```typescript
// ✅ 배럴 export 사용
import { createZipBytesFromFileMap } from '@shared/external/zip';
import { DownloadService } from '@shared/services';

// ZIP 생성
const zipBytes = await createZipBytesFromFileMap(
  {
    'photo1.jpg': buffer1,
    'photo2.jpg': buffer2,
    'video.mp4': buffer3,
  },
  { compressionLevel: 0 } // STORE 방식 (추가 압축 없음)
);

// 다운로드
const downloadService = DownloadService.getInstance();
await downloadService.downloadBlob({
  blob: new Blob([zipBytes], { type: 'application/zip' }),
  name: 'media.zip',
});
```

---

### 1️⃣ Vendor Getter (Solid.js 접근)

**언제 사용**: Solid.js API가 필요한 컴포넌트/훅에서

**✅ 올바른 사용**:

```typescript
// ✅ 배럴 export 경로
import { getSolid } from '@shared/external/vendors';

// ✅ getter로 동기 접근
const { createSignal, createMemo } = getSolid();

// ✅ 초기화 필요 시
import { initializeVendors } from '@shared/external/vendors';
await initializeVendors();
```

**❌ 잘못된 사용**:

```typescript
// ❌ 내부 파일 직접 import
import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static';

// ❌ Solid 직접 import (금지)
import { createSignal } from 'solid-js';
```

**관련 파일**:

- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
- `src/features/gallery/hooks/useGalleryScroll.ts`

---

### 2️⃣ Userscript API (Tampermonkey 접근)

**언제 사용**: GM\_\* API 접근이 필요할 때

**원칙**: **서비스 레이어** 사용 (Phase 309+)

**✅ 올바른 방식 (권장)**:

```typescript
// ✅ Service Layer를 통한 간접 접근
import { PersistentStorage } from '@shared/services';
const storage = PersistentStorage.getInstance();
await storage.set('key', value);

import { NotificationService } from '@shared/services';
const notif = NotificationService.getInstance();
notif.success('작업 완료');
```

**🔧 getter로 직접 접근 (고급/테스트용)**:

```typescript
// 🔧 테스트/디버깅 시에만 사용
import { getUserscript } from '@shared/external/userscript';
const userscript = getUserscript();
const value = await userscript.getValue('key');

// 환경 감지 (선택)
import {
  detectEnvironment,
  isGMAPIAvailable,
} from '@shared/external/userscript';
if (isGMAPIAvailable()) {
  console.log('Tampermonkey API 사용 가능');
}
```

**❌ 금지된 패턴 (ESLint로 자동 감지)**:

```typescript
// ❌ 금지 1: 내부 파일 직접 import
import { getSolidSafe } from '@shared/external/vendors/vendor-api-safe';
import { getUserscript } from '@shared/external/userscript/adapter';
import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static';

// ❌ 금지 2: GM_* API 직접 호출
GM_setValue('key', value);       // PersistentStorage 사용
GM_notification({ text: '...' }); // NotificationService 사용
GM_download({ ... });            // DownloadService 사용

// ❌ 금지 3: Solid.js 직접 import
import { createSignal } from 'solid-js'; // getSolid() 사용

// ❌ 금지 4: 상대 경로 import
import { getSolid } from '@shared/external/vendors'; // @shared/external 사용
```

**🔒 Service Layer 매핑** (Phase 309+):

| 기능         | Tampermonkey           | Service Layer         | 파일                      | 이점              |
| ------------ | ---------------------- | --------------------- | ------------------------- | ----------------- |
| **저장**     | `GM_setValue/getValue` | `PersistentStorage`   | `persistent-storage.ts`   | 타입 안전, 캐싱   |
| **알림**     | `GM_notification`      | `NotificationService` | `notification-service.ts` | 일관된 UI         |
| **다운로드** | `GM_download`          | `DownloadService`     | `download-service.ts`     | 진행률, 에러 처리 |
| **HTTP**     | `fetch` (MV3)          | `HttpRequestService`  | `http-request-service.ts` | CORS, 타임아웃    |

**참고**: [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - Phase 309+ Service
Layer 상세 설명

---

### 3️⃣ ZIP 유틸리티

**언제 사용**: 여러 미디어 파일을 ZIP으로 압축할 때

**사용 예**:

```typescript
// ✅ 배럴 export 경로
import {
  createZipBytesFromFileMap,
  type MediaItemForZip,
} from '@shared/external/zip';

// 미디어 아이템 준비
const mediaItems: MediaItemForZip[] = [
  { url: 'https://...', filename: 'photo1.jpg' },
  { url: 'https://...', filename: 'photo2.jpg' },
];

// ZIP 생성
const zipBytes = await createZipBytesFromFileMap(mediaItems, {
  compressionLevel: 0,
  maxFileSize: 50000000,
});

// 다운로드
await downloadService.downloadBlob({
  blob: new Blob([zipBytes], { type: 'application/zip' }),
  name: 'media.zip',
});
```

---

---

## 🔐 정책 및 설계 원칙

### 배럴 Export 정책 (엄격함)

**목적**: 내부 구현 세부사항 숨김, 공개 API만 노출

**허용된 경로** ✅:

```typescript
// 최상위 배럴
import { getSolid, initializeVendors } from '@shared/external';
import { getSolid } from '@shared/external/vendors';

// 서브 배럴
import { getUserscript, detectEnvironment } from '@shared/external/userscript';
import { createZipBytesFromFileMap } from '@shared/external/zip';

// 타입 import
import type { SolidAPI, EnvironmentInfo } from '@shared/external';
```

**금지된 경로** ❌:

```typescript
// 내부 구현 파일 직접 import (ESLint 자동 감지)
import { getSolidSafe } from '@shared/external/vendors/vendor-api-safe';
import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static';
import { UserscriptAdapterImpl } from '@shared/external/userscript/adapter';

// Vendor 직접 import
import { createSignal } from 'solid-js'; // getSolid() 사용
```

### API 계층화 원칙

**3단계 우선순위**:

```
1️⃣  Service Layer (권장) ⭐⭐⭐
    └─ PersistentStorage, NotificationService, DownloadService
    └─ 이점: 타입 안전, 에러 처리, 테스트 용이

2️⃣  Vendor Getter (고급/테스트) ⭐⭐
    └─ getSolid(), getUserscript(), detectEnvironment()
    └─ 사용처: 특수한 상황, 디버깅, 테스트

3️⃣  직접 GM 호출 (금지) ⭐
    └─ GM_setValue, GM_download 등
    └─ 절대 사용 금지!
```

### 타입 안전성 원칙

**배럴 export에서 타입 명시**:

```typescript
// ✅ 배럴에서 타입 export
export type { SolidAPI, EnvironmentInfo } from './vendors';

// ✅ 사용처에서 type import
import type { SolidAPI } from '@shared/external/vendors';
const api: SolidAPI = getSolid();

// ❌ 타입 정의 파일 직접 import
import type { SolidAPIImpl } from '@shared/external/vendors/vendor-types';
```

### 내부 구현 마킹 (@internal)

**규칙**:

```typescript
/**
 * @internal 테스트/디버깅만
 * 일반 사용자는 getSolid() 함수를 사용하세요.
 */
export { StaticVendorManager } from './vendor-manager-static';
```

**ESLint Rule** (설정됨):

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {
      patterns: [
        '**/external/vendors/vendor-*',  // 내부 파일 금지
        '**/external/userscript/adapter',
        '**/external/zip/store-*',
      ],
      message: '배럴 export를 사용하세요: @shared/external/vendors',
    },
  ],
}
```

❌ Direct GM\_\* 호출 (금지) └─ GM_setValue(), GM_notification() 등

````

---

## 📖 API 레퍼런스

### `@shared/external/vendors`

```typescript
// 초기화
export async function initializeVendors(): Promise<void>;

// Solid.js getter
export function getSolid(): SolidAPI;
export function getSolidStore(): SolidStoreAPI;
export function getNativeDownload(): NativeDownloadAPI;

// 타입
export type SolidAPI = { ... };
export type SolidStoreAPI = { ... };
export type NativeDownloadAPI = { ... };

// 검증/상태
export function validateVendors(): Record<string, boolean>;
export function getVendorVersions(): Record<string, string>;
export function isVendorsInitialized(): boolean;
export function isVendorInitialized(name: string): boolean;
export function getVendorStatuses(): Record<string, boolean>;
export function getVendorInitializationReport(): string;

// 정리/테스트
export function cleanupVendors(): void;
export function registerVendorCleanupOnUnload(): void;

// 고급 (테스트/디버깅만)
export { StaticVendorManager } from './vendor-manager-static';
````

### `@shared/external/userscript`

```typescript
// Getter
export function getUserscript(): UserscriptAPI;

// 환경 감지
export function detectEnvironment(): EnvironmentInfo;
export function isGMAPIAvailable(): boolean;
export function getEnvironmentDescription(): string;

// 타입
export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): GMUserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
}

export interface EnvironmentInfo {
  isUserscriptEnvironment: boolean;
  isTestEnvironment: boolean;
  isBrowserExtension: boolean;
  isBrowserConsole: boolean;
  availableGMAPIs: string[];
  environment: 'userscript' | 'test' | 'extension' | 'console';
}
```

### `@shared/external/zip`

```typescript
// ZIP 생성
export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  config: ZipCreationConfig
): Promise<Uint8Array>;

// 타입
export interface MediaItemForZip {
  url: string;
  originalUrl?: string;
  filename?: string;
}

export interface ZipCreationConfig {
  compressionLevel: number;
  maxFileSize: number;
  requestTimeout: number;
  maxConcurrent: number;
}
```

---

## 🔍 관련 문서

- **[ARCHITECTURE.md](../../docs/ARCHITECTURE.md)** - 전체 아키텍처 및 Service
  Layer
- **[CODING_GUIDELINES.md](../../docs/CODING_GUIDELINES.md)** - 코딩 규칙 및
  패턴
- **[copilot-instructions.md](.../../.github/copilot-instructions.md)** - AI
  개발 지침

---

## 🎯 최적화 이력

| Phase     | 변경 사항                         | 상태 |
| --------- | --------------------------------- | ---- |
| 309+      | Service Layer 패턴 도입           | ✅   |
| 318.1     | GM_xmlHttpRequest 제거 (MV3 호환) | ✅   |
| Phase 370 | 배럴 export 정책 명확화           | ✅   |
| Phase 373 | GM_xmlhttpRequest 복원            | ✅   |

---

**마지막 업데이트**: 2025-11-06 (Phase 370+)
