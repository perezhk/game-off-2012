var ANG_INCREMENT, Arena, BulletStatus, ElementStatus, Engine, MOVE_INCREMENT, PI2, RAD2DEG, Rectangle, RobotActions, RobotStatus, Vector2, WallStatus,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

MOVE_INCREMENT = 1;

ANG_INCREMENT = 1;

PI2 = Math.PI * 2;

RAD2DEG = 180 / Math.PI;

Vector2 = (function() {

  function Vector2(x, y) {
    this.x = x;
    this.y = y;
    if (this.x instanceof Vector2) {
      this.y = this.x.y;
      this.x = this.x.x;
    }
  }

  Vector2.prototype.rotate = function(angle, reference) {
    var cos, sin, translatedX, translatedY;
    angle = (angle * Math.PI) / 180;
    sin = Math.sin(angle);
    cos = Math.cos(angle);
    translatedX = this.x - reference.x;
    translatedY = this.y - reference.y;
    this.x = translatedX * cos - translatedY * sin + reference.x;
    this.y = translatedX * sin + translatedY * cos + reference.y;
    return this;
  };

  Vector2.prototype.module = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  Vector2.prototype.projectTo = function(axis) {
    var denominator, divisionResult, numerator;
    numerator = (this.x * axis.x) + (this.y * axis.y);
    denominator = (axis.x * axis.x) + (axis.y * axis.y);
    divisionResult = numerator / denominator;
    return new Vector2(divisionResult * axis.x, divisionResult * axis.y);
  };

  Vector2.add = function(v1, v2) {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  };

  Vector2.subtract = function(v1, v2) {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  };

  return Vector2;

})();

RobotActions = (function() {

  function RobotActions(currentStatus) {
    this.id = currentStatus.id;
    this.queue = [];
  }

  RobotActions.prototype.move = function(amount, direction) {
    this.queue.push({
      action: "move",
      direction: direction,
      count: amount / MOVE_INCREMENT
    });
    return true;
  };

  RobotActions.prototype.ahead = function(amount) {
    return this.move(amount, 1);
  };

  RobotActions.prototype.back = function(amount) {
    return this.move(amount, -1);
  };

  RobotActions.prototype.rotateCannon = function(degrees) {
    return this.queue.push({
      action: "rotateCannon",
      direction: degrees,
      count: degrees / ANG_INCREMENT
    });
  };

  RobotActions.prototype.turn = function(degrees) {
    return this.queue.push({
      action: "turn",
      direction: degrees,
      count: degrees / ANG_INCREMENT
    });
  };

  RobotActions.prototype.fire = function(bullets) {
    return this.queue.push({
      action: "fire"
    });
  };

  return RobotActions;

})();

Arena = (function() {

  function Arena(width, height) {
    this.width = width;
    this.height = height;
    this.walls = [new WallStatus(this.width / 2, 0, this.width, 1), new WallStatus(this.width, this.height / 2, 1, this.height), new WallStatus(this.width / 2, this.height, this.width, 1), new WallStatus(0, this.height / 2, 1, this.height)];
  }

  return Arena;

})();

