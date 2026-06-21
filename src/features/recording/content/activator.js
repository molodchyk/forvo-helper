export function activateRecordButton(element) {
  if (!element) {
    return false;
  }

  element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  element.focus?.({ preventScroll: true });

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  dispatchPointerEvent(element, "pointerdown", x, y);
  dispatchMouseEvent(element, "mousedown", x, y);
  dispatchPointerEvent(element, "pointerup", x, y);
  dispatchMouseEvent(element, "mouseup", x, y);
  element.click?.();

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
    clientY
  }));
}

function dispatchMouseEvent(element, type, clientX, clientY) {
  element.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: type.endsWith("down") ? 1 : 0,
    clientX,
    clientY
  }));
}

