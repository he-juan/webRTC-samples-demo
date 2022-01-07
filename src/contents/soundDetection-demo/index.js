let stream;
let isMute;
let currentMic;
let devices ={
    cameras: [],
    microphones:[],
    speakers: []
};

let audio = document.getElementById("audio")
let muteBtn = document.getElementById("muteBtn")
let logElement = document.getElementById('logs');
let start = document.getElementById("getusermedia")
let audioInputSelect = document.querySelector('select#audioSource');
let audioOutputSelect = document.querySelector('select#audioOutput');
let selectors = [audioInputSelect, audioOutputSelect];

audioInputSelect.onchange = changeMic;
audioOutputSelect.onchange = changeAudioDestination

async function changeMic(){
    let audioSource = audioInputSelect.value;
    currentMic = audioSource
    console.warn("currentSpeaker:",currentMic)


    if(stream){
       await window.soundDetection.closeStream(stream)
        stream = null
       getMedia({deviceId:currentMic})
    }else{
        console.warn("only switch localMicDeviceId")
    }
}

function changeAudioDestination(){
    const audioDestination = audioOutputSelect.value;
    attachSinkId(audioEle, audioDestination);
}

/******************************************************************************************************************/

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch(error => {
                let errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0;
            });
    } else {
        console.warn('Browser does not support output device selection.');
    }
}

async function getMedia(data){
    if(!stream){
        let constraints = {
            audio:{
                deviceId: {
                    exact: data && data.deviceId ? data.deviceId: (currentMic ? currentMic: devices.microphones[0].deviceId)
                }
            }
        };
        try {
            console.log("constraints:",constraints)
            if (navigator.mediaDevices.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            window.soundDetection.isMute = isMute= false
            audio.srcObject = stream
            audio.play()
            function callback(event){
                showLog(event.message)
            }
            window.soundDetection.checkAudioOutputVolume( {isMute:isMute, stream:stream, callback:callback})
            start.textContent = "停止声音检测"
        } catch(err) {
            console.error("Error: " + err);
        }
    }else{
        console.warn("停止声音检测")
        window.soundDetection && window.soundDetection.stop()
        window.soundDetection.closeStream(stream)
        stream = null
        start.textContent = "开始声音检测"
    }
}

function streamMuteSwitch(){
    function callback(event){
        showLog(event.message)
    }
    if(!window.soundDetection.isMute){
        window.soundDetection.streamMuteSwitch({stream: stream, type: 'audio', mute: true})
        muteBtn.textContent = 'unmute'
        window.soundDetection.checkAudioOutputVolume( {isMute:isMute, stream:stream, callback:callback})
    }else{
        window.soundDetection.streamMuteSwitch({stream: stream, type: 'audio', mute: false})
        muteBtn.textContent = 'mute'
        window.soundDetection.checkAudioOutputVolume( {isMute:isMute, stream:stream, callback:callback})
    }
}

/**
 * 页面打印提示
 * @param msg
 */
function showLog(msg) {
    console.log(msg);
    let logTime = new Date(parseInt((new Date()).getTime()))
    logTime = beautyDate(logTime);

    let line = document.createElement('div');
    line.textContent = logTime + ' ' + msg;
    logElement.appendChild(line);
}

function beautyDate(date) {
    var yyyy = date.getFullYear();
    var m = date.getMonth() + 1; // getMonth() is zero-based
    var d = date.getDate();
    var h = date.getHours();
    var mi = date.getMinutes();
    var sec = date.getSeconds();
    var msec = date.getMilliseconds();

    var mm  = m < 10 ? "0" + m : m;
    var dd  = d < 10 ? "0" + d : d;
    var hh  = h < 10 ? "0" + h : h;
    var min = mi < 10 ? "0" + mi : mi;
    var ss  = sec < 10 ? "0" + sec : sec;
    var mss = msec < 10 ? "00" + msec : ( msec < 100 ? "0" + msec : msec );

    return "".concat(yyyy).concat("-").concat(mm).concat("-").concat(dd).concat("@").concat(hh).concat(":").concat(min).concat(":").concat(ss).concat(".").concat(mss);
}


/**************************************获取设备********************************/

/**
 * 获取设备列表
 * @param deviceInfos
 */
function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput' && deviceInfo.deviceId !== 'default' && deviceInfo.deviceId !== 'communications') {
            option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
            devices.microphones.push(deviceInfo)
        } else if (deviceInfo.kind === 'audiooutput' && deviceInfo.deviceId !== 'default' && deviceInfo.deviceId !== 'communications') {
            option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            audioOutputSelect.appendChild(option);
            devices.speakers.push(deviceInfo)
        } else if (deviceInfo.kind === 'videoinput'){
            option.text = deviceInfo.label || `camera ${audioOutputSelect.length + 1}`;
            // cameraSelect.appendChild(option);
            devices.cameras.push(deviceInfo)
        } else {
            // console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
}

function handleError(error) {
    let errorMessage
    if(error.message && error.name){
        errorMessage = 'navigator.MediaDevices.getUserMedia error: ' + error.message + ' ' + error.name;
    }else {
        errorMessage = error
    }

    console.warn(errorMessage);
}

/*****************************************初始化阶段****************************************************/

window.addEventListener('load', async function () {
    if (SoundMeter) {
        window.soundDetection = new SoundMeter()
    }
    await navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
})