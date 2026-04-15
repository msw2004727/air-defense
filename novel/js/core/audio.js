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
    // 砲擊：子彈越多音效越厚實（散彈兵增益）
    shoot: function(opts) {
      var t = ctx.currentTime;
      var count = (opts && opts.bullets) ? opts.bullets : 1;

      // 縮放參數：對數增長，避免爆音
      var layers = Math.min(Math.floor((count - 1) / 2), 3); // 0~3 層
      var volMul = 1 + Math.log(Math.max(count, 1)) * 0.25;
      if (volMul > 1.6) volMul = 1.6;
      var startFreq = 800 + layers * 80;

      // 主音：方波掃頻
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.07);
      gain.gain.setValueAtTime(0.12 * volMul, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.07);

      // 失諧振盪器層：每層 +/- detune，製造厚實合唱效果
      for (var i = 0; i < layers; i++) {
        var detune = (i + 1) * 15;

        var oscP = ctx.createOscillator();
        var gainP = ctx.createGain();
        oscP.type = 'square';
        oscP.frequency.setValueAtTime(startFreq, t);
        oscP.frequency.exponentialRampToValueAtTime(200, t + 0.07);
        oscP.detune.setValueAtTime(detune, t);
        gainP.gain.setValueAtTime(0.06 * volMul, t);
        gainP.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        oscP.connect(gainP);
        gainP.connect(masterGain);
        oscP.start(t);
        oscP.stop(t + 0.07);

        var oscN = ctx.createOscillator();
        var gainN = ctx.createGain();
        oscN.type = 'square';
        oscN.frequency.setValueAtTime(startFreq, t);
        oscN.frequency.exponentialRampToValueAtTime(200, t + 0.07);
        oscN.detune.setValueAtTime(-detune, t);
        gainN.gain.setValueAtTime(0.06 * volMul, t);
        gainN.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        oscN.connect(gainN);
        gainN.connect(masterGain);
        oscN.start(t);
        oscN.stop(t + 0.07);
      }

      // 噪音層：隨子彈數加長加厚
      var noiseDur = 0.04 + layers * 0.015;
      var noise = createNoise(noiseDur);
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.08 * volMul, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDur);
      noise.connect(nGain);
      nGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + noiseDur);
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

  G.playSound = function(type, opts) {
    if (!ensureRunning()) return;
    var fn = sounds[type];
    if (fn) fn(opts || {});
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
