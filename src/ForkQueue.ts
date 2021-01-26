import { ChildProcess } from 'child_process';
import commonUtil from './utils/CommonUtil';
import ForkPool from './ForkPool';
import Task from './Task';

export const LOWEST_PRIORITY = -1; // Lowest task priority
export const HIGHEST_PRIORITY = 0; // Highest task priority

/**
 * Fork Queue
 * Schedules tasks from queue and runs them in a child process (using child_process.fork()).
 */
export default class ForkQueue {
  queue: Task[];
  taskRunningCount: number;
  pauseQueue: boolean;
  options: any;
  pool: ForkPool;
  saturatedCallback: any;
  drainCallback: any;
  unsaturatedCallback: any;
  /**
   * Constructor
   *
   * @param {*} options Example: {
   *     processFilePath: the child process file path,
   *     maxPoolSize: max number of child-processes (created by child_process.fork()) in the pool,
   *     minPoolSize: min number of child-processes (created by child_process.fork()) in the pool,
   *     idleTimeoutMillis: the idle-timeout in milliseconds
   *     evictionRunIntervalMillis: how often idle resources are checked (must be greater than 0. Otherwise idleTimeoutMillis will NOT work)
   * }
   */
  constructor(options: any) {
    // Initialize variables
    this.queue = [];
    this.taskRunningCount = 0;
    this.pauseQueue = false;

    // Create Pool
    this.options = options || {};

    this.pool = new ForkPool();
    this.pool.initPool(this.options);
  }

  /**
   * Drain pool during shutdown.
   *
   * Only call this once in your application -- at the point you want
   * to shutdown and stop using this pool.
   */
  async drainPool() {
    this.pool.drainPool();
  }

  /**
   * Push task to queue
   *
   * @param {*} message
   * @param {*} callback
   * @param {*} priority Optional. Default is LOWEST_PRIORITY if not set
   */
  push(message: any, callback: any, priority?: number) {
    console.debug('ForkQueue receives message: %s', JSON.stringify(message));

    const task: Task = new Task(message, callback, commonUtil.isFieldMissing(priority) ? LOWEST_PRIORITY : priority);

    if (this.isBusy()) {
      if (task.priority === LOWEST_PRIORITY) {
        this.queue.push(task);
      } else {
        // Insert task into queue based on priority
        let idx = 0;

        while (idx < this.queue.length && this.isLowerPriority(this.queue[idx], task)) {
          idx++;
        }

        if (idx >= this.queue.length) {
          this.queue.push(task);
        } else {
          // Insert task into queue at the specified index
          this.queue.splice(idx, 0, task);
        }
      }
    } else {
      this.processTask(task);
    }

    console.debug('ForkQueue status [waiting: %s, running: %s]', this.length(), this.running());

    if (this.isBusy()) {
      this.saturatedCallback && this.saturatedCallback();
    }
  }

  /**
   * Check if the incommingTask is lower priority than the currentTask
   *
   * @private
   * @param {*} currentTask
   * @param {*} incommingTask
   */
  isLowerPriority(currentTask: any, incommingTask: any) {
    return currentTask.priority !== LOWEST_PRIORITY && incommingTask.priority >= currentTask.priority;
  }

  /**
   * Process task using child_process.fork()
   *
   * @private
   * @param {*} param0
   */
  async processTask(task: Task) {
    this.taskRunningCount++;
    const self = this;
    let forked: ChildProcess;
    const message = task.message;
    const callback = task.callback;

    try {
      forked = await this.pool.acquire();
    } catch (err) {
      console.error('Error in acquire child-process from Pool. %s', err);

      callback && callback({ error: err });
      self.finishTask();
      return;
    }

    // Send message to child process
    forked.send({ value: message });

    let isFinished = false;

    // This call back will be call once the task done.
    // response is { value, error }
    const finishCallback = (response: any) => {
      // Receipt response from child process
      isFinished = true;
      forked.removeListener('exit', exitCallback);

      if (response.isFatalError) {
        // Kill child-process because it can be hanged up
        console.info('Fatal error. Kill child-process because it can be hanged up');
        self.pool.destroy(forked);
      } else {
        // Return child-process back to pool
        self.pool.release(forked);
      }

      callback && callback(response);
      self.finishTask();
    };

    // This call back will be call if child-process is unexpectedly exited while running.
    const exitCallback = (code: any, signal: any) => {
      // Check if child-process is exited unexpectedly while running
      if (!isFinished) {
        console.error('Child-process is exited unexpectedly while running. [code: %s, signal: %s]', code, signal);
        self.pool.destroy(forked);

        callback && callback({ error: new Error('Child-process is unexpectedly exited') });
        self.finishTask();
      }
    };

    forked.once('message', finishCallback);
    forked.once('exit', exitCallback);
  }

  /**
   * @private
   */
  finishTask() {
    this.taskRunningCount--;
    this.processNextTask();
  }

  /**
   * @private
   */
  processNextTask() {
    if (this.length() > 0) {
      // Process next task
      const queueItem: Task | undefined = this.queue.shift();

      if (queueItem === undefined) {
        return;
      }

      if (this.isResume() || queueItem.priority === HIGHEST_PRIORITY) {
        this.processTask(queueItem);
      } else {
        // Queue is paused and this queue-task is not a highest-priority-task.
        // So put it back to queue
        this.queue.unshift(queueItem);
      }
    }

    if (this.isResume()) {
      if (this.isAllTaskDone()) {
        this.drainCallback && this.drainCallback();
      } else if (this.isAvailable()) {
        this.unsaturatedCallback && this.unsaturatedCallback();
      }
    }
  }

  /**
   * Number of tasks that are waiting in queue
   */
  length() {
    return this.queue.length;
  }

  /**
   * Number of tasks that are running
   */
  running() {
    return this.taskRunningCount;
  }

  /**
   *
   */
  totalTasks() {
    return this.length() + this.running();
  }

  /**
   * true if number of total-tasks is larger than the max-pool-size
   */
  isBusy() {
    return this.totalTasks() >= this.options.maxPoolSize;
  }

  /**
   *
   */
  isAvailable() {
    return !this.isBusy();
  }

  /**
   *
   */
  isAllTaskDone() {
    return this.totalTasks() === 0;
  }

  /**
   *
   */
  pause() {
    this.pauseQueue = true;
  }

  /**
   *
   */
  resume() {
    this.pauseQueue = false;

    if (this.pool.isPoolDrained()) {
      throw new Error('Fork.Pool is not initialized.');
    }

    this.processNextTask();
  }

  /**
   * true if this queue is paused. false otherwise
   */
  isPaused() {
    return this.pauseQueue;
  }

  /**
   * true if this queue is resuming. false otherwise
   */
  isResume() {
    return !this.isPaused();
  }

  /**
   * Callback function thats will be called when the queue is busy. Incoming task will be put in queue.
   *
   * @param {*} callback
   */
  saturated(callback: any) {
    this.saturatedCallback = callback;
  }

  /**
   * Callback function thats will be called when the queue is able to process incoming task immediately.
   *
   * @param {*} callback
   */
  unsaturated(callback: any) {
    this.unsaturatedCallback = callback;
  }

  /**
   * Callback function thats will be called when all taskes have been processed.
   *
   * @param {*} callback
   */
  drain(callback: any) {
    this.drainCallback = callback;
  }
}
