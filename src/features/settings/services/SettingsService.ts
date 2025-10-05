/**
 * @fileoverview 설정 관리 서비스
 * @description 애플리케이션 설정의 영구 저장, 로드, 검증을 담당
 */

import { logger } from '@shared/logging/logger';
import getUserscript from '@shared/external/userscript/adapter';
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
const UNSAFE_SETTING_KEY_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

export class SettingsSecurityError extends Error {
  constructor(path: string) {
    super(`Disallowed settings key segment detected: ${path}`);
    this.name = 'SettingsSecurityError';
  }
}

function assertSafeSettingPath(pathSegments: readonly string[]): void {
  for (const segment of pathSegments) {
    if (!segment) continue;
    if (UNSAFE_SETTING_KEY_SEGMENTS.has(segment)) {
      throw new SettingsSecurityError(pathSegments.join('.'));
    }
  }
}

function sanitizeSettingsTree<T>(value: T, path: string[] = []): T {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeSettingsTree(item, [...path, String(index)])
    ) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const prototype = Object.getPrototypeOf(source);
    if (prototype && prototype !== Object.prototype) {
      throw new SettingsSecurityError([...path, '<prototype>'].join('.'));
    }
    const safeObject = Object.create(null) as Record<string, unknown>;

    for (const [key, nested] of Object.entries(source)) {
      assertSafeSettingPath([...path, key]);

      if (nested && typeof nested === 'object') {
        safeObject[key] = sanitizeSettingsTree(nested, [...path, key]);
      } else {
        safeObject[key] = nested;
      }
    }

    return safeObject as T;
  }

  return value;
}