Rectangle = (function() {

  function Rectangle(x, y, width, height, angle) {
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (width == null) {
      width = 1;
    }
    if (height == null) {
      height = 1;
    }
    this.angle = angle != null ? angle : 0;
    this.position = new Vector2(x, y);
    this.setDimension(width, height);
    this.updateCoords();
  }

  Rectangle.prototype.setAngle = function(angle) {
    this.angle = angle;
    return this.updateCoords();
  };

  Rectangle.prototype.setDimension = function(width, height) {
    this.dimension = {
      width: width,
      height: height
    };
    this.halfWidth = width / 2;
    this.halfHeight = height / 2;
    this.radius = this.halfWidth + this.halfHeight;
    return this.updateCoords();
  };

  Rectangle.prototype.setPosition = function(x, y) {
    this.position.x = x;
    this.position.y = y;
    return this.updateCoords();
  };

  Rectangle.prototype.incPosition = function(x, y) {
    this.position.x += x;
    this.position.y += y;
    return this.updateCoords();
  };

  Rectangle.prototype.updateCoords = function() {
    var bottom, left, right, top;
    top = this.position.y - this.halfHeight;
    left = this.position.x - this.halfWidth;
    bottom = this.position.y + this.halfHeight;
    right = this.position.x + this.halfWidth;
    this.upperRight = new Vector2(right, top).rotate(this.angle, this.position);
    this.upperLeft = new Vector2(left, top).rotate(this.angle, this.position);
    this.lowerLeft = new Vector2(left, bottom).rotate(this.angle, this.position);
    return this.lowerRight = new Vector2(right, bottom).rotate(this.angle, this.position);
  };

  Rectangle.prototype.intersects = function(other, smart) {
    var axis, axisList, distance, _i, _len;
    if (smart == null) {
      smart = true;
    }
    distance = Vector2.subtract(this.position, other.position).module();
    if (distance > (this.radius + other.radius)) {
      return false;
    }
    axisList = [Vector2.subtract(this.upperRight, this.upperLeft), Vector2.subtract(this.upperRight, this.lowerRight), Vector2.subtract(other.upperRight, other.upperLeft), Vector2.subtract(other.upperRight, other.lowerRight)];
    for (_i = 0, _len = axisList.length; _i < _len; _i++) {
      axis = axisList[_i];
      if (!this.isAxisCollision(other, axis)) {
        return false;
      }
    }
    return true;
  };

  Rectangle.prototype.isAxisCollision = function(other, axis) {
    var maxMine, maxOther, minMine, minOther, myProjections, otherProjections;
    myProjections = [this.generateScalar(this.upperLeft, axis), this.generateScalar(this.upperRight, axis), this.generateScalar(this.lowerLeft, axis), this.generateScalar(this.lowerRight, axis)];
    otherProjections = [this.generateScalar(other.upperLeft, axis), this.generateScalar(other.upperRight, axis), this.generateScalar(other.lowerLeft, axis), this.generateScalar(other.lowerRight, axis)];
    minMine = Math.min.apply(Math, myProjections);
    maxMine = Math.max.apply(Math, myProjections);
    minOther = Math.min.apply(Math, otherProjections);
    maxOther = Math.max.apply(Math, otherProjections);
    if (minMine <= maxOther && maxMine >= maxOther) {
      return true;
    } else if (minOther <= maxMine && maxOther >= maxMine) {
      return true;
    }
    return false;
  };

  Rectangle.prototype.generateScalar = function(corner, axis) {
    var projected;
    projected = corner.projectTo(axis);
    return (axis.x * projected.x) + (axis.y * projected.y);
  };

  return Rectangle;

})();

ElementStatus = (function() {

  ElementStatus.id = 1;

  function ElementStatus() {
    this.id = 'element' + (RobotStatus.id++);
    this.rectangle = new Rectangle();
  }

  ElementStatus.prototype.isAlive = function() {
    return true;
  };

  return ElementStatus;

})();

WallStatus = (function(_super) {

  __extends(WallStatus, _super);

  function WallStatus(x, y, width, height) {
    WallStatus.__super__.constructor.call(this);
    this.rectangle.setPosition(x, y);
    this.rectangle.setDimension(width, height);
  }

  return WallStatus;

})(ElementStatus);

BulletStatus = (function(_super) {

  __extends(BulletStatus, _super);

  function BulletStatus(robotStatus) {
    var angleRad, xInc, yInc;
    this.robotStatus = robotStatus;
    BulletStatus.__super__.constructor.call(this);
    this.rectangle.setAngle((this.robotStatus.rectangle.angle + this.robotStatus.cannonAngle) % 360);
    angleRad = (this.rectangle.angle * Math.PI) / 180;
    this.sinAngle = Math.sin(angleRad);
    this.cosAngle = Math.cos(angleRad);
    xInc = this.cosAngle * (this.robotStatus.rectangle.dimension.width / 2);
    yInc = this.sinAngle * (this.robotStatus.rectangle.dimension.height / 2);
    this.rectangle.setPosition(this.robotStatus.rectangle.position.x + xInc, this.robotStatus.rectangle.position.y + yInc);
    this.speed = 2;
    this.strength = 1;
    this.running = true;
  }

  BulletStatus.prototype.isIdle = function() {
    return false;
  };

  BulletStatus.prototype.isAlive = function() {
    return this.running;
  };

  BulletStatus.prototype.runItem = function() {
    this.previousPosition = new Vector2(this.rectangle.position);
    this.rectangle.incPosition(this.cosAngle * this.speed, this.sinAngle * this.speed);
    return null;
  };

  BulletStatus.prototype.destroy = function() {
    return this.running = false;
  };

  BulletStatus.prototype.rollbackAfterCollision = function() {
    if (this.previousPosition) {
      return this.rectangle.setPosition(this.previousPosition.x, this.previousPosition.y);
    }
  };

  BulletStatus.prototype.updateQueue = function() {};

  return BulletStatus;

})(ElementStatus);

