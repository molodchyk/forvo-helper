import assert from "node:assert/strict";
import test from "node:test";
import { createCircleGestureState, updateCircleGesture } from "./gesture.js";

test("completes after enough angular movement around the center", () => {
  let state = createCircleGestureState({ x: 0, y: 0 });
  const points = [
    { x: 60, y: 0 },
    { x: 42, y: 42 },
    { x: 0, y: 60 },
    { x: -42, y: 42 },
    { x: -60, y: 0 },
    { x: -42, y: -42 },
    { x: 0, y: -60 },
    { x: 42, y: -42 },
    { x: 60, y: 0 }
  ];

  for (const point of points) {
    state = updateCircleGesture(state, point);
  }

  assert.equal(state.completed, true);
});

test("resets when pointer leaves the gesture radius", () => {
  let state = createCircleGestureState({ x: 0, y: 0 });
  state = updateCircleGesture(state, { x: 60, y: 0 });
  state = updateCircleGesture(state, { x: 500, y: 500 });

  assert.equal(state.turn, 0);
  assert.equal(state.completed, false);
});

