const CHATGPT_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);
const DEFAULT_CHATGPT_REUSE_PATTERN = "https://chatgpt.com/";

export function buildChatGptReusePatterns(chatGptUrl) {
  try {
    const url = new URL(String(chatGptUrl || ""));

    if (url.protocol !== "https:" || !CHATGPT_HOSTS.has(url.hostname)) {
      return [DEFAULT_CHATGPT_REUSE_PATTERN];
    }

    const origin = `${url.protocol}//${url.hostname}`;
    const path = trimTrailingSlash(url.pathname || "/") || "/";

    if (path === "/") {
      return [`${origin}/`];
    }

    return [`${origin}${path}*`];
  } catch {
    return [DEFAULT_CHATGPT_REUSE_PATTERN];
  }
}

function trimTrailingSlash(path) {
  return path === "/" ? path : path.replace(/\/+$/u, "");
}
