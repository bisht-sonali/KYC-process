let mediaRecorder;
let recordedChunks = [];

//start kyc

document.getElementById("startKYC").onclick = async function(){
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
        let blob = new Blob(recordedChunks,{type:"video/mp4"});
        let videoURL = URL.createObjectURL(blob);

        let recordedVideo = document.getElementById("recorded");
        recordedVideo.style.display = "block";
         recordedVideo.src = "url";

         //upload to server

         let fromData = new FormData();
         fromData.append("video",blob, "kyc_video.mp4");

         fetch("https://script.google.com/macros/s/AKfycbz7IoXYmXJuWo1s03bP45N9HsWdev-WNhfghk-epiKWqCfseyZwUb6qtv2QFc70JI-bWA/exec",{
            method:"POST",
            body:fromData
         })
         .then(t=>alert("video uploaded successfully!"))
         .catch(err=>alert("upload failed!"));
    };

    mediaRecorder.start();

    document.getElementById("stopBtn").style.display = "inline-block";
};


// stop recording

document.getElementById("stopBtn").onclick = function(){
mediaRecorder.stop();
};
