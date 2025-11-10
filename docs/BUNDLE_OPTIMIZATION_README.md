# 번들 크기 최적화 프로젝트 (2025-11-10)

## 📁 생성된 문서

X.com Enhanced Gallery의 번들 크기 최적화를 위한 종합 분석 및 구현 계획입니다.

### 📋 4개의 상세 분석 문서

#### 1. **BUNDLE_SIZE_OPTIMIZATION_SUMMARY.md** (최우선 읽기)

- **용도**: 전체 프로젝트 개요 및 실행 계획
- **분량**: 445줄, 12 KB
- **내용**:
  - 현황 요약 (379 KB → 250-300 KB 목표)
  - 3가지 Tier별 전략 (Quick Start, Standard, Advanced)
  - 우선 실행 계획 (2주 타임라인)
  - 체크리스트 및 Q&A

**추천**: 이 문서부터 읽고 결정하기

---

#### 2. **BUNDLE_SIZE_OPTIMIZATION_ANALYSIS.md** (전략 수립)

- **용도**: 6개 Phase별 상세 분석
- **분량**: 473줄, 13 KB
- **내용**:
  - 현재 번들 구조 분석 (379 KB 상세 분류)
  - Phase 1-6 최적화 기회 상세 설명
  - 각 Phase별 절감 효과 예측
  - Optimization Roadmap (누적 효과 표)

**추천**: Phase별 기술 검토 시 참고

---

#### 3. **BUNDLE_OPTIMIZATION_IMPLEMENTATION.md** (개발 가이드)

- **용도**: 실제 코드 구현 방법
- **분량**: 532줄, 13 KB
- **내용**:
  - Phase 1-5 단계별 구현 절차
  - 코드 예제 및 수정 위치
  - 빌드 & 테스트 명령어
  - 검증 체크리스트

**추천**: 개발 중 단계별로 참고

---

#### 4. **BUNDLE_SOURCE_CODE_AUDIT.md** (소스 코드 감사)

- **용도**: 소스 코드 구조 및 최적화 기회 식별
- **분량**: 417줄, 13 KB
- **내용**:
  - 소스 코드 규모 분석 (8000줄 분류)
  - 폴더/파일별 상세 크기 추정
  - 각 모듈 최적화 후보 식별
  - CSS 규칙 및 아이콘 감시 방법

**추천**: 코드 리뷰 및 최적화 기회 파악 시 참고

---

## 🎯 핵심 발견사항

### 현재 상황

```
번들 크기: 379 KB (원시)
목표:     250 KB (34% 절감, Tier 2)
권장:     200 KB (47% 절감, Tier 3 + 추가 작업)

Composition:
├─ Solid.js 런타임    45 KB (12%)
├─ 컴파일 코드       120 KB (32%)
├─ CSS (Base64)       50 KB (13%) ← 주요 오버헤드
├─ UI 컴포넌트        60 KB (16%)
├─ 갤러리 로직        40 KB (11%)
└─ 기타              64 KB (16%)
```

### 주요 문제

1. **Base64 인코딩 오버헤드**: CSS 38 KB → 50 KB (+32%)
2. **미사용 CSS 규칙**: ~40-50% 제거 가능
3. **미사용 아이콘**: 6개 중 5-6개 제거 가능
4. **중복 코드**: 모듈 메타데이터, 반복되는 구조

### 빠른 승리 (Quick Win)

| 항목                   | 절감      | 예상 시간 | 위험         |
| ---------------------- | --------- | --------- | ------------ |
| Phase 1: CSS 외부 로드 | 12 KB     | 2h        | 🟢 매우 낮음 |
| Phase 2: CSS 최적화    | 10 KB     | 5h        | 🟡 낮음      |
| Phase 5: 아이콘 최적화 | 5 KB      | 2.5h      | 🟢 낮음      |
| **2주 결과**           | **27 KB** | **9.5h**  | 🟢 낮음      |

---

## 🚀 즉시 실행 항목 (Phase 1)

### vite.config.ts 수정 (약 10줄)

**목표**: Base64 인코딩 제거 → 12 KB 절감

**변경 내용**:

