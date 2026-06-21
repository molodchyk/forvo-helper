import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import {
  extractForvoWordFromUrl,
  normalizeForvoRecordingUrl,
  normalizeLookupWord
} from "../../lookup/core/word.js";
import { eventMatchesHotkey } from "../core/hotkey.js";
import { createCircleGestureState, gestureProgress, updateCircleGesture } from "../core/gesture.js";
import { activateRecordButton } from "./activator.js";
import { createRecordOverlay } from "./overlay.js";
import { findRecordButton } from "./recordButtonFinder.js";
import { getRecordActivationPoint, isPointInRecordHoverArea } from "./recordGeometry.js";
import { addRuntimeMessageListener, sendRuntimeMessage } from "../../../platform/chrome/runtime.js";
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
    this.hoverZoneActive = false;
    this.hoverTriggeredInZone = false;
    this.gestureState = null;
    this.layoutRefreshTimers = new Set();
    this.layoutRefreshFrame = null;
    this.resizeObserver = null;
  }

  async start() {
    this.settings = await readSettings();
    this.installListeners();
    this.refreshTarget();
    this.scheduleLayoutRefreshes();
    this.notifyWordDetected();

    this.observer = new MutationObserver(() => {
      this.scheduleRefresh();
      this.notifyWordDetected();
    });
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "height", "style", "width"],
      childList: true,
      subtree: true
    });
  }

  installListeners() {
    document.addEventListener("keydown", (event) => this.handleKeyDown(event), true);
    document.addEventListener("pointermove", (event) => this.handlePointerMove(event), true);
    document.addEventListener("click", (event) => this.handleDocumentClick(event));
    window.addEventListener("load", () => this.scheduleLayoutRefreshes(), { once: true });
    window.addEventListener("resize", () => this.scheduleRefresh(), { passive: true });
    window.addEventListener("scroll", () => this.scheduleRefresh(), { passive: true });
    document.fonts?.ready?.then(() => this.scheduleLayoutRefreshes());
    addRuntimeMessageListener((message, _sender, sendResponse) => {
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
      this.scheduleLayoutRefreshes();
    });
  }

  refreshTarget() {
    const nextTarget = findRecordButton(document);

    if (nextTarget !== this.target) {
      this.detachHover();
      this.target = nextTarget;
      this.attachHover();
      this.observeTarget();
    }

    if (this.settings?.recording.showRecordRing && this.target) {
      this.overlay.position(this.target);
    } else {
      this.overlay.hide();
    }

    return this.target;
  }

  scheduleRefresh() {
    if (this.layoutRefreshFrame) {
      return;
    }

    this.layoutRefreshFrame = requestAnimationFrame(() => {
      this.layoutRefreshFrame = null;
      this.refreshTarget();
    });
  }

  scheduleLayoutRefreshes() {
    for (const timer of this.layoutRefreshTimers) {
      clearTimeout(timer);
    }
    this.layoutRefreshTimers.clear();

    this.scheduleRefresh();
    requestAnimationFrame(() => requestAnimationFrame(() => this.refreshTarget()));

    for (const delay of [80, 180, 360, 720, 1200, 2000]) {
      const timer = setTimeout(() => {
        this.layoutRefreshTimers.delete(timer);
        this.refreshTarget();
      }, delay);
      this.layoutRefreshTimers.add(timer);
    }
  }

  observeTarget() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (!this.target || !globalThis.ResizeObserver) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.scheduleRefresh());
    this.resizeObserver.observe(this.target);

    const container = this.target.closest("#animation_container, #recorder");
    if (container) {
      this.resizeObserver.observe(container);
    }
  }

  notifyWordDetected() {
    const word = extractForvoWordFromUrl(location.href) || extractWordFromPage();

    if (!word || word === this.lastWord) {
      return;
    }

    this.lastWord = word;
    sendRuntimeMessage({
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

  handleDocumentClick(event) {
    const button = event.target instanceof Element ? event.target.closest("#sendAudio") : null;

    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }

    this.notifyPronunciationSubmitted();
  }

  attachHover() {
    if (!this.target) {
      return;
    }

    this.pointerEnter = (event) => this.handleHoverPointer(event);
    this.pointerMove = (event) => this.handleHoverPointer(event);
    this.pointerLeave = () => {
      this.hoverZoneActive = false;
      this.hoverTriggeredInZone = false;
      this.cancelHover();
    };
    this.target.addEventListener("pointerenter", this.pointerEnter);
    this.target.addEventListener("pointermove", this.pointerMove);
    this.target.addEventListener("pointerleave", this.pointerLeave);
  }

  detachHover() {
    if (!this.target || !this.pointerEnter || !this.pointerLeave) {
      return;
    }

    this.target.removeEventListener("pointerenter", this.pointerEnter);
    this.target.removeEventListener("pointermove", this.pointerMove);
    this.target.removeEventListener("pointerleave", this.pointerLeave);
    this.pointerEnter = null;
    this.pointerMove = null;
    this.pointerLeave = null;
    this.hoverZoneActive = false;
    this.hoverTriggeredInZone = false;
  }

  handleHoverPointer(event) {
    if (!this.settings?.recording.hoverEnabled || !this.target) {
      return;
    }

    const insideHoverArea = isPointInRecordHoverArea(this.target, {
      x: event.clientX,
      y: event.clientY
    });

    if (!insideHoverArea) {
      this.hoverZoneActive = false;
      this.hoverTriggeredInZone = false;
      this.cancelHover();
      return;
    }

    if (!this.hoverZoneActive) {
      this.hoverZoneActive = true;
      this.hoverTriggeredInZone = false;
    }

    if (!this.hoverTimer && !this.hoverTriggeredInZone) {
      this.startHover();
    }
  }

  startHover() {
    if (!this.settings?.recording.hoverEnabled) {
      return;
    }

    const delay = this.settings.recording.hoverDelayMs;
    const startedAt = performance.now();

    this.cancelHover();
    this.hoverTimer = setTimeout(() => {
      this.hoverTriggeredInZone = true;
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
    sendRuntimeMessage({
      type: MESSAGE_TYPES.RECORDING_TRIGGERED,
      source,
      ok,
      word: this.lastWord,
      url: location.href
    });

    return ok;
  }

  notifyPronunciationSubmitted() {
    const normalizedUrl = normalizeForvoRecordingUrl(location.href);
    const word = extractForvoWordFromUrl(location.href) || this.lastWord || extractWordFromPage();

    if (!normalizedUrl || !word) {
      return;
    }

    sendRuntimeMessage({
      type: MESSAGE_TYPES.FORVO_PRONUNCIATION_SUBMITTED,
      word,
      url: location.href,
      normalizedUrl
    });
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
