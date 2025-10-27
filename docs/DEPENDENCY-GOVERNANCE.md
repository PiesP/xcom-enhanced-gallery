# 🔒 의존성 거버넌스

> 구조적 안전장치: dependency-cruiser로 아키텍처 경계를 자동 검사 (최종 검증:
> Phase 209, 2025-10-27)

## 핵심 규칙

- **no-direct-vendor-imports**: 외부 라이브러리는 `@shared/external/vendors`
  getter를 통해서만 접근 (직접 import 에러)
- **no-circular-deps**: 순환 참조 금지 (패턴 기반 예외:
  services/container/state/types)
- **no-external-upward-deps**: External 레이어는 shared의 logging/utils/types만
  허용
- **no-shared-to-features-deps**: Shared는 Features 레이어를 참조할 수 없음
  (단방향 의존)
- **no-internal-barrel-imports**: 동일 패키지 내부에서 상위 배럴(index.ts)
  재수입 금지 (에러)

모든 규칙은 `.dependency-cruiser.cjs`에 정의되어 있습니다.

---

## 실행 방법

```bash
# 규칙 검증 (위반 시 빌드 실패)
npm run deps:check

# JSON 그래프만 생성 (빠름)
npm run deps:json

# DOT 그래프 생성
npm run deps:dot

# 전체 그래프 (JSON + DOT + SVG)
npm run deps:graph

# 검증 + 전체 그래프
npm run deps:all
```

## CI 실패 조건

- 빌드 훅: `prebuild`에서 의존성 검사 실행
- CI: Lint/Typecheck 이후 deps 검사 실행
- 위반 발생 시 빌드 실패

---

## 위반 수정 가이드

- **Vendor 직접 import** → vendor getter로 교체
- **순환 참조** → 배럴 경유 제거, 구체 경로 사용
- **레이어 위반** → 계층 배치 재검토

## 산출물

- `docs/dependency-graph.json` — 정적 의존성 데이터
- `docs/dependency-graph.dot` — Graphviz DOT
- `docs/dependency-graph.svg` — 시각화 (generate-dep-graph.js로 생성)

---

**상세 규칙과 테마: `.dependency-cruiser.cjs` 참조**
