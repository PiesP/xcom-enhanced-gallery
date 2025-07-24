/**
 * @fileoverview 설정 관리 서비스
 * @description 애플리케이션 설정의 영구 저장, 로드, 검증을 담당
 */

import { logger } from '@shared/logging/logger';
import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
  SettingValidationResult,
} from '../types/settings.types';
import { DEFAULT_SETTINGS as defaultSettings } from '../types/settings.types';

/**
 * 설정 저장 키
 */
const STORAGE_KEY = 'xeg-app-settings';

/**
 * 설정 변경 이벤트 타입
 */
type SettingChangeListener = (event: SettingChangeEvent) => void;

/**
 * 설정 관리 서비스
 *
 * 기능:
 * - 설정의 영구 저장/로드 (localStorage)
 * - 타입 안전 설정 접근
 * - 설정 변경 이벤트 시스템
 * - 설정 유효성 검증
 * - 마이그레이션 지원
 */
export class SettingsService {
  private settings: AppSettings = { ...defaultSettings };
  private readonly listeners = new Set<SettingChangeListener>();
  private initialized = false;

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      this.initialized = true;
      logger.debug('SettingsService 초기화 완료');
    } catch (error) {
      logger.error('SettingsService 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 서비스 정리
   */
  async cleanup(): Promise<void> {
    await this.saveSettings();
    this.listeners.clear();
    this.initialized = false;
    logger.debug('SettingsService 정리 완료');
  }

  /**
   * 모든 설정 조회
   *
   * @returns 현재 설정 (읽기 전용)
   */
  getAllSettings(): Readonly<AppSettings> {
    return { ...this.settings };
  }

  /**
   * 특정 설정 값 조회
   *
   * @param key 설정 키 (점 표기법 지원)
   * @returns 설정 값
   *
   * @example
   * ```typescript
   * const speed = settingsService.get('gallery.autoScrollSpeed');
   * const theme = settingsService.get('gallery.theme');
   * ```
   */
  get<T = unknown>(key: NestedSettingKey): T {
    const keys = key.split('.');
    let value: unknown = this.settings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        logger.warn(`설정 키를 찾을 수 없음: ${key}`);
        return this.getDefaultValue(key) as T;
      }
    }

    return value as T;
  }

  /**
   * 특정 설정 값 설정
   *
   * @param key 설정 키
   * @param value 새로운 값
   *
   * @example
   * ```typescript
   * settingsService.set('gallery.autoScrollSpeed', 7);
   * settingsService.set('download.autoZip', true);
   * ```
   */
  async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    const validation = this.validateSetting(key, value);
    if (!validation.valid) {
      throw new Error(`유효하지 않은 설정 값: ${validation.error}`);
    }

    const oldValue = this.get(key); // 설정 값 업데이트
    const keys = key.split('.');
    let target = this.settings as unknown as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (!currentKey) continue;

      if (!target[currentKey] || typeof target[currentKey] !== 'object') {
        target[currentKey] = {};
      }
      target = target[currentKey] as Record<string, unknown>;
    }

    const finalKey = keys[keys.length - 1];
    if (finalKey) {
      target[finalKey] = value;
    }
    this.settings.lastModified = Date.now();

    // 변경 이벤트 발생
    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    });

    // 즉시 저장 (중요한 설정)
    if (this.isCriticalSetting(key)) {
      await this.saveSettings();
    }

    logger.debug(`설정 변경: ${key} = ${value}`);
  }

  /**
   * 여러 설정을 일괄 업데이트
   *
   * @param updates 설정 업데이트 객체
   *
   * @example
   * ```typescript
   * settingsService.updateBatch({
   *   'gallery.theme': 'dark',
   *   'download.autoZip': true,
   *   'performance.debugMode': false
   * });
   * ```
   */
  async updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void> {
    const changes: SettingChangeEvent[] = [];

    // 모든 변경사항 검증
    for (const [key, value] of Object.entries(updates)) {
      const validation = this.validateSetting(key as NestedSettingKey, value);
      if (!validation.valid) {
        throw new Error(`유효하지 않은 설정 값 (${key}): ${validation.error}`);
      }
    }

    // 일괄 업데이트
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.get(key as NestedSettingKey);
      const keys = key.split('.');
      let target = this.settings as unknown as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        const currentKey = keys[i];
        if (!currentKey) continue;

        if (!target[currentKey] || typeof target[currentKey] !== 'object') {
          target[currentKey] = {};
        }
        target = target[currentKey] as Record<string, unknown>;
      }

      const finalKey = keys[keys.length - 1];
      if (finalKey) {
        target[finalKey] = value;
      }

      changes.push({
        key: key as NestedSettingKey,
        oldValue,
        newValue: value,
        timestamp: Date.now(),
      });
    }

    this.settings.lastModified = Date.now();

    // 모든 변경 이벤트 발생
    changes.forEach(change => this.notifyListeners(change));

    // 저장
    await this.saveSettings();

    logger.debug(`설정 일괄 업데이트 완료: ${Object.keys(updates).length}개 항목`);
  }

  /**
   * 설정을 기본값으로 재설정
   *
   * @param category 특정 카테고리만 재설정 (선택사항)
   */
  async resetToDefaults(category?: keyof AppSettings): Promise<void> {
    const oldSettings = { ...this.settings };

    if (category) {
      // 타입 안전성을 위해 unknown을 경유하여 캐스팅
      const settingsRecord = this.settings as unknown as Record<string, unknown>;
      const defaultsRecord = defaultSettings as unknown as Record<string, unknown>;
      settingsRecord[category] = {
        ...(defaultsRecord[category] as Record<string, unknown>),
      };
    } else {
      this.settings = { ...defaultSettings };
    }

    this.settings.lastModified = Date.now();

    // 변경 이벤트 발생
    const resetKey = category || 'all';
    this.notifyListeners({
      key: resetKey as NestedSettingKey,
      oldValue: oldSettings,
      newValue: this.settings,
      timestamp: Date.now(),
    });

    await this.saveSettings();

    logger.info(`설정 재설정 완료: ${category || '전체'}`);
  }

  /**
   * 설정 변경 이벤트 리스너 등록
   *
   * @param listener 이벤트 리스너
   * @returns 구독 해제 함수
   */
  subscribe(listener: SettingChangeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 설정을 JSON으로 내보내기
   */
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * JSON에서 설정 가져오기
   *
   * @param jsonString 설정 JSON 문자열
   */
  async importSettings(jsonString: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(jsonString) as AppSettings;

      // 설정 검증
      if (!this.validateSettingsStructure(importedSettings)) {
        throw new Error('유효하지 않은 설정 구조');
      }

      // 마이그레이션 수행 (필요한 경우)
      const migratedSettings = this.migrateSettings(importedSettings);

      const oldSettings = { ...this.settings };
      this.settings = migratedSettings;
      this.settings.lastModified = Date.now();

      // 변경 이벤트 발생
      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: oldSettings,
        newValue: this.settings,
        timestamp: Date.now(),
      });

      await this.saveSettings();

      logger.info('설정 가져오기 완료');
    } catch (error) {
      logger.error('설정 가져오기 실패:', error);
      throw new Error('설정을 가져올 수 없습니다. 올바른 형식인지 확인해주세요.');
    }
  }

  // Private methods

  /**
   * 설정 로드
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        logger.debug('저장된 설정이 없음, 기본값 사용');
        return;
      }

      const parsedSettings = JSON.parse(stored) as AppSettings;

      // 설정 구조 검증
      if (!this.validateSettingsStructure(parsedSettings)) {
        logger.warn('유효하지 않은 설정 구조, 기본값으로 복원');
        return;
      }

      // 마이그레이션 수행
      this.settings = this.migrateSettings(parsedSettings);

      logger.debug('설정 로드 완료');
    } catch (error) {
      logger.error('설정 로드 실패, 기본값 사용:', error);
    }
  }

  /**
   * 설정 저장
   */
  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      logger.debug('설정 저장 완료');
    } catch (error) {
      logger.error('설정 저장 실패:', error);
    }
  }

  /**
   * 설정 값 검증
   */
  private validateSetting(key: NestedSettingKey, value: unknown): SettingValidationResult {
    // 속도 관련 설정 검증
    if (key.includes('Speed') && typeof value === 'number') {
      if (value < 1 || value > 10) {
        return {
          valid: false,
          error: '속도는 1-10 사이여야 합니다',
          suggestion: '1에서 10 사이의 값을 입력하세요',
        };
      }
    }

    // 개수 관련 설정 검증
    if (key.includes('Count') && typeof value === 'number') {
      if (value < 0 || value > 20) {
        return {
          valid: false,
          error: '개수는 0-20 사이여야 합니다',
          suggestion: '0에서 20 사이의 값을 입력하세요',
        };
      }
    }

    // 불린 값 검증
    if (key.includes('enabled') || key.includes('auto') || key.includes('show')) {
      if (typeof value !== 'boolean') {
        return {
          valid: false,
          error: '이 설정은 true 또는 false 값이어야 합니다',
          suggestion: 'true 또는 false를 입력하세요',
        };
      }
    }

    return { valid: true };
  }

  /**
   * 설정 구조 검증
   */
  private validateSettingsStructure(settings: unknown): boolean {
    if (!settings || typeof settings !== 'object' || settings === null) {
      return false;
    }

    const settingsObj = settings as Record<string, unknown>;

    return (
      'gallery' in settingsObj &&
      'download' in settingsObj &&
      'tokens' in settingsObj &&
      'performance' in settingsObj &&
      'accessibility' in settingsObj &&
      'version' in settingsObj &&
      'lastModified' in settingsObj &&
      typeof settingsObj.lastModified === 'number'
    );
  }

  /**
   * 설정 마이그레이션
   */
  private migrateSettings(settings: AppSettings): AppSettings {
    // 버전별 마이그레이션 로직
    // 현재는 기본값으로 누락된 필드 채우기
    return {
      ...defaultSettings,
      ...settings,
      gallery: { ...defaultSettings.gallery, ...settings.gallery },
      download: { ...defaultSettings.download, ...settings.download },
      tokens: { ...defaultSettings.tokens, ...settings.tokens },
      performance: { ...defaultSettings.performance, ...settings.performance },
      accessibility: { ...defaultSettings.accessibility, ...settings.accessibility },
      version: defaultSettings.version, // 항상 최신 버전으로
      lastModified: Date.now(),
    };
  }

  /**
   * 기본값 조회
   */
  private getDefaultValue(key: NestedSettingKey): unknown {
    const keys = key.split('.');
    let value: unknown = defaultSettings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 중요 설정 여부 확인
   */
  private isCriticalSetting(key: NestedSettingKey): boolean {
    const criticalSettings = [
      'tokens.bearerToken',
      'performance.debugMode',
      'accessibility.reduceMotion',
    ];

    return criticalSettings.includes(key);
  }

  /**
   * 리스너들에게 변경 이벤트 알림
   */
  private notifyListeners(event: SettingChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('설정 변경 이벤트 리스너 오류:', error);
      }
    });
  }
}
