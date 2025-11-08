# test/unit/alias

경로 별칭(Path Alias) 해석 검증 모듈.

## 모듈 구조

- `alias-resolution.test.ts`: Vite 경로 별칭(`@features`, `@shared`,
  `@assets`)의 동적 import 검증
  - 갤러리 모듈 해석 확인
  - Toolbar 컴포넌트 해석 확인
  - 자산 경로 유효성 검증

## 설계 원칙

- **동적 import 기반**: 정적 분석 회피, 실제 런타임 해석 검증
- **JSDOM 호환성**: 브라우저 API 의존 없음
- **테스트 타임아웃**: 20초 (기본값)

## 아카이브 정책

`test/archive/unit/alias/alias-static-import.test.ts`는 플랫폼별 `/@fs/`
프리픽스 로직을 포함한 이전 버전입니다.

- 이유: 개발 서버 전용 경로(`/@fs/`), 빌드 시 alias만 사용
- 유지보수 부담 > 가치
- `alias-resolution.test.ts`로 충분한 검증 제공

## 참고

- 상위 문서: `test/README.md`
- 경로 별칭 설정: `tsconfig.json`, `vitest.config.ts`의 `resolve.alias`
- 아키텍처 가이드: `docs/ARCHITECTURE.md` (3계층 구조, 경로별칭 사용)
