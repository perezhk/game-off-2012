var Game,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

(function() {
  var targetTime, vendor, w, _i, _len, _ref;
  w = window;
  _ref = ['ms', 'moz', 'webkit', 'o'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    vendor = _ref[_i];
    if (w.requestAnimationFrame) {
      break;
    }
    w.requestAnimationFrame = w["" + vendor + "RequestAnimationFrame"];
    w.cancelAnimationFrame = w["" + vendor + "CancelAnimationFrame"] || w["" + vendor + "CancelRequestAnimationFrame"];
  }
  targetTime = 0;
  w.requestAnimationFrame || (w.requestAnimationFrame = function(callback) {
    var currentTime;
    targetTime = Math.max(targetTime + 16, currentTime = +(new Date));
    return w.setTimeout((function() {
      return callback(+(new Date));
    }), targetTime - currentTime);
  });
  return w.cancelAnimationFrame || (w.cancelAnimationFrame = function(id) {
    return clearTimeout(id);
  });
})();

Game = (function() {

  function Game(board, result, options) {
    this.board = board;
    this.result = result;
    this.options = options;
    this.play = __bind(this.play, this);

    if (this.result) {
      this.events = result.result;
      this.gameEnded = true;
    } else {
      this.events = [];
    }
    this.currentRound = 0;
    this.objects = {};
    this.options = $.extend({
      msPerRound: 100
    }, this.options);
  }

  Game.prototype.start = function() {
    this.lastRound = window.mozAnimationStartTime || Date.now();
    return requestAnimationFrame(this.play);
  };

  Game.prototype.end = function() {
    return this.gameEnded = true;
  };

  Game.prototype.forceEnd = function() {
    this.end();
    return this.events = [];
  };

  Game.prototype.addRound = function(roundLog) {
    return this.events.push(roundLog);
  };

  Game.prototype.createTank = function(object) {
    var color, referenceCannonColor, referenceTankColor, tank, tankObject;
    tank = $('<div class="tank"><div class="body"></div><div class="cannon"></div><div class="life"></div><div class="explosion"></div></div>');
    tankObject = {
      id: object.id,
      name: object.name,
      color: object.color,
      tank: tank,
      body: tank.find('.body'),
      cannon: tank.find('.cannon'),
      life: tank.find('.life')
    };
    referenceTankColor = {
      r: 76,
      g: 168,
      b: 27
    };
    referenceCannonColor = {
      r: 108,
      g: 211,
      b: 42
    };
    color = tankObject.color || '#ff0000';
    IconPainter.paintIcon('/img/tanks.png', color, referenceTankColor, 27, function(dataUrl) {
      return tankObject.body.css('background-image', 'url(' + dataUrl + ')');
    });
    IconPainter.paintIcon('/img/cannon.png', color, referenceCannonColor, 60, function(dataUrl) {
      return tankObject.cannon.css('background-image', 'url(' + dataUrl + ')');
    });
    this.board.append(tank);
    this.objects[object.id] = tankObject;
    return tankObject;
  };

  Game.prototype.createBullet = function(object) {
    var bullet, bulletObject;
    bullet = $('<div class="bullet"><div class="explosion"></div></div>');
    this.board.append(bullet);
    bulletObject = {
      id: object.id,
      bullet: bullet,
      width: bullet.width(),
      height: bullet.height()
    };
    this.objects[object.id] = bulletObject;
    return bulletObject;
  };

  Game.prototype.applyRotate = function(object, angle) {
    return object.style.webkitTransform = object.style.mozTransform = object.style.transform = "rotate3d(0,0,1," + angle + "deg)";
  };

  Game.prototype.handleTank = function(object) {
    var tank;
    tank = this.objects[object.id] || this.createTank(object);
    tank.tank[0].style.top = (object.position.y - (object.dimension.height / 2)) + 'px';
    tank.tank[0].style.left = (object.position.x - (object.dimension.width / 2)) + 'px';
    tank.life[0].style.width = (30 * object.life / 100) + 'px';
    this.applyRotate(tank.body[0], object.angle);
    return this.applyRotate(tank.cannon[0], object.angle + object.cannonAngle);
  };

  Game.prototype.handleBullet = function(object) {
    var bullet;
    bullet = this.objects[object.id];
    bullet.bullet[0].style.top = (object.position.y - (bullet.height / 2)) + 'px';
    bullet.bullet[0].style.left = (object.position.x - (bullet.width / 2)) + 'px';
    return this.applyRotate(bullet.bullet[0], object.angle);
  };

  Game.prototype.removeBullet = function(bulletObject) {
    delete this.objects[bulletObject.id];
    return bulletObject.bullet.remove();
  };

  Game.prototype.play = function(timestamp) {
    var hasFinished, object, onRound, progress, round, roundEvent, roundNumber, rounds, _i, _j, _k, _len, _len1, _ref, _ref1;
    progress = timestamp - this.lastRound;
    rounds = Math.floor(progress / this.options.msPerRound);
    this.lastRound = window.mozAnimationStartTime || Date.now();
    onRound = this.options.onRound;
    for (roundNumber = _i = 0; 0 <= rounds ? _i <= rounds : _i >= rounds; roundNumber = 0 <= rounds ? ++_i : --_i) {
      if (roundNumber + this.currentRound >= this.events.length) {
        break;
      }
      round = this.events[roundNumber + this.currentRound];
      if (onRound) {
        onRound(round);
      }
      _ref = round.objects;
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        object = _ref[_j];
        switch (object.type) {
          case 'tank':
            this.handleTank(object);
            break;
          case 'bullet':
            if (!this.objects[object.id]) {
              this.createBullet(object);
            }
            this.handleBullet(object);
        }
      }
      _ref1 = round.events;
      for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
        roundEvent = _ref1[_k];
        object = this.objects[roundEvent.id];
        if (!object) {
          continue;
        }
        switch (roundEvent.type) {
          case 'moving':
            object.tank[0].className = 'tank moving';
            break;
          case 'backwards':
            object.tank[0].className = 'tank moving backwards';
            break;
          case 'stopped':
            object.tank[0].className = 'tank';
            break;
          case 'cloned':
            object.tank[0].className = 'tank cloning';
            break;
          case 'exploded':
            object.bullet[0].className = 'bullet exploding';
            setTimeout(this.removeBullet.bind(this, object), 1000);
            break;
          case 'dead':
            object.tank[0].className = 'tank dead';
            break;
          case 'log':
            console.log.apply(console, ['ROBOT ' + object.name + ':'].concat(roundEvent.messages));
        }
      }
    }
    hasFinished = rounds + this.currentRound >= this.events.length && this.gameEnded;
    if (hasFinished && this.options.onEndGame) {
      this.options.onEndGame(this.result);
    }
    this.currentRound += rounds;
    if (!hasFinished) {
      return requestAnimationFrame(this.play);
    }
  };

  return Game;

})();