RobotStatus = (function(_super) {

  __extends(RobotStatus, _super);

  function RobotStatus(robot, arena) {
    this.robot = robot;
    this.arena = arena;
    RobotStatus.__super__.constructor.call(this);
    this.life = 100;
    this.cannonAngle = 0;
    this.rectangle.setDimension(27, 24);
    this.baseScanWaitTime = 50;
    this.scanWaitTime = 0;
    this.queue = [];
  }

  RobotStatus.prototype.isAlive = function() {
    return this.life > 0;
  };

  RobotStatus.prototype.isIdle = function() {
    return this.queue.length === 0;
  };

  RobotStatus.prototype.takeHit = function(buletStatus) {
    this.life -= buletStatus.strength;
    return buletStatus.destroy();
  };

  RobotStatus.prototype.rollbackAfterCollision = function() {
    if (this.previousPosition) {
      this.rectangle.setPosition(this.previousPosition.x, this.previousPosition.y);
    }
    if (this.previousAngle) {
      return this.rectangle.setAngle(this.previousAngle);
    }
  };

  RobotStatus.prototype.cannonTotalAngle = function() {
    return (this.rectangle.angle + this.cannonAngle) % 360;
  };

  RobotStatus.prototype.canScan = function() {
    return this.scanWaitTime === 0;
  };

  RobotStatus.prototype.tickScan = function() {
    if (this.scanWaitTime > 0) {
      return this.scanWaitTime -= 1;
    }
  };

  RobotStatus.prototype.preventScan = function() {
    return this.scanWaitTime = this.baseScanWaitTime;
  };

  RobotStatus.prototype.runItem = function() {
    var angle, direction, item, rad;
    item = this.queue.shift();
    if (!item) {
      return;
    }
    if ('count' in item) {
      item.count--;
      if (item.count > 0) {
        this.queue.unshift(item);
      }
    }
    direction = 1;
    if (item.direction && item.direction < 0) {
      direction = -1;
    }
    this.previousPosition = null;
    this.previousAngle = null;
    this.previousCannonAngle = null;
    switch (item.action) {
      case 'move':
        rad = (this.rectangle.angle * Math.PI) / 180;
        this.previousPosition = new Vector2(this.rectangle.position);
        this.rectangle.incPosition(Math.cos(rad) * MOVE_INCREMENT * direction, Math.sin(rad) * MOVE_INCREMENT * direction);
        break;
      case 'rotateCannon':
        this.previousCannonAngle = this.cannonAngl;
        this.cannonAngle += ANG_INCREMENT * direction;
        this.cannonAngle = this.cannonAngle % 360;
        break;
      case 'turn':
        this.previousAngle = this.rectangle.angle;
        angle = this.previousAngle + ANG_INCREMENT * direction;
        this.rectangle.setAngle(angle % 360);
        break;
      case 'fire':
        return new BulletStatus(this);
    }
    return null;
  };

  RobotStatus.prototype.updateQueue = function(actions) {
    return this.queue = actions.queue.concat(this.queue);
  };

  return RobotStatus;

})(ElementStatus);

