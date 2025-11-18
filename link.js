/* ---------------------------------------
   CONFIG – Google Script Upload URL
---------------------------------------- */
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz7IoXYmXJuWo1s03bP45N9HsWdev-WNhfghk-epiKWqCfseyZwUb6qtv2QFc70JI-bWA/exec";


/* ---------------------------------------
   Helper: Get Name from URL ?name=Sonali
---------------------------------------- */
function getNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "";
}


/* ---------------------------------------
   Generate Request ID
---------------------------------------- */
function generateRequestID() {
  return "ALCREQ" + Math.floor(100 + Math.random() * 900);
}


/* ---------------------------------------
   DOM references
---------------------------------------- */
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


/* ---------------------------------------
   Init User Name + Request ID
---------------------------------------- */
(function initUser() {
  const name = getNameFromURL();
  elName.textContent = name ? Dear ${name}, : "Dear Customer,";
  elRequest.textContent = Video KYC Process for Request No: ${generateRequestID()};
})();


/* ---------------------------------------
   START RECORDING (Mobile Friendly)
---------------------------------------- */
elStart.addEventListener("click", async () => {
  recordedChunks = [];
  finalBlob = null;

  elRecorded.style.display = "none";
  elUpload.style.display = "none";
  elStatus.textContent = "";

  try {
    // Mobile safe constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    });

    // Live preview
    elPreview.srcObject = stream;
    elPreview.style.display = "block";

    elStart.style.display = "none";
    elStop.style.display = "inline-block";
    elStatus.textContent = "Recording...";

    // MediaRecorder (mobile supported format)
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp8"
    });

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
    console.error(err);
    alert("Camera access failed: " + err);
    elStatus.textContent = "Camera not accessible. Try Chrome.";
  }
});


/* ---------------------------------------
   STOP RECORDING
---------------------------------------- */
elStop.addEventListener("click", () => {
  if (!mediaRecorder) return;

  mediaRecorder.stop();

  // Turn off camera after stopping
  if (elPreview.srcObject) {
    elPreview.srcObject.getTracks().forEach(t => t.stop());
    elPreview.srcObject = null;
  }

  elStop.style.display = "none";
  elStart.style.display = "inline-block";
});


/* ---------------------------------------
   UPLOAD VIDEO
---------------------------------------- */
elUpload.addEventListener("click", async () => {
  if (!finalBlob) {
    alert("No video recorded.");
    return;
  }

  elStatus.textContent = "Uploading...";
  elUpload.disabled = true;

  try {
    const fd = new FormData();
    fd.append("file", finalBlob, KYC_${Date.now()}.webm);
    fd.append("name", getNameFromURL());
    fd.append("requestId", elRequest.textContent);

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: fd,
    });

    const text = await res.text();
    elStatus.textContent = "Upload complete.";
    alert("Upload successful!");
  } catch (err) {
    console.error(err);
    alert("Upload failed: " + err);
    elStatus.textContent = "Upload error.";
  }

  elUpload.disabled = false;
});
