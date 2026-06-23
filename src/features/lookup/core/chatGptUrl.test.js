import assert from "node:assert/strict";
import test from "node:test";
import { buildChatGptReusePatterns } from "./chatGptUrl.js";

test("uses exact root ChatGPT target for root configuration", () => {
  assert.deepEqual(buildChatGptReusePatterns("https://chatgpt.com/"), ["https://chatgpt.com/"]);
});

test("scopes ChatGPT reuse to the configured conversation URL", () => {
  assert.deepEqual(
    buildChatGptReusePatterns("https://chatgpt.com/c/6a369b78-ce20-83ed-b94f-31929f6e1e54"),
    ["https://chatgpt.com/c/6a369b78-ce20-83ed-b94f-31929f6e1e54*"]
  );
});

test("matches configured ChatGPT conversations with a trailing slash or query", () => {
  assert.deepEqual(
    buildChatGptReusePatterns("https://chatgpt.com/c/6a369b78-ce20-83ed-b94f-31929f6e1e54/?model=gpt-5"),
    ["https://chatgpt.com/c/6a369b78-ce20-83ed-b94f-31929f6e1e54*"]
  );
});

test("supports legacy ChatGPT host", () => {
  assert.deepEqual(
    buildChatGptReusePatterns("https://chat.openai.com/c/example"),
    ["https://chat.openai.com/c/example*"]
  );
});

test("falls back to the default ChatGPT target for unsupported URLs", () => {
  assert.deepEqual(buildChatGptReusePatterns("https://example.com/c/example"), ["https://chatgpt.com/"]);
  assert.deepEqual(buildChatGptReusePatterns("not a url"), ["https://chatgpt.com/"]);
});
