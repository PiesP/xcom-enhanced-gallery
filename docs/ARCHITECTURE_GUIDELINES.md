# 🏗️ X.com Enhanced Gallery - Architecture Guidelines

> **유저스크립트 프로젝트를 위한 간결한 아키텍처 가이드**

## 📋 목차

1. [설계 원칙](#설계-원칙)
2. [프로젝트 구조](#프로젝트-구조)
3. [의존성 규칙](#의존성-규칙)
4. [외부 라이브러리 격리](#외부-라이브러리-격리)
5. [PC 환경 최적화](#pc-환경-최적화)

---

## 🎯 설계 원칙

### 핵심 철학

1. **단순성 우선 (Simplicity First)**
   - 유저스크립트에 적합한 간결한 구조
   - 과도한 추상화 제거
   - 명확하고 직관적인 코드

2. **PC 환경 전용**
   - 터치 기반 인터랙션 완전 제거
   - 마우스/키보드 중심 인터페이스
   - 데스크톱 브라우저 성능 최적화

3. **외부 의존성 격리**
   - 모든 외부 라이브러리를 격리 계층에서 관리
   - 라이브러리 교체 및 업데이트 용이성
   - 테스트 가능한 구조

4. **번들 크기 최소화**
   - 250KB 미만 유지
   - Tree-shaking 최적화
   - 불필요한 기능 제거

## 🏛️ 프로젝트 구조

### 디렉토리 구조

```
src/
├── features/                 # 기능별 모듈
│   ├── gallery/             # 갤러리 기능
│   └── settings/            # 설정 관리
├── shared/                   # 공통 재사용 모듈
│   ├── components/          # UI 컴포넌트
│   ├── hooks/               # 커스텀 훅
│   ├── utils/               # 유틸리티
│   ├── services/            # 비즈니스 서비스
│   ├── state/               # 상태 관리
│   └── external/            # 외부 라이브러리 격리
└── main.ts                  # 진입점
```

### 계층별 역할

- **Features**: 도메인별 비즈니스 기능 (갤러리, 설정 등)
- **Shared**: 여러 기능에서 재사용되는 공통 요소
- **External**: 외부 라이브러리 및 브라우저 API 격리

---

## 🔗 의존성 규칙

### 단방향 의존성

```
Features → Shared → External
```

- **Features**는 Shared와 External에서 import 가능
- **Shared**는 External에서만 import 가능
- **External**은 자체 완결형 (외부 라이브러리만 의존)

### 금지된 의존성

```typescript
// ❌ 기능 간 직접 의존
import { GalleryService } from '@features/gallery';

// ✅ Shared를 통한 통신
import { MediaService } from '@shared/services';
```

---

## � 외부 라이브러리 격리

### 격리 원칙

모든 외부 라이브러리는 반드시 `@shared/external/vendors`를 통해서만 접근:

```typescript
// ❌ 직접 import 금지
import { render } from 'preact';
import { deflate } from 'fflate';

// ✅ 격리된 접근
import { getPreact, getFflate } from '@shared/external/vendors';

const { render } = getPreact();
const { deflate } = getFflate();
```

### 현재 사용 라이브러리

| 라이브러리          | 용도          | 크기 |
| ------------------- | ------------- | ---- |
| **Preact**          | UI 프레임워크 | ~3KB |
| **@preact/signals** | 상태 관리     | ~2KB |
| **fflate**          | ZIP 압축      | ~8KB |

---

## 💻 PC 환경 최적화

### 지원 이벤트

```typescript
// ✅ PC 환경 전용 이벤트
interface PCEvents {
  onClick: (event: MouseEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onWheel: (event: WheelEvent) => void;
  onContextMenu: (event: MouseEvent) => void;
}

// ❌ 터치 이벤트 사용 금지
// onTouchStart, onTouchMove, onTouchEnd 등
```

### 키보드 단축키

```typescript
const SUPPORTED_KEYS = {
  ESCAPE: 'Escape', // 갤러리 닫기
  ARROW_LEFT: 'ArrowLeft', // 이전 이미지
  ARROW_RIGHT: 'ArrowRight', // 다음 이미지
  F: 'f', // 전체화면
} as const;
```

### 마우스 인터랙션

```typescript
// 마우스 휠 스크롤
function handleWheel(event: WheelEvent) {
  if (event.deltaY > 0) {
    selectNext();
  } else {
    selectPrevious();
  }
}
```

---

## 📊 성능 최적화

### 번들 크기 관리

- **목표**: 250KB 미만 유지
- **Tree-shaking**: 사용하지 않는 코드 자동 제거
- **지연 로딩**: 필요시에만 모듈 로딩

### 메모리 관리

```typescript
// 이미지 캐시 관리
interface ImageCache {
  maxSize: number; // 최대 캐시 크기
  evictionPolicy: 'LRU'; // 제거 정책
}

// 컴포넌트 정리
useEffect(() => {
  return () => {
    // 이벤트 리스너 제거
    // 타이머 정리
    // 메모리 해제
  };
}, []);
```

---

## � 아키텍처 검증

### 의존성 검사

```bash
# 순환 의존성 검사
npm run deps:check

# 번들 크기 분석
npm run build:analyze
```

### 품질 기준

- **타입 안전성**: strict TypeScript 모드
- **코드 품질**: ESLint + Prettier
- **번들 크기**: < 250KB
- **로딩 시간**: < 1초
- **PC 전용**: 터치 이벤트 0개

---

<div align="center">

**🏗️ "Simplicity is the ultimate sophistication." - Leonardo da Vinci**

</div>
