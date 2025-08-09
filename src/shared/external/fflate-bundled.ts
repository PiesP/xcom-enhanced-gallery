/**
 * Statically bundled facade for fflate
 *
 * CSP/IIFE 환경에서의 TDZ 및 동적 import 문제를 피하기 위해
 * 필요한 API만 정적 import로 묶어 제공합니다.
 */
import { zip, unzip, strToU8, strFromU8, zipSync, unzipSync, deflate, inflate } from 'fflate';

export const fflateBundled = {
  zip,
  unzip,
  strToU8,
  strFromU8,
  zipSync,
  unzipSync,
  deflate,
  inflate,
};

export type { ZipInputFile as FflateZipInputFile } from 'fflate';
