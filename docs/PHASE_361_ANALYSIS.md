# Phase 361: 단위 테스트 안정화 계획 및 실행

**작성 날짜**: 2025-11-07 | **상태**: 🔴 분석 중 | **버전**: 0.4.2

---

## 🔍 실패 원인 근본 분석

### 진단 결과

#### ❌ 실패 테스트: conflict-resolution.test.ts (Line 106-112)

```typescript
it('should handle manual focus with logging', async () => {
  const { readFileSync } = await import('fs');
  const content = readFileSync(
    './src/features/gallery/hooks/useGalleryFocusTracker.ts',
    'utf-8'
  );

  // 테스트 찾는 문자열:
  expect(content).toContain('manual focus set'); // ✅ 있음
  expect(content).toContain('manual focus cleared'); // ❌ 없음!
});
```

#### 원인 파악

**소스 코드 (useGalleryFocusTracker.ts:406)**:

```typescript
logger.debug('useGalleryFocusTracker: Manual focus cleared');
```

**테스트 예상 문자열**:

```
'manual focus cleared'
```

**실제 로그 문자열**:

```
'useGalleryFocusTracker: Manual focus cleared'
```

**문제**: 테스트가 찾는 부분 문자열이 너무 짧음 → 정확한 문자열과 비교해야 함

---

## ✅ 수정 계획

### 수정 방안 (3가지 옵션)

#### ✅ 옵션 A: 테스트 수정 (권장)

```typescript
// ❌ Before
expect(content).toContain('manual focus cleared');

// ✅ After
expect(content).toContain(
  "logger.debug('useGalleryFocusTracker: Manual focus cleared');"
);
// 또는
expect(content).toContain('Manual focus cleared');
```

**장점**:

- 더 정확한 검증
- 실제 로그 형식 확인 가능
- 코드 변경 불필요

#### ✅ 옵션 B: 코드 표준화

```typescript
// src/features/gallery/hooks/useGalleryFocusTracker.ts:351 변경
logger.debug('useGalleryFocusTracker: Manual focus cleared', { index });
↓
logger.debug('manual focus cleared');  // 간단하게
```

**장점**:

- 로그 메시지 표준화
- 테스트 단순화

**단점**:

- 기존 로그 포맷 변경
- 다른 곳에도 영향

#### ✅ 옵션 C: 하이브리드

```typescript
// 두 위치 모두 통일
- Line 351: logger.debug('useGalleryFocusTracker: Manual focus cleared', { index });
- Line 406: logger.debug('useGalleryFocusTracker: Manual focus cleared');

// 테스트는 공통 문자열 사용
expect(content).toContain("'Manual focus cleared'");
```

---

## 🎯 권장: 옵션 A 적용

### Step 1: conflict-resolution.test.ts 수정

**파일**: `test/unit/features/gallery/hooks/conflict-resolution.test.ts`

```typescript
// 114줄 근처
// ❌ Before
it('should handle manual focus with logging', async () => {
  const { readFileSync } = await import('fs');
  const content = readFileSync(
    './src/features/gallery/hooks/useGalleryFocusTracker.ts',
    'utf-8'
  );

  // manual focus set 로깅 확인
  expect(content).toContain('manual focus set');

  // manual focus cleared 로깅 확인
  expect(content).toContain('manual focus cleared'); // ❌ 이 줄 실패
});

// ✅ After
it('should handle manual focus with logging', async () => {
  const { readFileSync } = await import('fs');
  const content = readFileSync(
    './src/features/gallery/hooks/useGalleryFocusTracker.ts',
    'utf-8'
  );

  // manual focus set 로깅 확인
  expect(content).toContain('Manual focus set');

  // manual focus cleared 로깅 확인
  expect(content).toContain('Manual focus cleared'); // ✅ 정확한 문자열 검색
});
```

### Step 2: 다른 실패 테스트 현황

```
확인 필요:
[ ] Batch 3 다른 실패 테스트 확인
[ ] Batch 4 실패 테스트 확인
[ ] Batch 9 에러 원인 파악
[ ] Batch 10+ 실패 분석
```

---

## 📋 기타 예상 문제점

### 1. 파일 경로 문제

```typescript
// 문제: readFileSync('./src/...')
// 테스트 실행 위치에 따라 경로 달라질 수 있음

// 해결안:
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../../../');

const content = readFileSync(
  join(projectRoot, 'src/features/gallery/hooks/useGalleryFocusTracker.ts'),
  'utf-8'
);
```

### 2. 다른 배치 실패 원인 추정

```
Batch 9 (4 files failed, 2 errors):
→ 메모리 / timeout 문제일 가능성
→ 서비스 initialization 문제일 가능성

Batch 13+ (service worker):
→ Browser context 문제
→ Worker cleanup 문제

Batch 15+ (6 tests failed):
→ 복합 문제일 가능성
```

---

## 🚀 즉시 적용 가능한 수정

### Phase 361.1: conflict-resolution.test.ts 수정

```typescript
// 파일: test/unit/features/gallery/hooks/conflict-resolution.test.ts
// 라인: ~114

// 변경 전
expect(content).toContain('manual focus cleared');

// 변경 후
expect(content).toContain('Manual focus cleared');
```

### Phase 361.2: 파일 경로 robust화 (선택)

```typescript
// 테스트 파일 시작에 추가
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../../../');
```

---

## ✅ 검증 방법

```bash
# Phase 361.1 수정 후 실행
npm run test:unit:batched -- --batch-size=20

# 성공 기준:
# - conflict-resolution.test.ts ✅ 통과
# - 전체 실패 배치 감소
```

---

## 📈 기대 효과

### Phase 361.1 이후

```
현재: 11/18 배치 실패
예상: 10/18 배치 실패 (1개 개선)
진행: 55% → 56% 개선
```

### 추가 작업 (필요시)

```
- Batch 9 에러 원인 분석
- Batch 13+ service worker 문제 해결
- 기타 실패 테스트 분류 및 수정
```

---

**상태**: 🟡 준비 완료 **다음 단계**: conflict-resolution.test.ts 수정 및 검증
