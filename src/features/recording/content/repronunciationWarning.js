const SECTION_WARNING_SELECTOR = [
  "#displayer > div > section > p.notice.error",
  "#displayer section.main_section > p.notice.error"
].join(",");
const SEND_BUTTON_SELECTOR = "#sendAudio";
const RECORDER_SELECTOR = "#recorder, #canvas-recorder, canvas#canvas-recorder";
const REPRONUNCIATION_WARNING_PATTERNS = [
  {
    alreadyPronounced: /previously\s+pronounced/i,
    consequence: /votes\s+will\s+also\s+be\s+removed/i
  },
  {
    alreadyPronounced: /вже\s+записували/i,
    consequence: /попередня\s+вимова\s+та\s+голоси\s+за\s+неї\s+будуть\s+втрачені/i
  }
];

export function hasRepronunciationWarning(doc = document) {
  const notices = [...doc.querySelectorAll(SECTION_WARNING_SELECTOR)];

  return notices.some((notice) => {
    const text = String(notice.textContent || "").replace(/\s+/g, " ").trim();

    return Boolean(text) && (
      hasRecorderWorkflow(notice) || hasKnownWarningText(text)
    );
  });
}

function hasRecorderWorkflow(notice) {
  const section = notice.closest?.("section");

  return Boolean(
    section?.querySelector?.(SEND_BUTTON_SELECTOR)
      && section.querySelector(RECORDER_SELECTOR)
  );
}

function hasKnownWarningText(text) {
  return REPRONUNCIATION_WARNING_PATTERNS.some(({ alreadyPronounced, consequence }) => (
    alreadyPronounced.test(text) && consequence.test(text)
  ));
}
