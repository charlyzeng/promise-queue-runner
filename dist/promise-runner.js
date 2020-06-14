'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var Queue = /*#__PURE__*/function () {
  function Queue(promiseGenerators) {
    _classCallCheck(this, Queue);

    _defineProperty(this, "promiseGenerators", []);

    _defineProperty(this, "counter", -1);

    this.promiseGenerators = promiseGenerators;
  }

  _createClass(Queue, [{
    key: "count",
    value: function count() {
      return this.promiseGenerators.length;
    }
  }, {
    key: "pop",
    value: function pop() {
      var pg = this.promiseGenerators.shift();

      if (pg) {
        this.counter += 1;
        return {
          index: this.counter,
          promise: pg()
        };
      }

      return null;
    }
  }, {
    key: "push",
    value: function push(pg) {
      this.promiseGenerators.push(pg);
    }
  }]);

  return Queue;
}();

var Runner = /*#__PURE__*/function () {
  // count of finished promises
  // resolve callback of `stop` method
  function Runner(config) {
    _classCallCheck(this, Runner);

    _defineProperty(this, "stoped", false);

    _defineProperty(this, "finish", 0);

    _defineProperty(this, "stopResolve", null);

    _defineProperty(this, "config", null);

    _defineProperty(this, "queue", null);

    _defineProperty(this, "results", {});

    _defineProperty(this, "runningTasks", []);

    _defineProperty(this, "progressCallbacks", []);

    _defineProperty(this, "finishedCallbacks", []);

    this.config = config;
    this.queue = new Queue(config.promiseGenerators.slice());
  }

  _createClass(Runner, [{
    key: "isStoped",
    value: function isStoped() {
      return this.stoped;
    }
  }, {
    key: "start",
    value: function start() {
      this.stoped = false;
      var maxConcurrency = this.config.maxConcurrency;
      var runningCount = this.runningTasks.length;

      for (var i = 0; i < maxConcurrency - runningCount; i += 1) {
        this.execOnce();
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      var _this = this;

      if (this.stoped) {
        return Promise.resolve(true);
      }

      if (this.runningTasks.length === 0) {
        this.stoped = true;
        return Promise.resolve(true);
      }

      this.stoped = true;
      return new Promise(function (resolve) {
        _this.stopResolve = resolve;
      });
    }
  }, {
    key: "addListener",
    value: function addListener(eventName, callback) {
      var _this2 = this;

      switch (eventName) {
        case Runner.PROGRESS:
          {
            this.progressCallbacks.push(callback);
            return function () {
              var index = _this2.progressCallbacks.indexOf(callback);

              if (index > -1) {
                _this2.progressCallbacks.splice(index, 1);

                return true;
              }

              return false;
            };
          }

        case Runner.FINISHED:
          {
            this.finishedCallbacks.push(callback);
            return function () {
              var index = _this2.finishedCallbacks.indexOf(callback);

              if (index > -1) {
                _this2.finishedCallbacks.splice(index, 1);

                return true;
              }

              return false;
            };
          }

        default:
          {
            console.warn("can not listen the event: ".concat(eventName));
            return function () {
              return false;
            };
          }
      }
    }
  }, {
    key: "execOnce",
    value: function execOnce() {
      var _this3 = this;

      if (this.stoped) {
        if (this.runningTasks.length === 0 && this.stopResolve) {
          this.stopResolve(true);
          this.stopResolve = null;
        }

        return;
      }

      var popItem = this.queue.pop();

      if (!popItem) {
        return;
      }

      var index = popItem.index,
          promise = popItem.promise;
      this.runningTasks.push(popItem);

      var done = function done(result) {
        _this3.results[index] = result;
        _this3.finish += 1;

        var taskIndex = _this3.runningTasks.indexOf(popItem);

        if (taskIndex > -1) {
          _this3.runningTasks.splice(taskIndex, 1);
        }

        for (var i = 0; i < _this3.progressCallbacks.length; i += 1) {
          try {
            _this3.progressCallbacks[i]({
              finish: _this3.finish,
              results: _objectSpread2({}, _this3.results),
              latestResult: result
            });
          } catch (error) {
            console.error(error);
          }
        }

        if (_this3.queue.count() > 0) {
          for (var _i = 0; _i < _this3.config.maxConcurrency - _this3.runningTasks.length; _i += 1) {
            _this3.execOnce();
          }
        } else if (_this3.runningTasks.length === 0) {
          for (var _i2 = 0; _i2 < _this3.finishedCallbacks.length; _i2 += 1) {
            try {
              _this3.finishedCallbacks[_i2](_objectSpread2({}, _this3.results));
            } catch (error) {
              console.error(error);
            }
          }
        }
      };

      promise.then(function (value) {
        var result = {
          value: value,
          error: null
        };
        done(result);
      }, function (error) {
        var result = {
          error: error
        };
        done(result);
      });
    }
  }]);

  return Runner;
}();

_defineProperty(Runner, "PROGRESS", 'progress');

_defineProperty(Runner, "FINISHED", 'finished');

exports.Runner = Runner;
exports.default = Runner;
