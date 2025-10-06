# StoreZipWriter 설계 문서

> STORE 방식(무압축) ZIP 파일 생성기 설계 작성일: 2025-10-06 상태: 설계 완료

## 개요

xcom-enhanced-gallery 프로젝트는 이미 압축된 미디어 파일(이미지, 비디오)을
다루므로, ZIP 파일 생성 시 재압축이 불필요합니다. 이에 fflate 의존성을 제거하고,
압축 없이 파일을 묶기만 하는 STORE 방식 ZIP Writer를 직접 구현합니다.

### 목표

- **fflate 의존성 제거**: 번들 크기 감소 및 라이선스 관리 부담 제거
- **STORE 방식 지원**: 압축 없이 파일을 묶는 최소 기능만 구현
- **ZIP 명세 준수**: PKZIP Application Note 기반 표준 호환
- **테스트 가능성**: TDD 방식으로 단계적 구현

## ZIP 포맷 구조 (STORE 방식)

### 전체 구조

```text
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

### 1. Local File Header (30 bytes + 가변)

각 파일의 메타데이터를 포함합니다.

```text
Offset  Bytes  Field
------  -----  -----
0       4      Local file header signature (0x04034b50)
4       2      Version needed to extract (minimum) = 10
6       2      General purpose bit flag = 0
8       2      Compression method = 0 (STORE)
10      2      Last mod file time (DOS format)
12      2      Last mod file date (DOS format)
14      4      CRC-32
18      4      Compressed size
22      4      Uncompressed size
26      2      File name length (n)
28      2      Extra field length (m) = 0
30      n      File name
30+n    m      Extra field (우리는 사용하지 않음)
```

### 2. Central Directory Header (46 bytes + 가변)

ZIP 파일의 중앙 디렉토리에 각 파일의 정보를 기록합니다.

```text
Offset  Bytes  Field
------  -----  -----
0       4      Central directory file header signature (0x02014b50)
4       2      Version made by = 20
6       2      Version needed to extract = 10
8       2      General purpose bit flag = 0
10      2      Compression method = 0 (STORE)
12      2      Last mod file time
14      2      Last mod file date
16      4      CRC-32
20      4      Compressed size
24      4      Uncompressed size
28      2      File name length (n)
30      2      Extra field length = 0
32      2      File comment length = 0
34      2      Disk number start = 0
36      2      Internal file attributes = 0
38      4      External file attributes = 0
42      4      Relative offset of local header
46      n      File name
```

### 3. End of Central Directory Record (22 bytes)

ZIP 파일의 끝을 표시하고 전체 메타데이터를 요약합니다.

```text
Offset  Bytes  Field
------  -----  -----
0       4      End of central directory signature (0x06054b50)
4       2      Number of this disk = 0
6       2      Disk where central directory starts = 0
8       2      Number of central directory records on this disk
10      2      Total number of central directory records
12      4      Size of central directory
16      4      Offset of start of central directory
20      2      ZIP file comment length = 0
```

## 인터페이스 설계

### StoreZipWriter 클래스

````typescript
/**
 * STORE 방식(무압축) ZIP 파일 생성기
 *
 * @example
 * ```typescript
 * const writer = new StoreZipWriter();
 * writer.addFile('image1.jpg', imageData);
 * writer.addFile('image2.jpg', imageData2);
 * const zipBytes = writer.build();
 * ```
 */
export class StoreZipWriter {
  private files: FileEntry[] = [];
  private currentOffset: number = 0;

  /**
   * ZIP에 파일 추가
   * @param filename - 파일명 (UTF-8, 경로 구분자 '/' 사용)
   * @param data - 파일 내용 (Uint8Array)
   */
  addFile(filename: string, data: Uint8Array): void;

  /**
   * ZIP 파일을 Uint8Array로 빌드
   * @returns ZIP 파일 바이트 배열
   * @throws {Error} 파일이 없거나 빌드 실패 시
   */
  build(): Uint8Array;

  /**
   * 추가된 파일 초기화
   */
  clear(): void;
}

/**
 * ZIP 내부 파일 엔트리
 */
interface FileEntry {
  filename: string;
  data: Uint8Array;
  crc32: number;
  offset: number;
  modTime: number;
  modDate: number;
}
````

### 헬퍼 함수

```typescript
/**
 * CRC-32 체크섬 계산
 * @param data - 체크섬을 계산할 데이터
 * @returns CRC-32 값
 */
function calculateCRC32(data: Uint8Array): number;

/**
 * DOS 날짜/시간 형식으로 변환
 * @param date - JavaScript Date 객체
 * @returns [dosTime, dosDate] 튜플
 */
function toDOSDateTime(date: Date): [number, number];

