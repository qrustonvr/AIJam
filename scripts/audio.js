// =====================================================
// Audio stubs — wire real samples in hour 5.
// Generate or source: boom (cannon), quack, splash, win
// =====================================================

const sounds = {};
let enabled = true;

export function preload() {
  // Uncomment + drop files into assets/sounds/ to enable:
  // sounds.fire   = new Audio('assets/sounds/boom.mp3');
  // sounds.quack  = new Audio('assets/sounds/quack.mp3');
  // sounds.splash = new Audio('assets/sounds/splash.mp3');
  // sounds.win    = new Audio('assets/sounds/win.mp3');
}

export function play(name) {
  if (!enabled) return;
  const s = sounds[name];
  if (s) {
    try {
      s.currentTime = 0;
      s.play().catch(() => {});
    } catch (e) { /* no-op */ }
  }
}

export function setEnabled(v) { enabled = v; }
