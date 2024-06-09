chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ defaultHighlightColor: "#ffff00" });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content_script.js"],
  });
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (command === "highlight_text") {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: applyTextHighlight,
      });
    } else if (command === "create_note") {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: showNotePrompt,
      });
    }
  });
});

function applyTextHighlight() {
  const selectedText = window.getSelection().toString();
  if (selectedText.length > 0) {
    chrome.storage.local.get(["defaultHighlightColor"], function (result) {
      const highlightColor = result.defaultHighlightColor || "#ffff00";
      const highlightSpan = document.createElement("span");
      highlightSpan.style.backgroundColor = highlightColor;
      highlightSpan.className = "highlight";
      highlightSpan.textContent = selectedText;

      const textRange = window.getSelection().getRangeAt(0);
      textRange.deleteContents();
      textRange.insertNode(highlightSpan);
    });
  }
}

function showNotePrompt() {
  const userNote = prompt("Please enter your note:");
  if (userNote) {
    chrome.runtime.sendMessage({ action: "storeNote", note: userNote });
  }
}
