# test/archive/unit/alias

아카이브된 경로 별칭 검증 모듈.

## 파일 목록

- `alias-static-import.test.ts` (SKIPPED)
  - 플랫폼별 절대 경로 import 테스트
  - Windows/Unix 플랫폼 감지로 `/@fs/` vs alias 경로 선택
  - 발보기 상태: 복잡성 대비 가치 낮음

## 아카이브 정책

**이유**: 개발 서버 전용 기능 검증

- `/@fs/` 프리픽스: Vite dev server에서만 유효
- 빌드 시: alias 해석으로 해결됨
- 플랫폼별 하드코딩 경로: 유지보수 부담 증가
- `test/unit/alias/alias-resolution.test.ts`: 충분한 alias 검증 제공

## 복원 방법

`alias-static-import.test.ts`를 활성화하려면:

```bash
# 1. vitest.config.ts에서 제외 규칙 제거
# 2. test/unit/alias/로 파일 이동
# 3. describe.skip 제거
```

## 참고

- 현재 활성 테스트: `test/unit/alias/alias-resolution.test.ts`
- 상위 문서: `test/archive/unit/README.md`
