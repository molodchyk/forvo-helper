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
  const activationTarget = resolveActivationTarget(element, x, y);

  dispatchActivationSequence(activationTarget, x, y);

  if (isForvoCanvasRecorder(element)) {
    dispatchMouseEvent(activationTarget, "click", x, y);
  } else if (element instanceof HTMLElement) {
    element.click();
  }

  return true;
}

function resolveActivationTarget(element, clientX, clientY) {
  if (!isForvoCanvasRecorder(element)) {
    return element;
  }

  const doc = element.ownerDocument || document;
  const pointElement = doc.elementFromPoint?.(clientX, clientY);

  if (isRecorderLayer(pointElement, element)) {
    return pointElement;
  }

  const overlay = doc.getElementById("dom_overlay_container");

  if (isRecorderLayer(overlay, element) && containsPoint(overlay, clientX, clientY)) {
    return overlay;
  }

  return element;
}

function isRecorderLayer(candidate, canvas) {
  if (!(candidate instanceof Element) || candidate.closest(".forvo-helper-record-ring")) {
    return false;
  }

  const animationContainer = canvas.closest("#animation_container");
  const recorder = canvas.closest("#recorder");

  return candidate === canvas
    || Boolean(animationContainer?.contains(candidate))
    || Boolean(recorder?.contains(candidate));
}

function containsPoint(element, clientX, clientY) {
  if (!(element instanceof Element)) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom;
}

function dispatchActivationSequence(element, clientX, clientY) {
  dispatchPointerEvent(element, "pointerover", clientX, clientY);
  dispatchPointerEvent(element, "pointerenter", clientX, clientY);
  dispatchMouseEvent(element, "mouseover", clientX, clientY);
  dispatchMouseEvent(element, "mouseenter", clientX, clientY);
  dispatchPointerEvent(element, "pointermove", clientX, clientY);
  dispatchMouseEvent(element, "mousemove", clientX, clientY);
  dispatchPointerEvent(element, "pointerdown", clientX, clientY);
  dispatchMouseEvent(element, "mousedown", clientX, clientY);
  dispatchPointerEvent(element, "pointerup", clientX, clientY);
  dispatchMouseEvent(element, "mouseup", clientX, clientY);
}

function dispatchPointerEvent(element, type, clientX, clientY) {
  const view = element.ownerDocument?.defaultView || globalThis;
  const PointerEventConstructor = view.PointerEvent || globalThis.PointerEvent;

  if (!PointerEventConstructor) {
    return;
  }

  const event = new PointerEventConstructor(type, {
    bubbles: !type.endsWith("enter"),
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: type.endsWith("down") ? 1 : 0,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    view,
    composed: true
  });

  decoratePointerCoordinates(event, element, clientX, clientY);
  element.dispatchEvent(event);
}

function dispatchMouseEvent(element, type, clientX, clientY) {
  const view = element.ownerDocument?.defaultView || globalThis;
  const event = new view.MouseEvent(type, {
    bubbles: !type.endsWith("enter"),
    cancelable: true,
    button: 0,
    buttons: type.endsWith("down") ? 1 : 0,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    view,
    detail: type === "click" ? 1 : 0,
    composed: true
  });

  decoratePointerCoordinates(event, element, clientX, clientY);
  element.dispatchEvent(event);
}

function decoratePointerCoordinates(event, element, clientX, clientY) {
  const rect = element.getBoundingClientRect();
  const pageX = clientX + globalThis.scrollX;
  const pageY = clientY + globalThis.scrollY;

  defineEventValue(event, "offsetX", clientX - rect.left);
  defineEventValue(event, "offsetY", clientY - rect.top);
  defineEventValue(event, "layerX", clientX - rect.left);
  defineEventValue(event, "layerY", clientY - rect.top);
  defineEventValue(event, "pageX", pageX);
  defineEventValue(event, "pageY", pageY);
  defineEventValue(event, "which", 1);
}

function defineEventValue(event, key, value) {
  try {
    Object.defineProperty(event, key, {
      configurable: true,
      value
    });
  } catch {
    // Browser event coordinate properties are not consistently configurable.
  }
}
