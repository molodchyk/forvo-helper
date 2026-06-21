import { getRecordOverlayBox } from "./recordGeometry.js";

export function createRecordOverlay() {
  const ring = document.createElement("div");
  ring.className = "forvo-helper-record-ring";
  ring.hidden = true;
  document.documentElement.append(ring);

  return {
    position(target) {
      if (!target) {
        ring.hidden = true;
        return;
      }

      const rect = getRecordOverlayBox(target);
      const size = Math.max(rect.width, rect.height) + 28;

      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.left = `${rect.left + rect.width / 2 - size / 2}px`;
      ring.style.top = `${rect.top + rect.height / 2 - size / 2}px`;
      ring.hidden = false;
    },
    progress(value) {
      ring.classList.remove("is-fading");
      ring.style.setProperty("--forvo-helper-progress", String(Math.max(0, Math.min(1, value))));
    },
    flash(kind) {
      ring.classList.remove("is-ok", "is-error", "is-fading");
      ring.classList.add(kind === "error" ? "is-error" : "is-ok");
      setTimeout(() => {
        ring.classList.add("is-fading");
      }, 260);
      setTimeout(() => {
        ring.classList.remove("is-ok", "is-error", "is-fading");
        ring.hidden = true;
      }, 560);
    },
    hide() {
      ring.classList.remove("is-ok", "is-error", "is-fading");
      ring.hidden = true;
    },
    destroy() {
      ring.remove();
    }
  };
}
