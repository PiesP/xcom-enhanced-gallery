# 작업 계획 문서 (Implementation Roadmap)

**작성 날짜**: 2025-11-07 **작성자**: AI Assistant (GitHub Copilot) **기반**:
[STATIC_ANALYSIS_REPORT.md](./STATIC_ANALYSIS_REPORT.md) +
[ARCHITECTURE.md](./ARCHITECTURE.md) **언어 정책**: 코드/주석 = 영어, 문서 =
한국어

---

## 📋 작업 개요

정적 분석 결과를 바탕으로 **Phase 353, 354, 355** 3개 Phase를 순차적으로
진행합니다.

| Phase   | 제목                           | 우선도  | 영향도 | 작업량 | 위험도 | 예상 기간 |
| ------- | ------------------------------ | ------- | ------ | ------ | ------ | --------- |
| **353** | Type System Optimization       | 🔴 높음 | 높음   | 중간   | 중간   | 2-3일     |
| **354** | File Naming Normalization      | 🟡 중간 | 낮음   | 낮음   | 낮음   | 1일       |
| **355** | Download Service Consolidation | 🟡 중간 | 중간   | 중간   | 중간   | 3-4일     |

**총 예상 기간**: 6-8일 (검증 포함)

---

## 🎯 Phase 353: Type System Optimization (고우선순위)

### 목표

타입 정의의 중복을 제거하고, SSOT(Single Source of Truth) 원칙 준수

### 분석 결과

#### 문제점

```
❌ 현재 상태: Result<T> 타입이 2곳에서 정의됨

1. src/shared/types/core/core-types.ts (Line 231)
   export type Result<T> = { status: 'success'; data: T } | { status: 'error'; error: E };
   export type AsyncResult<T> = Promise<Result<T>>;

2. src/shared/types/result.types.ts
   export type Result<T> = ResultSuccess<T> | ResultPartial<T> | ResultError;

재export 체인:
   app.types.ts → core/core-types.ts → result.types.ts
   (모호한 경로 추적)
```

#### 영향받는 파일

- `src/shared/types/core/core-types.ts` (정의 제거)
- `src/shared/types/app.types.ts` (import 경로 정리)
- `src/shared/types/index.ts` (배럴 export 정리)
- 사용처: ~50개 파일

### 작업 단계

#### Step 353.1: 타입 정의 분석 (준비 단계)

```bash
# 1. Result<T> 사용처 모두 찾기
grep -r "Result<" src --include="*.ts" --include="*.tsx" | wc -l

# 2. AsyncResult<T> 사용처 모두 찾기
grep -r "AsyncResult<" src --include="*.ts" --include="*.tsx" | wc -l

# 3. 타입 정의 확인
cat src/shared/types/core/core-types.ts | grep -A5 "export type Result"
cat src/shared/types/result.types.ts | grep -A5 "export type Result"
```

**검증 기준**:

- ✅ Result 정의 2곳 확인됨
- ✅ 사용처 완전히 매핑됨

#### Step 353.2: core-types.ts에서 Result 제거

```typescript
// BEFORE
export type Result<T, E = Error> = Promise<Result<T, E>>;
export type AsyncResult<T> = Promise<Result<T>>;

// AFTER (제거)
// Result는 result.types.ts에서만 정의
```

**작업 파일**: `src/shared/types/core/core-types.ts`

#### Step 353.3: app.types.ts import 경로 수정

```typescript
// BEFORE
export type { Result, AsyncResult } from './core/core-types';

// AFTER
export type { Result } from './result.types';
export type { AsyncResult } from './core/core-types';
// (또는 AsyncResult도 result.types.ts로 이동)
```

#### Step 353.4: index.ts 배럴 export 정리

```typescript
// src/shared/types/index.ts
export type { Result, AsyncResult } from './app.types';
// (명확하고 단순해짐)
```

#### Step 353.5: 빌드 및 타입 검증

```bash
npm run typecheck
npm run lint
npm run validate:pre
```

**검증 기준**:

- ✅ TypeScript 0 errors
- ✅ ESLint 0 warnings
- ✅ 빌드 성공

#### Step 353.6: 회귀 테스트

```bash
npm run test:unit:batched
npm run test:browser
npm run e2e:smoke
```

