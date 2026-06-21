export function addRuntimeMessageListener(listener) {
  const runtime = getRuntime();

  if (!runtime?.onMessage?.addListener) {
    return () => {};
  }

  try {
    runtime.onMessage.addListener(listener);
  } catch {
    return () => {};
  }

  return () => {
    try {
      runtime.onMessage.removeListener?.(listener);
    } catch {
      // Extension contexts can be invalidated while a page stays open.
    }
  };
}

export async function sendRuntimeMessage(message) {
  const runtime = getRuntime();

  if (!runtime?.sendMessage) {
    return undefined;
  }

  try {
    return await runtime.sendMessage(message);
  } catch {
    return undefined;
  }
}

function getRuntime() {
  return globalThis.chrome?.runtime;
}
