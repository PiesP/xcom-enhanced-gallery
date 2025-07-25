/**
 * @fileoverview Download Manager Redirect - DEPRECATED
 * @description BulkDownloadService로 리다이렉트
 * @deprecated Use BulkDownloadService instead
 */

// BulkDownloadService를 DownloadManager로 alias
export { BulkDownloadService as DownloadManager } from '@shared/services/BulkDownloadService';

// 인스턴스도 alias
import { BulkDownloadService } from '@shared/services/BulkDownloadService';
export const downloadManager = BulkDownloadService.getInstance();
