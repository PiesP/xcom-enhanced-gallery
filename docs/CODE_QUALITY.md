# 코드 품질 점검 도구 가이드

**목적**: 프로젝트 코드 품질을 유지하는 점검 도구들의 역할과 사용법

**최종 업데이트**: 2025-10-27

---

## 도구 목록

### 1. CodeQL - 보안 및 패턴 분석

- vendor getter 사용, Touch/Pointer 이벤트 금지, 색상/크기 하드코딩 금지
- 실행: `npm run codeql:check`

### 2. ESLint - 코드 스타일

- 코드 포맷팅, 사용하지 않는 변수/import, Solid.js 규칙
- 실행: `npm run lint:fix`

### 3. Stylelint - CSS 품질

- CSS 문법, 디자인 토큰 사용, 일관된 단위
- 실행: `npm run lint:css:fix`

### 4. TypeScript Compiler - 타입 안전성

- 타입 오류, strict 모드 준수
- 실행: `npm run typecheck`

### 5. Vitest - 단위/통합 테스트

- 단위 테스트, 통합 테스트, 브라우저 테스트, 커버리지
- 실행: `npm test`, `npm run test:coverage`

### 6. Playwright - E2E 테스트

- 갤러리 기능, 키보드 네비게이션, 다운로드, 접근성
- 실행: `npm run e2e:smoke`, `npm run e2e:a11y`

### 7. Dependency Cruiser - 의존성 규칙

- 3계층 아키텍처, 순환 의존성 감지
- 실행: `npm run deps:check`

### 8. validate-build.js - 빌드 검증

- 번들 크기, 필수 파일, 메타데이터
- 실행: `npm run build`

### 9. maintenance-check.js - 프로젝트 정리

- 백업/임시 디렉터리, 큰 문서, Git 미추적 파일
- 실행: `npm run maintenance:check`

---

## 로컬 워크플로우

```bash
# 개발 시작 전
npm run validate

# 작업 완료 시
npm run build
npm run maintenance:check
```

---

## 우선순위

1. **즉시 수정**: TypeScript 오류, CodeQL Error, 실패한 테스트
2. **커밋 전**: ESLint/Stylelint 경고, 빌드 크기 90% 초과
3. **검토 후 판단**: Maintenance 경고, 큰 문서

---

## 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
