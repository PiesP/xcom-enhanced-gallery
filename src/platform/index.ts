// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

export { IS_MV3 } from './detect';
export { notifySafely } from './notifications';
export {
  getDownloadAdapter,
  getHttpRequestAdapter,
  getNotificationAdapter,
  getStorageAdapter,
} from './platform-adapters';
export type * from './types';
