#!/usr/bin/env node
/* eslint-env node */
/**
 * 빌드 산출물(dev/prod) 안전 복사 스크립트
 * - 0바이트 또는 파싱 실패 소스맵 무시
 * - 대상에 정상 파일이 있고, 새 파일이 0바이트면 덮어쓰지 않음
 * - 중복/스킵 로그 (DEBUG)
 */
import fs from 'fs';
import path from 'path';

const DEBUG = process.env.XEG_DEBUG_COPY === 'true';

function log(...args) {
  if (DEBUG) console.log('[copy]', ...args);
}

function isValidMap(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size < 20) return false;
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    return !!(json && json.version && json.mappings);
  } catch {
    return false;
  }
}

function copyDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const src = path.join(dir, f);
    const dest = path.join('dist', f);
    if (f.endsWith('.map')) {
      if (!isValidMap(src)) {
        log('skip invalid map', src);
        continue;
      }
    }
    if (fs.existsSync(dest)) {
      try {
        const sNew = fs.statSync(src).size;
        const sOld = fs.statSync(dest).size;
        if (sNew === 0 && sOld > 0) {
          log('skip overwrite with empty', src);
          continue;
        }
      } catch {
        /* ignore */
      }
    }
    try {
      fs.copyFileSync(src, dest);
      log('copied', src, '->', dest);
    } catch (e) {
      console.warn('copy fail', src, e.message);
    }
  }
}

['dist/dev', 'dist/prod'].forEach(copyDir);

export {}; // ensure ES module
