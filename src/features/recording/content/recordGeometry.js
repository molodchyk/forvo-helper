const FORVO_CANVAS_RECORDER_ID = "canvas-recorder";

export function isForvoCanvasRecorder(element) {
  return element?.tagName === "CANVAS" && element.id === FORVO_CANVAS_RECORDER_ID;
}

export function getRecordActivationPoint(element) {
  const rect = element.getBoundingClientRect();

  if (isForvoCanvasRecorder(element)) {
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.46
    };
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

export function getRecordOverlayBox(element) {
  const rect = element.getBoundingClientRect();

  if (!isForvoCanvasRecorder(element)) {
    return rect;
  }

  const point = getRecordActivationPoint(element);
  const size = Math.min(144, Math.max(96, rect.height * 0.62));

  return {
    left: point.x - size / 2,
    top: point.y - size / 2,
    width: size,
    height: size
  };
}
