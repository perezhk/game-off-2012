var Fight, global, runFight, worker,
  __slice = [].slice;

worker = self;

global = this;

Fight = (function() {

  function Fight() {
    this.bindEvents();
  }

  Fight.prototype.overrideFunctions = function() {
    this.originalFunctions = {
      setTimeout: global.setTimeout,
      setInterval: global.setInterval,
      XmlHttpRequest: global.XmlHttpRequest,
      Date: global.Date,
      random: Math.random,
      "eval": global["eval"],
      func: global.Function
    };
    global.setTimeout = function() {};
    global.setInterval = function() {};
    global.XmlHttpRequest = function() {};
    global.Date = function() {
      return null;
    };
    Math.random = function() {
      return 0;
    };
    global["eval"] = function() {};
    return global.Function = function() {};
  };

  Fight.prototype.restoreFunctions = function() {
    global.setTimeout = this.originalFunctions.setTimeout;
    global.setInterval = this.originalFunctions.setInterval;
    global.XmlHttpRequest = this.originalFunctions.XmlHttpRequest;
    global.Date = function() {
      return this.originalFunctions.Date;
    };
    Math.random = function() {
      return this.originalFunctions.random;
    };
    global["eval"] = this.originalFunctions["eval"];
    return global.Function = this.originalFunctions.func;
  };

  Fight.prototype.log = function() {
    var messages;
    messages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return worker.postMessage({
      type: "log",
      message: messages.join(', ')
    });
  };

  Fight.prototype.bindEvents = function() {
    var _this = this;
    return worker.onmessage = function(event) {
      var code, evData, i, robots, _i, _ref;
      evData = event.data;
      robots = [];
      for (i = _i = 1, _ref = evData.robots; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
        code = evData['robot' + i];
        code.code = code.code.replace(/\/\/.*?\n/g, '').replace(/#.*?\n/g, '');
        robots.push(code);
      }
      return _this.processFight(robots);
    };
  };

  Fight.prototype.processFight = function(robots) {
    var boardSize, constr, engine, eventData, maxRounds, result, robot, robotCode, robotInstance, robotInstances, _i, _len,
      _this = this;
    this.overrideFunctions();
    maxRounds = 10000;
    boardSize = {
      width: 800,
      height: 500
    };
    robotInstances = [];
    for (_i = 0, _len = robots.length; _i < _len; _i++) {
      robot = robots[_i];
      robotCode = "(function() {" + robot.code + "}.bind(window)()); return window.robotClass;";
      constr = new this.originalFunctions.func("window", robotCode)({
        log: function() {
          var message;
          message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return _this.log.apply(_this, message);
        }
      });
      robotInstance = new constr();
      robot.instance = robotInstance;
      robotInstances.push(robot);
    }
    engine = (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args), t = typeof result;
      return t == "object" || t == "function" ? result || child : child;
    })(Engine, [boardSize.width, boardSize.height, maxRounds, this.originalFunctions.random, this.log].concat(__slice.call(robotInstances)), function(){});
    result = engine.fight();
    this.restoreFunctions();
    eventData = {
      type: "results",
      result: result.result,
      winner: result.winner
    };
    return worker.postMessage(eventData);
  };

  return Fight;

})();

runFight = function() {
  var fight;
  return fight = new Fight();
};

runFight();