function mergeCategory<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Record<string, unknown>
): T {
  const target = Object.create(null) as Record<string, unknown>;

  for (const [key, value] of Object.entries(defaults)) {
    target[key] = value;
  }

  if (overrides && typeof overrides === 'object') {
    // Sanitize overrides to prevent prototype pollution
    const sanitizedOverrides = sanitizeSettingsTree(overrides, ['mergeCategory']);
    for (const [key, value] of Object.entries(sanitizedOverrides)) {
      target[key] = value;
    }
  }

  return target as T;
}

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
  // NOTE: 기본 설정은 중첩 객체를 포함하므로 얕은 복사 시 set() 호출이 defaultSettings.* 까지
  // 오염(예: preloadCount 변경 시 defaultSettings.gallery.preloadCount 값 자체가 변형)되는 문제가 있었다.
  // resetToDefaults(category) 동작이 실패한 원인은 초기 얕은 복사로 인해 set()이 기본 객체를 직접 변경했기 때문.
  // 해결: 초기 상태 및 reset 시 항상 깊은(필요한 레벨의) 구조적 복사 사용.
  private settings: AppSettings = SettingsService.cloneDefaults();
  private readonly listeners = new Set<SettingChangeListener>();
  private initialized = false;

  /** 기본 설정 깊은 복제 (1단계 depth - 각 카테고리 객체 분리) */
  private static cloneDefaults(): AppSettings {
    const clone = Object.create(null) as Record<string, unknown>;
    clone.gallery = mergeCategory(defaultSettings.gallery);
    clone.download = mergeCategory(defaultSettings.download);
    clone.tokens = mergeCategory(defaultSettings.tokens);
    clone.performance = mergeCategory(defaultSettings.performance);
    clone.accessibility = mergeCategory(defaultSettings.accessibility);
    clone.version = defaultSettings.version;
    clone.lastModified = Date.now();
    return clone as unknown as AppSettings;
  }

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    try {
      // 1) 하이브리드 저장소 마이그레이션(최초 1회) 후 로드
      await this.migrateLegacyLocalStorageIfNeeded();
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
    return sanitizeSettingsTree(this.settings) as AppSettings;
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
    assertSafeSettingPath(keys);
    let target = this.settings as unknown as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (!currentKey) continue;

      if (!target[currentKey] || typeof target[currentKey] !== 'object') {
        target[currentKey] = Object.create(null);
      }
      target = target[currentKey] as Record<string, unknown>;
    }

    const finalKey = keys[keys.length - 1];
    if (finalKey) {
      const sanitizedValue =
        value && typeof value === 'object' ? sanitizeSettingsTree(value as unknown, keys) : value;
      // codeql[js/prototype-pollution-utility]
      // Rationale: sanitizedValue is already sanitized by sanitizeSettingsTree() which filters
      // dangerous keys (__proto__, constructor, prototype). The key path is derived from
      // user input but the value has been sanitized against prototype pollution attacks.
      target[finalKey] = sanitizedValue;
    }
    this.settings.lastModified = Date.now();

    // 변경 이벤트 발생
    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
      status: 'success',
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
      const pathSegments = (key as NestedSettingKey).split('.');
      assertSafeSettingPath(pathSegments);
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
          target[currentKey] = Object.create(null);
        }
        target = target[currentKey] as Record<string, unknown>;
      }

      const finalKey = keys[keys.length - 1];
      if (finalKey) {
        const sanitizedValue =
          value && typeof value === 'object' ? sanitizeSettingsTree(value as unknown, keys) : value;
        // codeql[js/prototype-pollution-utility]
        // Rationale: sanitizedValue is already sanitized by sanitizeSettingsTree() which filters
        // dangerous keys (__proto__, constructor, prototype). The key path is derived from
        // user input but the value has been sanitized against prototype pollution attacks.
        target[finalKey] = sanitizedValue;
      }

      changes.push({
        key: key as NestedSettingKey,
        oldValue,
        newValue: value,
        timestamp: Date.now(),
        status: 'success',
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
      // 카테고리 단위 깊은 복제 (shared reference 제거)
      const defaultsRecord = defaultSettings as unknown as Record<string, unknown>;
      const source = defaultsRecord[category as string];
      if (source && typeof source === 'object') {
        const cloned = sanitizeSettingsTree(source as unknown, [category as string]);
        const target = this.settings as unknown as Record<string, unknown>;
        target[category as string] = cloned as unknown;
      }
    } else {
      // 전체 재설정은 안전한 깊은 복제 사용
      this.settings = SettingsService.cloneDefaults();
    }

    this.settings.lastModified = Date.now();

    // 변경 이벤트 발생
    const resetKey = category || 'all';
    this.notifyListeners({
      key: resetKey as NestedSettingKey,
      oldValue: oldSettings,
      newValue: this.settings,
      timestamp: Date.now(),
      status: 'success',
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
      const sanitizedSettings = sanitizeSettingsTree(importedSettings);

      // 설정 검증
      if (!this.validateSettingsStructure(sanitizedSettings)) {
        throw new Error('유효하지 않은 설정 구조');
      }

      // 마이그레이션 수행 (필요한 경우)
      const migratedSettings = this.migrateSettings(sanitizedSettings);

      const oldSettings = { ...this.settings };
      this.settings = migratedSettings;
      this.settings.lastModified = Date.now();

      // 변경 이벤트 발생
      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: oldSettings,
        newValue: this.settings,
        timestamp: Date.now(),
        status: 'success',
      });

      await this.saveSettings();

      logger.info('설정 가져오기 완료');
    } catch (error) {
      if (error instanceof SettingsSecurityError) {
        logger.error('설정 가져오기 보안 차단:', error);
        throw error;
      }

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
      const stored = await this.readStore(STORAGE_KEY);
      if (!stored) {
        logger.debug('저장된 설정이 없음, 기본값 사용');
        return;
      }

      const parsedSettings = JSON.parse(stored) as AppSettings;
      const sanitizedSettings = sanitizeSettingsTree(parsedSettings);

      // 설정 구조 검증
      if (!this.validateSettingsStructure(sanitizedSettings)) {
        logger.warn('유효하지 않은 설정 구조, 기본값으로 복원');
        return;
      }

      // 마이그레이션 수행
      this.settings = this.migrateSettings(sanitizedSettings);

      logger.debug('설정 로드 완료');
    } catch (error) {
      if (error instanceof SettingsSecurityError) {
        logger.warn('설정 로드 중 보안 위협 감지, 기본값 사용:', error);
        return;
      }

      logger.error('설정 로드 실패, 기본값 사용:', error);
    }
  }

  /**
   * 설정 저장
   */
  private async saveSettings(): Promise<void> {
    try {
      await this.writeStore(STORAGE_KEY, JSON.stringify(this.settings));
      logger.debug('설정 저장 완료');
    } catch (error) {
      logger.error('설정 저장 실패:', error);
    }
  }

  /**
   * 저장소 읽기 (하이브리드: GM → localStorage 폴백)
   */
  private async readStore(key: string): Promise<string | null> {
    try {
      const us = getUserscript();
      const value = await us.storage.get(key);
      return value;
    } catch {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * 저장소 쓰기 (하이브리드: GM → localStorage 폴백)
   */
  private async writeStore(key: string, value: string): Promise<void> {
    try {
      const us = getUserscript();
      await us.storage.set(key, value);
    } catch {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
  }

  /**
   * 1회 마이그레이션: 기존 LocalStorage에만 존재하는 설정을 하이브리드 우선 저장소(GM)에 이관
   * - Idempotent: 대상 저장소에 이미 값이 있으면 수행하지 않음
   */
  private async migrateLegacyLocalStorageIfNeeded(): Promise<void> {
    try {
      const us = getUserscript();
      const [gmExisting, legacy] = await Promise.all([
        us.storage.get(STORAGE_KEY),
        (async () => {
          try {
            return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
          } catch {
            return null;
          }
        })(),
      ]);

      if (!gmExisting && legacy) {
        // 대상 저장소가 비어 있고, legacy에만 존재 → 이관
        await us.storage.set(STORAGE_KEY, legacy);
        logger.info('SettingsService: legacy localStorage → hybrid(GM 우선) 마이그레이션 완료');
      }
    } catch (error) {
      // 마이그레이션 실패는 기능 중단 사유 아님 — 경고만 기록
      logger.warn('SettingsService: 마이그레이션 중 경고(무시 가능):', error);
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
    // 현재는 기본값으로 누락된 필드 채우기 후 재살균 처리
    const merged = {
      ...defaultSettings,
      ...settings,
      gallery: { ...defaultSettings.gallery, ...settings.gallery },
      download: { ...defaultSettings.download, ...settings.download },
      tokens: { ...defaultSettings.tokens, ...settings.tokens },
      performance: { ...defaultSettings.performance, ...settings.performance },
      accessibility: { ...defaultSettings.accessibility, ...settings.accessibility },
      version: defaultSettings.version, // 항상 최신 버전으로
      lastModified: Date.now(),
    } as AppSettings;

    return sanitizeSettingsTree(merged);
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
      // Persist frequently-toggled UX settings immediately
      'gallery.imageFitMode',
      'download.showProgressToast',
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
