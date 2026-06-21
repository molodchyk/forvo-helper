import assert from "node:assert/strict";
import test from "node:test";
import { getRecordActivationPoint, getRecordOverlayBox, isForvoCanvasRecorder } from "./recordGeometry.js";

function fakeElement(rect, tagName = "DIV", id = "") {
  return {
    tagName,
    id,
    getBoundingClientRect() {
      return rect;
    }
  };
}

test("detects Forvo recorder canvas by id and tag", () => {
  assert.equal(isForvoCanvasRecorder(fakeElement({}, "CANVAS", "canvas-recorder")), true);
  assert.equal(isForvoCanvasRecorder(fakeElement({}, "DIV", "canvas-recorder")), false);
});

test("uses the red record control area inside the Forvo canvas", () => {
  const element = fakeElement({ left: 100, top: 40, width: 490, height: 238 }, "CANVAS", "canvas-recorder");
  const point = getRecordActivationPoint(element);

  assert.equal(point.x, 345);
  assert.equal(point.y, 149.48000000000002);
});

test("keeps non-canvas activation at element center", () => {
  const element = fakeElement({ left: 10, top: 20, width: 100, height: 60 });
  const point = getRecordActivationPoint(element);
  const box = getRecordOverlayBox(element);

  assert.deepEqual(point, { x: 60, y: 50 });
  assert.equal(box.width, 100);
});

