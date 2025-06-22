/**
 * @fileoverview Resource Pool - 메모리 자원 통합 관리
 * @version 2.1.0 - Simplified naming
 *
 * 모든 메모리 자원을 통합 관리하는 리소스 풀
 * Clean Architecture 원칙에 따라 Infrastructure 레이어에 위치
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 자원 타입 정의
 */
type ResourceType = 'timer' | 'eventListener' | 'abortController' | 'url';

/**
 * 자원 정보 인터페이스
 */
interface ResourceInfo {
  id: string;
  type: ResourceType;
  createdAt: number;
  context?: string;
}

/**
 * 타이머 자원
 */
interface TimerResource extends ResourceInfo {
  type: 'timer';
  timerId: number;
  isInterval: boolean;
}

/**
 * 이벤트 리스너 자원
 */
interface EventListenerResource extends ResourceInfo {
  type: 'eventListener';
  target: EventTarget;
  event: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
}

/**
 * AbortController 자원
 */
interface ControllerResource extends ResourceInfo {
  type: 'abortController';
  controller: AbortController;
}

/**
 * URL 자원
 */
interface UrlResource extends ResourceInfo {
  type: 'url';
  url: string;
}

/**
 * 자원 사용량 통계
 */
export interface ResourceUsage {
  timers: number;
  eventListeners: number;
  abortControllers: number;
  urls: number;
  total: number;
  totalMemoryBytes: number;
}

/**
 * 통합 자원 관리 풀
 *
 * 모든 메모리 자원(타이머, 이벤트 리스너, AbortController, URL 등)을
 * 중앙에서 추적하고 관리합니다.
 */
export class ResourcePool {
  private static instance: ResourcePool | null = null;

  private readonly timers = new Map<string, TimerResource>();
  private readonly eventListeners = new Map<string, EventListenerResource>();
  private readonly controllers = new Map<string, ControllerResource>();
  private readonly urls = new Map<string, UrlResource>();

  private constructor() {
    // 페이지 언로드 시 자동 정리
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  public static getInstance(): ResourcePool {
    if (!ResourcePool.instance) {
      ResourcePool.instance = new ResourcePool();
    }
    return ResourcePool.instance;
  }

  /**
   * 타이머 생성 및 추적
   */
  public createTimer(
    callback: () => void,
    delay: number,
    isInterval = false,
    context?: string
  ): string {
    const id = this.generateId();

    try {
      const timerId = isInterval
        ? window.setInterval(callback, delay)
        : window.setTimeout(callback, delay);

      const resource: TimerResource = {
        id,
        type: 'timer',
        timerId,
        isInterval,
        createdAt: Date.now(),
        ...(context && { context }),
      };

      this.timers.set(id, resource);

      logger.debug(`ResourcePool: ${isInterval ? 'Interval' : 'Timeout'} 생성`, {
        id,
        delay,
        context,
      });

      return id;
    } catch (error) {
      logger.error('ResourcePool: 타이머 생성 실패', { id, error });
      throw error;
    }
  }

  /**
   * 타이머 정리
   */
  public clearTimer(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      return false;
    }

    try {
      if (timer.isInterval) {
        clearInterval(timer.timerId);
      } else {
        clearTimeout(timer.timerId);
      }

      this.timers.delete(id);

      logger.debug(`ResourcePool: ${timer.isInterval ? 'Interval' : 'Timeout'} 정리`, {
        id,
        context: timer.context,
      });

      return true;
    } catch (error) {
      logger.error('ResourcePool: 타이머 정리 실패', { id, error });
      return false;
    }
  }

