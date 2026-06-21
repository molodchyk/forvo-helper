import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import { extractForvoWordFromUrl, normalizeLookupWord } from "../../lookup/core/word.js";
import { eventMatchesHotkey } from "../core/hotkey.js";
import { createCircleGestureState, gestureProgress, updateCircleGesture } from "../core/gesture.js";
import { activateRecordButton } from "./activator.js";
import { createRecordOverlay } from "./overlay.js";
import { findRecordButton } from "./recordButtonFinder.js";
import { getRecordActivationPoint } from "./recordGeometry.js";
import { onSettingsChanged, readSettings } from "../../../platform/chrome/storage.js";

export function startForvoController() {
  const controller = new ForvoController();
  controller.start();
  return controller;
}

class ForvoController {
  constructor() {
    this.settings = null;
    this.target = null;
    this.overlay = createRecordOverlay();
    this.lastWord = "";
    this.hoverTimer = null;
    this.hoverFrame = null;
    this.gestureState = null;
  }

  async start() {
    this.settings = await readSettings();
    this.installListeners();
    this.refreshTarget();
    this.notifyWordDetected();

    this.observer = new MutationObserver(() => {
      this.refreshTarget();
      this.notifyWordDetected();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  installListeners() {
    document.addEventListener("keydown", (event) => this.handleKeyDown(event), true);
    document.addEventListener("pointermove", (event) => this.handlePointerMove(event), true);
    window.addEventListener("resize", () => this.refreshTarget(), { passive: true });
    window.addEventListener("scroll", () => this.refreshTarget(), { passive: true });
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== MESSAGE_TYPES.START_RECORDING) {
        return false;
      }

      sendResponse({ ok: this.triggerRecording("command") });
      return true;
    });
    onSettingsChanged((settings) => {
      this.settings = settings;
      this.cancelHover();
      this.gestureState = null;
      this.refreshTarget();
    });
  }

  refreshTarget() {
    const nextTarget = findRecordButton(document);

    if (nextTarget !== this.target) {
      this.detachHover();
      this.target = nextTarget;
      this.attachHover();
    }

    if (this.settings?.recording.showRecordRing && this.target) {
      this.overlay.position(this.target);
    } else {
      this.overlay.hide();
    }

    return this.target;
  }

  notifyWordDetected() {
    const word = extractForvoWordFromUrl(location.href) || extractWordFromPage();

    if (!word || word === this.lastWord) {
      return;
    }

    this.lastWord = word;
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.FORVO_WORD_DETECTED,
      word,
      url: location.href
    });
  }

  handleKeyDown(event) {
    if (!this.settings?.recording.pageHotkeyEnabled) {
      return;
    }

    if (!eventMatchesHotkey(event, this.settings.recording.hotkey)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.triggerRecording("page-hotkey");
  }

  attachHover() {
    if (!this.target) {
      return;
    }

    this.pointerEnter = () => this.startHover();
    this.pointerLeave = () => this.cancelHover();
    this.target.addEventListener("pointerenter", this.pointerEnter);
    this.target.addEventListener("pointerleave", this.pointerLeave);
  }

  detachHover() {
    if (!this.target || !this.pointerEnter || !this.pointerLeave) {
      return;
    }

    this.target.removeEventListener("pointerenter", this.pointerEnter);
    this.target.removeEventListener("pointerleave", this.pointerLeave);
    this.pointerEnter = null;
    this.pointerLeave = null;
  }

  startHover() {
    if (!this.settings?.recording.hoverEnabled) {
      return;
    }

    const delay = this.settings.recording.hoverDelayMs;
    const startedAt = performance.now();

    this.cancelHover();
    this.hoverTimer = setTimeout(() => {
      this.triggerRecording("hover");
      this.cancelHover();
    }, delay);

    const updateProgress = () => {
      const progress = Math.min(1, (performance.now() - startedAt) / delay);
      this.overlay.progress(progress);

      if (progress < 1 && this.hoverTimer) {
        this.hoverFrame = requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
  }

  cancelHover() {
    clearTimeout(this.hoverTimer);
    cancelAnimationFrame(this.hoverFrame);
    this.hoverTimer = null;
    this.hoverFrame = null;
    this.overlay.progress(0);
  }

  handlePointerMove(event) {
    if (!this.settings?.recording.gestureEnabled || !this.target) {
      return;
    }

    const center = getRecordActivationPoint(this.target);

    if (!this.gestureState) {
      this.gestureState = createCircleGestureState(center);
    } else {
      this.gestureState.center = center;
    }

    this.gestureState = updateCircleGesture(this.gestureState, {
      x: event.clientX,
      y: event.clientY
    });
    this.overlay.progress(gestureProgress(this.gestureState));

    if (this.gestureState.completed) {
      this.triggerRecording("gesture");
      this.gestureState = createCircleGestureState(center);
      this.overlay.progress(0);
    }
  }

  triggerRecording(source) {
    const target = this.refreshTarget();
    const ok = activateRecordButton(target);

    this.overlay.flash(ok ? "ok" : "error");
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.RECORDING_TRIGGERED,
      source,
      ok,
      word: this.lastWord,
      url: location.href
    });

    return ok;
  }
}

function extractWordFromPage() {
  const label = [...document.querySelectorAll("body *")]
    .find((element) => /you are pronouncing/i.test(element.textContent || ""));

  if (!label) {
    return "";
  }

  const region = label.closest("section,article,main,div") || document.body;
  const candidates = [...region.querySelectorAll("strong,b,h1,h2,h3")]
    .map((element) => normalizeLookupWord(element.textContent))
    .filter((text) => text.length > 1);

  return candidates[0] || "";
}
