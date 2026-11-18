// Synthesised WebAudio effects: no audio files, everything is an oscillator
// envelope. Created lazily on the first user gesture so autoplay rules never
// block the game; every call is guarded so a missing AudioContext is silent.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
      g.gain.setValueAtTime(gain, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    unlock() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    },
    catch(combo) {
      tone(520 + combo * 90, 0.12, 'sine', 0.16, 880 + combo * 90);
    },
    golden() {
      tone(660, 0.1, 'triangle', 0.18, 990);
      setTimeout(() => tone(990, 0.16, 'triangle', 0.16, 1320), 70);
    },
    hit() {
      tone(180, 0.25, 'sawtooth', 0.2, 60);
    },
    shield() {
      tone(440, 0.2, 'sine', 0.14, 880);
    },
    level() {
      tone(523, 0.12, 'triangle', 0.16);
      setTimeout(() => tone(659, 0.12, 'triangle', 0.16), 90);
      setTimeout(() => tone(784, 0.2, 'triangle', 0.16), 180);
    },
    overtake() {
      tone(740, 0.1, 'square', 0.1, 1180);
    },
    storm() {
      tone(90, 0.5, 'sawtooth', 0.12, 45);
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}
