# Epic NAMING-001 Phase A 실행 리포트

> 명명 규칙 위반 자동 검출 스크립트 개발 및 전수 스캔

## 📅 실행 일자

2025-01-22

## 🎯 목표

1. 명명 규칙 위반 자동 검출 스크립트 개발 (TDD 방식)
2. 전체 코드베이스(`src/`) 전수 스캔
3. 위반 항목 우선순위 분류 (HIGH/MEDIUM/LOW)
4. Phase B 작업 대상 선정 (30-50개 항목)

## 📊 실행 결과

### 스캔 범위

- **대상 디렉터리**: `src/`
- **스캔 파일**: 263개
- **총 위반 항목**: 314개

### 유형별 분포

| 유형                        | 건수    | 심각도 | 설명                                      |
| --------------------------- | ------- | ------ | ----------------------------------------- |
| `verb-pattern-inconsistent` | 268     | MEDIUM | 표준 동사 패턴 미준수 (25개 표준 동사 외) |
| `boolean-prefix-missing`    | 46      | HIGH   | Boolean 반환 함수에 적절한 접두사 누락    |
| **합계**                    | **314** | -      | -                                         |

### 심각도별 분포

- **HIGH**: 46건 (14.6%) - 즉시 수정 필요 (public API, boolean 함수)
- **MEDIUM**: 268건 (85.4%) - 점진적 개선 대상

## 🔍 주요 발견 사항

### 1. HIGH Priority 위반 (46건)

Boolean 반환 함수에 `is`, `has`, `can`, `should`, `will`, `check`, `validate`
접두사가 누락된 경우:

**상위 10건**:

1. `src/features/settings/services/token-consent.ts` -
   `setTokenExtractionConsent`
2. `src/shared/browser/utils/browser-utils.ts` - `matchesMediaQuery`
3. `src/shared/browser/utils/browser-utils.ts` - `prefersReducedMotion`
4. `src/shared/config/feature-flags.ts` - `setFeatureFlagOverride`
5. `src/shared/container/service-bridge.ts` - `bridgeHasService`
6. `src/shared/memory/MemoryTracker.ts` - `triggerGarbageCollection`
7. `src/shared/state/mediators/gallery-signal-mediator.ts` -
   `areGallerySignalsReady`
8. `src/shared/state/signals/gallery.signals.ts` - `setLoading`
9. `src/shared/state/signals/toolbar.signals.ts` - `setHighContrast`
10. `src/shared/utils/accessibility/accessibility-utils.ts` - `meetsWCAGAA`

**특징**:

- 주로 `shared/` 계층에 집중 (public API)
- Boolean 반환값인데 `set*`, `trigger*`, `matches*` 등 비표준 접두사 사용
- 접근성 유틸리티(`meetsWCAGAA`)는 의도적 명명일 가능성 (WCAG 표준 용어)

### 2. MEDIUM Priority 위반 (268건)

표준 동사 패턴 미준수 (create, get, set, add, remove, update, delete, find,
filter, map, reduce, validate, check, handle, process 등 25개 외):

**주요 패턴**:

- `extract*` (extractMediaId, extractTweetId) → `get*` 또는 `parse*`로 변경 검토
- `generate*` (generateOriginalUrl) → `create*` 또는 `build*`로 변경 검토
- `wire*` (wireGlobalEvents) → `register*` 또는 `bind*`로 변경 검토
- 컴포넌트 이름 (`KeyboardHelpOverlay`, `useProgressiveImage`) → 허용
  (React/SolidJS 관례)

### 3. 불필요한 수식어 위반

`simple`, `optimized`, `basic`, `improved` 패턴: **검출되지 않음** ✅

이는 이전 Epic LEGACY-CLEANUP-001에서 이미 정리된 결과입니다.

### 4. 도메인 용어 사용률

- **Gallery 도메인**: `gallery`, `media`, `image`, `thumbnail`, `slide`,
  `carousel` (6개 용어)
- **Accessibility 도메인**: `aria`, `role`, `label`, `contrast`, `focus`,
  `keyboard` 등 (14개 용어)

(도메인 용어 사용률 측정 기능은 구현되었으나 이번 스캔에서는 실행하지 않음)

## 📋 Phase B 작업 대상 (30-50개 선정)

### 선정 기준

1. **HIGH priority 전체** (46건) - 즉시 수정
2. **MEDIUM priority 중 상위 빈도** (패턴별 정리)

### HIGH Priority 작업 목록 (46건)

#### Shared Services (public API)

1. `token-consent.ts` - `setTokenExtractionConsent` →
   `isTokenExtractionConsented` 검토
2. `browser-utils.ts` - `matchesMediaQuery` → `isMediaQueryMatched`
3. `browser-utils.ts` - `prefersReducedMotion` → `isPrefersReducedMotion`
4. `feature-flags.ts` - `setFeatureFlagOverride` → 반환값 확인 필요
5. `service-bridge.ts` - `bridgeHasService` → `hasBridgedService`
6. `MemoryTracker.ts` - `triggerGarbageCollection` → 반환값 확인 필요
7. `gallery-signal-mediator.ts` - `areGallerySignalsReady` → 이미 적절한 접두사
   (false positive 가능)
