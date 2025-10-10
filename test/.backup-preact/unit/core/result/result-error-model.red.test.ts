import { describe, it, expect } from 'vitest';
import { bulkDownloadService } from '@shared/services/BulkDownloadService';
import { ErrorCode } from '@shared/types/result.types';

// RED TEST: 서비스 실패/부분실패/취소/빈 입력 시 code 필드가 요구됨

describe('Result/Error Model v2 (RED)', () => {
  it('빈 입력 다운로드는 status=error & code=EMPTY_INPUT 이어야 한다', async () => {
    // 현재 구현은 code를 설정하지 않으므로 RED
    const res = await bulkDownloadService.downloadMultiple([]);
    expect(res.status).toBe('error');
    // 기대: code 존재 및 EMPTY_INPUT
    expect((res as any).code).toBe(ErrorCode.EMPTY_INPUT);
  });
});
