import assert from "node:assert/strict";
import test from "node:test";
import {
  findLatestUserMessageText,
  latestUserMessageMatchesPrompt,
  normalizeMessageText,
  shouldWaitForChatGptThread
} from "./chatGptThread.js";

test("finds the latest explicit ChatGPT user message", () => {
  const first = fakeElement({ textContent: "чемерисів" });
  const second = fakeElement({ textContent: "Чемерисів-Барських" });
  const doc = fakeDocument({ explicitUserMessages: [first, second] });

  assert.equal(findLatestUserMessageText(doc), "Чемерисів-Барських");
});

test("uses right-aligned ChatGPT bubble fallback when role attributes are absent", () => {
  const assistant = fakeElement({
    textContent: "Assistant answer",
    role: "assistant",
    rect: { left: 80, right: 520, width: 440, height: 60 }
  });
  const user = fakeElement({
    textContent: "Чемерисів-Барських",
    className: "max-w-full min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap",
    rect: { left: 660, right: 920, width: 260, height: 42 }
  });
  const doc = fakeDocument({ messageCandidates: [assistant, user] });

  assert.equal(findLatestUserMessageText(doc), "Чемерисів-Барських");
});

test("matches duplicate prompts after whitespace normalization", () => {
  const user = fakeElement({ textContent: "Чемерисів-\nБарських" });
  const doc = fakeDocument({ explicitUserMessages: [user] });

  assert.equal(latestUserMessageMatchesPrompt(doc, "Чемерисів Барських"), false);
  assert.equal(latestUserMessageMatchesPrompt(doc, " Чемерисів- Барських ".replace("- ", "-\n")), true);
});

test("does not treat assistant messages as latest user messages", () => {
  const assistant = fakeElement({
    textContent: "Чемерисів-Барських",
    role: "assistant",
    rect: { left: 90, right: 570, width: 480, height: 80 }
  });
  const doc = fakeDocument({ messageCandidates: [assistant] });

  assert.equal(findLatestUserMessageText(doc), "");
  assert.equal(latestUserMessageMatchesPrompt(doc, "Чемерисів-Барських"), false);
});

test("waits for configured conversation threads before inserting", () => {
  const doc = fakeDocument({});

  assert.equal(shouldWaitForChatGptThread(doc, "https://chatgpt.com/c/abc"), true);
  assert.equal(shouldWaitForChatGptThread(doc, "https://chatgpt.com/"), false);
});

test("normalizes message text without changing hyphen semantics", () => {
  assert.equal(normalizeMessageText(" Чемерисів-\nБарських "), "Чемерисів- Барських");
  assert.notEqual(normalizeMessageText("Чемерисів-Барських"), normalizeMessageText("Чемерисів Барських"));
});

function fakeDocument({ explicitUserMessages = [], messageCandidates = [] }) {
  const root = fakeElement({
    rect: { left: 0, right: 1000, width: 1000, height: 900 },
    messageCandidates,
    explicitUserMessages
  });

  return {
    body: root,
    querySelector(selector) {
      return selector === "#thread" || selector === "main" ? root : null;
    }
  };
}

function fakeElement({
  textContent = "",
  className = "",
  role = "",
  rect = { left: 100, right: 300, width: 200, height: 40 },
  messageCandidates = [],
  explicitUserMessages = []
} = {}) {
  return {
    textContent,
    className,
    parentElement: null,
    getBoundingClientRect() {
      return rect;
    },
    closest(selector) {
      if (selector.includes("data-message-author-role='assistant'") && role === "assistant") {
        return this;
      }

      if (selector.includes("data-message-author-role='user'") && role === "user") {
        return this;
      }

      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes("data-message-author-role='user'")) {
        return explicitUserMessages;
      }

      if (selector.includes("whitespace-pre-wrap") || selector.includes("overflow-wrap")) {
        return messageCandidates;
      }

      return [];
    }
  };
}
