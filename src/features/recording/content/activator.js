import { getRecordActivationPoint, isForvoCanvasRecorder } from "./recordGeometry.js";

export function activateRecordButton(element) {
  if (!element) {
    return false;
  }

  element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  element.focus?.({ preventScroll: true });

  const point = getRecordActivationPoint(element);
  const x = point.x;
  const y = point.y;

  dispatchMouseEvent(element, "mouseover", x, y);
  dispatchMouseEvent(element, "mousemove", x, y);
  dispatchPointerEvent(element, "pointerdown", x, y);
  dispatchMouseEvent(element, "mousedown", x, y);
  dispatchPointerEvent(element, "pointerup", x, y);
  dispatchMouseEvent(element, "mouseup", x, y);

  if (isForvoCanvasRecorder(element)) {
    dispatchMouseEvent(element, "click", x, y);
  } else if (element instanceof HTMLElement) {
    element.click();
  }

  return true;
}

function dispatchPointerEvent(element, type, clientX, clientY) {
  if (!globalThis.PointerEvent) {
    return;
  }

  element.dispatchEvent(new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    composed: true
  }));
}

function dispatchMouseEvent(element, type, clientX, clientY) {
  element.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: type.endsWith("down") ? 1 : 0,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    detail: type === "click" ? 1 : 0,
    composed: true
  }));
}
