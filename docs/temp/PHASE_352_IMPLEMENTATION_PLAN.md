# Phase 352: Barrel Export 최적화 구현 계획

**버전**: 1.0.0
**날짜**: 2025-11-04
**상태**: 🚧 진행 중
**브랜치**: `feature/phase-352-barrel-optimization`

---

## 📋 목표

프로젝트 전체의 **51개 `export *` (wildcard export)**를 명시적 named export로 변환하여:
- **Tree-shaking 효율성 증대**: 번들러가 사용되지 않는 코드를 정확히 제거
- **번들 크기 감소**: 목표 -8~15% (418 KB → 355-385 KB)
- **타입 안전성 개선**: 명시적 export로 의존성 추적 용이
- **빌드 성능 개선**: 불필요한 코드 번들링 방지

---

## 🎯 발견된 export * 사용 현황 (51개)

### 📊 분류별 통계

| 레이어 | 파일 수 | 복잡도 | 우선순위 |
|--------|---------|--------|----------|
| **Types & Constants** | 12 | 낮음 | 1 (높음) |
| **Utilities** | 15 | 중간 | 2 (중간) |
| **Components** | 8 | 중간 | 3 (중간) |
| **Services & Logging** | 7 | 높음 | 4 (낮음) |
| **Top-level Barrels** | 9 | 높음 | 5 (낮음) |

### 📁 상세 파일 목록

#### 1단계: Types & Constants (12개) ✅ 안전
```
src/shared/types/
├── index.ts (7개 export *)
│   ├── media.types
│   ├── app.types
│   ├── ui.types
│   ├── component.types
│   ├── navigation.types
│   ├── toolbar.types
│   └── core/userscript.d
├── core/index.ts (2개 export *)
│   ├── core-types
│   └── userscript.d

src/shared/constants/
└── i18n/index.ts (2개 export *)
    ├── language-types
    └── translation-registry

src/shared/components/ui/
├── types.ts
└── constants.ts
```

#### 2단계: Utilities (15개) ⚠️ 중간
```
src/shared/utils/
├── accessibility.ts (재export) → accessibility/index.ts (4개)
│   ├── color-contrast
│   ├── keyboard-navigation
│   ├── aria-helpers
│   └── focus-restore-manager
├── performance/index.ts (5개)
│   ├── performance-utils
│   ├── preload
│   ├── idle-scheduler
│   ├── schedulers
│   └── prefetch-bench
├── browser/index.ts (2개)
│   ├── safe-browser
│   └── wait-for-load
├── styles/index.ts (1개)
│   └── css-utilities
├── scroll/index.ts (1개)
│   └── scroll-utils
├── deduplication/index.ts (1개)
│   └── deduplication-utils
└── core/index.ts (1개)
    └── type-safety-helpers
```

#### 3단계: Components (8개) ⚠️ 중간
```
src/shared/components/
├── index.ts (1개)
│   └── base
└── ui/index.ts (3개)
    ├── types
    ├── constants
    └── Toolbar

src/shared/index.ts (7개) - 최상위 재export
├── components/ui
├── components/isolation
├── components/hoc
├── services
├── state
├── logging
└── styles/tokens
```

#### 4단계: Services & Logging (7개) 🔴 복잡
```
src/shared/logging/index.ts (2개)
├── logger
└── flow-tracer

src/shared/external/index.ts (2개)
├── vendors
└── zip
```

#### 5단계: Features (5개) 🔴 복잡
```
src/features/
├── settings/index.ts (1개)
│   └── types/settings.types
├── gallery/index.ts (1개)
│   └── types
└── gallery/components/
    ├── index.ts (1개)
    │   └── vertical-gallery-view/hooks
    └── vertical-gallery-view/hooks/index.ts (2개)
        ├── useGalleryKeyboard
        └── useProgressiveImage
```

#### 기타 호환성 레이어 (1개)
```
src/shared/utils/media/media-url-compat.ts (1개)
└── ../media-url (Phase 351 호환성 - 변경 금지)
```

---

## 🚀 구현 전략

### Phase 352.1: Types & Constants (예상 2시간) ✅
**대상**: 12개 파일
**난이도**: ⭐ (낮음)
**검증**: TypeScript 0 에러

1. **src/shared/types/media.types.ts** 분석
   - 39개 export 확인
   - 실제 사용되는 타입만 나열

2. **src/shared/types/index.ts** 수정
   ```typescript
   // Before
   export * from './media.types';

   // After
   export type {
     MediaInfo,
     MediaItem,
     TweetInfo,
     // ... 실제 사용되는 타입만
   } from './media.types';
   ```

3. **src/shared/constants/i18n/index.ts** 수정
4. **src/shared/components/ui/{types,constants}.ts** 수정

**검증**:
```bash
npm run typecheck
npm run lint
```

### Phase 352.2: Utilities (예상 3시간) ⚠️
**대상**: 15개 파일
**난이도**: ⭐⭐ (중간)
**검증**: TypeScript + Unit tests

1. **Accessibility utilities** (4개)
2. **Performance utilities** (5개)
3. **Browser utilities** (2개)
4. **기타 utilities** (4개)

**검증**:
```bash
npm run typecheck
npm test:unit -- utils
```

### Phase 352.3: Components (예상 2시간) ⚠️
**대상**: 8개 파일
**난이도**: ⭐⭐ (중간)
**검증**: TypeScript + Browser tests

**검증**:
```bash
npm run typecheck
npm run test:browser
```

### Phase 352.4: Services & Logging (예상 2시간) 🔴
**대상**: 7개 파일
**난이도**: ⭐⭐⭐ (높음) - 순환 의존성 주의
**검증**: TypeScript + Integration tests

**검증**:
```bash
npm run typecheck
npm test
```

### Phase 352.5: Features & Top-level (예상 2시간) 🔴
**대상**: 14개 파일 (9 top-level + 5 features)
**난이도**: ⭐⭐⭐ (높음) - 전체 의존성 그래프
**검증**: Full test suite

**검증**:
```bash
npm run check
npm run build
```

### Phase 352.6: Bundle 분석 & 검증 (예상 1시간)
**대상**: 번들 크기 측정 및 최적화 효과 확인

**실행**:
```bash
npm run build -- --mode production
npm run build:analyze
```

**목표**:
- Before: 418 KB (116 KB gzipped)
- After: 355-385 KB (99-106 KB gzipped)
- 개선: -8~15%

---

## 📏 검증 기준

각 Phase마다:
1. ✅ TypeScript 0 에러
2. ✅ ESLint 0 경고
3. ✅ 모든 테스트 통과
4. ✅ 빌드 성공

최종 검증:
1. ✅ 번들 크기 -8% 이상 감소
2. ✅ 회귀 테스트 100% 통과
3. ✅ E2E smoke test 통과
4. ✅ Tree-shaking 효율성 검증

---

## 🔄 작업 흐름

각 Phase별:
```
1. 파일 분석 → 2. Export 목록 작성 → 3. 코드 수정
   ↓
4. TypeCheck → 5. Test 실행 → 6. Lint 검증
   ↓
7. Git commit (작은 단위) → 8. 다음 Phase
```

---

## 🎯 Phase 352.1 시작

**현재 진행**: Types & Constants 최적화

**다음 작업**:
1. media.types.ts에서 실제 사용되는 export 분석
2. types/index.ts의 export * 제거 및 named export 적용
3. TypeScript 검증

**예상 시간**: 2시간
