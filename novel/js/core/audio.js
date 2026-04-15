;(function(G) {
  'use strict';

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var masterGain = null;
  var volume = 0.5;

  G.initAudio = function() {
    if (ctx) return;
    try {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
  };

  // 確保 AudioContext 處於 running 狀態（瀏覽器自動播放政策）
  function ensureRunning() {
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.state !== 'closed';
  }

  // 建立噪音節點用於爆炸音效
  function createNoise(duration) {
    var sampleRate = ctx.sampleRate;
    var length = sampleRate * duration;
    var buffer = ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var node = ctx.createBufferSource();
    node.buffer = buffer;
    return node;
  }

  // 音效定義
  var sounds = {
    // 砲擊：短促有力的方波掃頻 + 噪音衝擊
    shoot: function() {
      var t = ctx.currentTime;

      // 主音：方波掃頻 800→200Hz
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.07);

      // 噪音層：模擬火藥爆發
      var noise = createNoise(0.04);
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.08, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      noise.connect(nGain);
      nGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.04);
    },

    // 命中：清脆的三角波下滑
    hit: function() {
      var t = ctx.currentTime;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    },

    // 爆炸：鋸齒波低頻轟鳴 + 噪音碎片
    explode: function() {
      var t = ctx.currentTime;

      // 低頻轟鳴
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.35);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.35);

      // 噪音碎片：模擬爆炸碎裂感
      var noise = createNoise(0.25);
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.12, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      noise.connect(nGain);
      nGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.25);
    },

    // 砲台被擊中：沉重的方波 + 金屬感
    turret_hit: function() {
      var t = ctx.currentTime;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.2);

      // 金屬碰撞泛音
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, t);
      osc2.frequency.exponentialRampToValueAtTime(200, t + 0.1);
      gain2.gain.setValueAtTime(0.06, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(t);
      osc2.stop(t + 0.1);
    },
  };

  G.playSound = function(type) {
    if (!ensureRunning()) return;
    var fn = sounds[type];
    if (fn) fn();
  };

  // 音量控制 API
  G.setVolume = function(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain) masterGain.gain.value = volume;
  };

  G.getVolume = function() {
    return volume;
  };

})(Game);
