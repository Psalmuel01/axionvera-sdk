export interface ConcurrencyConfig {
  maxConcurrentRequests: number;
  queueTimeout?: number; // Maximum time a request can wait in queue (ms)
}

export interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

export class ConcurrencyQueue {
  private activeRequests = 0;
  private queue: QueuedRequest<any>[] = [];
  private config: ConcurrencyConfig;

  constructor(config: ConcurrencyConfig) {
    this.config = {
      queueTimeout: 30000, // 30 seconds default timeout
      ...config
    };
  }

  /**
   * Execute a request with concurrency control
   */
  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateRequestId();
      const queuedRequest: QueuedRequest<T> = {
        id: requestId,
        execute: requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Set up queue timeout if specified
      if (this.config.queueTimeout) {
        queuedRequest.timeoutId = setTimeout(() => {
          this.removeFromQueue(requestId);
          reject(new Error(`Request timed out in queue after ${this.config.queueTimeout}ms`));
        }, this.config.queueTimeout);
      }

      this.queue.push(queuedRequest);
      this.processQueue();
    });
  }

  /**
   * Process the queue and execute requests up to the concurrency limit
   */
  private async processQueue(): Promise<void> {
    while (this.activeRequests < this.config.maxConcurrentRequests && this.queue.length > 0) {
      const queuedRequest = this.queue.shift();
      if (!queuedRequest) break;

      // Clear the timeout since the request is now being processed
      if (queuedRequest.timeoutId) {
        clearTimeout(queuedRequest.timeoutId);
      }

      this.activeRequests++;

      // Execute the request asynchronously
      this.executeRequest(queuedRequest);
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T>(queuedRequest: QueuedRequest<T>): Promise<void> {
    try {
      const result = await queuedRequest.execute();
      queuedRequest.resolve(result);
    } catch (error) {
      queuedRequest.reject(error);
    } finally {
      this.activeRequests--;
      // Process next requests in queue
      this.processQueue();
    }
  }

  /**
   * Remove a request from the queue by ID
   */
  private removeFromQueue(requestId: string): void {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const [removed] = this.queue.splice(index, 1);
      if (removed.timeoutId) {
        clearTimeout(removed.timeoutId);
      }
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current queue statistics
   */
  getStats() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      maxConcurrentRequests: this.config.maxConcurrentRequests,
      queueTimestamps: this.queue.map(req => req.timestamp)
    };
  }

  /**
   * Clear all queued requests (useful for cleanup)
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      request.reject(new Error('Request cancelled due to queue clearance'));
    });
    this.queue = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConcurrencyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create a wrapped HTTP client with concurrency control
 */
export function createConcurrencyControlledClient<T extends object>(
  baseClient: T,
  config: ConcurrencyConfig
): T {
  const queue = new ConcurrencyQueue(config);

  // Create a proxy that intercepts method calls
  return new Proxy(baseClient, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // If it's a function, wrap it with concurrency control
      if (typeof value === 'function') {
        return function (...args: any[]) {
          return queue.execute(() => value.apply(target, args));
        };
      }

      return value;
    }
  });
}

/**
 * Default concurrency configuration
 */
export const DEFAULT_CONCURRENCY_CONFIG: ConcurrencyConfig = {
  maxConcurrentRequests: 5,
  queueTimeout: 30000
};
