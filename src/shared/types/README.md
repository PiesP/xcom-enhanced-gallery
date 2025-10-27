# Shared Types System

## 📚 개요

`src/shared/types/` 디렉터리는 프로젝트 전체의 공유 타입 정의를 담당하는
계층입니다.

- **단일 import 지점**: `@shared/types`
- **도메인 분리**: 각 도메인별로 세부 파일
- **재-export 허브**: app.types.ts가 중앙 집중식 export 제공
- **Backward Compatibility**: 이전 import 경로도 제한적으로 지원

---

## 🏗️ 디렉터리 구조

```
src/shared/types/
├── index.ts                      # 배럴 export (권장 import 지점)
├── app.types.ts (205줄)         # 앱 레벨 + 재-export 허브
├── ui.types.ts                   # UI/테마 관련 타입
├── component.types.ts           # 컴포넌트 Props/이벤트
├── media.types.ts (558줄)       # 미디어 & 추출 도메인
├── result.types.ts              # Result 패턴 & ErrorCode
├── navigation.types.ts          # 네비게이션 타입
├── toolbar.types.ts             # 툴바 UI 상태 (Phase 197.1)
└── core/                        # 인프라 & 핵심 도메인
    ├── index.ts                 # core 배럴
    ├── core-types.ts (613줄)   # 통합 도메인 타입
    ├── base-service.types.ts    # BaseService 정의
    ├── extraction.types.ts      # Backward compat layer
    └── userscript.d.ts (205줄) # UserScript API
```

---

## 📖 각 파일의 목적

### Root Level Files

#### `index.ts` - 배럴 export

- **목적**: 전체 타입 시스템의 단일 진입점
- **역할**: 모든 공개 타입을 재-export
- **사용**: `import type { Result, MediaInfo } from '@shared/types'`

#### `app.types.ts` - 앱 레벨 타입

- **목적**: 앱 전역 타입 정의 + 하위 파일들의 재-export 허브
- **포함**: AppConfig, Cleanupable, Nullable, DeepPartial
- **Brand 타입**: UserId, TweetId 등
- **크기**: 205줄 (Phase 197에서 350줄에서 감소)

#### `ui.types.ts` - UI/테마 타입

- **목적**: UI 관련 타입
- **포함**: Theme, GalleryTheme, ToastType, ButtonVariant
- **사용**: UI 컴포넌트, 테마 시스템

#### `component.types.ts` - 컴포넌트 타입

- **목적**: 컴포넌트 Props 및 이벤트 타입
- **포함**: BaseComponentProps, InteractiveComponentProps
- **역할**: 모든 컴포넌트가 상속하는 기본 Props 정의

#### `media.types.ts` - 미디어 & 추출 타입

- **목적**: 미디어 도메인 타입 (크기: 558줄)
- **포함**: MediaInfo, MediaExtractionOptions, TweetInfo
- **특성**: ExtractionError 클래스 포함

#### `result.types.ts` - Result 패턴 & ErrorCode

- **목적**: 성공/실패 명시적 표현
- **포함**: BaseResult, ResultSuccess, ResultError
- **ErrorCode**: 범용 + 미디어 전용 통합

#### `navigation.types.ts` - 네비게이션 타입

- **목적**: 갤러리 네비게이션 관련 타입
- **포함**: NavigationSource ('button' | 'keyboard' | 'scroll' | 'auto-focus')

#### `toolbar.types.ts` - 툴바 UI 타입 (Phase 197.1 신규)

- **목적**: 툴바 UI 상태 타입
- **포함**: ToolbarDataState, ToolbarState, ToolbarActions, FitMode
- **이유**: @shared 코드가 의존하므로 @features에서 이동

### Core Layer Files

#### `core/index.ts` - core 배럴

- **목적**: 핵심 타입들의 진입점
- **역할**: core-types.ts, extraction.types.ts, UserScript API 재-export

#### `core/core-types.ts` - 통합 도메인 타입 (613줄)

- **목적**: 여러 도메인 타입을 통합 관리
- **섹션**:
  - SERVICE TYPES: 서비스 기본 인터페이스
  - GALLERY TYPES: 갤러리 상태, 액션, 이벤트
  - MEDIA MAPPING TYPES: 미디어 매핑 전략
  - LIFECYCLE TYPES: 생명주기 인터페이스
  - RESULT TYPES: Result 패턴 유틸 함수

