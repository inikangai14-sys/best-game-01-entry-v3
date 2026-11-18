// Keyboard + mouse steering. The drone chases the pointer when the mouse has
// moved recently, otherwise the keys drive it. Space/Enter confirms, P/Esc
// pauses, M mutes, Shift boosts.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
};

export function createInput(canvas) {
  const keys = { up: false, down: false, left: false, right: false, boost: false };
  const pointer = { x: 640, y: 360, active: false, seen: 0 };
  let actions = 0;

  function onKeyDown(event) {
    const name = KEYMAP[event.code];
    if (name) {
      keys[name] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    }
  }

  function onKeyUp(event) {
    const name = KEYMAP[event.code];
    if (name) keys[name] = false;
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 1280;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 720;
    pointer.active = true;
    pointer.seen = 0;
  }

  function onPointerDown(event) {
    onPointer(event);
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointer);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Steering vector for this frame: {x, y, boost}, each axis in [-1, 1]. */
    direction(player) {
      pointer.seen += 1;
      let x = 0;
      let y = 0;
      if (keys.left) x -= 1;
      if (keys.right) x += 1;
      if (keys.up) y -= 1;
      if (keys.down) y += 1;
      if (x !== 0 || y !== 0) {
        const len = Math.hypot(x, y) || 1;
        return { x: x / len, y: y / len, boost: keys.boost };
      }
      if (pointer.active && pointer.seen < 240) {
        const dx = pointer.x - player.x;
        const dy = pointer.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 14) {
          const pull = Math.min(1, dist / 220);
          return { x: (dx / dist) * pull, y: (dy / dist) * pull, boost: keys.boost };
        }
      }
      return { x: 0, y: 0, boost: keys.boost };
    },
  };
}
