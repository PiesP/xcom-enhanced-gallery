export * from '@shared/memory/unified-memory-manager';
import { UnifiedMemoryManager } from '@shared/memory/unified-memory-manager';

export const getCoreMemoryManager = () => {
  return UnifiedMemoryManager.getInstance();
};

export const CoreMemoryManager = () => {
  return UnifiedMemoryManager;
};
