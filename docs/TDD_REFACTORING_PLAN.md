# TDD 리팩토링 활성 계획 (2025-10-06 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

## 0) 현재 상태 점검 요약

- 품질 게이트: typecheck, lint, smoke/fast 테스트 GREEN. dev/prod 빌드 및
  postbuild validator 정상 동작 중.
- Vendors: 정적 매니저(`StaticVendorManager`) 경유 정책 준수. 테스트 모드 자동
  초기화 경고는 다운그레이드되어 소음 없음(완료 항목으로 이관됨).
- 레거시 표면: 동적 VendorManager(`vendor-manager.ts`)는 TEST-ONLY 유지. 갤러리
  런타임 `createAppContainer.ts` 스텁은 삭제 완료(테스트 하네스 전용 경로만
  사용).
- **NEW**: fflate 의존성 제거 결정 — 압축 없는 자체 ZIP 구현으로 전환하여 번들
  크기 최적화 및 완전한 제어권 확보

---

## 남은 작업(우선순위 및 순서)

### Epic: FFLATE-REMOVAL (2025-10-06 시작)

**목표**: fflate 외부 의존성을 제거하고 압축 없는 Store-only ZIP을 자체 구현하여
번들 크기 최적화(8-15 KB 절감) 및 완전한 제어권 확보

**배경**:

- 현재 fflate를 사용하지만 압축 레벨 0(압축 안 함)으로 설정되어 있음
- ZIP 포맷의 컨테이너 기능만 필요 → 압축 라이브러리는 오버스펙
- 의존성 1개 제거로 보안 감사 부담 감소
- 프로젝트 철학(외부 의존 최소화)과 일치

**솔루션 평가 결과**:

- ✅ **Option A (채택)**: 완전 자체 구현 (Store-only ZIP)
  - 장점: 의존성 0, 최소 크기(3-5 KB), 완전한 제어
  - 단점: 개발 시간 6-8시간, 초기 안정성 위험
- ❌ Option B: 경량 ZIP 라이브러리 교체 → 목적 불부합(여전히 의존성)
- ❌ Option C: TAR 포맷 → Windows 사용자 경험 저하
- ❌ Option D: 브라우저 네이티브 API → 파일 묶음 기능 없음
- ❌ Option E: ZIP 기능 제거 → 기능 퇴보

**예상 효과**:

- 번들 크기: Prod 367KB → 359-364KB (약 2-4% 감소)
- 의존성: 3개 → 2개 (preact, @preact/signals만)
- 코드 라인 증가: +250-400 줄 (핵심 150-250, 테스트 100-150)

---

#### Phase 1: Store-only ZIP 자체 구현 (핵심 로직)

**상태**: NOT STARTED **예상 시간**: 3-4 시간 **TDD 순서**: RED(기반 테스트) →
GREEN(최소 구현) → REFACTOR(최적화)

**Task 1.1: ZIP 포맷 핵심 유틸리티 구현**

파일: `src/shared/external/zip/zip-format-utils.ts` (신규)

구현 내용:

1. **CRC32 체크섬 계산**

   ```typescript
   // IEEE 802.3 표준 CRC32 (ZIP 포맷 요구)
   function calculateCRC32(data: Uint8Array): number;
   ```

   - 참고: https://www.ietf.org/rfc/rfc1952.txt
   - 사전 계산된 CRC32 테이블 사용 (256 엔트리)

2. **DOS 날짜/시간 변환**

   ```typescript
   function toDosDateTime(date: Date): { dosDate: number; dosTime: number };
   ```

   - DOS 날짜: (년-1980) << 9 | 월 << 5 | 일
   - DOS 시간: 시 << 11 | 분 << 5 | (초/2)

3. **Little-endian 바이트 쓰기**
   ```typescript
   class ByteWriter {
     writeUint8(value: number): void;
     writeUint16LE(value: number): void;
     writeUint32LE(value: number): void;
     writeBytes(data: Uint8Array): void;
     getBuffer(): Uint8Array;
   }
   ```

**수용 기준**:

