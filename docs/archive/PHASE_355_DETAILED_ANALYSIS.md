# Phase 355 상세 분석 및 작업 계획

**작성 날짜**: 2025-11-07 **Phase**: 355 - Download Service Consolidation
**상태**: 📊 분석 중

---

## 📊 현황 분석

### 다운로드 서비스 파일 구조

```
총 1,573줄 (3개 파일)

src/shared/services/
├── download-service.ts              (422줄)  - Blob/File 다운로드
├── bulk-download-service.ts         (539줄)  - 벌크 + ZIP (BaseServiceImpl)
├── unified-download-service.ts      (612줄)  - URL 기반 + 벌크 (Singleton)
└── download/                        (내부 모듈)
    ├── index.ts
    ├── download-orchestrator.ts
    └── types.ts
```

### 서비스별 책임 분석

#### 1. DownloadService (422줄)

**패턴**: Singleton (BaseServiceImpl 아님)

**주요 메서드**:

```typescript
- downloadBlob(options: BlobDownloadOptions): Promise<BlobDownloadResult>
- downloadBlobBulk(blobs): Promise<SingleDownloadResult[]>
- downloadInTestMode(options): Promise<TestModeDownloadResult>
```

**타입**:

- BlobDownloadOptions
- BlobDownloadResult
- TestModeDownloadOptions
- TestModeDownloadResult

**의존성**:

- NotificationService
- GM_download API

**특징**:

- ✅ Blob/File 객체 직접 다운로드
- ✅ GM_download 래퍼
- ✅ Test mode 지원

---

#### 2. BulkDownloadService (539줄)

**패턴**: BaseServiceImpl (Lifecycle 관리)

**주요 메서드**:

```typescript
- downloadSingle(media: MediaInfo): Promise<SingleDownloadResult>
- downloadMultiple(items): Promise<BulkDownloadResult>
- downloadAsZip(items): Promise<BulkDownloadResult>
- cancelDownload(): void
- isDownloading(): boolean
```

**타입**:

- BulkDownloadOptions
- DownloadResult
- SingleDownloadResult
- BulkDownloadAvailabilityResult
- SimulatedBulkDownloadResult

**의존성**:

- BaseServiceImpl (extends)
- NotificationService
- DownloadOrchestrator
- StreamingZipWriter

**특징**:

- ✅ BaseService 패턴
- ✅ URL 기반 미디어 다운로드
- ✅ ZIP 조립 기능
- ✅ 취소 지원
- ✅ Lazy registration 적용
- ⚠️ 진행 상황 콜백 제한적

---

#### 3. UnifiedDownloadService (612줄)

**패턴**: Singleton (BaseServiceImpl 아님)

**주요 메서드**:

```typescript
- downloadSingle(media: MediaInfo): Promise<SingleDownloadResult>
- downloadBulk(items): Promise<BulkDownloadResult>
- downloadAsZip(items): Promise<BulkDownloadResult>
- cancelDownload(): void
- isDownloading(): boolean
```

**타입**:

- DownloadOptions (BulkDownloadOptions와 동일 구조)
- SingleDownloadResult (동일)
- BulkDownloadResult (동일)
- UnifiedDownloadAvailabilityResult
- SimulatedUnifiedDownloadResult

**의존성**:

- NotificationService
- DownloadOrchestrator
- HttpRequestService

**특징**:

- ✅ URL 기반 미디어 다운로드
- ✅ ZIP 조립 기능
- ✅ 취소 지원
- ✅ 진행 상황 콜백 상세
- ✅ 에러 처리 강화

---

## 🔍 중복 분석

### 메서드 중복

| 메서드             | DownloadService | BulkDownloadService   | UnifiedDownloadService | 중복도    |
| ------------------ | --------------- | --------------------- | ---------------------- | --------- |
| downloadSingle()   | ❌              | ✅                    | ✅                     | 100%      |
| downloadMultiple() | ❌              | ✅ (downloadMultiple) | ✅ (downloadBulk)      | 거의 동일 |
| downloadAsZip()    | ❌              | ✅                    | ✅                     | 90%       |
| cancelDownload()   | ❌              | ✅                    | ✅                     | 100%      |
| isDownloading()    | ❌              | ✅                    | ✅                     | 100%      |

### 타입 중복

| 타입                 | BulkDownloadService | UnifiedDownloadService | 상태      |
| -------------------- | ------------------- | ---------------------- | --------- |
| DownloadOptions      | BulkDownloadOptions | DownloadOptions        | 거의 동일 |
| SingleDownloadResult | ✅                  | ✅                     | 동일      |
| BulkDownloadResult   | DownloadResult      | BulkDownloadResult     | 거의 동일 |

### 코드 중복 통계

```
✅ downloadSingle(): ~80줄 × 2 = 160줄 중복
✅ downloadAsZip(): ~140줄 × 2 = 280줄 중복 (로직 거의 동일)
✅ cancelDownload(): ~15줄 × 2 = 30줄 중복
✅ isDownloading(): ~5줄 × 2 = 10줄 중복
⚠️ 타입 정의: ~40줄 중복
⚠️ 에러 처리: ~50줄 중복

**총 중복**: ~600-700줄 (전체의 40-45%)
```

---

## 📋 통합 전략

### 현재 상태의 문제점

```
❌ 동일한 기능이 2개 서비스에 구현됨
   - BulkDownloadService
   - UnifiedDownloadService

❌ 타입 정의 중복
   - BulkDownloadOptions vs DownloadOptions
   - DownloadResult vs BulkDownloadResult

❌ 에러 처리 로직 중복
   - 진행 상황 콜백 로직 동일
   - 취소 처리 로직 동일

❌ 유지보수 어려움
   - 버그 수정 시 2곳 수정 필요
   - API 변경 시 2곳 동시 변경

⚠️ 실제 사용 현황:
   - BulkDownloadService: 주로 사용 (lazy registration)
   - UnifiedDownloadService: 이름만 존재? (사용처 확인 필요)
```