Engine = (function() {

  function Engine() {
    var height, maxTurns, robot, robots, width;
    width = arguments[0], height = arguments[1], maxTurns = arguments[2], robots = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    this.maxTurns = maxTurns;
    this.robots = robots;
    this.round = 0;
    this.arena = new Arena(width, height);
    this.robotsStatus = (function() {
      var _i, _len, _ref, _results;
      _ref = this.robots;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        robot = _ref[_i];
        _results.push(new RobotStatus(robot, this.arena));
      }
      return _results;
    }).call(this);
  }

  Engine.prototype.isDraw = function() {
    return this.round > this.maxTurns;
  };

  Engine.prototype.safeCall = function() {
    var method, obj, params;
    obj = arguments[0], method = arguments[1], params = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!obj[method]) {
      return;
    }
    return obj[method].apply(obj, params);
  };

  Engine.prototype.checkCollision = function(robotStatus) {
    var actions, eventName, status, wall, _i, _j, _len, _len1, _ref, _ref1;
    actions = new RobotActions(robotStatus);
    _ref = this.arena.walls;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      wall = _ref[_i];
      if (robotStatus.rectangle.intersects(wall.rectangle, false)) {
        robotStatus.rollbackAfterCollision();
        if (robotStatus instanceof BulletStatus) {
          this.roundLog.events.push({
            type: 'exploded',
            id: robotStatus.id
          });
        } else {
          this.safeCall(robotStatus.robot, 'onWallCollision', {
            robot: actions
          });
        }
      }
    }
    if (robotStatus instanceof BulletStatus) {
      return actions;
    }
    _ref1 = this.robotsStatus;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      status = _ref1[_j];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      if (robotStatus.rectangle.intersects(status.rectangle)) {
        eventName = 'onRobotCollision';
        if (status instanceof BulletStatus) {
          if (status.robotStatus === robotStatus) {
            continue;
          }
          eventName = 'onHitByBullet';
          robotStatus.takeHit(status);
          this.roundLog.events.push({
            type: 'exploded',
            id: status.id
          });
        } else {
          robotStatus.rollbackAfterCollision();
        }
        this.safeCall(robotStatus.robot, eventName, {
          robot: actions,
          bulletBearing: robotStatus.rectangle.angle - status.rectangle.angle
        });
      }
    }
    return actions;
  };

  Engine.prototype.checkSight = function(robotStatus) {
    var actions, dirVec, status, virtualHeight, virtualRect, virtualWidth, _i, _len, _ref;
    actions = new RobotActions(robotStatus);
    virtualWidth = 2000;
    virtualHeight = 1;
    dirVec = new Vector2(robotStatus.rectangle.position.x + virtualWidth / 2, robotStatus.rectangle.position.y - virtualHeight / 2);
    dirVec.rotate(robotStatus.cannonTotalAngle(), robotStatus.rectangle.position);
    virtualRect = new Rectangle(dirVec.x, dirVec.y, virtualWidth, virtualHeight, robotStatus.cannonTotalAngle());
    robotStatus.tickScan();
    _ref = this.robotsStatus;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      status = _ref[_i];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      if (!(status instanceof RobotStatus)) {
        continue;
      }
      if (robotStatus.canScan() && virtualRect.intersects(status.rectangle)) {
        robotStatus.preventScan();
        this.safeCall(robotStatus.robot, 'onScannedRobot', {
          robot: actions
        });
        this.roundLog.events.push({
          type: 'onScannedRobot',
          id: robotStatus.id
        });
      }
    }
    return actions;
  };

  Engine.prototype.fight = function() {
    var actions, aliveRobots, fightLog, newStatus, status, _i, _j, _len, _len1, _ref, _ref1;
    aliveRobots = this.robotsStatus.length;
    fightLog = [];
    while (aliveRobots > 1 && !this.isDraw()) {
      this.round++;
      fightLog.push(this.roundLog = {
        round: this.round,
        objects: [],
        events: []
      });
      aliveRobots = 0;
      _ref = this.robotsStatus;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        status = _ref[_i];
        if (!status.isAlive()) {
          continue;
        }
        this.roundLog.objects.push({
          type: status instanceof RobotStatus ? 'tank' : 'bullet',
          id: status.id,
          position: {
            x: status.rectangle.position.x,
            y: status.rectangle.position.y
          },
          dimension: {
            width: status.rectangle.dimension.width,
            height: status.rectangle.dimension.height
          },
          health: status.health,
          angle: status.rectangle.angle,
          cannonAngle: status.cannonAngle
        });
        if (status.isIdle()) {
          actions = new RobotActions(status);
          this.safeCall(status.robot, 'onIdle', {
            robot: actions
          });
          status.updateQueue(actions);
        }
        newStatus = status.runItem();
        if (newStatus) {
          this.robotsStatus.push(newStatus);
        }
        actions = this.checkCollision(status);
        status.updateQueue(actions);
        if (status instanceof RobotStatus) {
          aliveRobots++;
        }
      }
      _ref1 = this.robotsStatus;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        status = _ref1[_j];
        if (!(status.isAlive() && status instanceof RobotStatus)) {
          continue;
        }
        actions = this.checkSight(status);
        status.updateQueue(actions);
      }
    }
    if (this.isDraw()) {
      if (this.isDraw()) {
        console.log("DRAW!");
      }
    }
    return fightLog;
  };

  return Engine;

})();