- [ ] CRC32 계산이 표준 값과 일치 (테스트: "hello world" → 0x0D4A1185)
- [ ] DOS 날짜/시간이 올바르게 변환 (테스트: 2025-10-06 14:30:00)
- [ ] ByteWriter가 정확한 little-endian 쓰기 수행
- [ ] 모든 유틸 함수가 strict TypeScript 준수
- [ ] 단위 테스트 커버리지 100%

**테스트 파일**: `test/unit/shared/external/zip/zip-format-utils.test.ts`

---

**Task 1.2: ZIP 구조체 생성 구현**

파일: `src/shared/external/zip/zip-creator-native.ts` (신규)

ZIP 포맷 구조 (Store-only):

```
[Local File Header 1]
[File Data 1]
[Local File Header 2]
[File Data 2]
...
[Central Directory Header 1]
[Central Directory Header 2]
...
[End of Central Directory Record]
```

구현 내용:

1. **Local File Header** (30 bytes + 가변 길이)

   ```
   Offset  Size  Content
   0       4     Local file header signature (0x04034b50)
   4       2     Version needed to extract (10)
   6       2     General purpose bit flag (0)
   8       2     Compression method (0 = store)
   10      2     Last mod file time (DOS)
   12      2     Last mod file date (DOS)
   14      4     CRC-32
   18      4     Compressed size
   22      4     Uncompressed size
   26      2     Filename length (n)
   28      2     Extra field length (0)
   30      n     Filename
   ```

2. **Central Directory Header** (46 bytes + 가변 길이)

   ```
   Offset  Size  Content
   0       4     Central directory signature (0x02014b50)
   4       2     Version made by (10)
   6       2     Version needed (10)
   8       2     Flag (0)
   10      2     Compression (0)
   12      2     Mod time
   14      2     Mod date
   16      4     CRC-32
   20      4     Compressed size
   24      4     Uncompressed size
   28      2     Filename length (n)
   30      2     Extra length (0)
   32      2     Comment length (0)
   34      2     Disk number start (0)
   36      2     Internal attributes (0)
   38      4     External attributes (0)
   42      4     Local header offset
   46      n     Filename
   ```

3. **End of Central Directory Record** (22 bytes)
   ```
   Offset  Size  Content
   0       4     EOCD signature (0x06054b50)
   4       2     Disk number (0)
   6       2     Disk with CD (0)
   8       2     Entries on this disk
   10      2     Total entries
   12      4     CD size
   16      4     CD offset
   20      2     Comment length (0)
   ```

**핵심 함수**:

```typescript
export function createZipFromFiles(
  files: Record<string, Uint8Array>,
  options?: { date?: Date }
): Uint8Array;
```

**수용 기준**:

- [ ] 단일 파일 ZIP 생성 성공
- [ ] 다중 파일 ZIP 생성 성공
- [ ] 생성된 ZIP을 서드파티 도구(7-Zip, WinRAR)로 압축 해제 가능
- [ ] CRC32 체크섬 정확성 검증
- [ ] 특수 문자 파일명 처리 (UTF-8)
- [ ] 빈 파일 처리
- [ ] 큰 파일 처리 (>10MB, 메모리 효율성)

**테스트 파일**: `test/unit/shared/external/zip/zip-creator-native.test.ts`

**테스트 케이스**:

```typescript
describe('createZipFromFiles', () => {
  it('단일 파일 ZIP 생성', () => {
    const files = { 'test.txt': new TextEncoder().encode('hello') };
    const zip = createZipFromFiles(files);
    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip.length).toBeGreaterThan(0);
    // ZIP 시그니처 검증
    expect(zip[0]).toBe(0x50); // 'P'
    expect(zip[1]).toBe(0x4b); // 'K'
  });

  it('다중 파일 ZIP 생성', () => {
    const files = {
      'file1.txt': new TextEncoder().encode('content1'),
      'file2.txt': new TextEncoder().encode('content2'),
    };
    const zip = createZipFromFiles(files);
    // Central Directory 엔트리 수 검증 (EOCD의 offset 10-11)
  });

  it('특수 문자 파일명 처리', () => {
    const files = { '한글파일.txt': new TextEncoder().encode('test') };
    const zip = createZipFromFiles(files);
    expect(() => createZipFromFiles(files)).not.toThrow();
  });

  it('빈 파일 처리', () => {
    const files = { 'empty.txt': new Uint8Array(0) };
    expect(() => createZipFromFiles(files)).not.toThrow();
  });

  // 실제 압축 해제 가능 여부는 수동 검증 또는 E2E 테스트
});
```

