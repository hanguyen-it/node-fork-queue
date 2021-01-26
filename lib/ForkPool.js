"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _child_process = require("child_process");

var _genericPool = _interopRequireDefault(require("generic-pool"));

var _os = _interopRequireDefault(require("os"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Fork Pool
 *
 * Pool of child_process.fork().
 */
var ForkPool = /*#__PURE__*/function () {
  function ForkPool() {
    _classCallCheck(this, ForkPool);

    _defineProperty(this, "pool", void 0);
  }

  _createClass(ForkPool, [{
    key: "initPool",

    /**
     * Init Pool
     * @param {*} options
     */
    value: function initPool(options) {
      var factory = {
        create: function create() {
          return new Promise(function (resolve) {
            var forked = (0, _child_process.fork)(options.processFilePath);
            forked.on('exit', function (code, signal) {
              console.debug('Forked is exited with code: %s, signal: %s', code, signal);
            });
            return resolve(forked);
          });
        },
        destroy: function destroy(forked) {
          return new Promise(function (resolve) {
            forked.kill();
            resolve();
          });
        },
        validate: function validate(forked) {
          return new Promise(function (resolve) {
            if (forked.exitCode !== null || forked.signalCode !== null) {
              console.info('Child-process is terminated by the OS. Forking another child...');
              return false;
            }

            return true;
          });
        }
      };
      var opts = {
        max: options.maxPoolSize || _os["default"].cpus().length,
        min: options.minPoolSize || 2,
        idleTimeoutMillis: Number.MAX_SAFE_INTEGER,
        // work-arround since there is a bug with node-pool/lib/DefaultEvictor.js
        softIdleTimeoutMillis: options.idleTimeoutMillis || 30000,
        evictionRunIntervalMillis: options.evictionRunIntervalMillis || 5000,
        acquireTimeoutMillis: options.acquireTimeoutMillis || 6000,
        testOnBorrow: true
      };
      console.debug('Create fork-queue with options [min-pool-size: %s, max-pool-size: %s, idle-timeout-millis: %s]', opts.min, opts.max, opts.softIdleTimeoutMillis);
      this.pool = _genericPool["default"].createPool(factory, opts);
    }
    /**
     * Return child_process from Pool
     */

  }, {
    key: "acquire",
    value: function () {
      var _acquire = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.isPoolDrained()) {
                  _context.next = 2;
                  break;
                }

                throw new Error('Fork.Pool is not initialized.');

              case 2:
                _context.next = 4;
                return this.pool.acquire();

              case 4:
                return _context.abrupt("return", _context.sent);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function acquire() {
        return _acquire.apply(this, arguments);
      }

      return acquire;
    }()
    /**
     * Destroy child_process
     *
     * @param {*} forked
     */

  }, {
    key: "destroy",
    value: function destroy(forked) {
      this.pool.destroy(forked);
    }
    /**
     * Put child_process back to Pool
     *
     * @param {*} forked
     */

  }, {
    key: "release",
    value: function release(forked) {
      this.pool.release(forked);
    }
    /**
     * Drain pool during shutdown.
     *
     * Only call this once in your application -- at the point you want
     * to shutdown and stop using this pool.
     */

  }, {
    key: "drainPool",
    value: function () {
      var _drainPool = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.pool) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                _context2.next = 4;
                return this.pool.drain();

              case 4:
                _context2.next = 6;
                return this.pool.clear();

              case 6:
                delete this.pool;
                console.info('Fork.Pool is drained.');

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function drainPool() {
        return _drainPool.apply(this, arguments);
      }

      return drainPool;
    }()
    /**
     * true if Pool is drained. false otherwise
     */

  }, {
    key: "isPoolDrained",
    value: function isPoolDrained() {
      return !this.pool;
    }
  }]);

  return ForkPool;
}();

