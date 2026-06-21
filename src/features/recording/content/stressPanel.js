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
    return matchDisplayCase(result.stressedWord || result.stressSample || "", result.word);
  }

  if (result?.stressState === "missing") {
    return "No stress mark found";
  }

  return "";
}

export function matchDisplayCase(text, reference) {
  const source = String(text || "");
  const style = detectCaseStyle(reference);

  if (style === "lower") {
    return source.toLocaleLowerCase("uk-UA");
  }

  if (style === "upper") {
    return source.toLocaleUpperCase("uk-UA");
  }

  if (style === "title") {
    return titleCaseFirstLetter(source);
  }

  return source;
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

function detectCaseStyle(reference) {
  const letters = createStressTextParts(reference)
    .flatMap((part) => [...part.text])
    .filter((character) => /\p{L}/u.test(character));

  if (!letters.length) {
    return "asis";
  }

  const upperFlags = letters.map((letter) => letter === letter.toLocaleUpperCase("uk-UA"));
  const lowerFlags = letters.map((letter) => letter === letter.toLocaleLowerCase("uk-UA"));
  const allUpper = upperFlags.every(Boolean) && !lowerFlags.every(Boolean);
  const allLower = lowerFlags.every(Boolean) && !upperFlags.every(Boolean);

  if (allUpper) {
    return "upper";
  }

  if (allLower) {
    return "lower";
  }

  if (upperFlags[0] && letters.slice(1).every((letter) => letter === letter.toLocaleLowerCase("uk-UA"))) {
    return "title";
  }

  return "asis";
}

function titleCaseFirstLetter(text) {
  const lower = String(text || "").toLocaleLowerCase("uk-UA").normalize("NFD");
  const clusters = splitClusters(lower);
  const firstLetterIndex = clusters.findIndex((cluster) => /\p{L}/u.test(cluster));

  if (firstLetterIndex === -1) {
    return String(text || "");
  }

  clusters[firstLetterIndex] = clusters[firstLetterIndex].toLocaleUpperCase("uk-UA");
  return clusters.join("").normalize("NFC");
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