**검증 기준**:

- ✅ 기존 테스트 모두 통과
- ✅ 새로운 실패 테스트 없음

### 롤백 계획

만약 문제 발생 시:

```bash
git restore src/shared/types/
npm ci
npm run validate:pre
```

### 예상 결과

```diff
- 파일 수정: 4개
- 코드 라인: -15줄
- 타입 정의 중복: 0 (완전 제거)
- 재export 복잡도: 감소 (30%)
```

---

## 🎯 Phase 354: File Naming Normalization (중우선순위)

### 목표

`service-manager.ts` 파일명 충돌 해결 → import 혼동 방지

### 분석 결과

#### 문제점

```
❌ 현재 상태: service-manager.ts이 2개 경로에 존재

1. src/shared/services/service-manager.ts
   └─ 메인 서비스 관리자 (상위 계층)

2. src/shared/services/core/service-manager.ts
   └─ Core 서비스 관리자 (하위 계층)

위험: 동일한 이름으로 인한 import 혼동 가능성
```

#### 영향받는 파일

- 리네이밍 대상: `src/shared/services/core/service-manager.ts`
- import 수정 대상: 3-5개 파일

### 작업 단계

#### Step 354.1: 파일 영향도 분석

```bash
# core/service-manager.ts를 import하는 파일 찾기
grep -r "from.*core/service-manager\|from.*core.*service-manager" src \
  --include="*.ts" --include="*.tsx"
```

**검증**: 모든 사용처 확인

#### Step 354.2: 파일 리네이밍

```bash
# 1. 파일 이동
mv src/shared/services/core/service-manager.ts \
   src/shared/services/core/core-service-manager.ts

# 2. Git 추적
git add src/shared/services/core/core-service-manager.ts
git rm src/shared/services/core/service-manager.ts
```

#### Step 354.3: Import 경로 수정

```typescript
// BEFORE
import { ... } from '@shared/services/core/service-manager';
import { ... } from '../core/service-manager';

// AFTER
import { ... } from '@shared/services/core/core-service-manager';
import { ... } from '../core/core-service-manager';
```

**수정 대상 파일** (사전 분석으로 확인):

- `src/shared/services/core/index.ts`
- `src/shared/services/index.ts`
- 기타 import 3-5개 파일

#### Step 354.4: 배럴 export 수정

```typescript
// src/shared/services/core/index.ts
export { CoreServiceManager } from './core-service-manager';
// (기존: './service-manager')
```

#### Step 354.5: 검증

```bash
npm run typecheck
npm run lint
npm run validate:pre
npm run test:unit:batched
```

**검증 기준**:

- ✅ TypeScript 0 errors
- ✅ ESLint 0 warnings
- ✅ 모든 import 정상
- ✅ 테스트 통과

### 예상 결과

```diff
- 파일 리네이밍: 1개
- 파일 이동: src/shared/services/core/ 유지
- 명확성: 향상 (core-service-manager 명시적)
- import 혼동: 제거 (100%)
```

---

## 🎯 Phase 355: Download Service Consolidation (중우선순위)

### 목표

3개의 다운로드 서비스를 2개로 통합하여 코드 중복 40-50% 제거

### 분석 결과

#### 현재 구조 (문제점)

```
DownloadService (423줄)
├─ Blob/File 다운로드 (Phase 320)
├─ downloadBlob()
└─ downloadBlobBulk()

UnifiedDownloadService (613줄)
├─ URL 기반 다운로드 (Phase 312)
├─ downloadSingle()
└─ downloadBulk()

BulkDownloadService (540줄)
├─ 벌크 + ZIP 조립 (Phase 313)
├─ downloadSingle() ← 중복
└─ downloadBulk() ← 중복
```

#### 중복 분석

| 메서드             | 위치1 | 위치2 | 위치3 | 중복도 |
| ------------------ | ----- | ----- | ----- | ------ |
| `downloadBulk()`   | ✅    | ✅    | ✅    | 100%   |
| `downloadSingle()` | ❌    | ✅    | ✅    | 100%   |
| `DownloadOptions`  | ❌    | ✅    | ✅    | 90%    |
| `DownloadResult`   | ✅    | ✅    | ✅    | 85%    |

