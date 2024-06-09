document.getElementById("highlight-btn").addEventListener("click", () => {
  const chosenColor = document.getElementById("highlight-color").value;
  chrome.storage.local.set({ chosenColor });
});

document.getElementById("save-note-btn").addEventListener("click", () => {
  const userNote = document.getElementById("note").value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "storeNote", note: userNote },
      (response) => {
        if (response.status === "note saved") {
          document.getElementById("note").value = "";
          renderAnnotations();
        }
      }
    );
  });
});

document.getElementById("search-btn").addEventListener("click", () => {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  renderAnnotations(searchTerm);
});

function renderAnnotations(filter = "") {
  chrome.storage.local.get(["annotations"], (result) => {
    const annotationContainer = document.getElementById("annotations-list");
    annotationContainer.innerHTML = "";
    const allAnnotations = result.annotations || {};

    Object.keys(allAnnotations).forEach((url) => {
      allAnnotations[url].forEach((annotation) => {
        if (
          (annotation.text && annotation.text.toLowerCase().includes(filter)) ||
          (annotation.note && annotation.note.toLowerCase().includes(filter))
        ) {
          const annotationElement = document.createElement("div");
          annotationElement.className = "annotation-item";
          annotationElement.textContent = annotation.text || annotation.note;
          annotationContainer.appendChild(annotationElement);
        }
      });
    });
  });
}

document.getElementById("export-btn").addEventListener("click", () => {
  chrome.storage.local.get(["annotations"], (result) => {
    const allAnnotations = result.annotations || {};
    const dataBlob = new Blob([JSON.stringify(allAnnotations, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(dataBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "annotations.json";
    downloadLink.click();
  });
});

renderAnnotations();
