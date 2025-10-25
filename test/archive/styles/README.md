# test/archive/styles

## 📋 개요

완료된 리팩토링 Phase의 테스트 파일을 보관하는 디렉토리입니다. 이 파일들은
프로젝트 역사적 기록으로 유지되며, 현재 테스트 실행에는 포함되지 않습니다.

## 📁 구성

### Phase 파일 목록

| 파일명                                    | Phase | 목적                                    | 상태    |
| ----------------------------------------- | ----- | --------------------------------------- | ------- |
| **phase-109-settings-focus-ring.test.ts** | 109.1 | Settings focus ring 색상 일관성 검증    | ✅ 완료 |
| **phase-110-focus-ring.test.ts**          | 110.1 | --xeg-focus-ring 토큰 색상 수정 테스트  | ✅ 완료 |
| **phase-111-toast-colors.test.ts**        | 111.1 | Toast 색상 토큰 흑백 통일 검증          | ✅ 완료 |
| **phase-113-focus-ring-alias.test.ts**    | 113   | Focus ring alias 모노크롬 강제 검증     | ✅ 완료 |
| **phase-121-text-color-tokens.test.ts**   | 121   | 텍스트 색상 토큰 정의 및 테마별 값 검증 | ✅ 완료 |

## 🎯 아카이브화 정책

### 언제 파일을 아카이브하는가?

1. **Phase 완료 후**: 특정 리팩토링 단계(Phase)가 완료되고, 해당 기능이 안정화된
   경우
2. **기능 통합**: 여러 Phase에서 검증한 기능이 최종 구현으로 통합된 경우
3. **정책 변경**: 더 이상 필요 없는 검증 항목이 생긴 경우 (예: 과거 색상 정책
   검증)

### 왜 삭제하지 않고 보관하는가?

- **역사 추적**: 프로젝트의 의사결정 과정을 기록하기 위함
- **참고 자료**: 향후 유사한 리팩토링 시 패턴 참고
- **회귀 방지**: 과거에 해결한 문제가 다시 발생하지 않도록 검증

## 🔄 CI/CD 영향

- ❌ 테스트 실행: `npm test`, `npm run test:styles`에서 **제외됨**
- ❌ 빌드 검증: `npm run build`에서 **영향 없음**
- ✅ 아카이브 보존: Git에서 추적됨 (history 유지)

### vitest.config.ts 설정

```typescript
// test/archive/**/*.test.ts는 자동으로 exclude됨
exclude: ['**/node_modules/**', '**/dist/**', '**/test/archive/**'];
```

## 📚 관련 문서

- `test/README.md`: 전체 테스트 디렉토리 구조
- `TDD_REFACTORING_PLAN.md`: Phase별 진행 상태
- `TESTING_STRATEGY.md`: 테스트 전략 및 tower 구성

## 🛠️ 유지보수

### 파일 추가 시

1. **조건**: Phase가 완료되고, 관련 기능이 확정된 경우
2. **절차**:
   - test/styles/phase-\*.test.ts → test/archive/styles로 이동
   - 파일 헤더 주석 확인
   - TDD_REFACTORING_PLAN.md에 Phase 기록

### 파일 제거 시

필요한 경우 일반 Git 커밋으로 삭제:

```bash
git rm test/archive/styles/phase-*.test.ts
```

---

**최종 업데이트**: Phase 174 (test/styles 리팩토링) **아카이브화 연도**: 2025
