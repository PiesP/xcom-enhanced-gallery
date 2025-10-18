import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * @fileoverview Service Lifecycle Integration Tests
 *
 * 목적: 서비스 초기화 및 라이프사이클 통합 검증
 * - 서비스 초기화 순서
 * - 서비스 간 이벤트 전달
 * - 리소스 정리
 */

describe('Service Lifecycle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize services in correct order', () => {
    const initOrder: string[] = [];

    class ServiceA {
      constructor() {
        initOrder.push('ServiceA');
      }
      init() {
        initOrder.push('ServiceA:init');
      }
    }

    class ServiceB {
      constructor(private serviceA: ServiceA) {
        initOrder.push('ServiceB');
      }
      init() {
        initOrder.push('ServiceB:init');
        this.serviceA.init();
      }
    }

    const serviceA = new ServiceA();
    const serviceB = new ServiceB(serviceA);
    serviceB.init();

    expect(initOrder).toEqual(['ServiceA', 'ServiceB', 'ServiceB:init', 'ServiceA:init']);
  });

  it('should propagate events between services', async () => {
    const events: string[] = [];

    class EventEmitter {
      private handlers: Map<string, Array<(data: unknown) => void>> = new Map();

      on(event: string, handler: (data: unknown) => void) {
        if (!this.handlers.has(event)) {
          this.handlers.set(event, []);
        }
        this.handlers.get(event)?.push(handler);
      }

      emit(event: string, data: unknown) {
        this.handlers.get(event)?.forEach(handler => handler(data));
      }
    }

    class ProducerService {
      constructor(private emitter: EventEmitter) {}

      produce() {
        events.push('produce');
        this.emitter.emit('data', { value: 42 });
      }
    }

    class ConsumerService {
      constructor(private emitter: EventEmitter) {
        this.emitter.on('data', data => {
          events.push(`consume:${JSON.stringify(data)}`);
        });
      }
    }

    const emitter = new EventEmitter();
    const producer = new ProducerService(emitter);
    const consumer = new ConsumerService(emitter);

    producer.produce();

    expect(events).toEqual(['produce', 'consume:{"value":42}']);
    expect(consumer).toBeDefined(); // consumer 사용 확인
  });

  it('should handle service cleanup', () => {
    const cleanupCalls: string[] = [];

    class ResourceService {
      private resource: string | null = 'resource';

      dispose() {
        cleanupCalls.push('ResourceService:dispose');
        this.resource = null;
      }

      isDisposed() {
        return this.resource === null;
      }
    }

    class ManagerService {
      constructor(private resourceService: ResourceService) {}

      dispose() {
        cleanupCalls.push('ManagerService:dispose');
        this.resourceService.dispose();
      }
    }

    const resource = new ResourceService();
    const manager = new ManagerService(resource);

    expect(resource.isDisposed()).toBe(false);

    manager.dispose();

    expect(resource.isDisposed()).toBe(true);
    expect(cleanupCalls).toEqual(['ManagerService:dispose', 'ResourceService:dispose']);
  });

  it('should handle circular dependencies with lazy initialization', () => {
    class ServiceA {
      private _serviceB?: ServiceB;

      setServiceB(serviceB: ServiceB) {
        this._serviceB = serviceB;
      }

      callB() {
        return this._serviceB?.getName() ?? 'no-b';
      }

      getName() {
        return 'ServiceA';
      }
    }

    class ServiceB {
      constructor(private serviceA: ServiceA) {}

      getName() {
        return 'ServiceB';
      }

      callA() {
        return this.serviceA.getName();
      }
    }

    const serviceA = new ServiceA();
    const serviceB = new ServiceB(serviceA);
    serviceA.setServiceB(serviceB);

    expect(serviceA.callB()).toBe('ServiceB');
    expect(serviceB.callA()).toBe('ServiceA');
  });

  it('should share state across services using singleton pattern', () => {
    class StateStore {
      private static instance: StateStore;
      private state: Map<string, unknown> = new Map();

      static getInstance() {
        if (!StateStore.instance) {
          StateStore.instance = new StateStore();
        }
        return StateStore.instance;
      }

      set(key: string, value: unknown) {
        this.state.set(key, value);
      }

      get(key: string) {
        return this.state.get(key);
      }

      static reset() {
        StateStore.instance = new StateStore();
      }
    }

    // 싱글톤 리셋
    StateStore.reset();

    class WriterService {
      private store = StateStore.getInstance();

      write(key: string, value: unknown) {
        this.store.set(key, value);
      }
    }

    class ReaderService {
      private store = StateStore.getInstance();

      read(key: string) {
        return this.store.get(key);
      }
    }

    const writer = new WriterService();
    const reader = new ReaderService();

    writer.write('test', 'value');

    expect(reader.read('test')).toBe('value');
  });

  it('should coordinate async operations between services', async () => {
    class AsyncService {
      async fetchData(delay: number): Promise<string> {
        return new Promise(resolve => {
          setTimeout(() => resolve('data'), delay);
        });
      }
    }

    class CoordinatorService {
      constructor(private asyncService: AsyncService) {}

      async coordinateTasks() {
        const results = await Promise.all([
          this.asyncService.fetchData(10),
          this.asyncService.fetchData(20),
          this.asyncService.fetchData(5),
        ]);

        return results.join(',');
      }
    }

    const asyncService = new AsyncService();
    const coordinator = new CoordinatorService(asyncService);

    const result = await coordinator.coordinateTasks();

    expect(result).toBe('data,data,data');
  });

  it('should handle errors in service chain', async () => {
    class FailingService {
      async process(): Promise<string> {
        throw new Error('Service failed');
      }
    }

    class ErrorHandler {
      constructor(private service: FailingService) {}

      async handleProcess(): Promise<string> {
        try {
          return await this.service.process();
        } catch (error) {
          return `handled: ${(error as Error).message}`;
        }
      }
    }

    const failing = new FailingService();
    const handler = new ErrorHandler(failing);

    const result = await handler.handleProcess();

    expect(result).toBe('handled: Service failed');
  });

  it('should support service composition', () => {
    interface Logger {
      log(message: string): void;
    }

    class ConsoleLogger implements Logger {
      private logs: string[] = [];

      log(message: string) {
        this.logs.push(message);
      }

      getLogs() {
        return this.logs;
      }
    }

    class TimestampLogger implements Logger {
      constructor(private logger: Logger) {}

      log(message: string) {
        this.logger.log(`[${Date.now()}] ${message}`);
      }
    }

    class PrefixLogger implements Logger {
      constructor(
        private logger: Logger,
        private prefix: string
      ) {}

      log(message: string) {
        this.logger.log(`${this.prefix}: ${message}`);
      }
    }

    const console = new ConsoleLogger();
    const timestamped = new TimestampLogger(console);
    const prefixed = new PrefixLogger(timestamped, 'TEST');

    prefixed.log('hello');

    const logs = console.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/\[.*\] TEST: hello/);
  });
});