---

## 🎯 통합 계획 (안)

### Option A: BulkDownloadService 제거 (권장)

```
Before:
  DownloadService (Blob) → 유지
  BulkDownloadService (URL) → 제거
  UnifiedDownloadService (URL) → 통합

After:
  DownloadService (Blob) → 유지
  UnifiedDownloadService (URL) → 강화
```

**장점**:

- ✅ 코드 600줄 제거 (39% 감소)
- ✅ 유지보수 단순화
- ✅ UnifiedDownloadService 이름 의도 명확 (통합 서비스)

**단점**:

- ⚠️ BulkDownloadService → UnifiedDownloadService 마이그레이션 필요
- ⚠️ lazy-service-registration.ts 수정 필요

**영향 범위**:

- lazy-service-registration.ts: 수정
- service-factories.ts: 수정
- GalleryRenderer.ts: import 경로 수정
- 파일: bulk-download-service.ts 삭제

---

### Option B: DownloadService 확장

```
Before:
  DownloadService (Blob) → Blob만
  BulkDownloadService (URL) → 제거
  UnifiedDownloadService (URL) → 통합

After:
  DownloadService (Blob + URL) → 모두
```

**장점**:

- ✅ 단일 진입점 (DownloadService만)
- ✅ API 단순화

**단점**:

- ⚠️ Blob과 URL 로직 섞임
- ⚠️ 책임 분산 (Single Responsibility 위반)
- ❌ 디자인 패턴 어긋남

---

## 🚀 실행 계획 (Option A 추천)

### Phase 355 작업 순서

#### Step 355.1: 사용처 완전 분석 (준비)

```bash
# 1. BulkDownloadService 사용처 모두 찾기
grep -r "BulkDownloadService\|bulkDownloadService" src --include="*.ts" \
  --include="*.tsx" | wc -l

# 2. UnifiedDownloadService 사용처 확인
grep -r "UnifiedDownloadService\|unifiedDownloadService" src --include="*.ts" \
  --include="*.tsx" | wc -l

# 3. SERVICE_KEYS 확인
grep -r "BULK_DOWNLOAD\|UNIFIED_DOWNLOAD\|GALLERY_DOWNLOAD" src \
  --include="*.ts" | head -20
```

**검증**: 모든 사용처 매핑 완료

#### Step 355.2: 타입 표준화

**작업**:

```typescript
// Before
BulkDownloadOptions (in bulk-download-service.ts)
DownloadOptions (in unified-download-service.ts)

// After
DownloadOptions (통일, unified-download-service.ts 유지)
// BulkDownloadOptions는 별칭이거나 제거
```

#### Step 355.3: UnifiedDownloadService 강화

**추가할 기능** (BulkDownloadService에서):

```typescript
1. cancelDownload() 로직 검토
2. isDownloading() 상태 관리
3. 진행 상황 콜백 강화
4. 에러 처리 최적화
```

#### Step 355.4: Import 경로 변경

**변경 대상**:

```typescript
// Before
import { bulkDownloadService } from '@shared/services';

// After
import { unifiedDownloadService } from '@shared/services';

// 또는 alias 추가
export const bulkDownloadService = unifiedDownloadService;
```

#### Step 355.5: Lazy Registration 수정

**파일**: `src/shared/services/lazy-service-registration.ts`

```typescript
// Before
ensureBulkDownloadServiceRegistered();

// After
ensureUnifiedDownloadServiceRegistered();
```

#### Step 355.6: SERVICE_KEYS 정리

**파일**: `src/constants.ts`

```typescript
// Before
SERVICE_KEYS.BULK_DOWNLOAD;
SERVICE_KEYS.GALLERY_DOWNLOAD;
SERVICE_KEYS.UNIFIED_DOWNLOAD;

// After
SERVICE_KEYS.UNIFIED_DOWNLOAD(통합);
// BULK_DOWNLOAD는 별칭 또는 제거
```

#### Step 355.7: 파일 삭제

```bash
rm src/shared/services/bulk-download-service.ts
```

#### Step 355.8: 검증

```bash
npm run typecheck
npm run lint
npm run validate:pre
npm run test:unit:batched
```

---

## 📊 통합 효과 (예상)

| 항목                     | Before        | After         | 변화  |
| ------------------------ | ------------- | ------------- | ----- |
| **다운로드 서비스 파일** | 3개 (1,573줄) | 2개 (1,034줄) | -34%  |
| **코드 중복**            | ~600줄 (40%)  | ~0줄          | -100% |
| **공개 API**             | 동일          | 동일          | 호환  |
| **검증 시간**            | 기준          | 약간 감소     | -5%   |

---

## 📋 작업 시작 전 체크리스트

- [ ] Phase 354 모든 검증 통과
- [ ] 다운로드 서비스 구조 이해 완료
- [ ] 사용처 완전 매핑됨
- [ ] 위험 평가 완료
- [ ] Rollback 계획 수립

---

**다음 단계**: 체크리스트 확인 후 Step 355.1 시작

---

## 참고: 관련 파일

- **작업 계획**: IMPLEMENTATION_ROADMAP.md
- **Phase 353**: PHASE_353_COMPLETION.md
- **Phase 354**: PHASE_354_COMPLETION.md
- **구조 분석**: ARCHITECTURE.md (Services section)
