let mediaRecorder;
let recordedChunks = [];

//start kyc

document.getElementById("startKYC").onclick = async function(){
recordedChunks = [];
finalBlob = null;

    let stream = await
    navigator.mediaDevices.getUserMedia({video:true,audio:true});

    let preview = document.getElementById("preview");
    preview.srcObject = stream;
    preview.style.display = "block";

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e){
        recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = async function (){
        finalBlob = new Blob(recordedChunks,{type:"video/mp4"});
        let videoURL = URL.createObjectURL(finalBlob);

        let recordedVideo = document.getElementById("recorded");
         recordedVideo.src = "url";
          recordedVideo.style.display = "block";

         //show upload button
         document.getElementById("uploadBtn").style.display = "inline-block"
    };

    mediaRecorder.start();

    document.getElementById("stopBtn").style.display = "inline-block";
};


// stop recording

document.getElementById("stopBtn").onclick = function(){
mediaRecorder.stop();
};


//upload video button
document.getElementById("uploadBtn").onclick = function(){
    if(!finalBlob){
        alert("no video to upload!!");
        return;
    }

    let formData = new formData();
    formData.append("file",finalBlob, "kyc_video.mp4");

fetch("https://script.google.com/macros/s/AKfycbz7IoXYmXJuWo1s03bP45N9HsWdev-WNhfghk-epiKWqCfseyZwUb6qtv2QFc70JI-bWA/exec",{
            method:"POST",
            body:fromData
         })
         .then(res => Text())
         .then(txt=>alert("video uploaded successfully!"))
         .catch(err=>alert("upload failed!"));
    };
