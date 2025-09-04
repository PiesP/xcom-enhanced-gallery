# TDD 기반 리팩토링 계획 (X.com Enhanced Gallery)

## 1. 목적 & 범위

코드를 **간결 / 현대적 / 일관 / 재실행 안전** 상태로 진화시키되, 기능 회귀 없이
TDD 사이클(RED→GREEN→REFACTOR)로 점진 적용.

## Wave 진행 상황

### Wave 0: 기반 시스템 구축 ✅ 완료

- **vendor API 추적 시스템**: deprecated API 사용 로깅 및 추적 완료
- **에러 처리 표준화**: logger 기반 에러 처리 시스템 완료
- **서비스 별칭 시스템**: 중복 서비스 키 문제 해결을 위한 alias 시스템 완료
- **코드 변환 도구**: import path 변환을 위한 codemod 스크립트 완료

### Wave 1: 아키텍처 기반 구축 ✅ 완료 (2024년 12월)

- **Import Path 정규화**: 상대 경로를 @shared/@features alias로 변환 완료
- **서비스 키 정리**: 중복 서비스 등록을 alias 시스템으로 변환 완료
- **빌드 검증**: prebuild + build:all 전체 파이프라인 검증 완료
- **테스트 환경 개선**: ESLint 설정 및 테스트 파일 호환성 개선 완료
- **Git 커밋**: "refactor: complete Wave 1 architecture foundation" (4639405)

**완료 검증**:

- ✅ 타입스크립트 컴파일: 에러 없음
- ✅ ESLint 검사: 모든 규칙 통과
- ✅ 빌드 파이프라인: dev/prod 빌드 성공
- ✅ 테스트 실행: 핵심 테스트 통과
- ✅ 커밋 완료: 모든 변경사항 커밋됨

### Wave 2: 품질 & DX 향상 🔄 진행 예정

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