**총 중복**: 600-800줄 (40-50%)

#### 개선 목표

```
✅ AFTER: 2개 서비스만 유지

DownloadService (Blob/File)
  ├─ downloadBlob()
  └─ downloadBlobBulk()

MediaDownloadService (URL 기반, 통합)
  ├─ downloadSingle()
  └─ downloadBulk()
      └─ 내부: DownloadOrchestrator

❌ BulkDownloadService 제거 (로직 이관)
```

### 작업 단계

#### Step 355.1: 코드 분석 및 매핑

```typescript
// BulkDownloadService에서 UnifiedDownloadService로 이관할 로직:

// 1. downloadBulk() 로직
// 2. DownloadOptions 타입
// 3. DownloadResult 타입
// 4. 에러 처리 로직
// 5. 진행 상황 콜백

// UnifiedDownloadService에 이미 있는 것과 비교:
// - downloadBulk() ✅ 있음
// - downloadSingle() ✅ 있음
// - DownloadOptions ✅ 있음
// - DownloadResult ✅ 있음
```

#### Step 355.2: BulkDownloadService 정리 검토

```bash
# 1. BulkDownloadService 파일 내용 확인
head -100 src/shared/services/bulk-download-service.ts

# 2. UnifiedDownloadService 파일 내용 확인
head -100 src/shared/services/unified-download-service.ts

# 3. 차이점 분석
diff <(grep "export" src/shared/services/bulk-download-service.ts) \
     <(grep "export" src/shared/services/unified-download-service.ts)
```

#### Step 355.3: UnifiedDownloadService 강화

```typescript
// UnifiedDownloadService에 BulkDownloadService의 고유 기능 추가:

1. 추가 메서드 (있으면):
   - BulkDownloadService 전용 메서드
   - 에러 처리 강화
   - 진행 상황 추적 고도화

2. 타입 통합:
   - DownloadOptions 표준화
   - DownloadResult 확장 (필요시)

3. 의존성 확인:
   - DownloadOrchestrator 의존성 유지
   - HttpRequestService 의존성 유지
```

#### Step 355.4: BulkDownloadService 제거

```bash
# 1. 사용처 모두 찾기
grep -r "BulkDownloadService\|from.*bulk-download-service" src \
  --include="*.ts" --include="*.tsx"

# 2. import 경로 변경 (모든 사용처)
# BulkDownloadService → UnifiedDownloadService

# 3. API 호출 수정 (있으면)
# BulkDownloadService.downloadBulk() → UnifiedDownloadService.downloadBulk()

# 4. 파일 삭제
rm src/shared/services/bulk-download-service.ts
```

#### Step 355.5: 배럴 export 정리

```typescript
// src/shared/services/index.ts

// BEFORE
export { BulkDownloadService } from './bulk-download-service';
export { UnifiedDownloadService } from './unified-download-service';

// AFTER
export { UnifiedDownloadService } from './unified-download-service';
// BulkDownloadService 제거
```

#### Step 355.6: 주석 및 문서 업데이트

```typescript
// src/shared/services/unified-download-service.ts

/**
 * UnifiedDownloadService - Phase 312+355 통합
 *
 * **Role**: URL 기반 미디어 다운로드 (단일/벌크) + ZIP 조립
 *
 * Phase 312: 초기 구현
 * Phase 355: BulkDownloadService 통합
 *
 * **Usage**:
 * - ✅ 단일 다운로드: downloadSingle(media)
 * - ✅ 벌크 다운로드: downloadBulk(items, options)
 * - ✅ ZIP 조립: 내부 DownloadOrchestrator 사용
 */
```

#### Step 355.7: 타입 정의 정리

```typescript
// src/shared/services/download/types.ts

// CONSOLIDATE: 모든 다운로드 타입을 한 곳에서 관리
export interface DownloadOptions { ... }
export interface DownloadResult { ... }
export interface SingleDownloadResult { ... }
export interface BulkDownloadResult { ... }
// (중복된 타입 정의 제거)
```

#### Step 355.8: 단위 테스트 검증

