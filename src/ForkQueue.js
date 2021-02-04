import { performance } from 'perf_hooks';
import commonUtil from './utils/CommonUtil';
import CustomError from './models/CustomError';
import { ERR_TIMED_OUT, ERR_UNEXPECTEDLY_EXITED } from './models/CustomError';
import singletonLogger from './loggers/SingletonLogger';
import ForkPool from './ForkPool';

export const LOWEST_PRIORITY = -1; // Lowest task priority
export const HIGHEST_PRIORITY = 0; // Highest task priority

/**
 * Fork Queue
 * Schedules tasks from queue and runs them in a child process (using child_process.fork()).
 */
export default class ForkQueue {
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
  constructor(options) {
    // Init Logger
    singletonLogger.initLogger();

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
   * Push task to queue
   *
   * @param {*} message
   * @param {*} callback
   */
  push(message, callback, priority) {
    singletonLogger.debug('ForkQueue receives message: %s', JSON.stringify(message));

    const task = { message, callback, priority: commonUtil.isFieldMissing(priority) ? LOWEST_PRIORITY : priority };

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

    singletonLogger.debug('ForkQueue status [waiting: %s, running: %s]', this.length(), this.running());

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
  isLowerPriority(currentTask, incommingTask) {
    return currentTask.priority !== LOWEST_PRIORITY && incommingTask.priority >= currentTask.priority;
  }

  /**
   * Process task using child_process.fork()
   *
   * @private
   * @param {*} param0
   */
  async processTask({ message, callback }) {
    this.taskRunningCount++;
    const self = this;
    let forked;

    try {
      forked = await this.pool.acquire();
    } catch (err) {
      singletonLogger.error('Error in acquire child-process from Pool. %s', err);

      callback && callback({ error: err });
      self.finishTask();
      return;
    }

    // Send message to child process
    forked.send({ value: message });

    let isFinished = false;

    // This call back will be call once the task done.
    // response is { value, error }
    const finishCallback = (response) => {
      // Receipt response from child process
      isFinished = true;
      forked.removeListener('exit', exitCallback);

      if (response.isFatalError) {
        // Kill child-process because it can be hanged up
        singletonLogger.info('Fatal error. Kill child-process because it can be hanged up');
        self.pool.destroy(forked);
      } else {
        // Return child-process back to pool
        self.pool.release(forked);
      }

      callback && callback(response);
      self.finishTask();
    };

    // This call back will be call if child-process is unexpectedly exited while running.
    const exitCallback = (code, signal) => {
      if (isFinished) {
        // Child-process is completed. Do nothing.
        return;
      }

      // Child-process is exited unexpectedly while running
      singletonLogger.error('Child-process is exited unexpectedly while running. [code: %s, signal: %s]', code, signal);
      self.pool.destroy(forked);

      const errMsg = ['Child-process is unexpectedly exited with [code: ', code, ', signal: ', signal, ']'].join('');

      callback && callback({ error: new CustomError(ERR_UNEXPECTEDLY_EXITED, errMsg) });
      self.finishTask();
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
      const queueItem = this.queue.shift();

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
   * Cleanup resources during shutdown.
   *
   * Only call this once in your application -- at the point you want
   * to shutdown and stop using this queue.
   */
  async stop(timeoutMs) {
    singletonLogger.info('Request to stop Fork.Queue');
    const start = performance.now();

    // Pause the queue first
    this.pause();
    const stopTimeoutMs = timeoutMs || 2000;
    let numOfTry = 0;
    const period = 200;
    const maxTry = stopTimeoutMs / 200;

    return new Promise((resolve, reject) => {
      // Waiting for running tasks to finish before cleaning up resources.
      const waiting = () => {
        if (this.running() === 0) {
          // Cleanup resources
          this.pool.drainPool();
          singletonLogger.info('Finish to stop Fork.Queue in %s milliseconds', performance.now() - start);
          singletonLogger.debug('ForkQueue status [waiting: %s, running: %s]', this.length(), this.running());

          resolve();
        } else if (++numOfTry < maxTry) {
          setTimeout(waiting, period);
        } else {
          singletonLogger.info('Timed-out in stopping Fork.Queue after %s milliseconds', performance.now() - start);
          singletonLogger.debug('ForkQueue status [waiting: %s, running: %s]', this.length(), this.running());

          reject(new CustomError(ERR_TIMED_OUT, `Timed out after ${stopTimeoutMs} milliseconds.`));
        }
      };

      waiting();
    });
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
  saturated(callback) {
    this.saturatedCallback = callback;
  }

  /**
   * Callback function thats will be called when the queue is able to process incoming task immediately.
   *
   * @param {*} callback
   */
  unsaturated(callback) {
    this.unsaturatedCallback = callback;
  }

  /**
   * Callback function thats will be called when all taskes have been processed.
   *
   * @param {*} callback
   */
  drain(callback) {
    this.drainCallback = callback;
  }
}
