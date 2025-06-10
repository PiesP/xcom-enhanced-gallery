# 🛠️ X.com Enhanced Gallery 기술 스택

> **트위터(X) 미디어 확장 프로그램의 기술 스택과 아키텍처 문서**

## 📋 기술 스택 개요

### 🎯 핵심 프레임워크

| 기술                | 버전     | 역할                                                  |
| ------------------- | -------- | ----------------------------------------------------- |
| **Preact**          | v10.26.8 | 메인 UI 프레임워크 - React 호환 경량 라이브러리 (3KB) |
| **@preact/signals** | v2.2.0   | 반응형 상태 관리 - 세분화된 반응성으로 성능 최적화    |
| **TypeScript**      | v5.8.3   | 타입 안전성 및 개발 생산성                            |
| **fflate**          | v0.8.2   | ZIP 파일 생성 및 압축 - 순수 JavaScript 라이브러리    |

### 🔧 개발 도구

| 도구         | 버전                 | 용도                                 |
| ------------ | -------------------- | ------------------------------------ |
| **Vite**     | rolldown-vite@6.3.18 | 빌드 시스템 - Rolldown 백엔드 최적화 |
| **Vitest**   | v3.2.2               | 유닛 테스트 프레임워크               |
| **ESLint**   | v9.28.0              | 코드 품질 검사                       |
| **Prettier** | v3.5.3               | 코드 포맷팅                          |

## 🏗️ 아키텍처 계층

### 계층별 책임 구조

```
App Layer (애플리케이션)
    ↓ depends on
Features Layer (기능 모듈)
    ↓ depends on
Shared Layer (공통 컴포넌트)
    ↓ depends on
Core Layer (비즈니스 로직)
    ↓ depends on
Infrastructure Layer (외부 의존성)
```

### 📁 디렉토리 구조와 책임

#### **Infrastructure Layer** (`src/infrastructure/`)

```
infrastructure/
├── browser/          # 브라우저 API 추상화
├── logging/          # 로깅 및 모니터링
└── storage/          # 로컬 스토리지 관리
```

**책임**: 외부 시스템과의 인터페이스, 브라우저 API 래핑

#### **Core Layer** (`src/core/`)

```
core/
├── state/            # Preact Signals 상태 관리
├── services/         # 비즈니스 서비스
├── constants/        # 전역 상수
└── types/           # 핵심 타입 정의
```

**책임**: 비즈니스 로직, 도메인 모델, 상태 관리

#### **Shared Layer** (`src/shared/`)

```
shared/
├── components/       # 재사용 가능한 UI 컴포넌트
├── hooks/           # 커스텀 훅
├── utils/           # 유틸리티 함수
└── types/           # 공통 타입
```

**책임**: 재사용 가능한 컴포넌트, 공통 로직, 외부 라이브러리 래퍼

#### **Features Layer** (`src/features/`)

```
features/
├── gallery/         # 갤러리 뷰어 기능
├── media/           # 미디어 추출 및 처리
├── app/            # 애플리케이션 통합
└── [future]/       # 향후 기능 확장
```

**책임**: 비즈니스 기능 구현, 사용자 인터랙션 처리

#### **App Layer** (`src/app/`)

```
app/
└── configurations   # 앱 설정 및 부트스트랩
```

**책임**: 애플리케이션 초기화, 전역 설정

## ⚡ 성능 최적화 전략

### 1. **코드 분할**

```typescript
// 지연 로딩을 통한 번들 크기 최적화
const { GalleryManager } = await import('@features/gallery/GalleryManager');
```

### 2. **상태 최적화**

```typescript
// Preact Signals - 세분화된 반응성
const selectedMedia = signal<MediaItem | null>(null);
const galleryItems = signal<MediaItem[]>([]);
```

### 3. **외부 라이브러리 관리**

```typescript
// Vendor Wrapper 패턴으로 번들 크기 최적화
export function getFflate() {
  return window.fflate; // 전역 객체에서 안전하게 접근
}
```

## 🎨 스타일링 시스템

### CSS 변수 기반 테마 시스템

```css
:root {
  /* 색상 */
  --xeg-color-primary: #1d9bf0;
  --xeg-color-secondary: #536471;

  /* 간격 (8px 기반) */
  --xeg-spacing-xs: 4px;
  --xeg-spacing-md: 16px;

  /* Z-index */
  --xeg-z-gallery: 9999;
  --xeg-z-modal: 10000;
}
```

### CSS Modules

- 스타일 격리 및 컴포넌트별 스코핑
- 개발: `[name]__[local]__[hash:base64:5]`
- 프로덕션: `[hash:base64:8]`

## 🔒 타입 안전성

### TypeScript 엄격 모드

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noImplicitReturns": true
}
```

### 타입 계층 구조

- **Infrastructure Types**: 브라우저 API 타입
- **Core Types**: 비즈니스 도메인 타입
- **Shared Types**: 공통 UI/유틸리티 타입
- **Feature Types**: 기능별 전용 타입

## 🧪 테스트 전략

### 테스트 도구

- **Vitest**: 빠른 유닛 테스트
- **@testing-library/preact**: 컴포넌트 테스트
- **jsdom**: 브라우저 환경 시뮬레이션

### 커버리지 목표

```json
{
  "branches": 60,
  "functions": 70,
  "lines": 70,
  "statements": 70
}
```

## 📦 빌드 및 배포

### 빌드 타겟

- **UserScript**: 단일 파일 유저스크립트 (.user.js)
- **Browser Extension**: 브라우저 확장 프로그램
- **Development**: 개발용 소스맵 포함 빌드

### 최적화 기법

- **Tree Shaking**: 사용하지 않는 코드 제거
- **CSS Inlining**: 스타일을 JS에 인라인화
- **Terser Minification**: 프로덕션 코드 압축

## 🔧 개발 워크플로우

### 필수 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run test         # 테스트 실행
npm run lint:fix     # 코드 품질 수정
npm run validate     # 전체 검증
```

### 코드 품질 보장

1. **ESLint**: 코딩 규칙 검사
2. **Prettier**: 일관된 포맷팅
3. **TypeScript**: 타입 안전성 검증
4. **Vitest**: 유닛 테스트
5. **Husky**: Git 훅으로 품질 자동 검사

---

> **📚 관련 문서**: [코딩 가이드라인](./CODING_GUIDELINES.md) | [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)
