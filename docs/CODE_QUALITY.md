# 코드 품질 점검 도구 가이드

**목적**: 프로젝트 코드 품질을 유지하는 점검 도구들의 역할과 사용법

**최종 업데이트**: 2025-10-27

---

## 도구 목록

### 1. CodeQL - 보안 취약점 정적 분석

**목적**: XSS, 코드 인젝션, Prototype pollution 등 보안 취약점 탐지

**실행 환경**:

- CI (필수): GitHub Actions에서 `github/codeql-action` 자동 실행
- 로컬 (선택): `npm run codeql:check` (CI와 동일한 security-extended 쿼리)

**책임**: CI에서 전체 보안 검증, 로컬은 빠른 피드백용 (선택사항)

**옵션**:

- `--json`: JSON 형식 출력
- `--report`: 마크다운 리포트 생성 (codeql-reports/)
- `--force`: 데이터베이스 강제 재생성
- `--verbose`: 상세 디버깅

**참고**: validate 스크립트는 CodeQL 없이도 통과합니다.

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

# 보안 체크 (선택, 빠른 피드백)
npm run codeql:check

# 작업 완료 시
npm run build
npm run maintenance:check
```

**참고**: CodeQL은 CI에서 필수 실행되므로, 로컬 실행은 선택사항입니다.

---

## 우선순위

1. **즉시 수정**: TypeScript 오류, 실패한 테스트
2. **커밋 전**: ESLint/Stylelint 경고, 빌드 크기 90% 초과
3. **검토 후 판단**: CodeQL 경고 (CI에서 필수 검증), Maintenance 경고, 큰 문서

**참고**: CodeQL 경고는 CI에서 PR을 차단하므로, 로컬에서 미리 확인하면 개발
속도가 향상됩니다.

---

## 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
