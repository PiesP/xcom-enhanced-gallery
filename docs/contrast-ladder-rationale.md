# Contrast Ladder Rationale (Phase 21)

본 문서는 Modal Readability Guard v2/v3 에서 사용하는 contrast ladder 및
hysteresis 결정 로직의 설계 근거를 요약합니다. (Backlog → 채택 시 세부 수치
최신화)

## 1. 목표

1. 배경 이미지/패턴/동영상 위에서도 텍스트 대비 WCAG AA (≥4.5:1) 유지
2. 불필요한 Glass ⇄ Solid 왕복 전환 최소화 (시각적 안정성)
3. 저소음(낮은 noise) 배경에서는 투명감 유지, 고노이즈 / 저대비 배경에서는
   단계적 차폐(escalation)
4. Dark/Light 테마 모두에서 일관된 대비 체감 확보

## 2. Ladder 단계

| Stage      | Description | Trigger 조건 (요약)                          | 결과 Surface Mode    |
| ---------- | ----------- | -------------------------------------------- | -------------------- |
| base       | 초기 평가   | contrast ≥ target && noise < mid             | glass (no scrim)     |
| scrim-low  | 저강도 차폐 | contrast ∈ [target-δ, target) OR noise ≥ mid | glass + light scrim  |
| scrim-med  | 중강도 차폐 | contrast < target-δ && noise ≥ mid           | glass + medium scrim |
| scrim-high | 고강도 차폐 | contrast < target-δ && noise ≥ high          | glass + strong scrim |
| solid      | 불투명 전환 | contrast < floor OR noise ≫ high             | solid surface        |

- target: 4.5 (AA), floor: 4.2 (바운스 허용 하한), δ: 0.25 (히스테리시스 상한
  버퍼)
- noise: 배경 luminance & edge variance 정규화 점수 (0..1)

## 3. Hysteresis & Persistence

| 파라미터                | 값 (예시)    | 역할                                            |
| ----------------------- | ------------ | ----------------------------------------------- |
| stageHysteresisWindowMs | 1200         | 단기 소음/대비 변동 스파이크 흡수               |
| crossSessionTTL         | 7200000 (2h) | 최근 stage 재사용으로 첫 모달 열림 flicker 감소 |
| noiseStabilityThreshold | 0.05         | noise 변화가 이 값 미만이면 stage 유지          |

Stage 변화는 (a) contrast floor 위반, (b) noise 급등, (c) 강등 후 2회 연속 안정
조건 충족 시 승급 순으로만 진행.

## 4. Contrast & Noise 측정

```text
contrast = (Lmax + 0.05) / (Lmin + 0.05)
noiseScore = w1*edgeDensity + w2*luminanceVariance + w3*chromaVariance
```

권장 가중치: w1=0.5, w2=0.3, w3=0.2 (패턴 에지 우선)

샘플 픽셀 수(cap): 12 (성능 보장), 조기 종료 조건: contrast ≥ target+0.75 즉시
PASS.

## 5. Escalation Trace Schema

```ts
interface ReadabilityEscalation {
  stage: string; // 이전 stage → 다음 stage
  reason: string; // 'low-contrast' | 'high-noise' | 'floor-breach'
  before: { contrast: number; noise: number; stage: string };
  after: { contrast: number; noise: number; stage: string };
  timestamp: number;
}
```

테스트는 stage 전환 시 trace 길이 증가 및 reason 다양성을 검증.

## 6. 성능 목표

| 항목          | 목표                                   |
| ------------- | -------------------------------------- |
| Evaluator p95 | ≤ 1.0 ms (JSDOM, 12 samples)           |
| Allocation    | no unbounded arrays (고정 길이 buffer) |

최적화: 다단계 early-exit (contrast 충분) → noise 계산 생략.

## 7. Dark / Light 차이

Dark 모드에서 glass 유지 가시성 강화를 위해:

- targetDark = 5.3 (내부 평가), floorDark = 5.0
- noiseScore 감쇠 계수 0.9 적용 (저조도 환경 과도 escalations 억제)

## 8. Rationale 요약

1. Ladder 는 단계적 차폐로 대비 문제를 해결하면서 시각적 연속성을 유지
2. Hysteresis 로 미세한 배경 변화에 의한 모드 깜빡임(flicker) 억제
3. Noise 를 contrast 와 별개 차원으로 도입해 단색/패턴 상황 양립
4. Cross-session persistence 로 재방문 UX 안정

## 8.1 Phase22 업데이트 (Dead Glass Token & Contrast Util)

- contrast 최소값 계산 루프를 `computeMinContrast` 유틸로 통합하여 evaluator /
  escalation / readability 보조 계산 간 중복 제거
- blended contrast 추정 헬퍼(`estimateBlendedContrast`)는 overlay 알파 단계
  테스트 대비 간단 경로만 유지 (Phase22 목표: solid 전환 결정은 tier escalation
  우선)
- legacy glass 전용 토큰(`--xeg-surface-glass-*`, `--xeg-glass-blur-*`) 제거 →
  semantic modal / elevated 토큰과 단일 `.xeg-glassmorphism` 클래스 사용으로
  유지비 감소 및 Dead Token Reporter 에서 0 dead 상태 확인

## 8.2 Dead Token Reporter 개요

`scripts/dead-token-reporter.js`:

1. `design-tokens.css` 내 `--xeg-` 변수 수집
2. `src/`의 ts/tsx/js/css 에서 최초 참조 여부 검색 (0회 사용 토큰만 dead 분류)
3. `reports/dead-tokens.json` 생성 (generatedAt, totalTokens, deadCount 등)

현재 실행 결과: deadCount=0 (Phase22 후 불필요 토큰 정리 완료 상태 유지).

## 9. 향후 확장 (Backlog)

- Blended contrast (alpha compositing 추정) 추가
- Perceptual contrast (APCA) 실험적 비교 값 기록
- 사용자 지정 대비 상한/하한 옵션
- Telemetry: stage 전환 비율, 평균 유지 시간
- Dead Token Reporter CI 통합 & historical diff 저장

---

본 문서는 Phase 21 Contrast Ladder 의 기술적 근거를 캡슐화한 Backlog 초안입니다.
구현 변경 시 수치/표 업데이트 필요.