---

#### Phase 2: 기존 인터페이스 통합 및 전환

**상태**: NOT STARTED **예상 시간**: 2-3 시간 **의존성**: Phase 1 완료

**Task 2.1: zip-creator.ts 리팩토링**

기존 fflate 기반 구현을 자체 구현으로 교체하되, **API 시그니처는 완전히 동일하게
유지**

변경 파일: `src/shared/external/zip/zip-creator.ts`

```typescript
// BEFORE
import { getFflate } from '../../external/vendors';

export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  config: Partial<ZipCreationConfig> = {}
): Promise<Uint8Array> {
  const api = getFflate();
  // fflate.zip() 호출
}

// AFTER
import { createZipFromFiles } from './zip-creator-native';

export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  config: Partial<ZipCreationConfig> = {}
): Promise<Uint8Array> {
  // 자체 구현 호출
  return createZipFromFiles(files, {
    date: new Date(),
  });
}
```

**주의사항**:

- `compressionLevel` 옵션은 무시 (항상 Store 모드)
- 다른 config 옵션들은 유지 (maxFileSize, requestTimeout 등은 상위 레이어에서
  처리)
- 에러 메시지는 기존과 동일한 형식 유지

**수용 기준**:

- [ ] 기존 API 시그니처 100% 동일
- [ ] 기존 테스트 스위트 모두 GREEN (변경 없이)
- [ ] DownloadOrchestrator 통합 테스트 GREEN
- [ ] BulkDownloadService 테스트 GREEN
- [ ] 에러 처리 동작 일치

**테스트 실행**:

```bash
npm run test:unit -- zip-creator
npm run test:unit -- bulk-download
npm run test:unit -- DownloadOrchestrator
```

---

**Task 2.2: Deprecated 함수 정리**

`createZipFromItems` 함수는 이미 deprecated 상태이므로 제거 가능 여부 확인

```typescript
// 제거 대상 (현재 deprecated)
export async function createZipFromItems(...) { }
async function downloadFilesForZip(...) { }
async function downloadMediaForZip(...) { }
async function createZipBlob(...) { }
function chunkArray(...) { }
function generateUniqueFilename(...) { }
```

**수용 기준**:

- [ ] 프로젝트 전체에서 deprecated 함수 사용처 0개 확인 (grep 검색)
- [ ] 제거 후 전체 테스트 GREEN
- [ ] 코드 라인 수 감소 확인 (약 150-200 줄 제거 예상)

---

#### Phase 3: Vendor 시스템 정리

**상태**: NOT STARTED **예상 시간**: 1-2 시간 **의존성**: Phase 2 완료

**Task 3.1: Vendor Manager에서 fflate 제거**

변경 파일들:

1. `src/shared/external/vendors/vendor-manager-static.ts`
2. `src/shared/external/vendors/vendor-manager.ts` (TEST-ONLY)
3. `src/shared/external/vendors/vendor-api-safe.ts`
4. `src/shared/external/vendors/index.ts`

```typescript
// REMOVE
import * as fflate from 'fflate';

export interface FflateAPI { ... }

export function getFflateSafe(): FflateAPI { ... }

// REMOVE export
export { getFflateSafe as getFflate }
```

**수용 기준**:

- [ ] `getFflate()` 호출이 프로젝트에서 완전히 제거됨 (grep 검색 결과 0)
- [ ] Vendor 초기화 로직에서 fflate 관련 코드 제거
- [ ] VendorInitState 타입에서 `fflate: boolean` 제거
- [ ] 테스트 모킹에서 fflate 관련 코드 제거

**변경 파일**:

- `test/__mocks__/vendor.mock.ts`
- `test/utils/mocks/vendor-mocks.ts`
- `test/utils/mocks/vendor-mocks-clean.ts`

---

**Task 3.2: package.json 의존성 제거**

