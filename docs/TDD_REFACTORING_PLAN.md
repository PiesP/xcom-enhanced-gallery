# TDD 리팩토링 계획 (요약본)

최종 업데이트: 2025-10-31

이 문서는 “진행 중/예정” 항목만 유지합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

## 현재 상태 요약

- 최근 완료: Phase 286(Flow Tracer), Phase 285(고급 로깅)
- 전체 지표: 번들 344.54 KB (gzip 93.16 KB), 테스트 GREEN, 품질/보안 0 에러

---

## Phase 287-B: 번들 크기 절감 1차(설정 중심)

목표

- 기능 변경 없이 빌드 설정만으로 번들 크기 1–3% 절감(안전 범위)

우선 조치

- Rollup treeshake 강화(prod): moduleSideEffects=false, propertyReadSideEffects=false, tryCatchDeoptimization=false
- Terser compress 점검: passes 3으로 조정(빌드 시간/크기 균형), drop_console/debugger, toplevel, mangle.toplevel 유지
- 리소스 점검: 아이콘(동적 import 유지, preload 최소화), i18n(3언어 유지, 추가 시 코드스플릿 고려)

수용 기준(AC)

- npm run build 성공, scripts/validate-build.js GREEN
- prod userscript raw ≤ 420 KB, gzip ≤ 120 KB(경고선 이하)
- 기능 회귀 없음: smoke/browser/E2E 스모크 통과

작업 노트

- 설정 변경은 prod 전용으로 가드하고 dev 진단성 유지
- 번들 분석은 docs/bundle-analysis.html 참고(필요 시 재생성)

---

## 참고

- 개발 가이드: ../AGENTS.md
- 코딩 규칙: ./CODING_GUIDELINES.md
- 테스트 전략: ./TESTING_STRATEGY.md
| 256   | ✅ 완료 | VerticalImageItem 최적화    |
| 255   | ⏸️ 보류 | CSS 레거시 토큰 정리        |

---

## 📚 관련 문서

- **완료 기록**: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **개발 가이드**: [AGENTS.md](../AGENTS.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

---

🎉 **프로젝트 완성!** Phase 277 테스트 크기 정책 정규화로 모든 작업이 완료되었습니다.
