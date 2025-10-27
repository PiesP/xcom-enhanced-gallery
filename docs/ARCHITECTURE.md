## 📐 프로젝트 아키텍처

**마지막 업데이트**: 2025-10-27 | **버전**: 1.0.0 | **Phase**: 225

---

## 🏗️ 전체 구조 개요

프로젝트는 **3계층 구조**를 따릅니다:

```
src/
├── main.ts                      # 진입점
├── constants.ts                 # 전역 상수
├── bootstrap/                   # 부트스트랩 로직
├── features/                    # 🔴 Feature Layer (비즈니스 로직)
├── shared/                      # 🟡 Shared Layer (공유 인프라)
└── styles/                      # CSS & 디자인 토큰
```

### 계층 설명

| 계층         | 책임                      | 예시                                           |
| ------------ | ------------------------- | ---------------------------------------------- |
| **Features** | 비즈니스 로직 구현        | `gallery/`, `settings/`, `download/`           |
| **Shared**   | 기반 서비스 및 유틸리티   | `services/`, `components/`, `utils/`, `state/` |
| **Styles**   | 디자인 토큰 및 CSS 시스템 | 색상, 간격, 타이포그래피                       |

---

## 🗂️ Shared Layer 상세 구조

### Constants 시스템

#### 1. 전역 상수 (`src/constants.ts`)

**목적**: 프로젝트 전체에서 사용하는 상수 통합 관리

**포함 항목**:

- **APP_CONFIG**: 앱 설정 (버전, 이름, 애니메이션)
- **TIMING**: 시간 관련 상수 (debounce, 타임아웃)
- **SELECTORS**: DOM 선택자 (테스트ID)
- **MEDIA**: 미디어 타입, 도메인, 품질
- **CSS**: CSS 클래스, Z-Index, 간격
- **EVENTS**: 커스텀 이벤트 이름
- **STABLE_SELECTORS**: Fallback 선택자 목록
- **SERVICE_KEYS**: DI 컨테이너 키
- **DEFAULT_SETTINGS**: 기본 설정값

**import 방법**:

```typescript
import {
  APP_CONFIG,
  TIMING,
  SELECTORS,
  STABLE_SELECTORS,
  SERVICE_KEYS,
  DEFAULT_SETTINGS,
  type MediaType,
  type AppServiceKey,
} from '@/constants';
```

**구조**:

```typescript
// ✅ 정상: 상수 집중
export const APP_CONFIG = { ... };
export const TIMING = { ... };
export type MediaType = ...;

// ❌ 금지: 유틸리티 함수 (utils로 이동)
// export function isValidMediaUrl() { ... }
```

#### 2. Shared Constants (`src/shared/constants/`)

**목적**: i18n(다국어) 시스템 및 공유 설정값

**구조**:

```
src/shared/constants/
├── index.ts                    # 배럴 export
└── i18n/
    ├── index.ts                # i18n 배럴 export
    ├── language-types.ts       # 타입 및 검증
    ├── translation-registry.ts # 번역 데이터 레지스트리
    └── languages/
        ├── en.ts
        ├── ko.ts
        └── ja.ts
```

**import 방법**:

```typescript
// i18n 관련
import {
  LANGUAGE_CODES,
  type SupportedLanguage,
  getLanguageStrings,
  TRANSLATION_REGISTRY,
  DEFAULT_LANGUAGE,
} from '@shared/constants';

// 사용 예
const koStrings = getLanguageStrings('ko');
console.log(koStrings.toolbar.previous);
```

**i18n 정책**:

- 지원 언어: 'en', 'ko', 'ja' (3개)
- 기본 언어: 'en'
- 타입 검증: `isBaseLanguageCode(value)`
- 확장성: 새 언어 추가 시 `languages/` 하위에 파일 생성

---

## 🔄 Constants vs Shared Constants 선택 기준

| 항목          | `@/constants`              | `@shared/constants`                  |
| ------------- | -------------------------- | ------------------------------------ |
| **용도**      | 전역 상수                  | i18n 시스템                          |
| **경로**      | `src/constants.ts`         | `src/shared/constants/`              |
| **내용**      | 앱 설정, 서비스 키, 선택자 | 번역 문자열, 언어 타입               |
| **의존성**    | 최소 (self-contained)      | language-types, translation-registry |
| **확장성**    | 낮음 (부트 타임)           | 높음 (다국어 추가)                   |
| **수정 빈도** | 낮음                       | 중간 (번역 관리)                     |

---

## 📦 Import 경로 규칙

### 허용된 경로

```typescript
// ✅ 전역 상수
import { SELECTORS, SERVICE_KEYS } from '@/constants';

// ✅ Shared 상수
import { TRANSLATION_REGISTRY } from '@shared/constants';

// ✅ 서비스
import { MediaService } from '@shared/services';

// ✅ 컴포넌트
import { Button } from '@shared/components';

// ✅ 유틸리티
import { isValidMediaUrl } from '@shared/utils/media';

// ✅ 타입
import type { MediaType } from '@/constants';
import type { SupportedLanguage } from '@shared/constants';
```

### 금지된 패턴

```typescript
// ❌ 내부 파일 직접 import (배럴 사용)
import { SELECTORS } from '@/constants/selectors';
import { getLanguageStrings } from '@shared/constants/i18n/translation-registry';

// ❌ Vendor 직접 import (getter 사용)
import { createSignal } from 'solid-js';

// ❌ 상위 계층에서 하위 계층 import
import { GalleryApp } from '@/features/gallery';
```

---

## 🚀 개발 팁

### Constants 추가 시

1. **분류 확인**: 전역 vs i18n?
2. **위치 결정**: `@/constants` or `@shared/constants/`
3. **타입 정의**: TypeScript 타입 export
4. **테스트 작성**: 상수 유효성 검증

### i18n 새 언어 추가

1. `src/shared/constants/i18n/languages/` 에 파일 생성 (ex: `de.ts`)
2. `LANGUAGE_CODES` 업데이트
3. `translation-registry.ts` import 추가
4. 타입 검증 자동 처리

---

## 📚 관련 문서

- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙 및 패턴
- **[DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md)**: 의존성 정책
- **[TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)**: 진행 중인 작업
