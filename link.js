/* ---------------------------
  Google Script URL
---------------------------- */
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz7IoXYmXJuWo1s03bP45N9HsWdev-WNhfghk-epiKWqCfseyZwUb6qtv2QFc70JI-bWA/exec";

/* ---------------------------
  Get customer name from URL
---------------------------- */
function getNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "";
}

/* ---------------------------
  Generate Request ID
---------------------------- */
function generateRequestID() {
  return "ALCREQ" + Math.floor(100 + Math.random() * 900);
}

/* ---------------------------
  DOM elements
---------------------------- */
const elRequest = document.getElementById("requestNumber");
const elName = document.getElementById("customerName");
const elStart = document.getElementById("startKYC");
const elStop = document.getElementById("stopBtn");
const elUpload = document.getElementById("uploadBtn");
const elPreview = document.getElementById("preview");
const elRecorded = document.getElementById("recorded");
const elStatus = document.getElementById("status");

let mediaRecorder = null;
let recordedChunks = [];
let finalBlob = null;

/* ---------------------------
  Init Page (Name + Request ID)
---------------------------- */
(function initUser() {
  const name = getNameFromURL();
  elName.textContent = name ? Dear ${name}, : "Dear Customer,";
  elRequest.textContent = Video KYC Process for Request No: ${generateRequestID()};
})();

/* ---------------------------
  Start Recording
---------------------------- */
elStart.addEventListener("click", async () => {
  recordedChunks = [];
  finalBlob = null;

  elRecorded.style.display = "none";
  elUpload.style.display = "none";
  elStatus.textContent = "";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Show live camera preview
    elPreview.srcObject = stream;
    elPreview.style.display = "block";

    // UI updates
    elStart.style.display = "none";
    elStop.style.display = "inline-block";
    elStatus.textContent = "Recording...";

    // Create recorder
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      finalBlob = new Blob(recordedChunks, { type: "video/webm" });

      elRecorded.src = URL.createObjectURL(finalBlob);
      elRecorded.style.display = "block";

      elUpload.style.display = "inline-block";
      elStatus.textContent = "Recording stopped — preview below.";
    };

    mediaRecorder.start();
  } catch (err) {
    console.error("Camera Error:", err);
    elStatus.textContent =
      "Camera not accessible. Allow permission & use HTTPS mode.";
    alert("Camera access failed: " + err);
  }
});

/* ---------------------------
  Stop Recording
---------------------------- */
elStop.addEventListener("click", () => {
  if (mediaRecorder) mediaRecorder.stop();

  if (elPreview.srcObject) {
    elPreview.srcObject.getTracks().forEach((track) => track.stop());
    elPreview.srcObject = null;
  }

  elStop.style.display = "none";
  elStart.style.display = "inline-block";
});

/* ---------------------------
  Upload to Google Script
---------------------------- */
elUpload.addEventListener("click", async () => {
  if (!finalBlob) {
    alert("No video recorded yet.");
    return;
  }

  if (!GOOGLE_SCRIPT_URL) {
    alert("Google Script URL missing!");
    return;
  }

  elStatus.textContent = "Uploading...";
  elUpload.disabled = true;

  try {
    const fd = new FormData();
    fd.append("file", finalBlob, KYC_${Date.now()}.webm);

    const name = getNameFromURL();
    fd.append("name", name);
    fd.append("requestId", elRequest.textContent);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: fd,
    });

    const text = await response.text();

    elStatus.textContent = "Upload completed.";
    alert("Upload successful: " + text);
  } catch (err) {
    console.error(err);
    elStatus.textContent = "Upload failed.";
    alert("Upload failed: " + err);
  } finally {
    elUpload.disabled = false;
  }
});