```bash
# 1. BulkDownloadService 관련 테스트 찾기
find test -name "*bulk-download*" -o -name "*download*service*"

# 2. 테스트 마이그레이션 (있으면)
# BulkDownloadService 테스트 → UnifiedDownloadService 테스트로 이동

# 3. 테스트 실행
npm run test:unit:batched -- --pattern="*download*"
```

#### Step 355.9: 종합 검증

```bash
# 1. 타입 체크
npm run typecheck

# 2. 린트
npm run lint

# 3. 의존성 검사
npm run deps:check

# 4. 단위 테스트
npm run test:unit:batched

# 5. 브라우저 테스트
npm run test:browser

# 6. E2E 테스트
npm run e2e:smoke

# 7. 전체 검증
npm run check
```

### 롤백 계획

```bash
# 만약 문제 발생 시:
git restore src/shared/services/bulk-download-service.ts
git restore src/shared/services/unified-download-service.ts
git restore src/shared/services/index.ts
git restore src/shared/services/download/types.ts

# 영향받은 파일 복원
git checkout HEAD -- src/

# 의존성 재설치
npm ci

# 검증
npm run validate:pre
```

### 예상 결과

```diff
- 서비스 파일: 3개 → 2개 (-1개)
- 코드 라인: -540줄 (BulkDownloadService)
- 코드 중복: -40-50% (600-800줄)
- 책임 명확: 향상 (2개로 단순화)
- 유지보수성: 향상 (중복 제거)
- 테스트 복잡도: -30%
```

---

## 📊 Phase별 의존성 분석

```
Phase 353 (Type System)
  ├─ 독립적 작업
  ├─ Phase 354, 355와 의존성 없음
  └─ 완료 후: Phase 354 진행 가능

Phase 354 (File Naming)
  ├─ Phase 353에 의존하지 않음
  ├─ Phase 355와 독립적
  └─ 완료 후: Phase 355 진행 가능

Phase 355 (Service Consolidation)
  ├─ Phase 353, 354와 의존하지 않음
  ├─ 다운로드 서비스만 영향
  └─ 완료 후: 모든 Phase 완료
```

**결론**: **순차 진행** (353 → 354 → 355) 또는 **병렬 진행** (354와 355는 동시
가능) 모두 가능

---

## 🧪 검증 전략

### 각 Phase별 검증 체크리스트

#### 검증 Tier 1: 정적 분석 (5분)

```bash
npm run typecheck      # TypeScript 타입 체크
npm run lint           # ESLint
npm run lint:css       # stylelint
npm run deps:check     # 의존성 검사
```

#### 검증 Tier 2: 빠른 테스트 (10분)

```bash
npm run validate:pre   # Tier 1 + Prettier
npm test               # 단위 테스트 (빠른 배치)
```

#### 검증 Tier 3: 완전 검증 (30-40분)

```bash
npm run test:unit:batched    # 모든 단위 테스트
npm run test:browser         # 브라우저 테스트 (Solid.js)
npm run e2e:smoke           # E2E 스모크 테스트
npm run build               # 프로덕션 빌드
```

#### 검증 Tier 4: 전체 검증 (60분+)

```bash
npm run check           # 전체 검증 (Tier 3 + E2E A11y)
```

### 검증 기준

| 항목            | 기준      | 상태 |
| --------------- | --------- | ---- |
| TypeScript 에러 | 0개       | ✅   |
| ESLint 경고     | 0개       | ✅   |
| 의존성 위반     | 0개       | ✅   |
| 단위 테스트     | 90%+ 통과 | ✅   |
| 빌드 성공       | 성공      | ✅   |
| E2E 테스트      | 80%+ 통과 | ✅   |

---

## 📅 작업 일정

### Week 1: Phase 353 (타입 시스템)

| 날짜     | 작업                      | 소요시간 | 담당         |
| -------- | ------------------------- | -------- | ------------ |
| Day 1    | 353.1-353.3 (분석 + 수정) | 2h       | AI Assistant |
| Day 1    | 353.4-353.5 (검증)        | 1h       | CI/CD        |
| Day 1    | 353.6 (회귀 테스트)       | 2h       | Test suite   |
| **소계** | **Phase 353 완료**        | **5h**   |              |

### Week 1-2: Phase 354 (파일명 정규화)