```bash
npm uninstall fflate
```

변경 파일: `package.json`

```json
// BEFORE
"dependencies": {
  "@preact/signals": "2.3.2",
  "fflate": "0.8.2",  // ← 제거
  "preact": "10.27.2"
}

// AFTER
"dependencies": {
  "@preact/signals": "2.3.2",
  "preact": "10.27.2"
}
```

**수용 기준**:

- [ ] `npm list fflate` 결과가 "not found"
- [ ] `package-lock.json`에서 fflate 관련 엔트리 제거 확인
- [ ] `npm audit` 결과에 fflate 없음
- [ ] 의존성 그래프에서 fflate 노드 제거 확인
- [ ] `LICENSES/fflate-MIT.txt` 파일 제거 (라이선스 정리)

---

**Task 3.3: 빌드 및 번들 검증**

```bash
npm run build:dev
npm run build:prod
node ./scripts/validate-build.js
```

**검증 항목**:

- [ ] Dev 빌드 크기: 이전 대비 감소 확인 (예상: 1120KB → 1110KB 내외)
- [ ] Prod 빌드 크기: 이전 대비 감소 확인 (예상: 367KB → 359-364KB)
- [ ] 빌드 산출물에 "fflate" 문자열 없음 (grep 검색)
- [ ] Postbuild validator GREEN
- [ ] Userscript 메타데이터 정상

**번들 분석**:

```bash
# Vite 번들 분석 (선택적)
npm run build:prod -- --mode production --sourcemap
# dist/xcom-enhanced-gallery.user.js.map 확인
```

---

#### Phase 4: 통합 테스트 및 검증

**상태**: NOT STARTED **예상 시간**: 1-2 시간 **의존성**: Phase 3 완료

**Task 4.1: 전체 테스트 스위트 실행**

```bash
npm run typecheck
npm run lint:fix
npm run test:smoke
npm run test:fast
npm run test:unit
npm run test:styles
npm run validate
```

**수용 기준**:

- [ ] 모든 타입 체크 GREEN
- [ ] 린트 위반 0개
- [ ] 전체 테스트 스위트 GREEN (smoke, fast, unit, styles)
- [ ] 의존성 검증 GREEN (`npm run deps:check`)

---

**Task 4.2: 실제 ZIP 파일 검증 (수동 테스트)**

생성된 ZIP 파일을 실제 도구로 검증:

**테스트 시나리오**:

1. 브라우저 콘솔에서 테스트 ZIP 생성

   ```typescript
   import { createZipFromFiles } from '@shared/external/zip/zip-creator-native';

   const files = {
     'test1.txt': new TextEncoder().encode('Hello World'),
     'test2.jpg': new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), // JPEG 헤더
   };

   const zipData = createZipFromFiles(files);
   const blob = new Blob([zipData], { type: 'application/zip' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'test.zip';
   a.click();
   ```

2. 다운로드된 ZIP 파일을 다음 도구로 압축 해제:
   - ✅ Windows 탐색기 (내장 ZIP 지원)
   - ✅ 7-Zip
   - ✅ WinRAR
   - ✅ macOS Archive Utility
   - ✅ Linux unzip 명령어

**수용 기준**:

- [ ] 모든 도구에서 정상 압축 해제
- [ ] 파일 내용 정확성 100%
- [ ] 파일명 인코딩 정상 (한글, 이모지 등)
- [ ] CRC 에러 0개

---

**Task 4.3: E2E/Playwright 테스트 (선택적)**

실제 X.com 페이지에서 다중 이미지 다운로드 테스트

파일: `playwright/smoke/zip-download.spec.ts` (신규)

```typescript
test('다중 이미지 ZIP 다운로드', async ({ page }) => {
  // X.com 트윗 페이지 접속
  // 갤러리 열기
  // 다운로드 버튼 클릭 (다중 선택)
  // ZIP 파일 다운로드 확인
  // ZIP 파일 압축 해제 및 내용 검증
});
```

**수용 기준**:

- [ ] E2E 테스트 GREEN
- [ ] 실제 브라우저에서 정상 동작 확인

---

#### Phase 5: 문서화 및 마무리

