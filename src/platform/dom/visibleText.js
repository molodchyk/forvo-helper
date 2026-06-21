const HIDDEN_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

export function collectVisibleText(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!parent || HIDDEN_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      const style = getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }

      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const parts = [];

  while (walker.nextNode()) {
    parts.push(walker.currentNode.nodeValue.trim());
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

