export function findSendPronunciationButton(target) {
  const button = target?.closest?.("#sendAudio") || null;

  if (!button || button.tagName !== "BUTTON" || button.disabled) {
    return null;
  }

  return button;
}
