/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview Z-Index 관리 시스템
 * @description TDD 방식으로 구현된 Z-Index 충돌 방지 및 계층 관리
 *
 * 핵심 기능:
 * - 중앙화된 Z-Index 관리
 * - 계층 간 충돌 방지
 * - CSS 변수 자동 생성
 * - 동적 계층 등록
 */

type ZIndexLayer = 'gallery' | 'toolbar' | 'modal' | 'toast';

interface LayerInfo {
  readonly name: string;
  readonly zIndex: number;
}

/**
 * Z-Index 계층 관리자
 *
 * 갤러리 시스템의 모든 Z-Index 값을 중앙화하여 관리하고
 * 계층 간 충돌을 방지합니다.
 */
export class ZIndexManager {
  private static instance: ZIndexManager | null = null;

  // 기본 계층 정의 (낮음 → 높음)
  private readonly defaultLayers: Record<ZIndexLayer, number> = {
    gallery: 2000,
    toolbar: 2500,
    modal: 3000,
    toast: 4000,
  };

  // 동적으로 등록된 계층들
  private readonly customLayers: Map<string, number> = new Map();

  // 성능을 위한 캐시
  private readonly zIndexCache: Map<string, number> = new Map();

  private constructor() {
    this.initializeCache();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ZIndexManager {
    if (!ZIndexManager.instance) {
      ZIndexManager.instance = new ZIndexManager();
    }
    return ZIndexManager.instance;
  }

  /**
   * 지정된 계층의 Z-Index 값 반환
   *
   * @param layer 계층 이름
   * @param offset 오프셋 값 (선택사항)
   * @returns Z-Index 값
   */
  public getZIndex(layer: ZIndexLayer | string, offset: number = 0): number {
    const cacheKey = `${layer}:${offset}`;

    if (this.zIndexCache.has(cacheKey)) {
      return this.zIndexCache.get(cacheKey)!;
    }

    let baseZIndex: number;

    // 기본 계층 확인
    if (layer in this.defaultLayers) {
      baseZIndex = this.defaultLayers[layer as ZIndexLayer];
    }
    // 커스텀 계층 확인
    else if (this.customLayers.has(layer)) {
      baseZIndex = this.customLayers.get(layer)!;
    }
    // 알 수 없는 계층
    else {
      throw new Error(`Unknown z-index layer: ${layer}`);
    }

    const finalZIndex = baseZIndex + offset;
    this.zIndexCache.set(cacheKey, finalZIndex);

    return finalZIndex;
  }

  /**
   * 새로운 계층 등록
   *
   * @param name 계층 이름
   * @param zIndex Z-Index 값
   */
  public registerLayer(name: string, zIndex: number): void {
    // 기존 계층 덮어쓰기 방지
    if (name in this.defaultLayers || this.customLayers.has(name)) {
      throw new Error(`Layer ${name} already exists`);
    }

    // Z-Index 충돌 검사
    const conflictLayer = this.findLayerByZIndex(zIndex);
    if (conflictLayer) {
      throw new Error(`Z-Index ${zIndex} is already used by layer: ${conflictLayer}`);
    }

    this.customLayers.set(name, zIndex);
    this.clearCache();
  }

  /**
   * CSS 변수 문자열 생성
   *
   * @returns CSS 변수 문자열
   */
  public generateCSSVariables(): string {
    const variables: string[] = [];

    // 기본 계층들
    for (const [layer, zIndex] of Object.entries(this.defaultLayers)) {
      variables.push(`--xeg-z-${layer}: ${zIndex};`);
    }

    // 커스텀 계층들
    for (const [layer, zIndex] of this.customLayers.entries()) {
      variables.push(`--xeg-z-${layer}: ${zIndex};`);
    }

    return variables.join('\n  ');
  }

  /**
   * 모든 계층 정보 반환 (디버깅용)
   */
  public getAllLayers(): LayerInfo[] {
    const layers: LayerInfo[] = [];

    // 기본 계층들
    for (const [name, zIndex] of Object.entries(this.defaultLayers)) {
      layers.push({ name, zIndex });
    }

    // 커스텀 계층들
    for (const [name, zIndex] of this.customLayers.entries()) {
      layers.push({ name, zIndex });
    }

    return layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * 관리자 상태 리셋
   */
  public reset(): void {
    this.customLayers.clear();
    this.clearCache();
  }

  /**
   * 캐시 초기화
   */
  private initializeCache(): void {
    this.zIndexCache.clear();

    // 기본 계층들을 미리 캐시
    for (const [layer, zIndex] of Object.entries(this.defaultLayers)) {
      this.zIndexCache.set(`${layer}:0`, zIndex);
    }
  }

  /**
   * 캐시 정리
   */
  private clearCache(): void {
    this.zIndexCache.clear();
    this.initializeCache();
  }

  /**
   * 지정된 Z-Index를 사용하는 계층 찾기
   */
  private findLayerByZIndex(targetZIndex: number): string | null {
    // 기본 계층에서 검색
    for (const [layer, zIndex] of Object.entries(this.defaultLayers)) {
      if (zIndex === targetZIndex) {
        return layer;
      }
    }

    // 커스텀 계층에서 검색
    for (const [layer, zIndex] of this.customLayers.entries()) {
      if (zIndex === targetZIndex) {
        return layer;
      }
    }

    return null;
  }
}