**상태**: NOT STARTED **예상 시간**: 0.5-1 시간 **의존성**: Phase 4 완료

**Task 5.1: 코드 주석 및 문서 업데이트**

변경/추가 파일:

1. `src/shared/external/zip/README.md` (신규)
   - ZIP 포맷 구현 설명
   - Store-only 제한 사항 명시
   - 사용 예제

2. `CHANGELOG.md` 업데이트

   ```markdown
   ## [0.4.0] - 2025-10-06

   ### Changed

   - **BREAKING**: Removed fflate dependency
   - Implemented native Store-only ZIP creation
   - Reduced bundle size by ~8-15 KB (Prod: 367KB → 359KB)

   ### Removed

   - fflate external dependency
   - Compression support (Store-only mode)
   ```

3. `README.md` 업데이트
   - 의존성 목록에서 fflate 제거
   - 번들 크기 수치 업데이트

4. `docs/ARCHITECTURE.md` 업데이트
   - External 레이어에서 vendors/fflate 제거
   - zip-creator-native 자체 구현 명시

**수용 기준**:

- [ ] README.md 의존성 목록 정확
- [ ] CHANGELOG.md에 변경 사항 명시
- [ ] 코드 주석이 명확하고 이해하기 쉬움
- [ ] ZIP 포맷 참고 문서 링크 포함

---

**Task 5.2: 성능 벤치마크 (선택적)**

비교 대상: fflate vs 자체 구현

```typescript
// test/performance/zip-creation.bench.ts
describe('ZIP Creation Performance', () => {
  bench('fflate (baseline)', () => {
    /* ... */
  });
  bench('native (new)', () => {
    /* ... */
  });
});
```

**측정 항목**:

- 생성 속도 (ops/sec)
- 메모리 사용량
- 번들 크기 차이

**예상 결과**:

- 속도: 자체 구현이 약간 느릴 수 있음 (최적화 덜 됨)
- 메모리: 비슷하거나 약간 적음 (단순 구현)
- 번들: 자체 구현이 3-10 KB 작음

---

### Epic 완료 체크리스트

최종 검증 전 확인 사항:

**코드 품질**:

- [ ] 전체 typecheck GREEN
- [ ] 전체 lint GREEN (warnings 0)
- [ ] Prettier 포맷 적용
- [ ] 순환 의존성 0개 (`npm run deps:check`)

**테스트**:

- [ ] Unit 테스트 커버리지 유지 또는 증가
- [ ] 전체 테스트 스위트 GREEN (smoke/fast/unit/styles)
- [ ] 수동 ZIP 검증 통과 (3개 이상 도구)

**빌드**:

- [ ] Dev 빌드 성공
- [ ] Prod 빌드 성공
- [ ] Postbuild validator 통과
- [ ] 번들 크기 감소 확인

**문서**:

- [ ] CHANGELOG.md 업데이트
- [ ] README.md 업데이트
- [ ] 코드 주석 충분

**의존성**:

- [ ] `npm list fflate` → not found
- [ ] `npm audit` 통과
- [ ] 의존성 그래프 갱신 (`npm run deps:all`)

**배포 준비**:

- [ ] Git 커밋 메시지 명확
- [ ] PR 설명 작성 (변경 이유, 테스트 결과, 번들 크기 비교)
- [ ] 롤백 계획 준비 (fflate 버전 태깅)

---

### 리스크 관리

**높은 리스크**:

1. **ZIP 호환성 문제**: 일부 압축 해제 도구에서 실패 가능
   - 완화: 다양한 도구로 사전 테스트 (Task 4.2)
   - 롤백: fflate로 즉시 복원 가능

2. **초기 버그**: CRC32, 날짜 변환 등에서 버그 가능
   - 완화: 단위 테스트 100% 커버리지
   - 롤백: 배포 후 1주일 모니터링 기간

**중간 리스크**: 3. **성능 저하**: 자체 구현이 fflate보다 느릴 수 있음

- 완화: 벤치마크로 사전 측정
- 수용: 압축 없는 Store 모드는 빠름, 실사용 영향 미미

4. **엣지 케이스**: 특수 문자, 큰 파일 등
   - 완화: 광범위한 테스트 케이스
   - 모니터링: 사용자 피드백 수집

