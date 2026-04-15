;(function(G) {
  'use strict';
  var state = G.state;

  function GameEngine() {
    this._updateOrder = [];  // 保持註冊順序
    this._drawOrder = [];    // 按 drawOrder 排序
    this._drawSorted = false;
  }

  GameEngine.prototype.register = function(plugin) {
    this._updateOrder.push(plugin);
    this._drawOrder.push(plugin);
    this._drawSorted = false;
  };

  GameEngine.prototype.registerAll = function(list) {
    for (var i = 0; i < list.length; i++) this.register(list[i]);
  };

  GameEngine.prototype.init = function() {
    for (var i = 0; i < this._updateOrder.length; i++) {
      if (this._updateOrder[i].init) this._updateOrder[i].init();
    }
  };

  // update 按註冊順序執行
  GameEngine.prototype.update = function(dt) {
    for (var i = 0; i < this._updateOrder.length; i++) {
      if (this._updateOrder[i].update) this._updateOrder[i].update(dt);
    }
  };

  // draw 按 drawOrder 排序執行
  GameEngine.prototype.draw = function(ctx, now) {
    if (!this._drawSorted) {
      this._drawOrder.sort(function(a, b) {
        return (a.drawOrder || 0) - (b.drawOrder || 0);
      });
      this._drawSorted = true;
    }
    for (var i = 0; i < this._drawOrder.length; i++) {
      if (this._drawOrder[i].draw) this._drawOrder[i].draw(ctx, now);
    }
  };

  // 固定時間步長：物理以 60fps 模擬，繪製以螢幕原生刷新率
  var FIXED_DT = 1000 / 60;  // 16.67ms per tick

  GameEngine.prototype.start = function() {
    var self = this;
    var accumulator = 0;

    function loop(now) {
      if (state.gameState === 'playing') {
        var elapsed = now - state.lastTime;
        state.lastTime = now;
        // 夾限防止切頁回來的大跳躍
        if (elapsed > 200) elapsed = 200;

        accumulator += elapsed;
        while (accumulator >= FIXED_DT) {
          state.gameTime += FIXED_DT;
          self.update(FIXED_DT);
          accumulator -= FIXED_DT;
        }
      }
      var ctx = state.ctx;
      ctx.save();
      ctx.translate(state.shakeX, state.shakeY);
      self.draw(ctx, now);
      ctx.restore();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };

  G.GameEngine = GameEngine;
})(Game);
