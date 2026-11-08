const os = require('os');

class PriorityTaskManager {
  constructor() {
    this.highPriorityQueue = []; // Fast tasks: .get, .bypass, beautify, minify, ping
    this.heavyQueue = [];        // Heavy tasks: deobfuscation, complex tracing, pastblox pipeline
    this.activeHeavyTasks = 0;
    this.maxConcurrentHeavy = 1; // Heavy AST/VM deobfuscation is strictly throttled to prevent resource exhaustion
    this.isProcessing = false;
  }

  // System resource checks
  isResourceNearLimit() {
    // 1. Check memory usage
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    const rssMB = mem.rss / 1024 / 1024;
    
    // 2. Check system load averages (if available on Linux/macOS)
    const load = os.loadavg ? os.loadavg()[0] : 0;
    const cpus = os.cpus() ? os.cpus().length : 1;
    const highCpu = load > cpus * 1.5;

    // If heap > 450MB or RSS > 750MB or CPU is pegged, consider server under high load
    return (heapUsedMB > 450 || rssMB > 750 || highCpu || this.activeHeavyTasks >= this.maxConcurrentHeavy);
  }

  getSystemStatusNotice() {
    const isBusy = this.isResourceNearLimit();
    const queuedHeavy = this.heavyQueue.length;
    const queuedHigh = this.highPriorityQueue.length;

    let notice = '';
    if (isBusy || queuedHeavy > 0) {
      notice = `\n\n⚠️ **Resource Advisory**: MommyDeob CPU/Memory is currently under heavy load. Complex deobfuscations/Pastblox jobs may take up to several minutes. ${queuedHeavy > 0 ? `(${queuedHeavy} heavy tasks currently queued)` : ''}`;
    }
    return notice;
  }

  // Enqueue a fast task (jumps in front of queued heavy deobfuscations)
  enqueueFast(taskFn) {
    return new Promise((resolve, reject) => {
      this.highPriorityQueue.push({ taskFn, resolve, reject, addedAt: Date.now() });
      this.processNext();
    });
  }

  // Enqueue a heavy deobfuscation/Pastblox task
  enqueueHeavy(taskFn, onQueueNotice = null) {
    return new Promise((resolve, reject) => {
      const isBusy = this.isResourceNearLimit();
      const position = this.heavyQueue.length + 1;

      if (isBusy && typeof onQueueNotice === 'function') {
        onQueueNotice(position, this.getSystemStatusNotice());
      }

      this.heavyQueue.push({ taskFn, resolve, reject, addedAt: Date.now() });
      this.processNext();
    });
  }

  async processNext() {
    // 1. ALWAYS process high-priority (fast tasks like .get, .bypass, renames) first!
    // They get put in front of even heavy queued tasks and execute instantly.
    while (this.highPriorityQueue.length > 0) {
      const item = this.highPriorityQueue.shift();
      try {
        const result = await item.taskFn();
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }
    }

    // 2. Process heavy tasks under concurrency limits
    if (this.activeHeavyTasks >= this.maxConcurrentHeavy) {
      return;
    }

    if (this.heavyQueue.length === 0) {
      return;
    }

    const heavyItem = this.heavyQueue.shift();
    this.activeHeavyTasks++;

    (async () => {
      try {
        const result = await heavyItem.taskFn();
        heavyItem.resolve(result);
      } catch (err) {
        heavyItem.reject(err);
      } finally {
        this.activeHeavyTasks--;
        // Check if new fast tasks or next heavy tasks are waiting
        setImmediate(() => this.processNext());
      }
    })();
  }
}

const taskManager = new PriorityTaskManager();

module.exports = {
  PriorityTaskManager,
  taskManager
};
