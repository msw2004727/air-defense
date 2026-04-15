;(function(G) {
  'use strict';
  var CFG = G.CFG;
  var state = G.state;
  var canvas = document.getElementById('game');

  var SLIDER_HEIGHT = 64;

  function resizeCanvas() {
    var aspect = CFG.W / CFG.H;
    var aw = window.innerWidth;
    var ah = window.innerHeight - SLIDER_HEIGHT;

    // 保持比例縮放到可用空間
    var fitW, fitH;
    if (aw / ah > aspect) { fitH = ah; fitW = ah * aspect; }
    else { fitW = aw; fitH = aw / aspect; }

    var rawScale = Math.min(fitW / CFG.W, fitH / CFG.H);
    var scale;

    if (rawScale >= 1) {
      // 桌面：整數倍縮放，像素完美
      var maxScale = CFG.MAX_SCALE || 3;
      scale = Math.min(Math.floor(rawScale), maxScale);
      if (scale < 1) scale = 1;
    } else {
      // 手機：填滿螢幕
      scale = rawScale;
    }

    var displayW = Math.floor(CFG.W * scale);
    var displayH = Math.floor(CFG.H * scale);

    canvas.width = CFG.W;
    canvas.height = CFG.H;
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';

    state.scaleX = CFG.W / displayW;
    state.scaleY = CFG.H / displayH;

    var slider = document.getElementById('aim-slider');
    if (slider) slider.style.width = Math.floor(displayW * 0.75) + 'px';
  }

  G.initCanvas = function() {
    state.ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  };

  G.getCanvasPos = function(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * state.scaleX,
      y: (e.clientY - r.top) * state.scaleY,
    };
  };
})(Game);
