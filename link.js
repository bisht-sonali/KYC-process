const BACKEND_URL =
  "https://db-9onl.onrender.com/upload";

function getNameFromURL() {
  const p = new URLSearchParams(window.location.search);
  return p.get("name") || "";
}

function generateRequestID() {
  return "ALCREQ" + Math.floor(100 + Math.random() * 900);
}

const elRequest = document.getElementById("requestNumber");
const elName = document.getElementById("customerName");
const elStart = document.getElementById("startKYC");
const elStop = document.getElementById("stopBtn");
const elUpload = document.getElementById("uploadBtn");
const elPreview = document.getElementById("preview");
const elRecorded = document.getElementById("recorded");
const elStatus = document.getElementById("status");

let mediaRecorder, finalBlob, recordedChunks = [];

(function init() {
  const name = getNameFromURL();
  elName.textContent = name ? `Dear ${name},` : "Dear Customer,";
  elRequest.textContent = `Video KYC Process for Request No: ${generateRequestID()}`;
})();

elStart.addEventListener("click", async () => {
  recordedChunks = [];
  finalBlob = null;
  elUpload.style.display = "none";
  elRecorded.style.display = "none";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true
    });

    elPreview.srcObject = stream;
    elPreview.style.display = "block";

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);

    mediaRecorder.onstop = () => {
      finalBlob = new Blob(recordedChunks, { type: "video/webm" });
      elRecorded.src = URL.createObjectURL(finalBlob);
      elRecorded.style.display = "block";
      elUpload.style.display = "block";
      elStatus.textContent = "Recording complete.";
    };

    mediaRecorder.start();
    elStatus.textContent = "Recording...";
    elStart.style.display = "none";
    elStop.style.display = "block";

  } catch (err) {
    alert("Camera access failed.");
  }
});

elStop.addEventListener("click", () => {
  mediaRecorder.stop();
  elPreview.srcObject.getTracks().forEach(t => t.stop());
  elPreview.srcObject = null;

  elStop.style.display = "none";
  elStart.style.display = "block";
});

elUpload.addEventListener("click", async () => {
  if (!finalBlob) return alert("No video recorded");

  elStatus.textContent = "Uploading...";

  const fd = new FormData();
  fd.append("file", finalBlob, `KYC_${Date.now()}.webm`);
  fd.append("name", getNameFromURL());
  fd.append("requestId", elRequest.textContent);

  try {
    await fetch(BACKEND_URL, { method: "POST", body: fd });
    elStatus.textContent = "Upload successful!";
    alert("Uploaded successfully");

  } catch (err) {
    elStatus.textContent = "Upload failed";
    alert("Upload error");
  }
});
