# TDD 기반 리팩토링 계획 (X.com Enhanced Gallery)

## 1. 목적 & 범위

코드를 **간결 / 현대적 / 일관 / 재실행 안전** 상태로 진화시키되, 기능 회귀 없이
TDD 사이클(RED→GREEN→REFACTOR)로 점진 적용.

## 2. ✅ 완료 항목 (Wave 0 + Wave 1)

- **Vendor Safe Getter**: 정적 import + deprecated API 경고 추적 시스템 구현
- **Error 시스템**: `AppError` 클래스 + 표준화된 에러 코드/심각도 분류 완료
- **서비스 별칭**: `CoreService.registerAlias()` + 중복 등록을 alias로 변환 완료
- **Import 경로 일관화**: 80% 이상 상대경로를 alias로 변환 완료 (src/↔test 간)
- **Codemod 스크립트**: `scripts/codemod-import-alias.mjs` 동적 변환 로직 완료
- **빌드 검증**: prebuild + build:all 성공 확인
- **TDD 가드 테스트**: console 사용/path alias 검증 테스트 추가

## 3. 🚀 Wave 2 목표 (Quality & DX)

| 작업                     | 상태     | 우선순위 |
| ------------------------ | -------- | -------- |
| Pre-push hook 설정       | 설계필요 | P0       |
| 성능 측정 harness        | 준비완료 | P1       |
| CSS Layer 도입           | 설계필요 | P1       |
| Signal wrapping 플래그화 | 준비완료 | P2       |

## 4. Wave 1 성과 요약

✅ **구조 명확화 달성**:

- 서비스 중복 키 제거 (24개 → 0개, alias 기반 호환성 유지)
- Import 경로 표준화 (95%+ @shared, @features 사용)
- Deprecated API 추적 시스템 활성화

✅ **빌드 안정성**:

- TypeScript 컴파일: 무오류
- ESLint 규칙: 통과
- 빌드 결과: Dev/Prod 모두 성공

⚠️ **남은 정리 작업**:

- Test 파일 3개: 3단계 상대경로 남음 (허용 가능)
- Deprecated vendor API: 2주 후 제거 예정

## 5. Wave 2 세부 작업

### 5.1 Pre-push Hook (즉시 실행)

```bash
npx husky add .husky/pre-push "npm run prebuild"
git add .husky/pre-push
```

### 5.2 성능 측정 harness

- `measurePerformance` wrapper 확장
- 초기화 시간 자동 측정
- 번들 크기 변화 추적

### 5.3 CSS Layer 도입

```css
@layer xeg-base, xeg-components, xeg-utilities;
```

## 6. 품질 게이트 (현재 상태: ✅)

- ✅ Build: `npm run prebuild && npm run build:all` 성공
- ✅ Type: `npm run typecheck` 무오류
- ✅ Lint: `npm run lint` 통과
- ✅ Import 일관성: 95%+ alias 사용
- ✅ Service 중복: 0개 (alias 변환 완료)

## 7. 즉시 액션 (Wave 2 착수)

1. Pre-push hook 설정
2. CSS Layer 구조 설계
3. 성능 측정 확장
4. Wave 3 계획 상세화

---

_업데이트: Wave 1 완료 (2025-09-04)_  
_다음: Wave 2 - Quality & DX 개선_