  /**
   * 이벤트 리스너 등록 및 추적
   */
  public addEventListener(
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    const id = this.generateId();

    try {
      target.addEventListener(event, listener, options);

      const resource: EventListenerResource = {
        id,
        type: 'eventListener',
        target,
        event,
        listener,
        createdAt: Date.now(),
        ...(options && { options }),
        ...(context && { context }),
      };

      this.eventListeners.set(id, resource);

      logger.debug('ResourcePool: EventListener 등록', {
        id,
        event,
        context,
      });

      return id;
    } catch (error) {
      logger.error('ResourcePool: EventListener 등록 실패', { id, error });
      throw error;
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  public removeEventListener(id: string): boolean {
    const listener = this.eventListeners.get(id);
    if (!listener) {
      return false;
    }

    try {
      listener.target.removeEventListener(listener.event, listener.listener, listener.options);

      this.eventListeners.delete(id);

      logger.debug('ResourcePool: EventListener 제거', {
        id,
        event: listener.event,
        context: listener.context,
      });

      return true;
    } catch (error) {
      logger.error('ResourcePool: EventListener 제거 실패', { id, error });
      return false;
    }
  }

  /**
   * AbortController 생성 및 추적
   */
  public createController(context?: string): { id: string; controller: AbortController } {
    const id = this.generateId();

    try {
      const controller = new AbortController();

      const resource: ControllerResource = {
        id,
        type: 'abortController',
        controller,
        createdAt: Date.now(),
        ...(context && { context }),
      };

      this.controllers.set(id, resource);

      logger.debug('ResourcePool: AbortController 생성', {
        id,
        context,
      });

      return { id, controller };
    } catch (error) {
      logger.error('ResourcePool: AbortController 생성 실패', { id, error });
      throw error;
    }
  }

  /**
   * AbortController 중단 및 정리
   */
  public abortController(id: string): boolean {
    const controllerResource = this.controllers.get(id);
    if (!controllerResource) {
      return false;
    }

    try {
      controllerResource.controller.abort();
      this.controllers.delete(id);

      logger.debug('ResourcePool: AbortController 중단', {
        id,
        context: controllerResource.context,
      });

      return true;
    } catch (error) {
      logger.error('ResourcePool: AbortController 중단 실패', { id, error });
      return false;
    }
  }

  /**
   * Object URL 생성 및 추적
   */
  public createObjectURL(
    source: Blob | MediaSource,
    context?: string
  ): { id: string; url: string } {
    const id = this.generateId();

    try {
      const url = URL.createObjectURL(source);

      const resource: UrlResource = {
        id,
        type: 'url',
        url,
        createdAt: Date.now(),
        ...(context && { context }),
      };

      this.urls.set(id, resource);

      logger.debug('ResourcePool: ObjectURL 생성', {
        id,
        url,
        context,
      });

      return { id, url };
    } catch (error) {
      logger.error('ResourcePool: ObjectURL 생성 실패', { id, error });
      throw error;
    }
  }

  /**
   * Object URL 해제
   */
  public revokeObjectURL(id: string): boolean {
    const urlResource = this.urls.get(id);
    if (!urlResource) {
      return false;
    }

    try {
      URL.revokeObjectURL(urlResource.url);
      this.urls.delete(id);

      logger.debug('ResourcePool: ObjectURL 해제', {
        id,
        url: urlResource.url,
        context: urlResource.context,
      });

      return true;
    } catch (error) {
      logger.error('ResourcePool: ObjectURL 해제 실패', { id, error });
      return false;
    }
  }

  /**
   * 모든 자원 정리
   */
  public cleanup(): void {
    try {
      logger.info('ResourcePool: 전체 자원 정리 시작', this.getUsage());

      // 타이머 정리
      for (const [id] of this.timers) {
        this.clearTimer(id);
      }

      // 이벤트 리스너 정리
      for (const [id] of this.eventListeners) {
        this.removeEventListener(id);
      }

      // AbortController 정리
      for (const [id] of this.controllers) {
        this.abortController(id);
      }

      // URL 정리
      for (const [id] of this.urls) {
        this.revokeObjectURL(id);
      }

      logger.info('ResourcePool: 전체 자원 정리 완료');
    } catch (error) {
      logger.error('ResourcePool: 자원 정리 중 오류', error);
    }
  }

  /**
   * 자원 사용량 통계
   */
  public getUsage(): ResourceUsage {
    const timers = this.timers.size;
    const eventListeners = this.eventListeners.size;
    const abortControllers = this.controllers.size;
    const urls = this.urls.size;
    const total = timers + eventListeners + abortControllers + urls;

    // 대략적인 메모리 사용량 계산 (바이트)
    const avgTimerSize = 100;
    const avgListenerSize = 200;
    const avgControllerSize = 150;
    const avgUrlSize = 500;

    const totalMemoryBytes =
      timers * avgTimerSize +
      eventListeners * avgListenerSize +
      abortControllers * avgControllerSize +
      urls * avgUrlSize;

    return {
      timers,
      eventListeners,
      abortControllers,
      urls,
      total,
      totalMemoryBytes,
    };
  }

  /**
   * 특정 컨텍스트의 자원들 정리
   */
  public cleanupByContext(context: string): void {
    logger.debug(`ResourcePool: 컨텍스트별 정리 시작 - ${context}`);

    // 타이머 정리
    for (const [id, timer] of this.timers) {
      if (timer.context === context) {
        this.clearTimer(id);
      }
    }

    // 이벤트 리스너 정리
    for (const [id, listener] of this.eventListeners) {
      if (listener.context === context) {
        this.removeEventListener(id);
      }
    }

    // AbortController 정리
    for (const [id, controller] of this.controllers) {
      if (controller.context === context) {
        this.abortController(id);
      }
    }

    // URL 정리
    for (const [id, url] of this.urls) {
      if (url.context === context) {
        this.revokeObjectURL(id);
      }
    }

    logger.debug(`ResourcePool: 컨텍스트별 정리 완료 - ${context}`);
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 전역 인스턴스
 */
export const resourcePool = ResourcePool.getInstance();
