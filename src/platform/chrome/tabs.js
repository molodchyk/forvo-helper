export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

export async function openOrReuseTab({ url, matchPatterns, active = false, reuse = true, updateExistingUrl = true }) {
  if (reuse) {
    const tabs = await chrome.tabs.query({ url: matchPatterns });
    const existing = tabs.find((tab) => typeof tab.id === "number");

    if (existing) {
      if (updateExistingUrl) {
        return chrome.tabs.update(existing.id, { url, active });
      }

      return active ? chrome.tabs.update(existing.id, { active }) : existing;
    }
  }

  return chrome.tabs.create({ url, active });
}

export async function waitForTabComplete(tabId, timeoutMs = 10000) {
  const tab = await chrome.tabs.get(tabId);

  if (tab.status === "complete") {
    return tab;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.get(tabId).then(resolve, () => resolve({ id: tabId }));
    }, timeoutMs);

    function listener(updatedTabId, changeInfo, updatedTab) {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") {
        return;
      }

      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(updatedTab);
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

export async function sendTabMessage(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    return null;
  }
}