exports["default"] = ForkPool;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Gb3JrUG9vbC50cyJdLCJuYW1lcyI6WyJGb3JrUG9vbCIsIm9wdGlvbnMiLCJmYWN0b3J5IiwiY3JlYXRlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJmb3JrZWQiLCJwcm9jZXNzRmlsZVBhdGgiLCJvbiIsImNvZGUiLCJzaWduYWwiLCJjb25zb2xlIiwiZGVidWciLCJkZXN0cm95Iiwia2lsbCIsInZhbGlkYXRlIiwiZXhpdENvZGUiLCJzaWduYWxDb2RlIiwiaW5mbyIsIm9wdHMiLCJtYXgiLCJtYXhQb29sU2l6ZSIsIm9zIiwiY3B1cyIsImxlbmd0aCIsIm1pbiIsIm1pblBvb2xTaXplIiwiaWRsZVRpbWVvdXRNaWxsaXMiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwic29mdElkbGVUaW1lb3V0TWlsbGlzIiwiZXZpY3Rpb25SdW5JbnRlcnZhbE1pbGxpcyIsImFjcXVpcmVUaW1lb3V0TWlsbGlzIiwidGVzdE9uQm9ycm93IiwicG9vbCIsImdlbmVyaWNQb29sIiwiY3JlYXRlUG9vbCIsImlzUG9vbERyYWluZWQiLCJFcnJvciIsImFjcXVpcmUiLCJyZWxlYXNlIiwiZHJhaW4iLCJjbGVhciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNxQkEsUTs7Ozs7Ozs7OztBQUVuQjtBQUNGO0FBQ0E7QUFDQTs2QkFDV0MsTyxFQUFjO0FBQ3JCLFVBQU1DLE9BQThCLEdBQUc7QUFDckNDLFFBQUFBLE1BQU0sRUFBRSxrQkFBNkI7QUFFbkMsaUJBQU8sSUFBSUMsT0FBSixDQUEwQixVQUFBQyxPQUFPLEVBQUk7QUFDMUMsZ0JBQU1DLE1BQU0sR0FBRyx5QkFBS0wsT0FBTyxDQUFDTSxlQUFiLENBQWY7QUFDQUQsWUFBQUEsTUFBTSxDQUFDRSxFQUFQLENBQVUsTUFBVixFQUFrQixVQUFVQyxJQUFWLEVBQWdCQyxNQUFoQixFQUF3QjtBQUN4Q0MsY0FBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWMsNENBQWQsRUFBNERILElBQTVELEVBQWtFQyxNQUFsRTtBQUNELGFBRkQ7QUFJQSxtQkFBT0wsT0FBTyxDQUFDQyxNQUFELENBQWQ7QUFDRCxXQVBNLENBQVA7QUFRRCxTQVhvQztBQVlyQ08sUUFBQUEsT0FBTyxFQUFFLGlCQUFDUCxNQUFELEVBQXlDO0FBQ2hELGlCQUFPLElBQUlGLE9BQUosQ0FBa0IsVUFBQUMsT0FBTyxFQUFJO0FBQ2xDQyxZQUFBQSxNQUFNLENBQUNRLElBQVA7QUFDQVQsWUFBQUEsT0FBTztBQUNSLFdBSE0sQ0FBUDtBQUlELFNBakJvQztBQWtCckNVLFFBQUFBLFFBQVEsRUFBRSxrQkFBQ1QsTUFBRCxFQUE0QztBQUNwRCxpQkFBTyxJQUFJRixPQUFKLENBQXFCLFVBQUFDLE9BQU8sRUFBSTtBQUNyQyxnQkFBSUMsTUFBTSxDQUFDVSxRQUFQLEtBQW9CLElBQXBCLElBQTRCVixNQUFNLENBQUNXLFVBQVAsS0FBc0IsSUFBdEQsRUFBNEQ7QUFDMUROLGNBQUFBLE9BQU8sQ0FBQ08sSUFBUixDQUFhLGlFQUFiO0FBQ0EscUJBQU8sS0FBUDtBQUNEOztBQUVELG1CQUFPLElBQVA7QUFDRCxXQVBNLENBQVA7QUFRRDtBQTNCb0MsT0FBdkM7QUE4QkEsVUFBTUMsSUFBSSxHQUFHO0FBQ1hDLFFBQUFBLEdBQUcsRUFBRW5CLE9BQU8sQ0FBQ29CLFdBQVIsSUFBdUJDLGVBQUdDLElBQUgsR0FBVUMsTUFEM0I7QUFFWEMsUUFBQUEsR0FBRyxFQUFFeEIsT0FBTyxDQUFDeUIsV0FBUixJQUF1QixDQUZqQjtBQUdYQyxRQUFBQSxpQkFBaUIsRUFBRUMsTUFBTSxDQUFDQyxnQkFIZjtBQUdpQztBQUM1Q0MsUUFBQUEscUJBQXFCLEVBQUU3QixPQUFPLENBQUMwQixpQkFBUixJQUE2QixLQUp6QztBQUtYSSxRQUFBQSx5QkFBeUIsRUFBRTlCLE9BQU8sQ0FBQzhCLHlCQUFSLElBQXFDLElBTHJEO0FBTVhDLFFBQUFBLG9CQUFvQixFQUFFL0IsT0FBTyxDQUFDK0Isb0JBQVIsSUFBZ0MsSUFOM0M7QUFPWEMsUUFBQUEsWUFBWSxFQUFFO0FBUEgsT0FBYjtBQVVBdEIsTUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQ0UsZ0dBREYsRUFFRU8sSUFBSSxDQUFDTSxHQUZQLEVBR0VOLElBQUksQ0FBQ0MsR0FIUCxFQUlFRCxJQUFJLENBQUNXLHFCQUpQO0FBT0EsV0FBS0ksSUFBTCxHQUFZQyx3QkFBWUMsVUFBWixDQUF1QmxDLE9BQXZCLEVBQWdDaUIsSUFBaEMsQ0FBWjtBQUNEO0FBRUQ7QUFDRjtBQUNBOzs7Ozs7Ozs7O3FCQUVRLEtBQUtrQixhQUFMLEU7Ozs7O3NCQUNJLElBQUlDLEtBQUosQ0FBVSwrQkFBVixDOzs7O3VCQUVLLEtBQUtKLElBQUwsQ0FBVUssT0FBVixFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR2Y7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7Ozs0QkFDVWpDLE0sRUFBc0I7QUFDNUIsV0FBSzRCLElBQUwsQ0FBVXJCLE9BQVYsQ0FBa0JQLE1BQWxCO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBOzs7OzRCQUNVQSxNLEVBQXNCO0FBQzVCLFdBQUs0QixJQUFMLENBQVVNLE9BQVYsQ0FBa0JsQyxNQUFsQjtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O29CQUVTLEtBQUs0QixJOzs7Ozs7Ozs7dUJBSUosS0FBS0EsSUFBTCxDQUFVTyxLQUFWLEU7Ozs7dUJBQ0EsS0FBS1AsSUFBTCxDQUFVUSxLQUFWLEU7OztBQUNOLHVCQUFPLEtBQUtSLElBQVo7QUFFQXZCLGdCQUFBQSxPQUFPLENBQUNPLElBQVIsQ0FBYSx1QkFBYjs7Ozs7Ozs7Ozs7Ozs7OztBQUdGO0FBQ0Y7QUFDQTs7OztvQ0FDa0I7QUFDZCxhQUFPLENBQUMsS0FBS2dCLElBQWI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvcmssIENoaWxkUHJvY2VzcyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgZ2VuZXJpY1Bvb2wsIHsgRmFjdG9yeSB9IGZyb20gJ2dlbmVyaWMtcG9vbCc7XHJcbmltcG9ydCBvcyBmcm9tICdvcyc7XHJcblxyXG4vKipcclxuICogRm9yayBQb29sXHJcbiAqXHJcbiAqIFBvb2wgb2YgY2hpbGRfcHJvY2Vzcy5mb3JrKCkuXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb3JrUG9vbCB7XHJcbiAgcG9vbDogYW55O1xyXG4gIC8qKlxyXG4gICAqIEluaXQgUG9vbFxyXG4gICAqIEBwYXJhbSB7Kn0gb3B0aW9uc1xyXG4gICAqL1xyXG4gIGluaXRQb29sKG9wdGlvbnM6IGFueSkge1xyXG4gICAgY29uc3QgZmFjdG9yeTogRmFjdG9yeTxDaGlsZFByb2Nlc3M+ID0ge1xyXG4gICAgICBjcmVhdGU6ICgpOiBQcm9taXNlPENoaWxkUHJvY2Vzcz4gPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Q2hpbGRQcm9jZXNzPihyZXNvbHZlID0+IHtcclxuICAgICAgICAgIGNvbnN0IGZvcmtlZCA9IGZvcmsob3B0aW9ucy5wcm9jZXNzRmlsZVBhdGgpO1xyXG4gICAgICAgICAgZm9ya2VkLm9uKCdleGl0JywgZnVuY3Rpb24gKGNvZGUsIHNpZ25hbCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdGb3JrZWQgaXMgZXhpdGVkIHdpdGggY29kZTogJXMsIHNpZ25hbDogJXMnLCBjb2RlLCBzaWduYWwpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoZm9ya2VkKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgZGVzdHJveTogKGZvcmtlZDogQ2hpbGRQcm9jZXNzKTogUHJvbWlzZTx2b2lkPiA9PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgZm9ya2VkLmtpbGwoKTtcclxuICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgdmFsaWRhdGU6IChmb3JrZWQ6IENoaWxkUHJvY2Vzcyk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihyZXNvbHZlID0+IHtcclxuICAgICAgICAgIGlmIChmb3JrZWQuZXhpdENvZGUgIT09IG51bGwgfHwgZm9ya2VkLnNpZ25hbENvZGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdDaGlsZC1wcm9jZXNzIGlzIHRlcm1pbmF0ZWQgYnkgdGhlIE9TLiBGb3JraW5nIGFub3RoZXIgY2hpbGQuLi4nKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBvcHRzID0ge1xyXG4gICAgICBtYXg6IG9wdGlvbnMubWF4UG9vbFNpemUgfHwgb3MuY3B1cygpLmxlbmd0aCxcclxuICAgICAgbWluOiBvcHRpb25zLm1pblBvb2xTaXplIHx8IDIsXHJcbiAgICAgIGlkbGVUaW1lb3V0TWlsbGlzOiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiwgLy8gd29yay1hcnJvdW5kIHNpbmNlIHRoZXJlIGlzIGEgYnVnIHdpdGggbm9kZS1wb29sL2xpYi9EZWZhdWx0RXZpY3Rvci5qc1xyXG4gICAgICBzb2Z0SWRsZVRpbWVvdXRNaWxsaXM6IG9wdGlvbnMuaWRsZVRpbWVvdXRNaWxsaXMgfHwgMzAwMDAsXHJcbiAgICAgIGV2aWN0aW9uUnVuSW50ZXJ2YWxNaWxsaXM6IG9wdGlvbnMuZXZpY3Rpb25SdW5JbnRlcnZhbE1pbGxpcyB8fCA1MDAwLFxyXG4gICAgICBhY3F1aXJlVGltZW91dE1pbGxpczogb3B0aW9ucy5hY3F1aXJlVGltZW91dE1pbGxpcyB8fCA2MDAwLFxyXG4gICAgICB0ZXN0T25Cb3Jyb3c6IHRydWUsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnNvbGUuZGVidWcoXHJcbiAgICAgICdDcmVhdGUgZm9yay1xdWV1ZSB3aXRoIG9wdGlvbnMgW21pbi1wb29sLXNpemU6ICVzLCBtYXgtcG9vbC1zaXplOiAlcywgaWRsZS10aW1lb3V0LW1pbGxpczogJXNdJyxcclxuICAgICAgb3B0cy5taW4sXHJcbiAgICAgIG9wdHMubWF4LFxyXG4gICAgICBvcHRzLnNvZnRJZGxlVGltZW91dE1pbGxpcyxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5wb29sID0gZ2VuZXJpY1Bvb2wuY3JlYXRlUG9vbChmYWN0b3J5LCBvcHRzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybiBjaGlsZF9wcm9jZXNzIGZyb20gUG9vbFxyXG4gICAqL1xyXG4gIGFzeW5jIGFjcXVpcmUoKSB7XHJcbiAgICBpZiAodGhpcy5pc1Bvb2xEcmFpbmVkKCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3JrLlBvb2wgaXMgbm90IGluaXRpYWxpemVkLicpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucG9vbC5hY3F1aXJlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95IGNoaWxkX3Byb2Nlc3NcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Kn0gZm9ya2VkXHJcbiAgICovXHJcbiAgZGVzdHJveShmb3JrZWQ6IENoaWxkUHJvY2Vzcykge1xyXG4gICAgdGhpcy5wb29sLmRlc3Ryb3koZm9ya2VkKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1dCBjaGlsZF9wcm9jZXNzIGJhY2sgdG8gUG9vbFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHsqfSBmb3JrZWRcclxuICAgKi9cclxuICByZWxlYXNlKGZvcmtlZDogQ2hpbGRQcm9jZXNzKSB7XHJcbiAgICB0aGlzLnBvb2wucmVsZWFzZShmb3JrZWQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhaW4gcG9vbCBkdXJpbmcgc2h1dGRvd24uXHJcbiAgICpcclxuICAgKiBPbmx5IGNhbGwgdGhpcyBvbmNlIGluIHlvdXIgYXBwbGljYXRpb24gLS0gYXQgdGhlIHBvaW50IHlvdSB3YW50XHJcbiAgICogdG8gc2h1dGRvd24gYW5kIHN0b3AgdXNpbmcgdGhpcyBwb29sLlxyXG4gICAqL1xyXG4gIGFzeW5jIGRyYWluUG9vbCgpIHtcclxuICAgIGlmICghdGhpcy5wb29sKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhd2FpdCB0aGlzLnBvb2wuZHJhaW4oKTtcclxuICAgIGF3YWl0IHRoaXMucG9vbC5jbGVhcigpO1xyXG4gICAgZGVsZXRlIHRoaXMucG9vbDtcclxuXHJcbiAgICBjb25zb2xlLmluZm8oJ0ZvcmsuUG9vbCBpcyBkcmFpbmVkLicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogdHJ1ZSBpZiBQb29sIGlzIGRyYWluZWQuIGZhbHNlIG90aGVyd2lzZVxyXG4gICAqL1xyXG4gIGlzUG9vbERyYWluZWQoKSB7XHJcbiAgICByZXR1cm4gIXRoaXMucG9vbDtcclxuICB9XHJcbn1cclxuIl19