```typescript
// 변경 전: Base64 인코딩
function createStyleInjector(cssContent: string, isDev: boolean): string {
  return `(function(){var s='${btoa(cssConcat)}';GM_addStyle(atob(s));})();`;
}

// 변경 후: 직접 주입
function createStyleInjector(cssContent: string, isDev: boolean): string {
  const escaped = cssContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return `(function(){GM_addStyle(\`${escaped}\`);})();`;
}
```

**테스트**:

```bash
npm run build:prod
wc -c dist/xcom-enhanced-gallery.user.js  # 379 KB → 330 KB 확인
npm test:browser  # CSS 적용 확인
```

**예상 결과**: 379 KB → **330 KB** ✅

---

## 📊 타임라인 & 마일스톤

### Week 1: Phase 1 완료

- **날짜**: 2025-11-11 ~ 2025-11-14
- **목표**: 379 KB → 330 KB (13% 절감)
- **작업**: CSS 외부 로드
- **위험도**: 🟢 매우 낮음
- **결과**: 제1 마일스톤 달성

### Week 2: Phase 2-5 완료

- **날짜**: 2025-11-17 ~ 2025-11-21
- **목표**: 330 KB → 307 KB (추가 6% 절감)
- **작업**: CSS 최적화 + 아이콘 정리
- **위험도**: 🟡 낮음
- **결과**: 제2 마일스톤 달성 (19% 총 절감)

### Week 3-4: Phase 3-6 (선택)

- **날짜**: 2025-11-24 ~ 2025-12-05
- **목표**: 307 KB → 250 KB (추가 15% 절감)
- **작업**: 코드 분할 + 런타임 최적화
- **위험도**: 🔴 중간 ~ 높음
- **결과**: 제3 마일스톤 달성 (34% 총 절감)

---

## ✅ 검증 전략

### Phase별 테스트

**Phase 1 (필수)**:

```bash
npm run build:prod
npm test:browser  # CSS 렌더링 확인
npm run validate:pre  # 타입 & lint 확인
```

**Phase 2-5 (권장)**:

```bash
npm test:unit:batched  # 기능 검증
npm test:browser  # UI 렌더링 확인
npm run e2e:smoke  # 전체 흐름 테스트
```

**최종**:

```bash
npm run check  # 전체 품질 검사
```

---

## 📚 사용 방법

### 1️⃣ 전체 이해 (30분)

1. **이 문서** 읽기
2. `BUNDLE_SIZE_OPTIMIZATION_SUMMARY.md` 정독 (요약 및 타임라인)

### 2️⃣ 기술 이해 (1시간)

1. `BUNDLE_SIZE_OPTIMIZATION_ANALYSIS.md` 검토 (각 Phase의 기술적 배경)
2. `BUNDLE_SOURCE_CODE_AUDIT.md` 검토 (소스 코드 구조)

### 3️⃣ 개발 준비 (1시간)

1. `BUNDLE_OPTIMIZATION_IMPLEMENTATION.md` 정독 (Phase 1)
2. vite.config.ts 파일 백업
3. git branch 생성

### 4️⃣ 개발 실행 (2시간 + 테스트)

1. Phase 1 구현
2. 빌드 & 크기 측정
3. 테스트 실행
4. 커밋

---

## 🎯 Success Criteria

### Phase 1 (필수)

- ✅ 번들 크기: 379 KB → 330 KB (±5 KB)
- ✅ 모든 테스트 통과
- ✅ CSS 스타일 정상 적용
- ✅ 모든 UI 요소 표시됨

### Phase 2-5 (권장)

- ✅ 번들 크기: 330 KB → 307 KB (±5 KB)
- ✅ 레이아웃 깨짐 없음
- ✅ 아이콘 정상 표시
- ✅ 기능 정상 작동

### Phase 3-6 (선택)

- ✅ 번들 크기: 307 KB → 250 KB (±10 KB)
- ✅ 모든 기능 정상 작동
- ✅ 성능 저하 없음
- ✅ 호환성 유지

---

## 📖 학습 경로

### 의사결정자 (PM/리뷰어)

1. 이 문서 (README)
2. SUMMARY 문서의 "3가지 Tier" 섹션

**소요 시간**: 15분

### 개발자 (구현)

1. 이 문서 (README)
2. SUMMARY 문서 전체 정독
3. IMPLEMENTATION 문서의 Phase 1
4. 코드 수정 진행

**소요 시간**: 2-4시간 (학습 + 구현)

### QA/테스터 (검증)

1. IMPLEMENTATION 문서의 "검증 & 테스트 전략"
2. "Success Criteria" 체크리스트

**소요 시간**: 1-2시간 (테스트 실행)

---

## 🔗 빠른 참조

### 파일 수정 위치

| Phase | 파일                                | 함수/섹션             | 변경 라인  |
| ----- | ----------------------------------- | --------------------- | ---------- |
| 1     | vite.config.ts                      | createStyleInjector() | 160-200    |
| 2     | src/shared/styles/\*.css            | -                     | 전체       |
| 2     | postcss.config.js                   | cssnano               | 설정       |
| 5     | src/shared/components/ui/Icon/hero/ | -                     | SVG 콘텐츠 |

### 주요 명령어

```bash
# 빌드
npm run build:prod

# 크기 측정
wc -c dist/xcom-enhanced-gallery.user.js

# 테스트
npm test:browser
npm test:unit:batched
npm run e2e:smoke

# 검증
npm run validate:pre
npm run check
```

---

## ❓ FAQ

**Q: 어디서 시작해야 하나요?** A: BUNDLE_SIZE_OPTIMIZATION_SUMMARY.md를 읽고
Phase 1을 구현하세요 (2시간).

**Q: 모든 Phase를 구현해야 하나요?** A: Phase 1은 필수 (15분 작업), Phase 2-5는
권장 (7시간), Phase 3-6은 선택입니다.

**Q: 실패 위험도는?** A: Phase 1은 🟢 매우 낮음, Phase 2-5는 🟡 낮음입니다.

**Q: 번들을 200 KB 이하로 줄 수 있나요?** A: Tier 3 (Phase 3-6 포함)으로 250 KB
달성 가능, 200 KB는 Solid.js 대체 필요.

---

## 📅 다음 단계

1. **지금**: 이 문서 및 SUMMARY 문서 읽기
2. **내일**: IMPLEMENTATION 문서 검토 및 Phase 1 시작
3. **2일**: Phase 1 완료 및 PR
4. **이번 주**: Phase 2-5 진행
5. **다음 주**: 최종 결과 검증 및 릴리스

---

## 📞 연락처 & 참고

- **프로젝트**: X.com Enhanced Gallery (v0.4.2)
- **분석 일자**: 2025-11-10
- **상태**: ✅ 분석 완료, 🚀 구현 준비 완료
- **문서 위치**:
  `/home/piesp/projects/xcom-enhanced-gallery_local/docs/BUNDLE_*.md`

---

**마지막 업데이트**: 2025-11-10 13:03 UTC **문서 버전**: 1.0 **상태**:
Production Ready ✅
