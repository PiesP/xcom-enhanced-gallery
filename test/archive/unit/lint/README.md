# test/archive/unit/lint

아카이브된 Lint 가드 테스트들입니다.

## 파일 목록

### mediabunny-no-static-imports.deprecated.red.test.ts

**상태**: 폐기 대상 (DEPRECATED)

**목적**: mediabunny 라이브러리의 정적 import 금지 검증

**이유 - 아카이브 이유**:

1. **미래 불확실성**: mediabunny 라이브러리 도입 여부 미정
2. **성능 문제**: 전체 파일시스템 재귀 스캔으로 비효율
   - `walkSourceTree()` 함수가 모든 소스 파일을 순회하므로 대규모 프로젝트에서
     느림
   - 향후 필요시 "focused scan" 패턴으로 대체 권장

3. **우선순위 낮음**: 현재 프로젝트에서 mediabunny 미사용

**개선 여지**:

필요시 다시 활성화할 경우, 아래 개선 권장:

```typescript
// ❌ 비효율: 전체 파일 순회
const allFiles = walkSourceTree(join(cwd(), 'src'));

// ✅ 효율: 특정 엔트리포인트만 스캔
const entrypoints = [
  join(cwd(), 'src', 'shared', 'services', 'media-extraction', 'index.ts'),
  join(cwd(), 'src', 'shared', 'external', 'vendors', 'index.ts'),
];
```

**이동 경로**: `test/unit/deps/mediabunny.not-imported.scan.red.test.ts` → Phase
180

---

## 참고

- 활성 Lint 가드는 `test/unit/lint/README.md` 참고
- 아카이브 정책: `test/archive/README.md` 참고