/**
 * 리틀 엔디안으로 정수 쓰기
 * @param buffer - 대상 버퍼
 * @param offset - 쓰기 시작 위치
 * @param value - 쓸 값
 * @param bytes - 바이트 수 (2 또는 4)
 */
function writeUint(
  buffer: Uint8Array,
  offset: number,
  value: number,
  bytes: 2 | 4
): void;
```

## 구현 단계 (TDD)

### Phase 1: 기본 구조 (RED → GREEN)

1. **빈 ZIP 생성 테스트**
   - EOCD만 포함된 최소 ZIP 생성
   - 22바이트 크기 검증

2. **단일 파일 추가 테스트**
   - Local File Header + File Data 생성
   - 파일명 인코딩 (UTF-8)
   - CRC-32 계산

### Phase 2: Central Directory (RED → GREEN)

3. **Central Directory 생성**
   - 각 파일에 대한 CD 헤더 생성
   - 오프셋 계산 정확성

4. **EOCD 완성**
   - 파일 수, CD 크기, CD 오프셋 계산
   - 전체 ZIP 구조 검증

### Phase 3: 엣지케이스 (RED → GREEN)

5. **특수 문자 파일명**
   - UTF-8 인코딩 테스트
   - 경로 구분자 처리 ('/')
   - 한글, 공백, 특수 문자

6. **다양한 파일 크기**
   - 빈 파일 (0 bytes)
   - 큰 파일 처리

7. **중복 파일명 처리**
   - 자동 유니크화 또는 에러 처리

## CRC-32 구현

### 표준 폴리노미얼

```typescript
const CRC32_POLYNOMIAL = 0xedb88320;

function makeCRC32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ CRC32_POLYNOMIAL : crc >>> 1;
    }
    table[i] = crc;
  }
  return table;
}

function calculateCRC32(data: Uint8Array): number {
  const table = makeCRC32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
```

## DOS 날짜/시간 형식

```typescript
function toDOSDateTime(date: Date): [number, number] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2); // 2초 단위

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;

  return [dosTime, dosDate];
}
```

## 메모리 관리

### 버퍼 크기 계산

```typescript
function calculateTotalSize(files: FileEntry[]): number {
  let size = 0;

  // Local File Headers + File Data
  for (const file of files) {
    size += 30; // Local File Header 고정 부분
    size += file.filename.length; // 파일명
    size += file.data.length; // 파일 데이터
  }

  // Central Directory Headers
  for (const file of files) {
    size += 46; // Central Directory Header 고정 부분
    size += file.filename.length; // 파일명
  }

  // End of Central Directory
  size += 22;

  return size;
}
```

### 한 번에 빌드

- 전체 크기를 미리 계산하고 단일 `Uint8Array` 할당
- 순차적 쓰기로 메모리 효율성 확보
- 중간 버퍼 생성 최소화

## 호환성 및 검증

### 표준 도구 호환성

생성된 ZIP은 다음 도구에서 정상 동작해야 합니다:

- **Windows**: Windows Explorer, 7-Zip, WinRAR
- **macOS**: Archive Utility, The Unarchiver
- **Linux**: unzip, file-roller

### 검증 전략

1. **바이트 레벨 검증**: 헤더 시그니처, 오프셋, 크기 검증
2. **표준 도구 테스트**: 생성된 ZIP을 unzip 등으로 압축 해제
3. **라운드트립 테스트**: ZIP 생성 → 압축 해제 → 내용 비교

## 제약 사항 및 제외 기능

### 지원하지 않음

- **압축 방식**: DEFLATE, BZIP2 등 (STORE만 지원)
- **ZIP64**: 4GB 이상 파일/아카이브
- **암호화**: AES, Traditional 등
- **멀티 디스크**: 분할 아카이브
- **Extra Field**: 확장 속성
- **파일 속성**: Unix 권한, Windows 속성 등

### 미래 확장 가능성

필요 시 다음 기능을 추가할 수 있습니다:

- 스트리밍 API (대용량 파일)
- 진행률 콜백
- 파일명 충돌 자동 해결
- 디렉토리 구조 지원 (현재는 평탄화)

## 참고 자료

- **PKZIP Application Note**:
  [APPNOTE.TXT](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- **ZIP File Format Specification**:
  [Wikipedia](<https://en.wikipedia.org/wiki/ZIP_(file_format)>)
- **RFC 1951**: DEFLATE Compressed Data Format Specification (참고용)

## 성공 기준

1. ✅ STORE 방식 ZIP 파일 생성 성공
2. ✅ CRC-32 체크섬 정확성
3. ✅ 표준 도구로 압축 해제 가능
4. ✅ UTF-8 파일명 올바른 처리
5. ✅ 여러 파일 묶기 성공
6. ✅ 모든 단위 테스트 GREEN
7. ✅ 엣지케이스 처리 (빈 파일, 큰 파일, 특수 문자)
