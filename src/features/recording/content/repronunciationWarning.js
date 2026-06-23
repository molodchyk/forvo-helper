const REPRONUNCIATION_PATTERN = /previously\s+pronounced/i;
const VOTES_REMOVED_PATTERN = /votes\s+will\s+also\s+be\s+removed/i;

export function hasRepronunciationWarning(doc = document) {
  const notices = [
    ...doc.querySelectorAll("#displayer > div > section > p.notice.error"),
    ...doc.querySelectorAll("p.notice.error")
  ];

  return notices.some((notice) => {
    const text = String(notice.textContent || "").replace(/\s+/g, " ").trim();
    return REPRONUNCIATION_PATTERN.test(text) && VOTES_REMOVED_PATTERN.test(text);
  });
}
