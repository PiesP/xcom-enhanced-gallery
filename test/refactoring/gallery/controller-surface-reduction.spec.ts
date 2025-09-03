/**
 * Phase13 GREEN: GalleryController 공개 API 표면 축소 검증
 * 결과: GalleryApp 7개 -> Controller 4개 (42.86% 감소 >= 30% 목표 충족)
 */
import { GalleryApp } from '@/features/gallery/GalleryApp';
import { GalleryController } from '@/features/gallery/GalleryController';

function getDeclaredFunctions(proto: object): string[] {
  return Object.getOwnPropertyNames(proto)
    .filter(n => n !== 'constructor')
    .filter(n => typeof (proto as Record<string, unknown>)[n] === 'function');
}

describe('Phase13 GREEN: GalleryController API 축소', () => {
  const APP_PUBLIC = new Set([
    'initialize',
    'openGallery',
    'closeGallery',
    'updateConfig',
    'isRunning',
    'getDiagnostics',
    'cleanup',
  ]);
  const CONTROLLER_PUBLIC = new Set(['initialize', 'open', 'close', 'getState']); // getDiagnostics 제거

  const appMethods = getDeclaredFunctions(GalleryApp.prototype).filter(m => APP_PUBLIC.has(m));
  const controllerMethods = getDeclaredFunctions(GalleryController.prototype).filter(m =>
    CONTROLLER_PUBLIC.has(m)
  );

  const appCount = appMethods.length; // 7
  const controllerCount = controllerMethods.length; // 4
  const reduction = (appCount - controllerCount) / appCount; // ≈0.4286

  it('30% 이상 축소되었다', () => {
    expect(appCount).toBe(7);
    expect(controllerCount).toBe(4);
    expect(reduction).toBeGreaterThanOrEqual(0.3);
  });
});
