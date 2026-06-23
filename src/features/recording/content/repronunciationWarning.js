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
  const notices = [
    ...doc.querySelectorAll("#displayer > div > section > p.notice.error"),
    ...doc.querySelectorAll("p.notice.error")
  ];

  return notices.some((notice) => {
    const text = String(notice.textContent || "").replace(/\s+/g, " ").trim();
    return REPRONUNCIATION_WARNING_PATTERNS.some(({ alreadyPronounced, consequence }) => (
      alreadyPronounced.test(text) && consequence.test(text)
    ));
  });
}
