"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.HIGHEST_PRIORITY = exports.LOWEST_PRIORITY = void 0;

var _CommonUtil = _interopRequireDefault(require("./utils/CommonUtil"));

var _ForkPool = _interopRequireDefault(require("./ForkPool"));

var _Task = _interopRequireDefault(require("./Task"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var LOWEST_PRIORITY = -1; // Lowest task priority

exports.LOWEST_PRIORITY = LOWEST_PRIORITY;
var HIGHEST_PRIORITY = 0; // Highest task priority

/**
 * Fork Queue
 * Schedules tasks from queue and runs them in a child process (using child_process.fork()).
 */

exports.HIGHEST_PRIORITY = HIGHEST_PRIORITY;

var ForkQueue = /*#__PURE__*/function () {
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
  function ForkQueue(options) {
    _classCallCheck(this, ForkQueue);

    _defineProperty(this, "queue", void 0);

    _defineProperty(this, "taskRunningCount", void 0);

    _defineProperty(this, "pauseQueue", void 0);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "pool", void 0);

    _defineProperty(this, "saturatedCallback", void 0);

    _defineProperty(this, "drainCallback", void 0);

    _defineProperty(this, "unsaturatedCallback", void 0);

    // Initialize variables
    this.queue = [];
    this.taskRunningCount = 0;
    this.pauseQueue = false; // Create Pool

    this.options = options || {};
    this.pool = new _ForkPool["default"]();
    this.pool.initPool(this.options);
  }
  /**
   * Drain pool during shutdown.
   *
   * Only call this once in your application -- at the point you want
   * to shutdown and stop using this pool.
   */


  _createClass(ForkQueue, [{
    key: "drainPool",
    value: function () {
      var _drainPool = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.pool.drainPool();

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function drainPool() {
        return _drainPool.apply(this, arguments);
      }

      return drainPool;
    }()
    /**
     * Push task to queue
     *
     * @param {*} message
     * @param {*} callback
     * @param {*} priority Optional. Default is LOWEST_PRIORITY if not set
     */

  }, {
    key: "push",
    value: function push(message, callback, priority) {
      console.debug('ForkQueue receives message: %s', JSON.stringify(message));
      var task = new _Task["default"](message, callback, _CommonUtil["default"].isFieldMissing(priority) ? LOWEST_PRIORITY : priority);

      if (this.isBusy()) {
        if (task.priority === LOWEST_PRIORITY) {
          this.queue.push(task);
        } else {
          // Insert task into queue based on priority
          var idx = 0;

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

  }, {
    key: "isLowerPriority",
    value: function isLowerPriority(currentTask, incommingTask) {
      return currentTask.priority !== LOWEST_PRIORITY && incommingTask.priority >= currentTask.priority;
    }
    /**
     * Process task using child_process.fork()
     *
     * @private
     * @param {*} param0
     */

  }, {
    key: "processTask",
    value: function () {
      var _processTask = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(task) {
        var self, forked, message, callback, isFinished, finishCallback, exitCallback;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.taskRunningCount++;
                self = this;
                message = task.message;
                callback = task.callback;
                _context2.prev = 4;
                _context2.next = 7;
                return this.pool.acquire();

              case 7:
                forked = _context2.sent;
                _context2.next = 16;
                break;

              case 10:
                _context2.prev = 10;
                _context2.t0 = _context2["catch"](4);
                console.error('Error in acquire child-process from Pool. %s', _context2.t0);
                callback && callback({
                  error: _context2.t0
                });
                self.finishTask();
                return _context2.abrupt("return");

              case 16:
                // Send message to child process
                forked.send({
                  value: message
                });
                isFinished = false; // This call back will be call once the task done.
                // response is { value, error }

                finishCallback = function finishCallback(response) {
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
                }; // This call back will be call if child-process is unexpectedly exited while running.


                exitCallback = function exitCallback(code, signal) {
                  // Check if child-process is exited unexpectedly while running
                  if (!isFinished) {
                    console.error('Child-process is exited unexpectedly while running. [code: %s, signal: %s]', code, signal);
                    self.pool.destroy(forked);
                    callback && callback({
                      error: new Error('Child-process is unexpectedly exited')
                    });
                    self.finishTask();
                  }
                };

                forked.once('message', finishCallback);
                forked.once('exit', exitCallback);

              case 22:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[4, 10]]);
      }));

      function processTask(_x) {
        return _processTask.apply(this, arguments);
      }

      return processTask;
    }()
    /**
     * @private
     */

  }, {
    key: "finishTask",
    value: function finishTask() {
      this.taskRunningCount--;
      this.processNextTask();
    }
    /**
     * @private
     */

  }, {
    key: "processNextTask",
    value: function processNextTask() {
      if (this.length() > 0) {
        // Process next task
        var queueItem = this.queue.shift();

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

  }, {
    key: "length",
    value: function length() {
      return this.queue.length;
    }
    /**
     * Number of tasks that are running
     */

  }, {
    key: "running",
    value: function running() {
      return this.taskRunningCount;
    }
    /**
     *
     */

  }, {
    key: "totalTasks",
    value: function totalTasks() {
      return this.length() + this.running();
    }
    /**
     * true if number of total-tasks is larger than the max-pool-size
     */

  }, {
    key: "isBusy",
    value: function isBusy() {
      return this.totalTasks() >= this.options.maxPoolSize;
    }
    /**
     *
     */

  }, {
    key: "isAvailable",
    value: function isAvailable() {
      return !this.isBusy();
    }
    /**
     *
     */

  }, {
    key: "isAllTaskDone",
    value: function isAllTaskDone() {
      return this.totalTasks() === 0;
    }
    /**
     *
     */

  }, {
    key: "pause",
    value: function pause() {
      this.pauseQueue = true;
    }
    /**
     *
     */

  }, {
    key: "resume",
    value: function resume() {
      this.pauseQueue = false;

      if (this.pool.isPoolDrained()) {
        throw new Error('Fork.Pool is not initialized.');
      }

      this.processNextTask();
    }
    /**
     * true if this queue is paused. false otherwise
     */

  }, {
    key: "isPaused",
    value: function isPaused() {
      return this.pauseQueue;
    }
    /**
     * true if this queue is resuming. false otherwise
     */

  }, {
    key: "isResume",
    value: function isResume() {
      return !this.isPaused();
    }
    /**
     * Callback function thats will be called when the queue is busy. Incoming task will be put in queue.
     *
     * @param {*} callback
     */

  }, {
    key: "saturated",
    value: function saturated(callback) {
      this.saturatedCallback = callback;
    }
    /**
     * Callback function thats will be called when the queue is able to process incoming task immediately.
     *
     * @param {*} callback
     */

  }, {
    key: "unsaturated",
    value: function unsaturated(callback) {
      this.unsaturatedCallback = callback;
    }
    /**
     * Callback function thats will be called when all taskes have been processed.
     *
     * @param {*} callback
     */

  }, {
    key: "drain",
    value: function drain(callback) {
      this.drainCallback = callback;
    }
  }]);

  return ForkQueue;
}();

exports["default"] = ForkQueue;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Gb3JrUXVldWUudHMiXSwibmFtZXMiOlsiTE9XRVNUX1BSSU9SSVRZIiwiSElHSEVTVF9QUklPUklUWSIsIkZvcmtRdWV1ZSIsIm9wdGlvbnMiLCJxdWV1ZSIsInRhc2tSdW5uaW5nQ291bnQiLCJwYXVzZVF1ZXVlIiwicG9vbCIsIkZvcmtQb29sIiwiaW5pdFBvb2wiLCJkcmFpblBvb2wiLCJtZXNzYWdlIiwiY2FsbGJhY2siLCJwcmlvcml0eSIsImNvbnNvbGUiLCJkZWJ1ZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0YXNrIiwiVGFzayIsImNvbW1vblV0aWwiLCJpc0ZpZWxkTWlzc2luZyIsImlzQnVzeSIsInB1c2giLCJpZHgiLCJsZW5ndGgiLCJpc0xvd2VyUHJpb3JpdHkiLCJzcGxpY2UiLCJwcm9jZXNzVGFzayIsInJ1bm5pbmciLCJzYXR1cmF0ZWRDYWxsYmFjayIsImN1cnJlbnRUYXNrIiwiaW5jb21taW5nVGFzayIsInNlbGYiLCJhY3F1aXJlIiwiZm9ya2VkIiwiZXJyb3IiLCJmaW5pc2hUYXNrIiwic2VuZCIsInZhbHVlIiwiaXNGaW5pc2hlZCIsImZpbmlzaENhbGxiYWNrIiwicmVzcG9uc2UiLCJyZW1vdmVMaXN0ZW5lciIsImV4aXRDYWxsYmFjayIsImlzRmF0YWxFcnJvciIsImluZm8iLCJkZXN0cm95IiwicmVsZWFzZSIsImNvZGUiLCJzaWduYWwiLCJFcnJvciIsIm9uY2UiLCJwcm9jZXNzTmV4dFRhc2siLCJxdWV1ZUl0ZW0iLCJzaGlmdCIsInVuZGVmaW5lZCIsImlzUmVzdW1lIiwidW5zaGlmdCIsImlzQWxsVGFza0RvbmUiLCJkcmFpbkNhbGxiYWNrIiwiaXNBdmFpbGFibGUiLCJ1bnNhdHVyYXRlZENhbGxiYWNrIiwidG90YWxUYXNrcyIsIm1heFBvb2xTaXplIiwiaXNQb29sRHJhaW5lZCIsImlzUGF1c2VkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFTyxJ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LEVBQWU7QUFDdkIsV0FBS2tCLGlCQUFMLEdBQXlCbEIsUUFBekI7QUFDRDtBQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7Ozs7Z0NBQ2NBLFEsRUFBZTtBQUN6QixXQUFLa0QsbUJBQUwsR0FBMkJsRCxRQUEzQjtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7OzswQkFDUUEsUSxFQUFlO0FBQ25CLFdBQUtnRCxhQUFMLEdBQXFCaEQsUUFBckI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgY29tbW9uVXRpbCBmcm9tICcuL3V0aWxzL0NvbW1vblV0aWwnO1xyXG5pbXBvcnQgRm9ya1Bvb2wgZnJvbSAnLi9Gb3JrUG9vbCc7XHJcbmltcG9ydCBUYXNrIGZyb20gJy4vVGFzayc7XHJcblxyXG5leHBvcnQgY29uc3QgTE9XRVNUX1BSSU9SSVRZID0gLTE7IC8vIExvd2VzdCB0YXNrIHByaW9yaXR5XHJcbmV4cG9ydCBjb25zdCBISUdIRVNUX1BSSU9SSVRZID0gMDsgLy8gSGlnaGVzdCB0YXNrIHByaW9yaXR5XHJcblxyXG4vKipcclxuICogRm9yayBRdWV1ZVxyXG4gKiBTY2hlZHVsZXMgdGFza3MgZnJvbSBxdWV1ZSBhbmQgcnVucyB0aGVtIGluIGEgY2hpbGQgcHJvY2VzcyAodXNpbmcgY2hpbGRfcHJvY2Vzcy5mb3JrKCkpLlxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRm9ya1F1ZXVlIHtcclxuICBxdWV1ZTogVGFza1tdO1xyXG4gIHRhc2tSdW5uaW5nQ291bnQ6IG51bWJlcjtcclxuICBwYXVzZVF1ZXVlOiBib29sZWFuO1xyXG4gIG9wdGlvbnM6IGFueTtcclxuICBwb29sOiBGb3JrUG9vbDtcclxuICBzYXR1cmF0ZWRDYWxsYmFjazogYW55O1xyXG4gIGRyYWluQ2FsbGJhY2s6IGFueTtcclxuICB1bnNhdHVyYXRlZENhbGxiYWNrOiBhbnk7XHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0b3JcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Kn0gb3B0aW9ucyBFeGFtcGxlOiB7XHJcbiAgICogICAgIHByb2Nlc3NGaWxlUGF0aDogdGhlIGNoaWxkIHByb2Nlc3MgZmlsZSBwYXRoLFxyXG4gICAqICAgICBtYXhQb29sU2l6ZTogbWF4IG51bWJlciBvZiBjaGlsZC1wcm9jZXNzZXMgKGNyZWF0ZWQgYnkgY2hpbGRfcHJvY2Vzcy5mb3JrKCkpIGluIHRoZSBwb29sLFxyXG4gICAqICAgICBtaW5Qb29sU2l6ZTogbWluIG51bWJlciBvZiBjaGlsZC1wcm9jZXNzZXMgKGNyZWF0ZWQgYnkgY2hpbGRfcHJvY2Vzcy5mb3JrKCkpIGluIHRoZSBwb29sLFxyXG4gICAqICAgICBpZGxlVGltZW91dE1pbGxpczogdGhlIGlkbGUtdGltZW91dCBpbiBtaWxsaXNlY29uZHNcclxuICAgKiAgICAgZXZpY3Rpb25SdW5JbnRlcnZhbE1pbGxpczogaG93IG9mdGVuIGlkbGUgcmVzb3VyY2VzIGFyZSBjaGVja2VkIChtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwLiBPdGhlcndpc2UgaWRsZVRpbWVvdXRNaWxsaXMgd2lsbCBOT1Qgd29yaylcclxuICAgKiB9XHJcbiAgICovXHJcbiAgY29uc3RydWN0b3Iob3B0aW9uczogYW55KSB7XHJcbiAgICAvLyBJbml0aWFsaXplIHZhcmlhYmxlc1xyXG4gICAgdGhpcy5xdWV1ZSA9IFtdO1xyXG4gICAgdGhpcy50YXNrUnVubmluZ0NvdW50ID0gMDtcclxuICAgIHRoaXMucGF1c2VRdWV1ZSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBQb29sXHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIHRoaXMucG9vbCA9IG5ldyBGb3JrUG9vbCgpO1xyXG4gICAgdGhpcy5wb29sLmluaXRQb29sKHRoaXMub3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcmFpbiBwb29sIGR1cmluZyBzaHV0ZG93bi5cclxuICAgKlxyXG4gICAqIE9ubHkgY2FsbCB0aGlzIG9uY2UgaW4geW91ciBhcHBsaWNhdGlvbiAtLSBhdCB0aGUgcG9pbnQgeW91IHdhbnRcclxuICAgKiB0byBzaHV0ZG93biBhbmQgc3RvcCB1c2luZyB0aGlzIHBvb2wuXHJcbiAgICovXHJcbiAgYXN5bmMgZHJhaW5Qb29sKCkge1xyXG4gICAgdGhpcy5wb29sLmRyYWluUG9vbCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHVzaCB0YXNrIHRvIHF1ZXVlXHJcbiAgICpcclxuICAgKiBAcGFyYW0geyp9IG1lc3NhZ2VcclxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXHJcbiAgICogQHBhcmFtIHsqfSBwcmlvcml0eSBPcHRpb25hbC4gRGVmYXVsdCBpcyBMT1dFU1RfUFJJT1JJVFkgaWYgbm90IHNldFxyXG4gICAqL1xyXG4gIHB1c2gobWVzc2FnZTogYW55LCBjYWxsYmFjazogYW55LCBwcmlvcml0eT86IG51bWJlcikge1xyXG4gICAgY29uc29sZS5kZWJ1ZygnRm9ya1F1ZXVlIHJlY2VpdmVzIG1lc3NhZ2U6ICVzJywgSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xyXG5cclxuICAgIGNvbnN0IHRhc2s6IFRhc2sgPSBuZXcgVGFzayhtZXNzYWdlLCBjYWxsYmFjaywgY29tbW9uVXRpbC5pc0ZpZWxkTWlzc2luZyhwcmlvcml0eSkgPyBMT1dFU1RfUFJJT1JJVFkgOiBwcmlvcml0eSk7XHJcblxyXG4gICAgaWYgKHRoaXMuaXNCdXN5KCkpIHtcclxuICAgICAgaWYgKHRhc2sucHJpb3JpdHkgPT09IExPV0VTVF9QUklPUklUWSkge1xyXG4gICAgICAgIHRoaXMucXVldWUucHVzaCh0YXNrKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBJbnNlcnQgdGFzayBpbnRvIHF1ZXVlIGJhc2VkIG9uIHByaW9yaXR5XHJcbiAgICAgICAgbGV0IGlkeCA9IDA7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHggPCB0aGlzLnF1ZXVlLmxlbmd0aCAmJiB0aGlzLmlzTG93ZXJQcmlvcml0eSh0aGlzLnF1ZXVlW2lkeF0sIHRhc2spKSB7XHJcbiAgICAgICAgICBpZHgrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpZHggPj0gdGhpcy5xdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIHRoaXMucXVldWUucHVzaCh0YXNrKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gSW5zZXJ0IHRhc2sgaW50byBxdWV1ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4XHJcbiAgICAgICAgICB0aGlzLnF1ZXVlLnNwbGljZShpZHgsIDAsIHRhc2spO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5wcm9jZXNzVGFzayh0YXNrKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmRlYnVnKCdGb3JrUXVldWUgc3RhdHVzIFt3YWl0aW5nOiAlcywgcnVubmluZzogJXNdJywgdGhpcy5sZW5ndGgoKSwgdGhpcy5ydW5uaW5nKCkpO1xyXG5cclxuICAgIGlmICh0aGlzLmlzQnVzeSgpKSB7XHJcbiAgICAgIHRoaXMuc2F0dXJhdGVkQ2FsbGJhY2sgJiYgdGhpcy5zYXR1cmF0ZWRDYWxsYmFjaygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2sgaWYgdGhlIGluY29tbWluZ1Rhc2sgaXMgbG93ZXIgcHJpb3JpdHkgdGhhbiB0aGUgY3VycmVudFRhc2tcclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHsqfSBjdXJyZW50VGFza1xyXG4gICAqIEBwYXJhbSB7Kn0gaW5jb21taW5nVGFza1xyXG4gICAqL1xyXG4gIGlzTG93ZXJQcmlvcml0eShjdXJyZW50VGFzazogYW55LCBpbmNvbW1pbmdUYXNrOiBhbnkpIHtcclxuICAgIHJldHVybiBjdXJyZW50VGFzay5wcmlvcml0eSAhPT0gTE9XRVNUX1BSSU9SSVRZICYmIGluY29tbWluZ1Rhc2sucHJpb3JpdHkgPj0gY3VycmVudFRhc2sucHJpb3JpdHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQcm9jZXNzIHRhc2sgdXNpbmcgY2hpbGRfcHJvY2Vzcy5mb3JrKClcclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHsqfSBwYXJhbTBcclxuICAgKi9cclxuICBhc3luYyBwcm9jZXNzVGFzayh0YXNrOiBUYXNrKSB7XHJcbiAgICB0aGlzLnRhc2tSdW5uaW5nQ291bnQrKztcclxuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgbGV0IGZvcmtlZDogQ2hpbGRQcm9jZXNzO1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IHRhc2subWVzc2FnZTtcclxuICAgIGNvbnN0IGNhbGxiYWNrID0gdGFzay5jYWxsYmFjaztcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBmb3JrZWQgPSBhd2FpdCB0aGlzLnBvb2wuYWNxdWlyZSgpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGFjcXVpcmUgY2hpbGQtcHJvY2VzcyBmcm9tIFBvb2wuICVzJywgZXJyKTtcclxuXHJcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHsgZXJyb3I6IGVyciB9KTtcclxuICAgICAgc2VsZi5maW5pc2hUYXNrKCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gY2hpbGQgcHJvY2Vzc1xyXG4gICAgZm9ya2VkLnNlbmQoeyB2YWx1ZTogbWVzc2FnZSB9KTtcclxuXHJcbiAgICBsZXQgaXNGaW5pc2hlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFRoaXMgY2FsbCBiYWNrIHdpbGwgYmUgY2FsbCBvbmNlIHRoZSB0YXNrIGRvbmUuXHJcbiAgICAvLyByZXNwb25zZSBpcyB7IHZhbHVlLCBlcnJvciB9XHJcbiAgICBjb25zdCBmaW5pc2hDYWxsYmFjayA9IChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgIC8vIFJlY2VpcHQgcmVzcG9uc2UgZnJvbSBjaGlsZCBwcm9jZXNzXHJcbiAgICAgIGlzRmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICBmb3JrZWQucmVtb3ZlTGlzdGVuZXIoJ2V4aXQnLCBleGl0Q2FsbGJhY2spO1xyXG5cclxuICAgICAgaWYgKHJlc3BvbnNlLmlzRmF0YWxFcnJvcikge1xyXG4gICAgICAgIC8vIEtpbGwgY2hpbGQtcHJvY2VzcyBiZWNhdXNlIGl0IGNhbiBiZSBoYW5nZWQgdXBcclxuICAgICAgICBjb25zb2xlLmluZm8oJ0ZhdGFsIGVycm9yLiBLaWxsIGNoaWxkLXByb2Nlc3MgYmVjYXVzZSBpdCBjYW4gYmUgaGFuZ2VkIHVwJyk7XHJcbiAgICAgICAgc2VsZi5wb29sLmRlc3Ryb3koZm9ya2VkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBSZXR1cm4gY2hpbGQtcHJvY2VzcyBiYWNrIHRvIHBvb2xcclxuICAgICAgICBzZWxmLnBvb2wucmVsZWFzZShmb3JrZWQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIHNlbGYuZmluaXNoVGFzaygpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBUaGlzIGNhbGwgYmFjayB3aWxsIGJlIGNhbGwgaWYgY2hpbGQtcHJvY2VzcyBpcyB1bmV4cGVjdGVkbHkgZXhpdGVkIHdoaWxlIHJ1bm5pbmcuXHJcbiAgICBjb25zdCBleGl0Q2FsbGJhY2sgPSAoY29kZTogYW55LCBzaWduYWw6IGFueSkgPT4ge1xyXG4gICAgICAvLyBDaGVjayBpZiBjaGlsZC1wcm9jZXNzIGlzIGV4aXRlZCB1bmV4cGVjdGVkbHkgd2hpbGUgcnVubmluZ1xyXG4gICAgICBpZiAoIWlzRmluaXNoZWQpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdDaGlsZC1wcm9jZXNzIGlzIGV4aXRlZCB1bmV4cGVjdGVkbHkgd2hpbGUgcnVubmluZy4gW2NvZGU6ICVzLCBzaWduYWw6ICVzXScsIGNvZGUsIHNpZ25hbCk7XHJcbiAgICAgICAgc2VsZi5wb29sLmRlc3Ryb3koZm9ya2VkKTtcclxuXHJcbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soeyBlcnJvcjogbmV3IEVycm9yKCdDaGlsZC1wcm9jZXNzIGlzIHVuZXhwZWN0ZWRseSBleGl0ZWQnKSB9KTtcclxuICAgICAgICBzZWxmLmZpbmlzaFRhc2soKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmb3JrZWQub25jZSgnbWVzc2FnZScsIGZpbmlzaENhbGxiYWNrKTtcclxuICAgIGZvcmtlZC5vbmNlKCdleGl0JywgZXhpdENhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZmluaXNoVGFzaygpIHtcclxuICAgIHRoaXMudGFza1J1bm5pbmdDb3VudC0tO1xyXG4gICAgdGhpcy5wcm9jZXNzTmV4dFRhc2soKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgcHJvY2Vzc05leHRUYXNrKCkge1xyXG4gICAgaWYgKHRoaXMubGVuZ3RoKCkgPiAwKSB7XHJcbiAgICAgIC8vIFByb2Nlc3MgbmV4dCB0YXNrXHJcbiAgICAgIGNvbnN0IHF1ZXVlSXRlbTogVGFzayB8IHVuZGVmaW5lZCA9IHRoaXMucXVldWUuc2hpZnQoKTtcclxuXHJcbiAgICAgIGlmIChxdWV1ZUl0ZW0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuaXNSZXN1bWUoKSB8fCBxdWV1ZUl0ZW0ucHJpb3JpdHkgPT09IEhJR0hFU1RfUFJJT1JJVFkpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NUYXNrKHF1ZXVlSXRlbSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gUXVldWUgaXMgcGF1c2VkIGFuZCB0aGlzIHF1ZXVlLXRhc2sgaXMgbm90IGEgaGlnaGVzdC1wcmlvcml0eS10YXNrLlxyXG4gICAgICAgIC8vIFNvIHB1dCBpdCBiYWNrIHRvIHF1ZXVlXHJcbiAgICAgICAgdGhpcy5xdWV1ZS51bnNoaWZ0KHF1ZXVlSXRlbSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5pc1Jlc3VtZSgpKSB7XHJcbiAgICAgIGlmICh0aGlzLmlzQWxsVGFza0RvbmUoKSkge1xyXG4gICAgICAgIHRoaXMuZHJhaW5DYWxsYmFjayAmJiB0aGlzLmRyYWluQ2FsbGJhY2soKTtcclxuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzQXZhaWxhYmxlKCkpIHtcclxuICAgICAgICB0aGlzLnVuc2F0dXJhdGVkQ2FsbGJhY2sgJiYgdGhpcy51bnNhdHVyYXRlZENhbGxiYWNrKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiB0YXNrcyB0aGF0IGFyZSB3YWl0aW5nIGluIHF1ZXVlXHJcbiAgICovXHJcbiAgbGVuZ3RoKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucXVldWUubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHRhc2tzIHRoYXQgYXJlIHJ1bm5pbmdcclxuICAgKi9cclxuICBydW5uaW5nKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudGFza1J1bm5pbmdDb3VudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICovXHJcbiAgdG90YWxUYXNrcygpIHtcclxuICAgIHJldHVybiB0aGlzLmxlbmd0aCgpICsgdGhpcy5ydW5uaW5nKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiB0cnVlIGlmIG51bWJlciBvZiB0b3RhbC10YXNrcyBpcyBsYXJnZXIgdGhhbiB0aGUgbWF4LXBvb2wtc2l6ZVxyXG4gICAqL1xyXG4gIGlzQnVzeSgpIHtcclxuICAgIHJldHVybiB0aGlzLnRvdGFsVGFza3MoKSA+PSB0aGlzLm9wdGlvbnMubWF4UG9vbFNpemU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIGlzQXZhaWxhYmxlKCkge1xyXG4gICAgcmV0dXJuICF0aGlzLmlzQnVzeSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKi9cclxuICBpc0FsbFRhc2tEb25lKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudG90YWxUYXNrcygpID09PSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKi9cclxuICBwYXVzZSgpIHtcclxuICAgIHRoaXMucGF1c2VRdWV1ZSA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIHJlc3VtZSgpIHtcclxuICAgIHRoaXMucGF1c2VRdWV1ZSA9IGZhbHNlO1xyXG5cclxuICAgIGlmICh0aGlzLnBvb2wuaXNQb29sRHJhaW5lZCgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRm9yay5Qb29sIGlzIG5vdCBpbml0aWFsaXplZC4nKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnByb2Nlc3NOZXh0VGFzaygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogdHJ1ZSBpZiB0aGlzIHF1ZXVlIGlzIHBhdXNlZC4gZmFsc2Ugb3RoZXJ3aXNlXHJcbiAgICovXHJcbiAgaXNQYXVzZWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXVzZVF1ZXVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogdHJ1ZSBpZiB0aGlzIHF1ZXVlIGlzIHJlc3VtaW5nLiBmYWxzZSBvdGhlcndpc2VcclxuICAgKi9cclxuICBpc1Jlc3VtZSgpIHtcclxuICAgIHJldHVybiAhdGhpcy5pc1BhdXNlZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdHMgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgcXVldWUgaXMgYnVzeS4gSW5jb21pbmcgdGFzayB3aWxsIGJlIHB1dCBpbiBxdWV1ZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Kn0gY2FsbGJhY2tcclxuICAgKi9cclxuICBzYXR1cmF0ZWQoY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5zYXR1cmF0ZWRDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdHMgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgcXVldWUgaXMgYWJsZSB0byBwcm9jZXNzIGluY29taW5nIHRhc2sgaW1tZWRpYXRlbHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXHJcbiAgICovXHJcbiAgdW5zYXR1cmF0ZWQoY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy51bnNhdHVyYXRlZENhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsYmFjayBmdW5jdGlvbiB0aGF0cyB3aWxsIGJlIGNhbGxlZCB3aGVuIGFsbCB0YXNrZXMgaGF2ZSBiZWVuIHByb2Nlc3NlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Kn0gY2FsbGJhY2tcclxuICAgKi9cclxuICBkcmFpbihjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmRyYWluQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICB9XHJcbn1cclxuIl19