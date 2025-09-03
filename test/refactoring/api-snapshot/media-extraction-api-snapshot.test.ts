// API Surface Snapshot Test for Media Extraction / StrategyChain before Phase 13 consolidation
// 목적: Phase 13 진입 전 공개 API(StrategyChain 관련) 변경 감지
// 변경 시 이 스냅샷을 갱신하기 전에 리뷰 필요 (의도된 브레이킹 여부 판단)

import { describe, it, expect } from 'vitest';
// StrategyChain 모듈 전체 export 스냅샷 확보
import * as StrategyChainModule from '@/shared/services/media-extraction/StrategyChain';
// Orchestrator 주요 타입/클래스 (public API 변동 감지)
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

describe('API Snapshot: media-extraction / StrategyChain', () => {
  it('StrategyChain module named exports snapshot', () => {
    const exportedKeys = Object.keys(StrategyChainModule).sort();
    // 스냅샷: 필요 시 의도된 변경이면 배열을 갱신(BREAKING 표기)
    // NOTE: TypeScript interfaces는 런타임 export 목록(Object.keys)에 나타나지 않음.
    // 따라서 런타임 값(클래스/함수)만 스냅샷 관리.
    expect(exportedKeys).toEqual(['StrategyChain', 'StrategyChainBuilder', 'withRetry'].sort());
  });

  it('MediaExtractionOrchestrator is class (stable public)', () => {
    expect(typeof MediaExtractionOrchestrator).toBe('function');
    expect(MediaExtractionOrchestrator.name).toBe('MediaExtractionOrchestrator');
  });
});