| 날짜     | 작업                   | 소요시간 | 담당         |
| -------- | ---------------------- | -------- | ------------ |
| Day 2    | 354.1-354.3 (리네이밍) | 30m      | AI Assistant |
| Day 2    | 354.4-354.5 (검증)     | 1h       | CI/CD        |
| **소계** | **Phase 354 완료**     | **1.5h** |              |

### Week 2: Phase 355 (서비스 통합)

| 날짜     | 작업                           | 소요시간 | 담당         |
| -------- | ------------------------------ | -------- | ------------ |
| Day 2-3  | 355.1-355.3 (분석 + 코드 이관) | 3h       | AI Assistant |
| Day 3    | 355.4-355.5 (정리)             | 1h       | AI Assistant |
| Day 3    | 355.6-355.7 (문서 + 타입)      | 1h       | AI Assistant |
| Day 3    | 355.8-355.9 (테스트 + 검증)    | 3h       | CI/CD        |
| **소계** | **Phase 355 완료**             | **8h**   |              |

**총 예상 기간**: 6-8일 (병렬 작업으로 3-4일 단축 가능)

---

## 🚀 실행 전 체크리스트

### 준비 단계

- [ ] 현재 master 브랜치 상태 확인 (`git status`)
- [ ] 마지막 빌드 성공 확인 (`npm run build`)
- [ ] 마지막 테스트 통과 확인 (`npm test`)
- [ ] 마스터 브랜치 로컬 백업 (`git branch backup/pre-phase353`)
- [ ] 분석 문서 다시 확인 (STATIC_ANALYSIS_REPORT.md)

### 진행 단계

- [ ] Phase 353 시작 (TypeScript 타입)
- [ ] Phase 354 시작 (파일명)
- [ ] Phase 355 시작 (서비스)

### 완료 단계

- [ ] 모든 Phase 테스트 통과
- [ ] 문서 업데이트 (ARCHITECTURE.md, Phase 이력)
- [ ] 커밋 메시지 작성 (명확한 Phase 표기)
- [ ] Pull Request (또는 master 병합)
- [ ] 릴리스 노트 생성 (v0.4.3 대상)

---

## 📝 언어 정책 준수

✅ **코드 수정 시**:

- 변수명: 영어
- 함수명: 영어
- 주석: 영어 (100% 이미 완료)
- docstring: 영어

✅ **문서 작성**:

- 기술 용어: 영어
- 설명: 한국어

✅ **커밋 메시지**:

```
Phase 353: Type System Optimization - Result<T> duplication removed

- 타입 정의 중복 제거 (core-types.ts)
- SSOT 원칙 준수 (result.types.ts만 사용)
- import 경로 통일 (app.types → result.types)
```

---

## 🔗 관련 문서

- [STATIC_ANALYSIS_REPORT.md](./STATIC_ANALYSIS_REPORT.md) - 정적 분석 (상세)
- [STATIC_ANALYSIS_SUMMARY.md](./STATIC_ANALYSIS_SUMMARY.md) - 정적 분석 (요약)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 아키텍처 (Phase 이력)
- [AGENTS.md](../AGENTS.md) - AI 지침
- [copilot-instructions.md](../.github/copilot-instructions.md) - Copilot 규칙

---

## 📊 성공 지표

### Phase별 성공 기준

**Phase 353**:

- ✅ Result<T> 정의 1곳 (result.types.ts만)
- ✅ TypeScript 0 errors
- ✅ 테스트 100% 통과
- ✅ 코드 중복도 -15줄

**Phase 354**:

- ✅ service-manager.ts 1곳 (상위 경로만)
- ✅ import 경로 명확 (core/core-service-manager.ts)
- ✅ 테스트 100% 통과
- ✅ 문제 0개

**Phase 355**:

- ✅ 다운로드 서비스 2개 (DownloadService + MediaDownloadService)
- ✅ 코드 중복도 -40-50%
- ✅ 책임 명확
- ✅ 테스트 90%+ 통과

---

**상태**: ✅ 작업 계획 완성 **다음 단계**: Phase 353 구현 시작

---

_이 문서는 정적 분석 결과 및 프로젝트 지침을 바탕으로 작성되었습니다._ _모든
작업은 test-driven development (TDD) 및 검증 우선 원칙을 따릅니다._
