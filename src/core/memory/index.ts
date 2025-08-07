export * from '@shared/memory/unified-memory-manager';

export const getCoreMemoryManager = () => {
  const { UnifiedMemoryManager } = require('@shared/memory/unified-memory-manager');
  return UnifiedMemoryManager.getInstance();
};

export const CoreMemoryManager = () => {
  const { UnifiedMemoryManager } = require('@shared/memory/unified-memory-manager');
  return UnifiedMemoryManager;
};
