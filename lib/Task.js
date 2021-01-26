"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Task = function Task(message, callback, priority) {
  _classCallCheck(this, Task);

  _defineProperty(this, "message", void 0);

  _defineProperty(this, "callback", void 0);

  _defineProperty(this, "priority", void 0);

  this.message = message;
  this.callback = callback;
  this.priority = priority;
};

exports["default"] = Task;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9UYXNrLnRzIl0sIm5hbWVzIjpbIlRhc2siLCJtZXNzYWdlIiwiY2FsbGJhY2siLCJwcmlvcml0eSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBcUJBLEksR0FLbkIsY0FBWUMsT0FBWixFQUEwQkMsUUFBMUIsRUFBeUNDLFFBQXpDLEVBQXdEO0FBQUE7O0FBQUE7O0FBQUE7O0FBQUE7O0FBQ3RELE9BQUtGLE9BQUwsR0FBZUEsT0FBZjtBQUNBLE9BQUtDLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsT0FBS0MsUUFBTCxHQUFnQkEsUUFBaEI7QUFDRCxDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFzayB7XHJcbiAgbWVzc2FnZTogYW55OyBcclxuICBjYWxsYmFjazogYW55O1xyXG4gIHByaW9yaXR5OiBhbnk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IGFueSwgY2FsbGJhY2s6IGFueSwgcHJpb3JpdHk6IGFueSkge1xyXG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcclxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgIHRoaXMucHJpb3JpdHkgPSBwcmlvcml0eTtcclxuICB9XHJcblxyXG4gIFxyXG59Il19