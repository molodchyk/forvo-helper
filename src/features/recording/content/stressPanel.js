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
      renderStressText(value, text);

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

export function createStressTextParts(text) {
  const normalized = String(text || "").normalize("NFD");
  const clusters = splitClusters(normalized);

  return clusters
    .map((cluster) => ({
      text: cluster.replace(/[\u0301\u0341]/gu, "").normalize("NFC"),
      stressed: /[\u0301\u0341]/u.test(cluster)
    }))
    .filter((part) => part.text);
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

function renderStressText(element, text) {
  element.textContent = "";

  for (const part of createStressTextParts(text)) {
    if (!part.stressed) {
      element.append(document.createTextNode(part.text));
      continue;
    }

    const letter = document.createElement("span");
    letter.className = "forvo-helper-stress-panel__stressed-letter";
    letter.textContent = part.text;
    element.append(letter);
  }
}

function splitClusters(text) {
  const clusters = [];
  let current = "";

  for (const character of text) {
    if (/[\p{M}]/u.test(character) && current) {
      current += character;
      continue;
    }

    if (current) {
      clusters.push(current);
    }

    current = character;
  }

  if (current) {
    clusters.push(current);
  }

  return clusters;
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