#### `core/base-service.types.ts` - BaseService 정의

- **목적**: 기본 서비스 인터페이스
- **크기**: 12줄 (매우 작음)
- **이유**: 순환 의존성 방지를 위해 분리

#### `core/extraction.types.ts` - Backward Compatibility

- **목적**: 이전 import 경로 지원
- **역할**: media.types.ts의 추출 타입을 재-export
- **사용**: core/index.ts에서만 사용

#### `core/userscript.d.ts` - UserScript API (205줄)

- **목적**: UserScript API 타입 정의
- **포함**: GM\_\* 함수 선언 (download, getValue, setValue 등)
- **특성**: 인프라/정의 파일

---

## 💡 사용 가이드

### 기본 사용법

```typescript
// 권장: 배럴 export에서 import
import type { Result, MediaInfo, BaseService } from '@shared/types';

// 세부 타입이 필요한 경우
import type { MediaExtractionOptions } from '@shared/types/media.types';
import type { ToolbarState } from '@shared/types/toolbar.types';

// Result 패턴 사용
import { success, failure, isSuccess } from '@shared/types';
```

### Import 원칙

| 상황           | 권장 Import                     |
| -------------- | ------------------------------- |
| 일반 타입      | `@shared/types`                 |
| 세부 타입      | `@shared/types/{domain}`        |
| UI 타입만      | `@shared/types/ui.types`        |
| 컴포넌트 Props | `@shared/types/component.types` |

### ❌ 피해야 할 패턴

```typescript
// 금지: @shared에서 @features 타입 import (의존성 역행)
import type { GalleryConfig } from '@features/gallery/types';

// 대신 @shared/types 사용
import type { ToolbarState } from '@shared/types/toolbar.types';
```

---

## 🔄 주요 마이그레이션

### Phase 195: media.types.ts 통합

- core/media.types.ts → @shared/types/media.types.ts (root로 이동)
- 이유: 미디어는 공유 도메인

### Phase 196: 타입 파일 분할

- ui.types.ts, component.types.ts 신규 생성
- app.types.ts 구조화

### Phase 197: 구조 명확화

- app.types.ts 단순화 (350줄 → 205줄)
- BaseService 중복 제거
- JSDoc 강화

### Phase 197.1: 의존성 역행 해결

- toolbar.types @features → @shared/types로 이동
- 이유: @shared 코드가 의존
- @features에서 재-export로 backward compat 유지

---

## 📋 파일 크기 참고

| 파일               | 크기  | 설명           |
| ------------------ | ----- | -------------- |
| media.types.ts     | 558줄 | 미디어 도메인  |
| core-types.ts      | 613줄 | 도메인 통합    |
| userscript.d.ts    | 205줄 | UserScript API |
| component.types.ts | 356줄 | 컴포넌트 Props |
| app.types.ts       | 205줄 | 앱 레벨 + 허브 |

---

## ⚠️ 알려진 사항

### 1. core-types.ts 크기

- 현재 613줄로 다소 큼
- 여러 도메인 타입을 통합 관리
- 장점: 단일 파일 → import 경로 단순
- 단점: 책임 다양

### 2. 재-export 체인

- app.types.ts가 여러 파일에서 재-export
- 복잡하지만 단일 import 지점 제공

### 3. Backward Compatibility

- extraction.types.ts: backward compat 유지
- @features/gallery/types/toolbar.types.ts: re-export layer
- 이전 코드도 점진적으로 마이그레이션 가능

---

## 🚀 향후 개선 예정

### Phase 197.2

- core-types.ts 도메인별 최적화 검토
- media.types.ts 크기 최적화

### Phase 198+

- Types README 지속적 업데이트
- 불필요한 타입 정리
- 새 도메인 타입 추가 시 구조 검토

---

## 📞 관련 문서

- [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) - 전체 아키텍처
- [`docs/CODING_GUIDELINES.md`](../../docs/CODING_GUIDELINES.md) - 코딩 규칙
- [`src/shared/types/`](./) - 소스 코드

---

**최종 업데이트**: Phase 197.1 (2025년) **상태**: ✅ 활발히 유지 중
