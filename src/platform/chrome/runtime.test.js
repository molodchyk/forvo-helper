import assert from "node:assert/strict";
import test from "node:test";
import { addRuntimeMessageListener, sendRuntimeMessage } from "./runtime.js";

test("runtime messaging helpers are inert when chrome.runtime is unavailable", async () => {
  const originalChrome = globalThis.chrome;

  try {
    delete globalThis.chrome;

    const removeListener = addRuntimeMessageListener(() => {});
    assert.equal(typeof removeListener, "function");
    removeListener();
    assert.equal(await sendRuntimeMessage({ type: "test" }), undefined);
  } finally {
    if (originalChrome === undefined) {
      delete globalThis.chrome;
    } else {
      globalThis.chrome = originalChrome;
    }
  }
});

test("runtime messaging helpers use chrome.runtime when available", async () => {
  const originalChrome = globalThis.chrome;
  const listeners = new Set();

  try {
    globalThis.chrome = {
      runtime: {
        onMessage: {
          addListener(listener) {
            listeners.add(listener);
          },
          removeListener(listener) {
            listeners.delete(listener);
          }
        },
        sendMessage(message) {
          return Promise.resolve({ ok: message.type === "test" });
        }
      }
    };

    const listener = () => {};
    const removeListener = addRuntimeMessageListener(listener);
    assert.equal(listeners.has(listener), true);
    removeListener();
    assert.equal(listeners.has(listener), false);
    assert.deepEqual(await sendRuntimeMessage({ type: "test" }), { ok: true });
  } finally {
    if (originalChrome === undefined) {
      delete globalThis.chrome;
    } else {
      globalThis.chrome = originalChrome;
    }
  }
});
