let highlightedText = '';
const currentUrl = window.location.href;

document.addEventListener('mouseup', (event) => {
  highlightedText = window.getSelection().toString();
  if (highlightedText.length > 0) {
    chrome.storage.local.get(['highlightColor', 'annotations'], function(result) {
      const highlightColor = result.highlightColor || '#ffff00';
      const annotations = result.annotations || {};

      const spanElement = document.createElement('span');
      spanElement.style.backgroundColor = highlightColor;
      spanElement.className = 'highlighted-text';
      spanElement.textContent = highlightedText;

      const range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      range.insertNode(spanElement);

      const newHighlight = {
        text: highlightedText,
        color: highlightColor,
        url: currentUrl,
        position: {
          start: range.startOffset,
          end: range.endOffset,
          parentXPath: getElementXPath(range.startContainer.parentNode)
        }
      };

      if (!annotations[currentUrl]) {
        annotations[currentUrl] = [];
      }
      annotations[currentUrl].push(newHighlight);

      chrome.storage.local.set({ annotations });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'saveNote') {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    noteDiv.textContent = request.note;
    document.body.appendChild(noteDiv);

    chrome.storage.local.get(['annotations'], function(result) {
      const annotations = result.annotations || {};
      if (!annotations[currentUrl]) {
        annotations[currentUrl] = [];
      }
      annotations[currentUrl].push({
        note: request.note,
        url: currentUrl
      });
      chrome.storage.local.set({ annotations });
      sendResponse({ status: 'note saved' });
    });
  }
});

function getElementXPath(element) {
  if (element.id !== '') {
    return 'id("' + element.id + '")';
  }
  if (element === document.body) {
    return element.tagName;
  }
  let index = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return getElementXPath(element.parentNode) + '/' + element.tagName + '[' + (index + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      index++;
    }
  }
  return null;
}

function restoreHighlightsAndNotes() {
  chrome.storage.local.get(['annotations'], function(result) {
    const annotations = result.annotations || {};
    if (annotations[currentUrl]) {
      annotations[currentUrl].forEach(annotation => {
        if (annotation.text) {
          const range = document.createRange();
          const parentElement = document.evaluate(annotation.position.parentXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          range.setStart(parentElement.childNodes[0], annotation.position.start);
          range.setEnd(parentElement.childNodes[0], annotation.position.end);

          const spanElement = document.createElement('span');
          spanElement.style.backgroundColor = annotation.color;
          spanElement.className = 'highlighted-text';
          spanElement.textContent = annotation.text;

          range.deleteContents();
          range.insertNode(spanElement);
        } else if (annotation.note) {
          const noteDiv = document.createElement('div');
          noteDiv.className = 'note';
          noteDiv.textContent = annotation.note;
          document.body.appendChild(noteDiv);
        }
      });
    }
  });
}

restoreHighlightsAndNotes();
