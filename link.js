// get name from url
const query = new URLSearchParams(window.location.search);
let username = query.get("name");
if(username){
    document.getElementById("customerName").innerText =`Dear ${username},`;
}


//create unique request id
function generateRequestID(){
    return "ALCREQ"+Math.floor(100+Math.random()*900);
}
let requestID = generateRequestID();
document.getElementById("requestNumber").innerText = "Video KYC process for Request No:"+requestID;



//camera+rec

let mediaRecorder;
let recordedChunks = [];
let finalBlob = null;

const startBtn = document.getElementById("startKYC");

const stopBtn = document.getElementById("stopBtn");

const uploadBtn = document.getElementById("uploadBtn");

const preview = document.getElementById("preview");

const recorded = document.getElementById("recorded");

startBtn.onclick = async function(){
    try{
        let stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        preview.style.display = "block";
        preview.srcObject = stream;

        startBtn.style.display = "none";
        stopBtn.style.display = "inline-block";

        recordedChunks = [];

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
            recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () =>{
            finalBlob = new Blob(recordedChunks,{type: "video/webm"});
            recorded.src = URL.createObjectURL(finalBlob);
            recorded.style.display = "block";
            uploadBtn.style.display = "inline-block";
        };

        mediaRecorder.start();
    } catch(error){
        alert("camera access failed"+ error);   
    }
};

stopBtn.onclick = function(){
   if(mediaRecorder) mediaRecorder.stop();
  if( preview.srcObject)  preview.srcObject.getTracks().forEach(t => t.stop());
    stopBtn.style.display = "none";
};


//upload vid to google script

uploadBtn.onclick = function(){
    if(!finalBlob){
        alert("no video recorded!");
        return;
    }

    let formData = new FormData();
    formData.append("file",finalBlob,"kyc_video.webm");

    fetch("https://script.google.com/macros/s/AKfycbz7IoXYmXJuWo1s03bP45N9HsWdev-WNhfghk-epiKWqCfseyZwUb6qtv2QFc70JI-bWA/exec",{
            method:"POST",
            body:formData
         })
         .then(res => res.text())
         .then(msg=> alert("video uploaded successfully!"))
         .catch(err=> alert("upload failed:"+err));
    };




