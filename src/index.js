const $ = require('jQuery');

let url = process.env.URL;
let KEY = process.env.KEY;
let api_url = url + KEY

let video;
let imgCanvas;
let selectedDetectionType = 1;

window.addEventListener('load',function(){
    init();
});

function init() {
    console.log("init...");
    video  = document.querySelector("#camera");
    imgCanvas = document.querySelector("#pic");
    initCamera();

    // Button Clicked
    document.querySelector("#btn-shutter").addEventListener("click", () => {
        const ctx = imgCanvas.getContext("2d");
        ctx.drawImage(video, 0, 0, imgCanvas.width, imgCanvas.height);

        let imgDataURI = imgCanvas.toDataURL() ;
        makeRequest(imgDataURI, getAPIInfo);
    });

    document.querySelector("#detection-type").addEventListener("change", (event) => {
        console.log("detection type selected...", event.target.value);
        selectedDetectionType = event.target.value;
    });
}

function initCamera() {
    console.log("initCamera...");
    const constraints = {
        audio: false,
        video: {
            width: 640,
            height: 480,
            facingMode: "user" // Use the front camera
            // facingMode: { exact: "environment" } // Use the rear camera
        }
    };
    navigator.mediaDevices.getUserMedia(constraints)
    .then( (stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = (e) => {
            video.play();
        };
    })
    .catch( (err) => {
        console.log(err.name + ": " + err.message);
    });
}

function clearTextArea(){
    document.form.textarea.value = "";
}

// Create Json to be included in the request to Vision API
function makeRequest(dataUrl,callback){
    console.log("makeRequest...");

    let end = dataUrl.indexOf(",");
    let request;

    if(selectedDetectionType == 1){
        request = "{'requests': [{'image': {'content': '" + dataUrl.slice(end + 1) + "'},'features': [{'type': 'LABEL_DETECTION','maxResults': 5,}]}]}"
    }else if(selectedDetectionType == 2){
        request = "{'requests': [{'image': {'content': '" + dataUrl.slice(end + 1) + "'},'features': [{'type':'TEXT_DETECTION','maxResults': 5,}]}]}"
    }else if(selectedDetectionType == 3){
        request = "{'requests': [{'image': {'content': '" + dataUrl.slice(end + 1) + "'},'features': [{'type': 'SAFE_SEARCH_DETECTION',}]}]}"
    }

    callback(request)
}

// Send request
function getAPIInfo(request){
    console.log("getAPIInfo...");

    $.ajax({
        url : api_url,
        type : 'POST',       
        async : true,        
        cashe : false,
        data: request, 
        dataType : 'json', 
        contentType: 'application/json',   
    }).done(function(result){
        showResult(result);
    }).fail(function(result){
        alert('failed to load the info');
        console.log("failed...");
        console.log(result);
    });  
}

// Display Result
let safeSearchElements = ["adult", "spoof", "medical", "violence", "racy"];
function showResult(result){
    console.log("showResult...");

    // Reset result text
    clearTextArea();
    
    resultText = "";
    if(selectedDetectionType == 1){
        // Label detection result
        if(result.responses[0].labelAnnotations){
            for (let i = 0; i < result.responses[0].labelAnnotations.length;i++){
                resultText += result.responses[0].labelAnnotations[i].description + "\n";
            }
            document.form.textarea.value = resultText;
        }else{
            document.form.textarea.value = "No labelAnnotations...";
        }
    }else if(selectedDetectionType == 2){
        // Text decoding result
        if(result.responses[0].textAnnotations){
            for (let i = 1; i < result.responses[0].textAnnotations.length; i++){
                if(i < 5){
                    resultText += result.responses[0].textAnnotations[i].description + "\n";
                }
            }
            document.form.textarea.value = resultText;
        }else{
            document.form.textarea.value = "No textAnnotations...";
        }
    }else if(selectedDetectionType == 3){
        // Safe search result
        if(result.responses[0].safeSearchAnnotation){
            console.log("---SAFE_SEARCH_DETECTION---");
            let output = result.responses[0].safeSearchAnnotation;
            for (let i=0; i<safeSearchElements.length; i++){
                resultText += safeSearchElements[i] + ": " + output[safeSearchElements[i]] + "\n";
            }
            document.form.textarea.value = resultText;
        }else{
            document.form.textarea.value = "No safeSearchAnnotation...";
        }
    }
}