/**
 * @file RED: MediaProcessor 텔레메트리(stage latency) 테스트
 */
/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';
// jsdom 환경 전제 (RED 단계 간단 선언)
declare const document: any;

interface TelemetryEntry {
  stage: string;
  count: number;
  duration: number; // ms 단위 추정
}

describe('MediaProcessor - Telemetry (RED)', () => {
  it('단계별 latency 텔레메트리를 반환해야 한다', async () => {
    const { MediaProcessor } = await import('@shared/media/MediaProcessor');

    const root = document.createElement('div');
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = `https://example.com/${i}.jpg`;
      root.appendChild(img);
    }

    const processor = new MediaProcessor();

    // 가설 옵션: telemetry 수집 플래그 (아직 구현 전)
    const result: any = processor.process(root, {
      /* telemetry: true */
    } as any);

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    // RED: 아직 telemetry 속성이 없으므로 실패 기대 (구현 후 GREEN)
    expect(result).toHaveProperty('telemetry');
    const telemetry: TelemetryEntry[] = result.telemetry;
    const expectedStages = ['collect', 'extract', 'normalize', 'dedupe', 'validate'];
    expect(telemetry.map(t => t.stage)).toEqual(expectedStages);
    telemetry.forEach(entry => {
      expect(entry.count).toBeGreaterThanOrEqual(0);
      expect(entry.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
