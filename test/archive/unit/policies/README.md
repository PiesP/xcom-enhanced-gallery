# 아카이브: 정책 검증 테스트 (Archive/Unit/Policies)

> Phase 188에서 이동된 deprecated/RED 정책 검증 테스트
> 최종 업데이트: 2025-10-25

## 📋 테스트 목록

### Loader - 사이드 이펙트 정책 (RED)

- `feature-side-effect.red.test.ts`: 피처 import 시 전역 이벤트 등록이 없어야 함
- `import-side-effect.scan.red.test.ts`: 특정 모듈 import 시 사이드 이펙트 금지

**상태**: RED 테스트 (현재 환경에서 실패하도록 설계된 보호 정책)
**용도**: CI 정책 검증, 커밋 전 보호 게이트
**활성화**: 필요시 `vitest.config.ts`의 refactor 프로젝트에서 활성화

### i18n - 메시지 키 정책 (RED)

- `i18n.message-keys.red.test.ts`: Phase 4 이전 하드코딩 한글 문자열이 없어야 함

**상태**: RED 테스트 (정책 위반 감지)
**용도**: i18n 마이그레이션 정책 보호
**활성화**: test/unit/policies/ 에서 관리

## 🔄 마이그레이션 경로

**원본 위치**:

- `test/unit/loader/*` → `test/archive/unit/policies/`
- `test/unit/i18n/*.red.test.ts` → `test/archive/unit/policies/`

**이유**:

1. RED 테스트는 일반 개발 흐름에서 실행되지 않음
2. 정책 위반 감지 용도로 별도 실행 (CI/특정 프로젝트)
3. 활성 테스트군과 분리하여 관리 용이

## ✅ 다음 단계

1. **필요시 활성화**:

```bash
vitest --project refactor  # RED 정책 테스트 실행
```

1. **정책 수정 시**:

- 원본 테스트 수정 → archive도 함께 업데이트
- 해당 정책이 완료되면 아카이브로 이동

1. **문서 참조**:

- `docs/TDD_REFACTORING_PLAN.md` (Phase 188 기록)
- `test/README.md` (테스트 구조 가이드)

---

**참고**: 이 폴더의 테스트는 CI `npm run test:refactor` 프로젝트에서 선택적으로 실행됩니다.