**낮은 리스크**: 5. **테스트 업데이트**: 모킹 코드 변경 필요

- 완화: Phase 별 점진적 변경
- 자동화: CI에서 즉시 탐지

---

### 예상 일정

**총 예상 시간**: 8-12 시간 (1-2 작업일)

| Phase    | 예상 시간 | 설명               |
| -------- | --------- | ------------------ |
| Phase 1  | 3-4h      | ZIP 포맷 핵심 구현 |
| Phase 2  | 2-3h      | 기존 API 통합      |
| Phase 3  | 1-2h      | Vendor 정리        |
| Phase 4  | 1-2h      | 통합 테스트        |
| Phase 5  | 0.5-1h    | 문서화             |
| **합계** | **8-12h** |                    |

**마일스톤**:

- Day 1 오전: Phase 1 완료 (핵심 구현)
- Day 1 오후: Phase 2 완료 (통합)
- Day 2 오전: Phase 3-4 완료 (정리 및 검증)
- Day 2 오후: Phase 5 완료 (문서화 및 PR)

---

### 롤백 계획

만약 심각한 문제 발견 시:

1. **즉시 롤백** (< 1 시간):

   ```bash
   git revert <commit-range>
   npm install  # fflate 복원
   npm run build:prod
   ```

2. **점진적 롤백** (Feature Flag 방식):

   ```typescript
   // zip-creator.ts
   const USE_NATIVE_ZIP = false; // ← 플래그로 전환 제어

   if (USE_NATIVE_ZIP) {
     return createZipFromFiles(files);
   } else {
     const api = getFflate();
     // fflate 사용
   }
   ```

3. **하이브리드 접근** (일부만 전환):
   - 작은 파일(<10개)만 자체 구현 사용
   - 큰 파일은 fflate 유지 (또는 에러 시 fallback)

---

### 참고 자료

**ZIP 포맷 스펙**:

- [PKWARE ZIP File Format Specification](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- [ZIP File Structure](<https://en.wikipedia.org/wiki/ZIP_(file_format)#Structure>)

**CRC32 구현 참고**:

- [IEEE 802.3 CRC32](https://www.ietf.org/rfc/rfc1952.txt)
- [CRC32 in JavaScript](https://stackoverflow.com/questions/18638900/javascript-crc32)

**기존 구현 참고**:

- [fflate source code](https://github.com/101arrowz/fflate)
- [JSZip](https://github.com/Stuk/jszip)

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서
진행하며, 실패 시 해당 커밋만 리버트 가능.

## 품질 게이트 (작업 중 반복 확인)

## 참고/정책 고지

---

## 부록 — SOURCE PATH RENAME / CLEANUP PLAN (정리됨)

> 목적: 레거시/혼동 가능 경로를 식별하고, 안전한 단계별 리네임/정리를 통해

- 근거/제약: 3계층 단방향(Features → Shared → External), vendors/userscript
  getter 규칙, PC-only, CSS Tokens, 테스트 우선(TDD)

### 스코프(1차)

- (해결) B/C/F 항목은 TEST-ONLY/LEGACY 표면 유지 정책으로 확정되었습니다. 활성
  계획에서는 제외되었으며, 완료 로그에서 가드/수용 기준과 함께 추적합니다.

### 후보와 제안

- 해당 없음(완료 로그 참조). 필요 시 후속 스캔/가드 강화만 수행.

### 단계별 실행 순서(요약 현행화)

- 현재 없음 — 신규 관찰 대상이 생기면 추가.

### 리스크/롤백

- 리스크: 테스트 경로 의존(특히 vendor-manager.ts) 및 스캔 규칙 민감도
- 롤백: re-export 유지, 배럴 되돌림, 문서/테스트만 수정으로 복구 가능

### 수용 기준(전역)

- deps-cruiser 순환/금지 위반 0
- src/\*\*에서 TEST-ONLY/LEGACY 대상의 런타임 import 0
- 번들 문자열 가드 PASS(VendorManager 등 금지 키워드 0)
- 전체 테스트/빌드/포스트빌드 GREEN
