# Phase 5: Pure Functions Inventory

> Epic BUNDLE-SIZE-DEEP-OPTIMIZATION Phase 5 - Pure Annotations 추가

**목표**: `/*#__PURE__*/` 주석 추가로 Terser 최적화 강화 (-10 KB 예상) **날짜**:
2025-10-06

---

## 순수 함수 판별 기준

**순수 함수 조건**:

1. 부작용 없음 (DOM 조작, 네트워크 요청, 전역 상태 변경 등)
2. 동일 입력 → 동일 출력 (참조 투명성)
3. 외부 의존성 최소화

**비순수 함수 (제외 대상)**:

- `logger.*` 함수들 (console 호출 = 부작용)
- `createLogger`, `createScopedLogger` (내부에서 logger 호출)
- DOM 조작 함수
- 네트워크 요청 함수
- 전역 상태 변경 함수

---

## 카테고리 1: 타입 안전 유틸리티 (src/shared/utils/type-safety-helpers.ts)

### ✅ 순수 함수 (11개)

1. **safeParseInt** - 문자열을 정수로 안전하게 파싱
2. **safeParseFloat** - 문자열을 실수로 안전하게 파싱
3. **safeArrayGet** - 배열 요소 안전 접근
4. **safeNodeListAccess** - NodeList 안전 접근
5. **safeMatchExtract** - 정규식 매치 결과 추출
6. **safeCall** - 안전한 함수 호출
7. **safeEventHandler** - 이벤트 핸들러 wrapper
8. **undefinedToNull** - undefined → null 변환
9. **nullToUndefined** - null → undefined 변환
10. **stringWithDefault** - 문자열 기본값 적용
11. **safeElementCheck** - HTMLElement 검증

---

## 카테고리 2: Factory 함수들

### ✅ 순수 Factory (5개)

1. **createCorrelationId** (src/shared/logging/logger.ts:328)
   - crypto.getRandomValues() 또는 Math.random() 사용
   - 부작용 없음 (읽기 전용 API)

2. **createBundleInfo** (src/shared/utils/optimization/bundle.ts:24)
   - 번들 정보 객체 생성

3. **createThemedClassName** (src/shared/utils/styles/css-utilities.ts:59)
   - 테마 기반 클래스명 생성

4. **createNamespacedClass** (src/shared/styles/namespaced-styles.ts:159)
   - 네임스페이스 클래스명 생성

5. **createNamespacedSelector** (src/shared/styles/namespaced-styles.ts:166)
   - 네임스페이스 선택자 생성

### ❌ 비순수 Factory (제외)

- **createLogger** - console 호출 (부작용)
- **createScopedLogger** - console 호출 (부작용)
- **createScopedLoggerWithCorrelation** - console 호출 (부작용)
- **createFocusTrap** - DOM 조작 (부작용)
- **createScrollHandler** - 이벤트 리스너 (부작용)
- **createEventManager** - 이벤트 리스너 (부작용)
- **createSelectorRegistry** - 상태 변경 (부작용)

---

## 카테고리 3: 문자열/데이터 변환 유틸리티

### ✅ 순수 함수 (10개)

1. **formatMessage** (src/shared/logging/logger.ts:147) - 로그 메시지 포맷
2. **shouldLog** (src/shared/logging/logger.ts:163) - 로그 레벨 판별
3. **logFields** (src/shared/logging/logger.ts:426) - 로그 필드 구조화
4. **combineClasses** (src/shared/utils/utils.ts) - 클래스명 결합
5. **removeDuplicates** (src/shared/utils/utils.ts) - 중복 제거 (제네릭)
6. **removeDuplicateStrings** (src/shared/utils/utils.ts) - 문자열 중복 제거
7. **parseColor** (src/shared/utils/utils.ts) - 색상 파싱
8. **getEnvironmentLogLevel** (src/shared/logging/logger.ts:74) - 환경 기반 로그
   레벨
9. **isTestEnv** (src/shared/logging/logger.ts:126) - 테스트 환경 감지
10. **getRelativeLuminance**
    (src/shared/utils/accessibility/accessibility-utils.ts) - 상대 휘도 계산

---

## 카테고리 4: URL/미디어 유틸리티

### ✅ 순수 함수 (6개)

1. **isTrustedTwitterMediaHostname** (src/shared/utils/url-safety.ts) - URL 검증
2. **isTrustedHostname** (src/shared/utils/url-safety.ts) - 호스트명 검증
3. **createTrustedHostnameGuard** (src/shared/utils/url-safety.ts:192) -
   호스트명 가드 factory
4. **createMediaInfoFromImage** (src/shared/utils/media/media-url.util.ts:94) -
   이미지 정보 생성
5. **createMediaInfoFromVideo** (src/shared/utils/media/media-url.util.ts:145) -
   비디오 정보 생성
6. **getHighQualityMediaUrlFallback**
   (src/shared/utils/media/media-url.util.ts:383) - URL 품질 변환

---

## 총계

| 카테고리            | 순수 함수 수 | 비고                   |
| ------------------- | ------------ | ---------------------- |
| 타입 안전 유틸리티  | 11           | type-safety-helpers.ts |
| Factory 함수        | 5            | 순수 factory만         |
| 문자열/데이터 변환  | 10           | Logger 내부 헬퍼 포함  |
| URL/미디어 유틸리티 | 6            | 보안 검증 포함         |
| **합계**            | **32**       | -                      |

---

## 예상 효과

- **32개 순수 함수**에 `/*#__PURE__*/` 주석 추가
- Terser가 미사용 호출을 안전하게 제거 가능
- 예상 번들 크기 감소: **-10 KB** (495 KB → 485 KB)

---

## 다음 단계

1. ✅ 순수 함수 목록 작성 (완료)
2. 🔄 RED: Pure Annotation 검증 테스트 작성
3. ⏳ GREEN: PURE 주석 추가 및 번들 크기 확인
4. ⏳ REFACTOR: 타입 체크, ESLint 규칙, 문서화
