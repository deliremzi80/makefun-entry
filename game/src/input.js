// Unified Keyboard and Pointer controls
export function attachControls(target) {
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    start: false,
    restart: false,
  };

  function updateKey(code, pressed) {
    if (code === 'KeyW' || code === 'ArrowUp') keys.up = pressed;
    if (code === 'KeyS' || code === 'ArrowDown') keys.down = pressed;
    if (code === 'KeyA' || code === 'ArrowLeft') keys.left = pressed;
    if (code === 'KeyD' || code === 'ArrowRight') keys.right = pressed;
    if (code === 'Space' || code === 'KeyJ') keys.fire = pressed;
    if (code === 'Enter' || code === 'Space') keys.start = pressed;
    if (code === 'KeyR') keys.restart = pressed;
  }

  window.addEventListener('keydown', (e) => {
    updateKey(e.code, true);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    updateKey(e.code, false);
  });

  target.addEventListener('pointerdown', (e) => {
    keys.fire = true;
    keys.start = true;
  });

  target.addEventListener('pointerup', () => {
    keys.fire = false;
  });

  return keys;
}
