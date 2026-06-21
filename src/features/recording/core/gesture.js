const FULL_CIRCLE_RADIANS = Math.PI * 2;

export function createCircleGestureState(center) {
  return {
    center,
    lastAngle: null,
    turn: 0,
    completed: false
  };
}

export function updateCircleGesture(state, point, options = {}) {
  const minimumTurn = options.minimumTurn ?? Math.PI * 1.75;
  const minimumRadius = options.minimumRadius ?? 24;
  const maximumRadius = options.maximumRadius ?? 220;
  const dx = point.x - state.center.x;
  const dy = point.y - state.center.y;
  const radius = Math.hypot(dx, dy);

  if (radius < minimumRadius || radius > maximumRadius) {
    return {
      ...state,
      lastAngle: null,
      turn: 0,
      completed: false
    };
  }

  const angle = Math.atan2(dy, dx);
  const delta = state.lastAngle === null ? 0 : normalizeAngleDelta(angle - state.lastAngle);
  const turn = Math.min(FULL_CIRCLE_RADIANS, state.turn + Math.abs(delta));
  const completed = turn >= minimumTurn;

  return {
    ...state,
    lastAngle: angle,
    turn,
    completed
  };
}

export function gestureProgress(state) {
  return Math.min(1, state.turn / (Math.PI * 1.75));
}

function normalizeAngleDelta(delta) {
  if (delta > Math.PI) return delta - FULL_CIRCLE_RADIANS;
  if (delta < -Math.PI) return delta + FULL_CIRCLE_RADIANS;
  return delta;
}

