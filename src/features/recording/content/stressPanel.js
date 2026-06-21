export function createStressPanel() {
  const panel = document.createElement("aside");
  const label = document.createElement("span");
  const value = document.createElement("span");
  const link = document.createElement("a");

  panel.className = "forvo-helper-stress-panel";
  panel.hidden = true;
  label.className = "forvo-helper-stress-panel__label";
  value.className = "forvo-helper-stress-panel__value";
  link.className = "forvo-helper-stress-panel__link";
  label.textContent = "Goroh";
  link.textContent = "Open";
  link.target = "_blank";
  link.rel = "noreferrer";
  panel.append(label, value, link);

  return {
    render(result) {
      const text = displayText(result);

      if (!result?.word || !text) {
        panel.hidden = true;
        return;
      }

      ensureMounted(panel);
      panel.dataset.state = result.stressState || "unknown";
      value.textContent = text;

      if (result.gorohUrl) {
        link.href = result.gorohUrl;
        link.hidden = false;
      } else {
        link.removeAttribute("href");
        link.hidden = true;
      }

      panel.hidden = false;
    },
    hide() {
      panel.hidden = true;
    },
    destroy() {
      panel.remove();
    }
  };
}

function displayText(result) {
  if (result?.stressState === "found") {
    return result.stressedWord || result.stressSample || "";
  }

  if (result?.stressState === "missing") {
    return "No stress mark found";
  }

  return "";
}

function ensureMounted(panel) {
  if (panel.isConnected) {
    return;
  }

  const anchor = document.querySelector(".mainpage.page_word-record .main_section header, section.main_section header");
  const recorder = document.querySelector("#recorder");

  if (anchor) {
    anchor.insertAdjacentElement("afterend", panel);
  } else if (recorder?.parentElement) {
    recorder.parentElement.insertBefore(panel, recorder);
  } else {
    document.body.prepend(panel);
  }
}
