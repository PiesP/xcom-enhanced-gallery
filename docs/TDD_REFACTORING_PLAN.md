# TDD 리팩토링 계획 (요약본)

최종 업데이트: 2025-11-01

이 문서는 간결한 진행 현황만 유지합니다. 전체 기록은 아카이브를 참고하세요.

## 최근 상태

- **Phase 296**: 빌드 검증 스크립트 현대화 — ✅ 완료 (2025-11-01)
- **Phase 295**: TwitterScrollPreservation 실제 통합 — ✅ 완료 (2025-11-01,
  COMPLETED로 이관)
- **Phase 291-294**: 미디어 서비스 모듈화 및 갤러리 최적화 — ✅ 완료 (2025-10-31
  ~ 2025-11-01, COMPLETED로 이관)

## 현재 진행 중

없음 (모든 계획된 Phase 완료)

---

## 계획/검토 항목

현재 활성 Phase 없음

### 향후 고려사항

- **Phase 296.1**: 빌드 검증 로직 모듈화 (선택적)
  - 6개 검증기 분리 (header, metadata, pc-policy, sourcemap, size-budget,
    legacy-api)
  - Result 패턴 적용
  - 단위 테스트 추가
  - 예상 시간: 2-3시간

- **Phase 287**: 개발 전용 로깅/Flow Tracer 정책 문서화 (보류)

---

## 완료된 Phase (요약)

상세 내용은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

### Phase 296: 빌드 검증 스크립트 현대화 (2025-11-01)

- TypeScript 마이그레이션 (validate-build.js → validate-build.ts)
- 타입 안전성 확보 (ValidationOptions, ValidationResult, SourceMap, SizeBudget)
- tsx 의존성 추가 (TypeScript 스크립트 실행)
- 기존 검증 로직 100% 유지 (기능 변경 없음)
- 번들: 영향 없음 (빌드 스크립트는 런타임 번들과 무관)

### Phase 295: TwitterScrollPreservation 실제 통합 (2025-11-01)

- GalleryApp에 TwitterScrollPreservation 통합
- 갤러리 열기/닫기 시 스크롤 보존 동작
- 통합 테스트 7개 신규 추가
- 번들: +1.21 KB raw (+0.35%), +0.35 KB gzip (+0.38%)

### Phase 294: Twitter 네비게이션 스크롤 복원 호환성 개선 (2025-11-01)

**목표**: 갤러리 오버레이가 Twitter의 스크롤 위치 복원 메커니즘을 방해하지
않도록 개선

**완료 일자**: 2025-11-01

**수행 작업**:

1. **TwitterScrollPreservation 유틸리티 클래스 구현**
   - `src/shared/utils/twitter/scroll-preservation.ts` 생성
   - 갤러리 열기 전 스크롤 위치 저장
   - 갤러리 닫은 후 필요 시 보정 (requestAnimationFrame 활용)
   - 28개 단위 테스트 추가 및 모두 통과

2. **GalleryContainer unmount 개선**
   - DOM 요소 완전 제거 (firstChild loop)
   - Twitter 스크롤 컨테이너 참조 강제 리프레시 (reflow 트리거)
   - 갤러리 정리 안정성 향상

3. **CSS 격리 개선**
   - `isolated-gallery.css`: `contain: layout style paint` →
     `contain: style paint`
   - layout containment 제거로 Twitter 페이지 레이아웃 재계산 최소화

4. **E2E 테스트 작성**
   - `playwright/smoke/twitter-navigation.spec.ts` 생성
   - Twitter 로그인 필요로 CI에서는 skip 처리
   - 로컬 환경에서 수동 검증용

**검증 결과**:

- ✅ 타입 체크 통과
- ✅ 단위 테스트: TwitterScrollPreservation 28개 테스트 모두 통과
- ✅ 전체 테스트: 2763 passed (28개 신규 추가)
- ✅ E2E 테스트: 88 passed, 8 skipped (Twitter 테스트 포함)
- ✅ 빌드: 343.71 KB (gzip 93.26 KB) — 번들 크기 변화 없음 ✅

**번들 크기 분석**:

| 항목 | Phase 293 (이전) | Phase 294 (현재) | 변화               |
| ---- | ---------------- | ---------------- | ------------------ |
| Raw  | 343.68 KB        | 343.71 KB        | +0.03 KB (+0.009%) |
| Gzip | 93.27 KB         | 93.26 KB         | -0.01 KB (-0.011%) |

**영향**:

- ✅ Twitter 네비게이션 호환성 개선 (스크롤 복원 간섭 최소화)
- ✅ 갤러리 unmount 안정성 향상
- ✅ CSS containment 최적화
- ✅ 번들 크기 영향 없음 (유틸리티 클래스 tree-shaking 효율적)
- ✅ Breaking change 없음

**파일 변경**:

- 신규: `src/shared/utils/twitter/scroll-preservation.ts` (168 lines)
- 신규: `src/shared/utils/twitter/index.ts` (배럴 export)
- 신규: `test/unit/shared/utils/twitter-scroll-preservation.test.ts` (268 lines,
  28 테스트)
- 신규: `playwright/smoke/twitter-navigation.spec.ts` (127 lines, 3 테스트 -
  skip)
- 수정: `src/shared/components/isolation/GalleryContainer.tsx` (unmount 개선)
- 수정: `src/shared/styles/isolated-gallery.css` (contain 속성 조정)

---

### Phase 291-292: 미디어 서비스 모듈화 및 단순화 (2025-10-31 ~ 2025-11-01)

