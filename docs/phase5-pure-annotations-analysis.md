# Phase 5: Pure Annotations 분석 보고서

**날짜**: 2025-10-06  
**Epic**: BUNDLE-SIZE-DEEP-OPTIMIZATION  
**목표**: `/*#__PURE__*/` 어노테이션을 통한 tree-shaking 개선

---

## 📊 결과 요약

### 번들 크기 변화

- **Baseline**: 495.19 KB
- **After Phase 5**: 495.86 KB
- **변화량**: +0.67 KB (+0.14%) ⚠️

### 작업 내용

- **식별된 함수**: 31개 (4개 카테고리)
- **어노테이션 추가**: 15개 함수
- **이미 어노테이션됨**: 11개 함수
- **패턴 미매칭**: 5개 함수

---

## 🔍 원인 분석

### 1. PURE 어노테이션 인식 문제

**문제**: `/*#__PURE__*/` 주석은 **함수 정의**가 아닌 **함수 호출** 앞에 있어야
Rollup이 인식합니다.

```typescript
// ❌ 현재 방식 (효과 없음)
/*#__PURE__*/
export function safeParseInt(value: unknown): number | null {
  // ...
}

// ✅ 올바른 방식 (함수 호출 앞)
const result = /*#__PURE__*/ safeParseInt(input);
```

### 2. 실제 사용 중인 함수

분석 결과, 어노테이션을 추가한 15개 함수 중 **대부분이 실제로 사용 중**입니다:

| 카테고리    | 함수                             | 사용 여부                  |
| ----------- | -------------------------------- | -------------------------- |
| Type Safety | `safeParseInt`, `safeParseFloat` | ✅ 사용 중                 |
| Type Safety | `stringWithDefault`              | ✅ 사용 중                 |
| Factory     | `createBundleInfo`               | ✅ 사용 중 (테스트)        |
| URL/Media   | `isTrustedHostname`              | ✅ 사용 중 (보안 핵심)     |
| String/Data | `createNamespacedStyle`          | ✅ 사용 중 (스타일 시스템) |

**결론**: PURE 어노테이션은 **사용되지 않는 코드**를 제거하는 데 도움이 되지만,
현재 모든 함수가 실제로 사용되고 있어 제거되지 않았습니다.

### 3. Terser 설정 검토

**현재 설정** (`vite.config.ts`):

```javascript
terserOptions: {
  compress: {
    pure_funcs: ['logger.debug', 'console.log', ...],
    pure_getters: true,  // 이미 활성화됨
    unsafe: true,
    // ...
  }
}
```

- `pure_getters`: getter 함수를 pure로 간주 (이미 활성화)
- `pure_funcs`: 특정 함수 이름을 pure로 명시 (제거 가능)
- `/*#__PURE__*/` 주석: Rollup tree-shaking 단계에서 처리 (Terser 이전)

---

## 💡 개선 방안

### 단기 (Phase 5 완료)

1. **문서화 강화**
   - CODING_GUIDELINES.md에 PURE 어노테이션 가이드라인 추가
   - 함수 호출 앞에 주석을 다는 것이 효과적임을 명시

2. **ESLint 규칙 추가** (향후 Phase)
   - Pure 함수 감지 규칙 (부작용 없음, 동일 입력 → 동일 출력)
   - 자동으로 `/*#__PURE__*/` 제안

### 중기 (Phase 6+)

1. **Dead Code 제거 우선**
   - knip 보고서: 111 unused exports, 96 unused files
   - 예상 효과: -45 KB (-9%)
   - Phase 6에서 진행 (더 큰 효과)

2. **함수 인라인화**
   - 매우 작은 pure 함수는 인라인으로 변환
   - Terser가 자동으로 처리하지만, 명시적 인라인화도 고려

3. **Bundle Analyzer 활용**
   - `rollup-plugin-visualizer` 추가
   - 실제 번들 구성 시각화
   - 큰 모듈 우선 최적화

### 장기 (Phase 7+)

1. **Dynamic Import 전환**
   - 큰 유틸리티 모듈 (URL patterns, media utilities)
   - Lazy loading으로 초기 번들 크기 감소

2. **Code Splitting**
   - Features 단위로 번들 분리
   - Settings, Gallery, Notifications를 독립적으로 로드

---

## 📈 학습 포인트

### TDD 관점

- ✅ **RED 단계**: 27개 테스트로 pure 함수 계약 검증 성공
- ✅ **GREEN 단계**: 자동화 스크립트로 일관된 어노테이션 추가
- 🔄 **REFACTOR 단계**: 실제 효과 측정 → 근본 원인 분석 → 개선 방안 도출

### Bundle 최적화 전략

1. **Dead Code 제거**가 가장 효과적 (Phase 6 우선)
2. **PURE 어노테이션**은 보조 수단 (함수 호출 시점에 적용)
3. **측정 기반 최적화** (Bundle Analyzer 필수)

### 기술 부채

- Phase 5는 **교육적 가치**가 큼 (PURE 어노테이션 학습)
- 실제 번들 감소는 **Phase 6 (Dead Code)**에서 기대
- 점진적 개선 원칙 유지 (TDD)

---

## ✅ Action Items

- [x] Phase 5 테스트 작성 (27 tests)
- [x] PURE 어노테이션 자동화 스크립트 작성
- [x] 15개 함수에 어노테이션 추가
- [x] 번들 크기 측정 및 분석
- [ ] CODING_GUIDELINES.md 업데이트 (PURE 가이드라인)
- [ ] Phase 5 완료 내용 TDD_REFACTORING_PLAN_COMPLETED.md로 이관
- [ ] Phase 6 (Dead Code 제거) 준비

---

## 📚 참고 자료

- [Terser Documentation - Pure Functions](https://terser.org/docs/options/#compress-options)
- [Rollup Tree-shaking Guide](https://rollupjs.org/guide/en/#tree-shaking)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html#build-optimizations)
- knip 분석 보고서: `docs/knip-analysis-report.md`

---

**결론**: Phase 5는 번들 크기 감소에는 직접적 효과가 없었지만, PURE 어노테이션의
올바른 사용법을 학습하고, 실제 효과적인 최적화 전략(Dead Code 제거)을 식별하는
데 기여했습니다. Phase 6에서는 knip 보고서 기반으로 미사용 코드를 제거하여 -45
KB 감소를 목표로 합니다.
