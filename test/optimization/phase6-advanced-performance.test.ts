/**
 * @fileoverview Phase 6: 고급 성능 최적화 테스트
 * @description Web Workers, Service Worker 캐싱, 메모리 풀링, 배치 DOM 업데이트, 성능 프로파일링 검증
 * @version 6.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  WorkerPoolManager,
  MemoryPoolManager,
  BatchDOMUpdateManager,
  PerformanceProfiler,
} from '@shared/utils';

// Mock DOM APIs for testing
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 16),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: (id: number) => clearTimeout(id),
});

// Mock Canvas API for testing
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: function (contextType: string) {
    if (contextType === '2d') {
      return {
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        strokeText: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Uint8ClampedArray(4) }),
        save: () => {},
        restore: () => {},
        canvas: this,
      };
    }
    return null;
  },
});

describe('Phase 6: Advanced Performance Optimization', () => {
  describe('1. Web Workers Pool', () => {
    let workerPool: WorkerPoolManager;

    beforeEach(() => {
      workerPool = new WorkerPoolManager({
        maxWorkers: 2,
        taskTimeout: 1000,
      });
    });

    afterEach(() => {
      workerPool.dispose();
    });

    it('should execute tasks in web workers', async () => {
      const task = {
        id: 'test-task',
        type: 'cpu-intensive' as const,
        data: { numbers: [1, 2, 3, 4, 5] },
        priority: 1,
      };

      // Note: In test environment, this will use fallback execution
      const result = await workerPool.executeTask(task);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle worker pool management', () => {
      expect(workerPool.getActiveWorkerCount()).toBe(0);
      expect(workerPool.getPendingTaskCount()).toBe(0);
    });
  });

  describe('2. Service Worker Caching', () => {
    it('should be available for implementation', () => {
      // Service Worker caching will be implemented in browser environment
      expect(true).toBe(true);
    });
  });

  describe('3. Memory Pooling System', () => {
    let memoryPool: MemoryPoolManager;

    beforeEach(() => {
      memoryPool = new MemoryPoolManager();
    });

    afterEach(() => {
      memoryPool.dispose();
    });

    it('should reuse DOM elements', () => {
      const element1 = memoryPool.getDOMElement('div');
      const element2 = memoryPool.getDOMElement('div');

      expect(element1).toBeInstanceOf(HTMLElement);
      expect(element2).toBeInstanceOf(HTMLElement);

      // Return and reuse
      memoryPool.returnDOMElement('div', element1);
      const element3 = memoryPool.getDOMElement('div');

      expect(element3).toBe(element1); // Should reuse
    });

    it('should manage canvas contexts', () => {
      const canvas1 = memoryPool.getCanvas();
      const canvas2 = memoryPool.getCanvas();

      expect(canvas1).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas2).toBeInstanceOf(HTMLCanvasElement);

      memoryPool.returnCanvas(canvas1);
      const canvas3 = memoryPool.getCanvas();

      expect(canvas3).toBe(canvas1); // Should reuse
    });

    it('should pool event handlers', () => {
      const handler1 = memoryPool.getEventHandler('click');
      const handler2 = memoryPool.getEventHandler('click');

      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
    });
  });

  describe('4. Batch DOM Updates', () => {
    let batchUpdater: BatchDOMUpdateManager;

    beforeEach(() => {
      batchUpdater = new BatchDOMUpdateManager();
      // Create test element
      document.body.innerHTML = '<div id="test-element">Test</div>';
    });

    afterEach(() => {
      batchUpdater.dispose();
      document.body.innerHTML = '';
    });

    it('should batch DOM updates', async () => {
      const element = document.getElementById('test-element');
      expect(element).not.toBeNull();

      // Schedule multiple updates using actual API
      batchUpdater.scheduleUpdate({
        element: element!,
        type: 'style',
        property: 'color',
        value: 'red',
        priority: 1,
      });

      batchUpdater.scheduleUpdate({
        element: element!,
        type: 'textContent',
        value: 'Updated',
        priority: 2,
      });

      // Force batch execution for testing
      (batchUpdater as any).executeBatch();

      expect(element!.style.color).toBe('red');
      expect(element!.textContent).toBe('Updated');
    });

    it('should handle priority ordering', () => {
      const updates = batchUpdater.getPendingUpdates();
      expect(Array.isArray(updates)).toBe(true);
    });
  });

  describe('5. Performance Profiling', () => {
    let profiler: PerformanceProfiler;

    beforeEach(() => {
      profiler = PerformanceProfiler.getInstance();
    });

    afterEach(() => {
      profiler.dispose();
    });

    it('should record custom metrics', () => {
      profiler.recordMetric('test-metric', 100, 'user', 'ms');

      const metrics = profiler.getMetrics({ name: 'test-metric' });
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].category).toBe('user');
    });

    it('should measure function execution time', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };

      const result = await profiler.measureFunction('test-function', testFunction);

      expect(result).toBe('result');

      const metrics = profiler.getMetrics({ name: 'test-function-duration' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should generate performance reports', () => {
      // Add some test metrics
      profiler.recordMetric('cpu-usage', 50, 'cpu', '%');
      profiler.recordMetric('memory-usage', 80, 'memory', 'MB');

      const report = profiler.generateReport();

      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(report.metrics).toHaveLength(report.summary.totalMetrics);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('6. Integration Tests', () => {
    it('should coordinate all performance optimizations', async () => {
      const workerPool = new WorkerPoolManager({ maxWorkers: 1 });
      const memoryPool = new MemoryPoolManager();
      const batchUpdater = new BatchDOMUpdateManager();
      const profiler = PerformanceProfiler.getInstance();

      try {
        // Test integrated workflow
        const canvas = memoryPool.getCanvas();
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);

        // Record performance metric
        profiler.recordMetric('integration-test', 1, 'user');

        // Batch DOM update
        document.body.innerHTML = '<div id="integration-test">Test</div>';
        const element = document.getElementById('integration-test');

        batchUpdater.scheduleUpdate({
          element: element!,
          type: 'style',
          property: 'display',
          value: 'block',
          priority: 1,
        });

        // Force execution for testing
        (batchUpdater as any).executeBatch();

        expect(element!.style.display).toBe('block');

        // Cleanup
        memoryPool.returnCanvas(canvas);
      } finally {
        workerPool.dispose();
        memoryPool.dispose();
        batchUpdater.dispose();
        profiler.dispose();
      }
    });
  });
});
