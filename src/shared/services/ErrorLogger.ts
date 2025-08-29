/**
 * @fileoverview ErrorLogger Service
 * @description Centralized error logging with memory management and log rotation
 */

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  error: Error;
  context: ErrorContext;
  stackTrace?: string | undefined;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  size: number; // Memory footprint in bytes
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
}

export type ErrorType = 'network' | 'validation' | 'runtime' | 'permission' | 'timeout' | 'unknown';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface MemoryStats {
  totalEntries: number;
  totalMemoryUsage: number;
  memoryLimit: number;
  rotationCount: number;
  oldestEntry?: number | undefined;
  newestEntry?: number | undefined;
}

/**
 * ErrorLogger - Centralized error logging system with memory management
 *
 * Features:
 * - Error categorization and severity levels
 * - Context information tracking
 * - Memory-efficient circular buffer with size limits
 * - Automatic log rotation based on memory usage
 * - Analytics and monitoring integration
 */
export class ErrorLogger {
  private readonly maxEntries: number;
  private readonly memoryLimit: number; // Memory limit in bytes
  private readonly entries: ErrorLogEntry[] = [];
  private readonly listeners: Array<(entry: ErrorLogEntry) => void> = [];
  private currentMemoryUsage = 0;
  private rotationCount = 0;

  constructor(maxEntries = 100, memoryLimit = 5 * 1024 * 1024) {
    // 5MB default
    this.maxEntries = maxEntries;
    this.memoryLimit = memoryLimit;
  }

  /**
   * Log an error with context information and memory tracking
   */
  logError(error: Error, context: Partial<ErrorContext> = {}): string {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      error,
      context: {
        errorType: this.categorizeError(error),
        severity: this.determineSeverity(error),
        ...context,
      },
      stackTrace: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      size: 0, // Will be calculated
    };

    // Calculate memory footprint
    entry.size = this.calculateEntrySize(entry);

    // Add to buffer with memory management
    this.addEntryWithRotation(entry);

    // Notify listeners
    this.notifyListeners(entry);

    // Log to console based on severity
    this.logToConsole(entry);

    return entry.id;
  }

  /**
   * Add error event listener
   */
  onError(listener: (entry: ErrorLogEntry) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get recent error logs
   */
  getRecentErrors(count = 10): ErrorLogEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.entries.filter(entry => entry.context.severity === severity);
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.entries.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    for (const entry of this.entries) {
      const type = entry.context.errorType;
      const severity = entry.context.severity;

      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): MemoryStats {
    const timestamps = this.entries.map(entry => entry.timestamp);
    return {
      totalEntries: this.entries.length,
      totalMemoryUsage: this.currentMemoryUsage,
      memoryLimit: this.memoryLimit,
      rotationCount: this.rotationCount,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }

  /**
   * Force log rotation to free memory
   */
  forceRotation(): void {
    const targetSize = Math.floor(this.maxEntries * 0.7); // Keep 70% of entries
    const removedCount = this.entries.length - targetSize;

    if (removedCount > 0) {
      const removedEntries = this.entries.splice(0, removedCount);
      this.currentMemoryUsage -= removedEntries.reduce((sum, entry) => sum + entry.size, 0);
      this.rotationCount++;

      console.info(
        `[XEG] [ErrorLogger] Log rotation: removed ${removedCount} entries, freed ${this.formatBytes(removedEntries.reduce((sum, entry) => sum + entry.size, 0))}`
      );
    }
  }

  /**
   * Clear error logs and reset memory tracking
   */
  clear(): void {
    this.entries.length = 0;
    this.currentMemoryUsage = 0;
    this.rotationCount = 0;
  }

  /**
   * Add entry with memory management and rotation
   */
  private addEntryWithRotation(entry: ErrorLogEntry): void {
    // Check if adding this entry would exceed memory limit
    if (this.currentMemoryUsage + entry.size > this.memoryLimit) {
      this.forceRotation();
    }

    this.entries.push(entry);
    this.currentMemoryUsage += entry.size;

    // Maintain circular buffer size
    if (this.entries.length > this.maxEntries) {
      const removedEntry = this.entries.shift();
      if (removedEntry) {
        this.currentMemoryUsage -= removedEntry.size;
      }
    }
  }

  /**
   * Calculate memory footprint of an entry
   */
  private calculateEntrySize(entry: ErrorLogEntry): number {
    let size = 0;

    // Basic properties
    size += entry.id.length * 2; // UTF-16
    size += 8; // timestamp (number)
    size += (entry.error.message?.length || 0) * 2;
    size += (entry.error.stack?.length || 0) * 2;
    size += (entry.stackTrace?.length || 0) * 2;
    size += (entry.userAgent?.length || 0) * 2;
    size += (entry.url?.length || 0) * 2;

    // Context object
    if (entry.context) {
      size += JSON.stringify(entry.context).length * 2;
    }

    // Metadata
    if (entry.metadata) {
      size += JSON.stringify(entry.metadata).length * 2;
    }

    // Add overhead for object structure
    size += 128; // Estimated object overhead

    return size;
  }

  /**
   * Format bytes for human-readable output
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }

    if (message.includes('timeout')) {
      return 'timeout';
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    return 'runtime';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors that break core functionality
    if (
      message.includes('critical') ||
      message.includes('fatal') ||
      error.name === 'ChunkLoadError'
    ) {
      return 'critical';
    }

    // High severity for network and security issues
    if (message.includes('network') || message.includes('security') || message.includes('cors')) {
      return 'high';
    }

    // Medium for validation and user errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('timeout')
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(entry: ErrorLogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error('[XEG] [ErrorLogger] Listener error:', error);
      }
    }
  }

  /**
   * Log to console based on severity
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[XEG] [${entry.context.severity.toUpperCase()}]`;
    const message = `${prefix} ${entry.error.message}`;

    switch (entry.context.severity) {
      case 'critical':
      case 'high':
        console.error(message, entry);
        break;
      case 'medium':
        console.warn(message, entry);
        break;
      default:
        console.info(message, entry);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();
