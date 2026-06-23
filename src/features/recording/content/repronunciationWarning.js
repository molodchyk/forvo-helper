const SECTION_WARNING_SELECTOR = [
  "#displayer > div > section > p.notice.error",
  "#displayer section.main_section > p.notice.error"
].join(",");
const SEND_BUTTON_SELECTOR = "#sendAudio";
const RECORDER_SELECTOR = "#recorder, #canvas-recorder, canvas#canvas-recorder";

export function hasRepronunciationWarning(doc = document) {
  const notices = [...doc.querySelectorAll(SECTION_WARNING_SELECTOR)];

  return notices.some((notice) => {
    const text = String(notice.textContent || "").replace(/\s+/g, " ").trim();
    const section = notice.closest?.("section");

    return Boolean(
      text
        && section?.querySelector?.(SEND_BUTTON_SELECTOR)
        && section.querySelector(RECORDER_SELECTOR)
    );
  });
}
