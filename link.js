const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_PUBLIC_KEY";

// Initialize Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elements
const elRequest = document.getElementById("requestNumber");
const elName = document.getElementById("customerName");
const elStart = document.getElementById("startKYC");
const elStop = document.getElementById("stopBtn");
const elUpload = document.getElementById("uploadBtn");
const elPreview = document.getElementById("preview");
const elRecorded = document.getElementById("recorded");
const elStatus = document.getElementById("status");

let mediaRecorder, finalBlob, recordedChunks = [];

// Generate Request ID
function generateRequestID() {
  return "ALCREQ" + Math.floor(100 + Math.random() * 900);
}

// Load Name & Request ID
(function init() {
  const p = new URLSearchParams(window.location.search);
  const name = p.get("name") || "Customer";

  elName.textContent = "Dear " + name;
  elRequest.textContent = generateRequestID();
})();

// Start KYC
elStart.addEventListener("click", async () => {
  recordedChunks = [];

  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  elPreview.srcObject = stream;

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);

  mediaRecorder.onstop = () => {
    finalBlob = new Blob(recordedChunks, { type: "video/webm" });
    elRecorded.src = URL.createObjectURL(finalBlob);
    elRecorded.style.display = "block";
    elUpload.style.display = "block";
  };

  mediaRecorder.start();
  elStart.style.display = "none";
  elStop.style.display = "block";
});

// Stop recording
elStop.addEventListener("click", () => {
  mediaRecorder.stop();
  elPreview.srcObject.getTracks().forEach(t => t.stop());

  elStop.style.display = "none";
  elStart.style.display = "block";
});

// Upload to Supabase
elUpload.addEventListener("click", async () => {
  elStatus.textContent = "Uploading...";

  const name = elName.textContent.replace("Dear ", "");
  const requestId = elRequest.textContent;

  const fileName = `KYC_${requestId}_${Date.now()}.webm`;

  // Upload to Supabase Storage bucket "kyc_videos"
  const { data, error } = await supabase.storage
    .from("kyc_videos")
    .upload(fileName, finalBlob);

  if (error) {
    elStatus.textContent = "Upload Failed";
    alert("Upload error");
    return;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("kyc_videos")
    .getPublicUrl(fileName);

  const videoURL = urlData.publicUrl;

  // Save record in Supabase Table
  const { error: dbError } = await supabase
    .from("kyc_records")
    .insert({
      customer_name: name,
      request_id: requestId,
      video_url: videoURL
    });

  if (dbError) {
    elStatus.textContent = "Database Error";
    alert("DB Error");
    return;
  }

  elStatus.textContent = "Upload Successful!";
  alert("Video Uploaded Successfully!");
});
