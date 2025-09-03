# StrategyChain DSL 요약

간단한 순차 전략 실행 + 미들웨어/데코레이터 지원 계층.

기능:

1. 순차 실행 (canHandle 검사 통과 전략만 시도)
2. duplicate guard (Builder.enableDuplicateGuard) 동일 name 전략 두 번째 추가
   skip → metrics.duplicateSkipped
3. retry decorator (withRetry) 실패 시 최대 N회 재시도 →
   metrics.strategyRetries[name]
4. middleware before/after 훅 + short-circuit (`before` 가
   `{ shortCircuit:true, result }` 반환 시 즉시 종료)
5. metrics: attemptedStrategies, failedStrategies, successStrategy, durationMs,
   duplicateSkipped, strategyRetries, customMiddlewareCalls

간단 예시:

```ts
const chain = new StrategyChainBuilder()
  .enableDuplicateGuard()
  .add(withRetry(primaryStrategy, 1))
  .add(fallbackStrategy)
  .build();
const { result, metrics } = await chain.run(el, options, 'extract-1');
```

테스트 커버:

- strategy-chain-duplicate-guard-retry.test.ts
- strategy-chain-retry-edges.test.ts

추가 아이디어:

- 병렬 전략 그룹
- backoff 정책 확장
- 실패 원인 집계(extraction error codes)
