# 🏗️ 아키텍처 설계 가이드라인

> **확장 가능하고 테스트 가능한 소프트웨어 아키텍처**

## 🎯 핵심 원칙

### 1. 관심사의 분리

- 각 모듈은 단일 책임을 가짐
- 비즈니스 로직과 UI 로직 분리
- 데이터 접근과 비즈니스 로직 분리

### 2. 의존성 역전

- 고수준 모듈이 저수준 모듈에 의존하지 않음
- 인터페이스를 통한 느슨한 결합
- 의존성 주입을 통한 테스트 가능성

### 3. 계층형 구조

```
Features (gallery, settings) → Shared (hooks, utils) → External (vendors)
```

## 🏛️ 계층 구조

### 계층별 책임

```typescript
// Features: 비즈니스 기능
features /
  gallery / // 갤러리 기능
  settings / // 설정 기능
  // Shared: 공통 모듈
  shared /
  components / // 재사용 컴포넌트
  hooks / // 커스텀 훅
  utils / // 유틸리티
  // External: 외부 의존성
  external /
  vendors.ts; // 라이브러리 접근 함수
```

### 의존성 규칙

```typescript
// ✅ 허용된 의존성
Features → Shared → External

// ❌ 금지된 의존성
Shared → Features     // 상위 계층 참조 금지
External → Shared     // 역방향 의존성 금지
Features ↔ Features   // 기능 간 직접 참조 금지
```

## 🔗 의존성 관리

### 인터페이스 기반 설계

```typescript
// 추상화 정의
interface MediaStorage {
  save(id: string, data: Blob): Promise<void>;
  load(id: string): Promise<Blob | null>;
}

// 비즈니스 로직
class GalleryService {
  constructor(private storage: MediaStorage) {}

  async saveMedia(media: MediaData): Promise<void> {
    await this.storage.save(media.id, media.blob);
  }
}

// 구현체 주입
const service = new GalleryService(new IndexedDBStorage());
```

### 외부 라이브러리 격리

```typescript
// shared/external/vendors.ts
export function getPreact() {
  return {
    render: window.preact.render,
    useState: window.preact.useState,
  };
}

// 사용
import { getPreact } from '@shared/external/vendors';
const { render } = getPreact();
```

## 📊 확장성 고려

### 플러그인 아키텍처

```typescript
interface GalleryPlugin {
  readonly name: string;
  initialize(context: GalleryContext): void;
  destroy(): void;
}

class GalleryManager {
  private plugins = new Map<string, GalleryPlugin>();

  registerPlugin(plugin: GalleryPlugin): void {
    this.plugins.set(plugin.name, plugin);
    plugin.initialize(this.context);
  }
}
```

### 설정 기반 동작

```typescript
interface GalleryConfig {
  readonly features: {
    readonly autoPlay: boolean;
    readonly showThumbnails: boolean;
  };
}

class ConfigurableGallery {
  constructor(private config: GalleryConfig) {}

  private shouldAutoPlay(): boolean {
    return this.config.features.autoPlay;
  }
}
```

---

**🏗️ 좋은 아키텍처는 변경에 유연하고 테스트하기 쉽습니다.**
