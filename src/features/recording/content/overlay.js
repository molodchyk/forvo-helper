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

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) + 28;

      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.left = `${rect.left + rect.width / 2 - size / 2}px`;
      ring.style.top = `${rect.top + rect.height / 2 - size / 2}px`;
      ring.hidden = false;
    },
    progress(value) {
      ring.style.setProperty("--forvo-helper-progress", String(Math.max(0, Math.min(1, value))));
    },
    flash(kind) {
      ring.classList.remove("is-ok", "is-error");
      ring.classList.add(kind === "error" ? "is-error" : "is-ok");
      setTimeout(() => ring.classList.remove("is-ok", "is-error"), 550);
    },
    hide() {
      ring.hidden = true;
    },
    destroy() {
      ring.remove();
    }
  };
}

