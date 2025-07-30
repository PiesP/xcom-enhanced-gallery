/**
 * @fileoverview 간소화된 번들 유틸리티
 * @description 유저스크립트에 적합한 최소한의 번들 관리 기능
 * @version 2.0.0
 */

/**
 * 번들 크기가 목표 범위 내인지 확인
 *
 * @param sizeKB - 현재 번들 크기 (KB)
 * @param targetKB - 목표 크기 (KB, 기본값: 400)
 * @returns 범위 내 여부
 */
export function isWithinSizeTarget(sizeKB: number, targetKB = 400): boolean {
  return sizeKB <= targetKB;
}

/**
 * 번들 크기 정보 생성 (간소화)
 *
 * @param sizeBytes - 번들 크기 (bytes)
 * @returns 크기 정보
 */
export function createBundleInfo(sizeBytes: number) {
  const sizeKB = sizeBytes / 1024;
  return {
    size: sizeBytes,
    sizeKB: Math.round(sizeKB * 100) / 100,
    isWithinTarget: isWithinSizeTarget(sizeKB),
  };
}