8. `gallery.signals.ts` - `setLoading` → 반환값 확인 필요
9. `toolbar.signals.ts` - `setHighContrast` → 반환값 확인 필요
10. `accessibility-utils.ts` - `meetsWCAGAA` → `isWCAGAACompliant` 또는 허용
    (표준 용어)

(나머지 36건은 JSON 리포트에서 개별 검토 필요)

### MEDIUM Priority 샘플 (패턴 기반 정리 필요)

- `extract*` 패턴 (30-40건 추정) → `get*` 또는 `parse*`
- `generate*` 패턴 (20-30건 추정) → `create*` 또는 `build*`
- `wire*` 패턴 (5-10건 추정) → `register*` 또는 `bind*`

**Phase B에서는 HIGH 46건 + MEDIUM 상위 패턴 정리로 총 50-70건 예상**

## 🛠️ 기술 세부사항

### 스캐너 구현

- **파일**: `scripts/scan-naming-violations.mjs` (370 lines)
- **함수**: 6개 (scanUnnecessaryModifiers, scanBooleanPrefixes,
  scanVerbPatterns, measureDomainTerms, classifyPriority, scanDirectory)
- **테스트**: `test/infrastructure/naming-scanner.test.ts` (4 suites, 4/4 GREEN)
- **검출 방식**: Line-by-line regex matching on export statements
- **False positive 필터링**: @deprecated comments, constants (UPPERCASE), types
  (*Type,*Config)

### 우선순위 분류 로직

```javascript
function classifyPriority(violation):
  if (violation.type === 'boolean-prefix-missing'):
    return 'HIGH'  // Boolean 함수는 항상 HIGH

  if (violation.file.includes('services/') && isPublicAPI && usageCount > 10):
    return 'HIGH'  // 공개 API 고빈도 사용

  if (violation.file.includes('test/') || usageCount < 2):
    return 'LOW'   // 테스트 파일 또는 저빈도

  return 'MEDIUM'  // 기본값
```

### 산출물

- **JSON 리포트**: `docs/naming-violations-map.json` (2528 lines)
- **Phase A 리포트**: 본 문서
- **커밋 대상**: 스캐너 스크립트 + 테스트 + 리포트

## ✅ Acceptance Criteria 달성 현황

- [x] 명명 규칙 스캐너 스크립트 개발 완료
- [x] 스캐너 테스트 4/4 GREEN (100%)
- [x] 전수 스캔 실행 완료 (src/ 전체, 263 files)
- [x] JSON 리포트 생성 (naming-violations-map.json)
- [x] Phase A 실행 리포트 작성 (본 문서)
- [x] Phase B 계획 수립 (HIGH 46건 + MEDIUM 패턴 기반 30-50건)
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN (커밋 전 실행 예정)

## 📝 다음 단계 (Phase B)

1. **HIGH priority 46건 일괄 검토 및 수정**
   - Boolean 함수 접두사 추가 (`is*`, `has*`, `can*`)
   - 반환값 타입 재확인 (일부 false positive 가능)
   - WCAG 관련 용어는 예외 허용 검토

2. **MEDIUM priority 패턴별 정리**
   - `extract*` → `get*` / `parse*`
   - `generate*` → `create*` / `build*`
   - `wire*` → `register*` / `bind*`

3. **컴포넌트 명명 관례 허용 목록 작성**
   - React/SolidJS 컴포넌트는 명사형 허용
   - 커스텀 훅(`use*`)은 동사 패턴 예외

4. **자동화 린트 룰 추가 고려**
   - ESLint 플러그인으로 boolean 접두사 강제
   - 표준 동사 패턴 경고 (auto-fix 불가능하므로 warn 레벨)

## 🎯 메트릭 요약

| 항목               | 수치        | 비고                         |
| ------------------ | ----------- | ---------------------------- |
| 스캔 파일          | 263         | src/ 전체 TS/TSX             |
| 총 위반 항목       | 314         | -                            |
| HIGH priority      | 46 (14.6%)  | 즉시 수정                    |
| MEDIUM priority    | 268 (85.4%) | 점진적 개선                  |
| 불필요한 수식어    | 0           | LEGACY-CLEANUP-001 완료 효과 |
| 도메인 용어 사용률 | 미측정      | Phase C에서 분석 예정        |

## 🏁 결론

Epic NAMING-001 Phase A는 **TDD 방식**으로 명명 규칙 위반 스캐너를 성공적으로
개발하고, 전체 코드베이스를 스캔하여 **314건의 위반 항목**을 발견했습니다.

**핵심 성과**:

- ✅ 자동화 스캐너 도구 완성 (6 functions, 4/4 tests GREEN)
- ✅ 우선순위 분류 (HIGH 46건, MEDIUM 268건)
- ✅ Phase B 작업 대상 명확화 (50-70건)
- ✅ 재사용 가능한 인프라 (향후 CI 통합 가능)

**다음 Epic**: Phase B 실행 (HIGH 46건 중점 수정, MEDIUM 패턴 정리)

---

**작성일**: 2025-01-22  
**Epic**: NAMING-001 Phase A  
**산출물**: `scan-naming-violations.mjs`, `naming-violations-map.json`, 본
리포트