- Phase 291: TwitterVideoExtractor 분할 (573 lines → 4파일)
- Phase 292: MediaService 단순화 (750 → 679줄, -9.5%)
- 단위 테스트 29개 신규 추가
- 번들: -3.82 KB raw (-1.1%), -0.86 KB gzip (-0.9%)

### Phase 275-277: EPIPE 에러 해결 및 테스트 정책 정규화 (2025-10-20)

- Phase 277: VerticalImageItem 크기 정책 정규화
- Phase 276: EPIPE 에러 근본 해결 (bash 스크립트 순차 실행)
- Phase 275: EPIPE 에러 첫 시도 (Vitest 워커 메모리 최적화)
- EPIPE 에러 0건 달성

---

## 다음 액션

- 현재 활성 Phase 없음
- 향후 고려: Phase 296.1 (빌드 검증 모듈화), Phase 287 (로깅 정책 문서화)

## 메트릭(요약)

- 번들 크기: 344.92 KB (gzip 93.61 KB)
- 테스트: 단위 2763/2765(2 skipped, 99.9%), E2E 88/96(8 skipped), 접근성 AA
- 품질: TS/ESLint/Stylelint 0 에러, CodeQL 0 경고
- 리팩토링: Phase 291-296 완료 (미디어 서비스, 갤러리, Twitter 호환성, 빌드
  스크립트)

## 참고

- 개발 가이드: ../AGENTS.md
- 코딩 규칙: ./CODING_GUIDELINES.md
- 테스트 전략: ./TESTING_STRATEGY.md
- 완료된 Phase 상세 내용: ./TDD_REFACTORING_PLAN_COMPLETED.md
- IPC 채널의 EPIPE 발생 지점 이동
- 개별 테스트 프로젝트 처리 중에는 안정적

### 2. 메모리 증가 (NODE_OPTIONS)

```bash
NODE_OPTIONS="--max-old-space-size=4096"
```

- V8 메모리 4GB로 증가
- 워커 생성 및 관리에 필요한 충분한 메모리 제공

### 3. 단일 스레드 강제 (vitest.config.ts)

```typescript
const sharedPoolOptions = {
  threads: {
    singleThread: true, // 항상 단일 스레드
    maxThreads: 1,
    reuseWorkers: false,
  },
};
```

- 멀티스레드 IPC 버퍼 오버플로우 완전 제거
- 워커 간 통신 최소화

### 4. 순차 실행 (package.json)

```json
"test:full": "npm run test:smoke && npm run test:unit && ... && npm run test:browser"
```

- 각 프로젝트를 순차적으로 실행
- 워커 재사용 및 메모리 압박 완화
- 동시 워커 수 최대 1개로 제한

**검증 결과**:

- ✅ smoke: 18/18 통과
- ✅ unit: 67/67 통과 (logger 테스트 일부 환경 이슈 있음)
- ✅ styles: 219/219 통과
- ✅ E2E 스모크: 86/86 통과
- ✅ 빌드: 345.68 KB (안정적)
- ✅ validate: 0 에러

**성능 영향**:

- ❌ 테스트 속도 약 10-20% 감소 (순차 실행 + 단일 워커)
- ✅ 안정성 대폭 개선 (EPIPE 0건)
- ✅ 메모리 사용 안정화

**변경 파일**:

- `package.json`: test 스크립트 수정 (stdbuf, NODE_OPTIONS, 순차 실행)
- `vitest.config.ts`: poolOptions, singleThread: true 설정

---

---

## 📋 완료된 Phase 목록 (요약)

| Phase | 상태    | 주요 작업                   |
| ----- | ------- | --------------------------- |
| 277   | ✅ 완료 | 테스트 크기 정책 정규화     |
| 276   | ✅ 완료 | EPIPE 에러 근본 해결        |
| 275   | ✅ 완료 | EPIPE 에러 첫 시도 (재발생) |
| 274   | ✅ 완료 | 테스트 실패 수정            |
| 273   | ✅ 완료 | jsdom 아티팩트 제거         |
| 272   | ✅ 완료 | smoke 테스트 명확화         |
| 271   | ✅ 완료 | 테스트 커버리지 개선        |
| 270   | ✅ 완료 | 이미지 로드 타이밍          |
| 269   | ✅ 완료 | 갤러리 초기 높이 문제       |
| 268   | ✅ 완료 | 런타임 경고 제거            |
| 267   | ✅ 완료 | 메타데이터 폴백 강화        |
| 266   | ✅ 완료 | 자동 스크롤 debounce        |
| 265   | ✅ 완료 | 스크롤 누락 버그 수정       |
| 264   | ✅ 완료 | 스크롤 모션 제거            |
| 263   | ✅ 완료 | 기동 스크롤 개선            |
| 262   | ✅ 완료 | 자동 스크롤 분석            |
| 261   | ✅ 완료 | dev 빌드 가독성             |
| 260   | ✅ 완료 | 의존성 정리                 |
| 258   | ✅ 완료 | 부트스트랩 최적화           |
| 257   | ✅ 완료 | events.ts 최적화            |
| 256   | ✅ 완료 | VerticalImageItem 최적화    |
| 255   | ⏸️ 보류 | CSS 레거시 토큰 정리        |

---

## 📚 관련 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **개발 가이드**: [AGENTS.md](../AGENTS.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

---

🎉 **프로젝트 완성!** Phase 277 테스트 크기 정책 정규화로 모든 작업이
완료되었습니다.
