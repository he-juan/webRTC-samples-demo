let container = document.getElementById("container")

/***************************gif 动图***********************************/
let canvasTimer
let inter
let t = 6
let recorder
let allChunks = []
let format = 'video/webm;codecs=vp9';
let repeat;
let button, capture,info, gif, sample, sampleInterval, sampleUpdate, startTime, timer, start, load, go, begin,imgBlobs;
// let gifCanvas = document.createElement("canvas")
let gifCanvas = document.getElementsByClassName("gifCanvas")[0]
let gifCtx = gifCanvas .getContext("2d")
// let gifVideo = document.createElement("video")
let gifVideo = document.getElementsByClassName("gifVideo")[0]

/************************************正文左边按钮******************/
let videoBtn = document.getElementsByClassName("toggleVideoButton")[0]
let shareBtn = document.getElementsByClassName("toggleShareButton")[0]
let localVideoBtn = document.getElementsByClassName("localVideoButton")[0]
let muteBtn = document.getElementsByClassName("toggleMuteButton")[0]

/******************************正文中间按钮********************/
let areaVideoArea = document.getElementsByClassName("areaVideoBtn")[0]
let videoArea = document.getElementsByClassName("videoBtn")[0]
let audioArea = document.getElementsByClassName("audioBtn")[0]

/***************************正文右边按钮***********************/
let startRecordBtn = document.getElementsByClassName("startRecord")[0]
let pauseRecordBtn = document.getElementsByClassName("pauseRecord")[0]
let resumeRecordBtn = document.getElementsByClassName("resumeRecord")[0]
let stopRecordBtn = document.getElementsByClassName("stopRecord")[0]
let restartRecordBtn = document.getElementsByClassName("restartRecord")[0]
let downloadBtn = document.getElementsByClassName("download")[0]
let gifImgBtn = document.getElementsByClassName("gifImg")[0]
let downloadGifImg = document.getElementsByClassName("downloadImg")[0]


/*****************************************区域录制元素************************************************/
let shareVideo = document.getElementsByClassName("shareVideo")[0]
let shareLocalVideo = document.getElementsByClassName("shareLocalVideo")[0]
let shareRecord = document.getElementsByClassName("shareRecord")[0]
let shareCanvas = document.getElementsByClassName("shareCanvas")[0]
let ctx = shareCanvas.getContext('2d')
let virtualVideo = document.createElement("video")
    virtualVideo.id = 'virtualVideo'

let video_Area = document.getElementsByClassName("videoArea")[0]
let textContrainter = document.getElementsByClassName("textContrainter")[0]
let input = document.getElementsByClassName("input")[0]
let textBtn = document.getElementsByClassName("textBtn")[0]
let gif_container_videoArea = document.getElementsByClassName("gif_container")[0]
let gifVideoOfAreaVideo = document.getElementsByClassName("gifVideoOfAreaVideo")[0]

/***************************************音视频录制元素*********************************************/
let mainVideo = document.createElement("video")
let slidesVideo = document.createElement('video')
let localVideo = document.createElement('video')

let vtcanvas = document.getElementsByClassName("p-video_recorder_canvas")[0]
let context = vtcanvas.getContext('2d')

let canvasRecord = document.getElementsByClassName("canvasRecord")[0]
let gifContainer = document.getElementsByClassName("gifContainer")[0]


/************************************音频录制元素***************************************************/
let localAudio = document.getElementsByClassName("localAudio")[0]



/***********************开启、关闭视频、演示的标志*****/
let isOpenVideo = false
let isOpenShareScreen = false
let isMute = false
let isRecording = false
let isUploadVideo = false
let currentMic = null
let currentSpeaker = null
let currentCamera = null
let isDrawCanvas = false


/**************** 绘制canvas定时器********************/
let switchTimeout
let shareTimeout
let stopTimeout

/** ******************像素匹配位置*******************/
let setX
let setY
let setWidth
let setHeight

let sx
let sy
let rangeH
let rangeW
let text
let count

/*********************获取canvas匹配位置**********************/
let canvasX
let canvasY


areaVideoArea.addEventListener("click",function(){
    if(localStreams.audio){
        stopCategory({type:'audio'})
    }

    if(localStreams.main ){
        stopCategory({type:'main'})
    }

    if(localStreams.localVideo){
        stopCategory({type:'localVideo'})
    }

    if(localStreams.slides){
        stopCategory({type:'slides'})
    }
    startRecordBtn.disabled = true
    stopRecordBtn.disabled = true
    pauseRecordBtn.disabled = true
    resumeRecordBtn.disabled = true
    restartRecordBtn.disabled = true
    downloadBtn.disabled = true
    startRecordBtn.style.backgroundColor = '#8c818a'
    stopRecordBtn.style.backgroundColor = '#8c818a'
    pauseRecordBtn.style.backgroundColor = '#8c818a'
    resumeRecordBtn.style.backgroundColor = '#8c818a'
    downloadBtn.style.backgroundColor = '#8c818a'
    restartRecordBtn.style.backgroundColor = '#8c818a'

    videoBtn.disabled = false
    shareBtn.disabled = false
    localVideoBtn.disabled = false
    muteBtn.disabled = false
    videoBtn.style.backgroundColor = "skyblue"
    shareBtn.style.backgroundColor = "skyblue"
    localVideoBtn.style.backgroundColor = "skyblue"
    muteBtn.style.backgroundColor = "skyblue"
    window.record.currentRecoderType = "areaVideo"
    handleStopGif()
    getCategory({type: 'audio'})
})
videoArea.addEventListener("click",function () {

    if(localStreams.audio){
        stopCategory({type:'audio'})
    }

    if(localStreams.main ){
        stopCategory({type:'main'})
    }

    if(localStreams.localVideo){
        stopCategory({type:'localVideo'})
    }

    if(localStreams.slides){
        stopCategory({type:'slides'})
    }
    startRecordBtn.disabled = true
    stopRecordBtn.disabled = true
    pauseRecordBtn.disabled = true
    resumeRecordBtn.disabled = true
    restartRecordBtn.disabled = true
    downloadBtn.disabled = true
    startRecordBtn.style.backgroundColor = '#8c818a'
    stopRecordBtn.style.backgroundColor = '#8c818a'
    pauseRecordBtn.style.backgroundColor = '#8c818a'
    resumeRecordBtn.style.backgroundColor = '#8c818a'
    downloadBtn.style.backgroundColor = '#8c818a'
    restartRecordBtn.style.backgroundColor = '#8c818a'

    videoBtn.disabled = false
    shareBtn.disabled = false
    localVideoBtn.disabled = false
    muteBtn.disabled = false
    videoBtn.style.backgroundColor = "skyblue"
    shareBtn.style.backgroundColor = "skyblue"
    localVideoBtn.style.backgroundColor = "skyblue"
    muteBtn.style.backgroundColor = "skyblue"
    window.record.currentRecoderType = "video"
    handleStopGif()
    getCategory({type: 'audio'})
})

audioArea.addEventListener("click",function () {
    if(localStreams.audio){
        stopCategory({type:'audio'})
    }

    if(localStreams.main ){
        stopCategory({type:'main'})
    }

    if(localStreams.localVideo){
        stopCategory({type:'localVideo'})
    }

    if(localStreams.slides){
        stopCategory({type:'slides'})
    }

    videoBtn.disabled = true
    shareBtn.disabled = true
    localVideoBtn.disabled = true
    muteBtn.disabled = false
    videoBtn.style.backgroundColor = "#8c818a"
    shareBtn.style.backgroundColor = "#8c818a"
    localVideoBtn.style.backgroundColor = "#8c818a"
    muteBtn.style.backgroundColor = "skyblue"

    startRecordBtn.disabled = true
    stopRecordBtn.disabled = true
    pauseRecordBtn.disabled = true
    resumeRecordBtn.disabled = true
    restartRecordBtn.disabled = true
    downloadBtn.disabled = true
    startRecordBtn.style.backgroundColor = '#8c818a'
    stopRecordBtn.style.backgroundColor = '#8c818a'
    pauseRecordBtn.style.backgroundColor = '#8c818a'
    resumeRecordBtn.style.backgroundColor = '#8c818a'
    downloadBtn.style.backgroundColor = '#8c818a'
    restartRecordBtn.style.backgroundColor = '#8c818a'

    window.record.currentRecoderType = "audio"
    handleStopGif()
    getCategory({type: 'audio'})
})

let currentRecodeType = null     // 标记当前录制的类型

// ***************获取设备*****************
let devices ={
    cameras: [],
    microphones:[],
    speakers: []
}
let localStreams = {
    audio:null,
    main:null,
    slides: null,
    localVideo: null,
}
let audioInputSelect = document.querySelector('select#audioSource');
let audioOutputSelect = document.querySelector('select#audioOutput');
let cameraSelect = document.querySelector('select#camera')
let selectors = [audioInputSelect, audioOutputSelect, cameraSelect];

// *************设置设备*********************

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
            cameraSelect.appendChild(option);
            devices.cameras.push(deviceInfo)
        } else {
            // console.log('Some other kind of source/device: ', deviceInfo);
        }
    }

    console.warn("devices:",devices)
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


function changeMic(){
    const audioSource = audioInputSelect.value;
    currentMic = audioSource
    console.warn("currentSpeaker:",currentMic)

    if(localStreams.audio){
        switchAudioDeviced()
    }else{
        console.warn("only switch localMicDeviceId")
    }
}

function changeAudioDestination() {
    const audioDestination = audioOutputSelect.value;
    attachSinkId(audio, audioDestination);
    currentSpeaker = audioDestination
    console.warn("currentSpeaker:",currentSpeaker)
}

function changeCamera(){
    const camera = cameraSelect.value;
    currentCamera = camera
    console.warn("currentCamera:",currentCamera)

    if(localStreams.main){
        switchLcoalCamera()
    }else{
        console.warn("only switch localCamera")
    }
}

audioInputSelect.onchange = changeMic;
audioOutputSelect.onchange = changeAudioDestination
cameraSelect.onchange = changeCamera

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

/********************************处理不同类型获取页面逻辑(录制视频、录制音频、区域录制)**********************************************/

//获取页面的每个按钮
let btns = document.getElementsByClassName("btn")　　　　　//获取内容盒子
let contents = document.getElementsByClassName("midContent")

//遍历每个按钮为其添加点击事件
for(let i=0;i < btns.length;i++){
    btns[i].index = i;
    btns[i].onclick = function(){　　　　　　　　　　//对当前点击的按钮赋予active类名及显示当前按钮对应的内容
        for(let j=0;j<btns.length;j++){
            btns[j].className = btns[j].className.replace(' active', '').trim();
            contents[j].className = contents[j].className.replace(' show', '').trim();
        }
        this.className = this.className + ' active';
        contents[this.index].className = contents[this.index].className + ' show';
    };
    if(btns[i].textContent === '区域录制类型'){
        currentRecodeType = 'areaVideo'
    }else if(btns[i].textContent === '混合录制类型'){
        currentRecodeType = 'video'
    }else if(btns[i].textContent === '音频录制类型'){
        currentRecodeType = 'audio'
    }
}

function toggleShareButton(data){
    if(shareBtn.textContent === '开启共享'){
        getCategory(data)
    }else if(shareBtn.textContent === '关闭共享'){
        stopCategory(data)
    }
}


function toggleVideoButton(data){
    console.warn("button toggle")
    if(videoBtn.textContent === '开启视频'){
        getCategory(data)
    }else if(videoBtn.textContent === '关闭视频'){
        stopCategory(data)
    }
}


function toggleMuteButton(data){
    if(muteBtn.textContent === '静音'){
        if(!localStreams.audio){
            getCategory(data)
        }else{
            data.mute = true
            data.stream = localStreams.audio
            data.callback = function(event){
                if(event.stream){
                    muteBtn.textContent = "非静音"
                }
            }
            window.record.streamMuteSwitch(data)

        }
    }else if(muteBtn.textContent === '非静音'){
        data.mute = false
        data.stream = localStreams.audio
        data.callback = function(event){
            if(event.stream){
                muteBtn.textContent = "静音"
            }
        }
        window.record.streamMuteSwitch(data)

    }
}

function localVideoButton(){
    /**开始上传视频**/
    if(localVideoBtn.textContent === '上传视频'){
         // window.cancelAnimationFrame(switchTimeout)
         // window.cancelAnimationFrame(shareTimeout)

        if(localStreams.slides){
            stopCategory({type: 'slides'})
            localStreams.slides = null
        }

        if(localStreams.main){
            stopCategory({type: 'main'})
            localStreams.slides = null
        }

        if(localStreams.localVideo){
            stopCategory({type: 'localVideo'})
        localStreams.localVideo = null
        }

        // if(localStreams.audio){
        //     stopCategory({type: 'audio'})
        //     localStreams.audio = null
        // }
        videoInput.click();
    }else if(localVideoBtn.textContent === '关闭上传视频'){
          stopCategory({type: 'localVideo'})
    }
}

/************************************************共享本地文件*********************************************************/
let videoInput = document.createElement('input');
let file;
let fileURL;
let ifMediaChange = false;

videoInput.setAttribute('type', 'file');
videoInput.setAttribute('id', 'localVideoInput');
videoInput.setAttribute('style', 'visibility: hidden');
document.body.appendChild(videoInput);


shareLocalVideo.oncanplay = async function(){
    console.info("localVideo: "+ shareLocalVideo.videoWidth + " * " + shareLocalVideo.videoHeight)
    if(isUploadVideo ){
        localStreams.localVideo = shareLocalVideo.captureStream(60)
        handleCanPlay({elem: shareLocalVideo})
    }

}

localVideo.onloadedmetadata = function(){
    console.info("localVideo: "+ localVideo.videoWidth + " * " + localVideo.videoHeight)
    vtcanvas.style.display = 'inline-block'
    localVideo.play()
    localVideo.autoplay = true
    localVideo.loop = true
    localStreams.localVideo = localVideo.captureStream(60)
    startRecordBtn.disabled = false
    startRecordBtn.style.backgroundColor = 'skyblue'
    videoToCanvas(localVideo, vtcanvas, context, vtcanvas.width, vtcanvas.height)
}

function videoToCanvas(video,canvas,ctx,rangeW,rangeH){
    ctx.drawImage(video,  0, 0, rangeW, rangeH);
    canvas.style.border = "none";
    stopTimeout = requestAnimationFrame(() => {
        videoToCanvas(video,canvas,ctx,rangeW,rangeH);
    })
}

videoInput.oninput = function(){
    if(isUploadVideo === true){
        console.warn('LocalVideo is sharing now.')
        let ifChange = confirm('是否要切换演示媒体文件?');
        if(ifChange){
            console.warn('Slides stream is going to change!')
            ifMediaChange = true
        }else{
            this.value = "";  // clear input
            return
        }
    }
    handlelocalVideo()
}

function handlelocalVideo(){
    if (videoInput.files) {
        try {
            file = videoInput.files[0];
            fileURL = window.record.getObjectURL(file);
            let fileType = file.type.split('/')[0];
            if(fileType === 'audio' || fileType === 'video'){
                if(window.record.currentRecoderType === 'areaVideo'){
                    shareLocalVideo.controls = 'controls'
                    shareLocalVideo.style.display = 'inline-block'
                    shareLocalVideo.setAttribute('src', fileURL);
                }

                if(window.record.currentRecoderType === 'video'){
                    localVideo.controls = 'controls'
                    localVideo.style.display = 'inline-block'
                    localVideo.setAttribute('src', fileURL);
                }

                // fileName.innerHTML = videoInput.files[0].name

                try {
                    if(window.record.currentRecoderType === 'areaVideo'){
                        isUploadVideo = true
                        window.record.isUploadVideo = true
                        shareLocalVideo.play();
                    }else if(window.record.currentRecoderType === 'video'){
                        isUploadVideo = true
                        window.record.isUploadVideo = true
                        localVideo.play();
                    }
                    localVideoBtn.textContent = '关闭上传视频'

                }catch (e) {
                    console.warn(e)
                }
            }else{
                console.warn('only support upload video or audio, please try again！')
            }
        }catch (e) {
            console.warn(e)
        }
    }

}


function handleCanPlay(data){

    if(!data || !data.elem){
         console.warn("handle canPlay is invalid parameters")
         return
    }
     /**
     * 帧率localMediaframeRate
     * 最大值为 30
     * 考虑到mcu解码可能吃不消
     * ipvt一般设置为 5
     */
    if (fileURL) {
        if (isUploadVideo === true){
            console.warn('switch local sharing source')
                if(ifMediaChange){
                    let rect = document.getElementsByClassName('rect')[0]
                    if(rect){
                        rect.style.display = "none"
                    }
                    ctx.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
                    window.cancelAnimationFrame(stopTimeout)
                }
        } else {
            function callback(data) {
                console.warn('local video share on call back: ', data)
                if (data.codeType === 999){
                    isUploadVideo = true


                    console.warn("share local video success...")
                }else {
                    if(data.reason){
                        alert(data.reason)
                    }
                    console.warn("share local video failed: ", data)

                }
            }
        }
        // handlelocalVideo()
    }
}


/***************************************************区域录制添加文字********************************************************* */
function writeTextOnCanvas(ctx, lh, rw, text) {
    let lineheight = lh;

    ctx.clearRect(0, 0, ctx.width, ctx.height);
    ctx.font = "40px Arial";
    ctx.fillStyle = "#f00";

    function getTrueLength(str) { //获取字符串的真实长度（字节长度）
        let len = str.length,
            truelen = 0;
        for (let x = 0; x < len; x++) {
            if (str.charCodeAt(x) > 128) {
                truelen += 2;
            } else {
                truelen += 1;
            }
        }
        return truelen;
    }

    function cutString(str, leng) { //按字节长度截取字符串，返回substr截取位置
        let len = str.length,
            tlen = len,
            nlen = 0;
        for (let x = 0; x < len; x++) {
            if (str.charCodeAt(x) > 128) {
                if (nlen + 2 < leng) {
                    nlen += 2;
                } else {
                    tlen = x;
                    break;
                }
            } else {
                if (nlen + 1 < leng) {
                    nlen += 1;
                } else {
                    tlen = x;
                    break;
                }
            }
        }
        return tlen;
    }
    // ctx.fillText(text, canvasX, canvasY );
    /**************处理添加文字自动换行******************/
    for (let i = 1; getTrueLength(text) > 0; i++) {
        let tl = cutString(text, 40);
        // ctx.fillText(text.substr(0, tl).replace(/^\s+|\s+$/, ""), 10, i * lineheight + 50);
        ctx.fillText(text.substr(0, tl).replace(/^\s+|\s+$/, ""), canvasX, i * canvasY + 10);
        text = text.substr(tl);
    }
}

shareCanvas.addEventListener("mousedown",function(e){
    if(isDrawCanvas){
        let inputHeight = e.pageX - container.offsetLeft ;
        let inputWidth = e.pageY - container.offsetTop ;
        console.warn("mouseDown position:", canvasX  + '  *  ' + canvasY)

        canvasX = e.offsetX
        canvasY = e.offsetY
        textContrainter.style.display = 'block'
        input.placeholder = '请输入文字添加到canvas...'

        // textContrainter.style.position = 'absolute'
        // textContrainter.style.zIndex = '1000';
        // textContrainter.style.left = inputHeight + 'px';
        // textContrainter.style.top = inputWidth + 'px';
        // textContrainter.style.width = '300px'
        // textContrainter.style.height = '100px';
        // input.style.width = '300px'
        // input.style.height = '100px';
    }
})

input.onkeyup = function(){
    if(window.record.currentRecoderType === 'areaVideo' ){
        text = input.value
        finish()
        // playCanvas(shareVideo, shareCanvas, ctx, sx, sy, rangeW, rangeH, canvasX, canvasY, input.value)
    }else if(window.record.currentRecoderType === 'video'){

    }
}

textBtn.onclick = function(){
    textContrainter.style.display = 'none'
    input.value = ''
    text = ' '
    finish()
}


/**
 * 获取录制类型,
 * 类型 type：如areaVideo、 video 、 audio
 */

async function getCategory(data){
    console.warn("start handle getCategory:", data)
    if(!record){
        console.warn('record is not initialized')
        return
    }

    if(!data || !data.type){
        console.warn('invalid parameters')
        return
    }

    if(!localStreams && !localStreams.main && !localStreams.slides && !localStreams.localVideo){
        console.warn('localStreams is  null')
        return
    }

    if(window.record.currentRecoderType === 'areaVideo' || window.record.currentRecoderType === 'video'){
        if(data.type === 'audio' ){
            data.callback = function(event){
                if(event.codeType === 999){
                    console.warn("open audio success")
                    localStreams.audio = event.stream
                    muteBtn.textContent = "静音"
                }else{
                    console.warn("open audio failed")
                }
            }
            data.deviceId = currentMic || devices.microphones[0].deviceId
            openAudio(data)
        }
    }


   if(window.record.currentRecoderType === 'areaVideo'){
       if(localStreams.main ){
           await stopCategory({type:'main'})
       }

       if(localStreams.localVideo){
           await stopCategory({type:'localVideo'})
       }

       if(localStreams.slides){
           await stopCategory({type:'slides'})
       }

       if(data.type === 'slides'){
           data.callback = function(event){
               if(event.codeType === 999){
                   console.warn("open shareScreen success",event)

                   shareBtn.textContent = "关闭共享"
                   shareVideo.style.display = 'inline-block'
                   // shareCanvas.style.display = 'inline-block'

                   shareBtn.style.backgroundColor = "skyBlue"
                   localVideoBtn.style.backgroundColor = "skyBlue"

                   localStreams.slides = event.stream
                   shareVideo.srcObject = localStreams.slides
                   shareVideo.onloadedmetadata = function(){
                       shareVideo.play()
                       shareVideo.controls = true

                       shareVideo.style.width = shareVideo.videoWidth / 3 + 'px'
                       shareVideo.style.height = shareVideo.videoHeight / 3  + 'px'
                   }

                   virtualVideo.srcObject = localStreams.slides
                   virtualVideo.onloadedmetadata = function(){
                       virtualVideo.play()
                       virtualVideo.controls = true

                       virtualVideo.style.width = shareVideo.videoWidth  + 'px'
                       virtualVideo.style.height = shareVideo.videoHeight  + 'px'
                       console.warn("virtualVideo: " + virtualVideo.videoWidth + "  *  " + virtualVideo.videoHeight)
                       console.warn("stream: " + virtualVideo.srcObject.id)
                   }
               }else{
                   console.warn("open shareScreen failed")
               }
           }
           openShare(data)
       }else if(data.type === 'main'){
           data.callback = function(event){
               if(event.codeType === 999){
                   console.warn("open video success",event)

                   videoBtn.textContent = "关闭视频"
                   shareVideo.style.display = 'inline-block'
                   // shareCanvas.style.display = 'inline-block'

                   shareBtn.style.backgroundColor = "skyBlue"
                   localVideoBtn.style.backgroundColor = "skyBlue"

                   localStreams.main = event.stream
                   shareVideo.srcObject = localStreams.main
                   shareVideo.onloadedmetadata = function(){
                       shareVideo.play()
                       shareVideo.controls = true

                       shareVideo.style.width = shareVideo.videoWidth / 3 + 'px'
                       shareVideo.style.height = shareVideo.videoHeight / 3  + 'px'
                   }

                   virtualVideo.srcObject = localStreams.main
                   virtualVideo.onloadedmetadata = function(){
                       virtualVideo.play()
                       virtualVideo.controls = true

                       virtualVideo.style.width = shareVideo.videoWidth  + 'px'
                       virtualVideo.style.height = shareVideo.videoHeight  + 'px'
                       console.warn("virtualVideo: " + virtualVideo.videoWidth + "  *  " + virtualVideo.videoHeight)
                       console.warn("stream: " + virtualVideo.srcObject.id)
                   }
               }else{
                   console.warn("open video failed")
               }
           }
           data.deviceId =  currentCamera || devices.cameras[0].deviceId
           openVideo(data)
       }
   }else if(window.record.currentRecoderType === 'video'){
       if(data.type === 'main' || data.type === 'localVideo'){
           data.callback = function(event){
               if(event.codeType === 999){
                   console.warn(" open video success:" , event)
                   videoBtn.textContent = "关闭视频"
                   isOpenVideo = true

                   startRecordBtn.disabled = false
                   startRecordBtn.style.backgroundColor = 'skyblue'

                   vtcanvas.style.display = 'inline-block'
                   canvasRecord.style.display = "none"
                   shareBtn.style.backgroundColor = "skyblue"
                   localVideoBtn.style.backgroundColor = "skyblue"
                   videoBtn.style.backgroundColor = "skyblue"

                   localStreams.main = event.stream
                   mainVideo.srcObject = localStreams.main
                   mainVideo.onloadedmetadata = function(){
                       console.info("mainVideo: "+ mainVideo.videoWidth + " * " + mainVideo.videoHeight)
                       mainVideo.play()
                       if(isOpenShareScreen){
                           draw({openShare:true})
                       }else{
                           draw()
                       }
                   }
               }else{
                   console.warn(" open video failed")
               }
           }
           data.deviceId =  currentCamera || devices.cameras[0].deviceId
           openVideo(data)
       }else if(data.type === 'slides'){
           data.callback = function(event){
               if(event.codeType === 999){
                   console.warn(" open shareScreen success: ", event)
                   shareBtn.textContent = "关闭共享"
                   isOpenShareScreen = true

                   startRecordBtn.disabled = false
                   startRecordBtn.style.backgroundColor = 'skyblue'

                   vtcanvas.style.display = 'inline-block'
                   canvasRecord.style.display = "none"
                   shareBtn.style.backgroundColor = "skyBlue"
                   localVideoBtn.style.backgroundColor = "skyBlue"
                   videoBtn.style.backgroundColor = "skyBlue"

                   localStreams.slides = event.stream
                   slidesVideo.srcObject = localStreams.slides
                   slidesVideo.onloadedmetadata = function(){
                       console.info("slidesVideo: "+ slidesVideo.videoWidth + " * " + slidesVideo.videoHeight)
                       slidesVideo.play()
                       if(isOpenVideo){
                           draw({openVideo:true})
                       }else{
                           draw()
                       }
                   }
               }else{
                   console.warn(" open shareScreen failed")
               }
           }
           openShare(data)
       }
   }else if(window.record.currentRecoderType === 'audio'){
      if(data.type === 'audio'){
          data.callback = function(event){
              if(event.codeType === 999){
                  localStreams.audio = event.stream
                  startRecordBtn.disabled = false
                  startRecordBtn.style.backgroundColor = 'skyblue'
                  muteBtn.textContent = "静音"
                  console.warn("open audio success")
              }else{
                  console.warn("open audio failed")
              }
          }
          data.deviceId = currentMic || devices.microphones[0].deviceId
          openAudio(data)
      }
   }
}


function stopCategory(data){
    console.warn("stop handle getCategory")
    if(!record){
        console.warn('record is not initialized')
        return
    }

    if(!data || !data.type){
        console.warn('invalid parameters')
        return
    }

    if(!(localStreams.audio || localStreams.main || localStreams.slides || localStreams.localVideo)){
        console.warn('localStreams is  not null')
        return
    }
    if(window.record.currentRecoderType === 'areaVideo' || window.record.currentRecoderType === 'video'){
        if(data.type === 'audio'){
            if(localStreams.audio){
                data.callback = function(event){
                    if(event.codeType === 999){
                        localStreams.audio = null
                        console.warn("stop audio success")
                    }else{
                        console.warn("stop audio failed")
                    }
                }
                stopAudio(data)
            }
        }
    }

    if(window.record.currentRecoderType === 'areaVideo'){
        if(data.type === 'slides'){
            if(localStreams.slides){
                data.callback = function(event){
                    if(event.codeType === 999){
                        console.warn("stop shareScreen success: " , event )
                        shareBtn.textContent = "开启共享"
                        isDrawCanvas = false
                        if(localStreams && localStreams.slides){
                            window.record.closeStream(localStreams.slides)
                        }

                        let rect = document.getElementsByClassName('rect')[0]
                        if(rect){
                            rect.style.display = "none"
                        }
                        ctx.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
                        window.cancelAnimationFrame(stopTimeout)

                        virtualVideo.srcObject = null
                        localStreams.slides = null
                        shareVideo.style.display = 'none'
                        shareCanvas.style.display = 'none'
                    }else{
                        console.warn("stop shareScreen failed")
                    }
                }
                stopShare(data)
            }
        }else if(data.type === 'main'){
            if(localStreams.main){
                data.callback = function(event){
                    if(event.codeType === 999){
                        console.warn(" stop video success: ", event )
                        isDrawCanvas = false
                        if(localStreams && localStreams.main){
                            window.record.closeStream(localStreams.main)
                        }
                        localStreams.main = null
                        videoBtn.textContent = "开启视频"
                        shareVideo.style.display = 'none'
                        let rect = document.getElementsByClassName('rect')[0]
                        if(rect){
                            rect.style.display = "none"
                        }
                        context.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
                        window.cancelAnimationFrame(stopTimeout)
                    }else{
                        console.warn(" stop video failed")
                    }
                }
                stopVideo(data)
            }
        }else if(data.type === 'localVideo'){
            if(localStreams.localVideo){
                localVideoBtn.textContent = '上传视频'
                shareLocalVideo.src = ''
                localStreams.localVideo = null
                window.record.isUploadVideo = false
                let rect = document.getElementsByClassName('rect')[0]
                if(rect){
                    rect.style.display = "none"
                }
                isDrawCanvas = false
                ctx.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
                window.cancelAnimationFrame(stopTimeout)
                shareLocalVideo.srcObject = null
                shareLocalVideo.style.display = 'none'
            }
        }
    }else if(window.record.currentRecoderType === 'video') {
        if(data.type === 'main' || data.type === 'localVideo'){
           if(localStreams.main){
               data.callback = function(event){
                   if(event.codeType === 999){
                       console.warn(" stop video success: ", event )
                       videoBtn.textContent = "开启视频"
                       isOpenVideo = false
                       if(localStreams && localStreams.main){
                           window.record.closeStream(localStreams.main)
                       }
                       localStreams.main = null
                       window.cancelAnimationFrame(switchTimeout)
                       context.clearRect(setX, setY, setWidth, setHeight)
                       draw()
                   }else{
                       console.warn(" stop video failed")
                   }
               }
               stopVideo(data)
           }else if(data.type === 'localVideo'){
               if(localStreams.localVideo){
                   localVideo.src = ''
                   localStreams.localVideo = null
                   localVideo.srcObject = null
                   localVideo.style.display = 'none'
                   localVideoBtn.textContent = '上传视频'
                   context.clearRect(0, 0, vtcanvas.width, vtcanvas.height)
                   window.cancelAnimationFrame(stopTimeout)
               }
           }
        }else if(data.type === 'slides'){
            if(localStreams.slides){
                data.callback = function(event){
                    if(event.codeType === 999){
                        console.warn(" stop shareScreen success: ", event)
                        shareBtn.textContent = "开启共享"
                        isOpenShareScreen = false
                        if(localStreams && localStreams.slides){
                            window.record.closeStream(localStreams.slides)
                        }
                        localStreams.slides = null
                        window.cancelAnimationFrame(shareTimeout)
                        context.clearRect(setX, setY, setWidth, setHeight)
                        draw()
                    }else{
                        console.warn(" stop shareScreen failed")
                    }
                }
                stopShare(data)
            }
        }
    }else if(window.record.currentRecoderType === 'audio'){
         data.callback = function(event){
             if(event.codeType === 999){
                 console.warn("stop audio success")
                 if(localStreams && localStreams.audio){
                     window.record.closeStream(localStreams.audio)
                 }
                 localStreams.audio = null
                 muteBtn.textContent = "非静音"
             }else{
                 console.warn("stop audio failed")
             }
         }
         stopAudio(data)
    }
}


/*********************************************************切换麦克风和摄像头***********************************************************************/
function switchAudioDeviced(){
    if(!record){
        console.warn('record is not initialized')
        return
    }

    if (localStreams.audio) {
        stopCategory({type: 'audio'})
    }

    // if(window.record.currentRecoderType === 'areaVideo' || window.record.currentRecoderType === 'video'){
        let data ={}
        data.deviceId = currentMic
        data.callback = function(event){
            if(event.codeType === 999){
                console.warn("switch local audioDeviced success:", event)
                localStreams.audio = event.stream
            }else{
                console.warn("switch local audioDeviced failed")
            }
        }
        switchLocalAudioDeviced(data)
    // }else if(window.record.currentRecoderType === 'audio'){
    //
    // }
}


function switchLcoalCamera(){
    if(!record){
        console.warn('record is not initialized')
        return
    }

    if (localStreams.main) {
        stopCategory({type: 'main'})
    }

    if(window.record.currentRecoderType === 'areaVideo' ){
        let data ={}
        data.deviceId = currentCamera
        data.callback = function(event){
            if(event.codeType === 999){
                console.warn("switch local videoDeviced success")

                shareVideo.style.display = 'inline-block'
                // shareCanvas.style.display = 'inline-block'

                shareBtn.style.backgroundColor = "skyBlue"
                localVideoBtn.style.backgroundColor = "skyBlue"

                localStreams.main = event.stream
                shareVideo.srcObject = localStreams.main
                shareVideo.onloadedmetadata = function(){
                    shareVideo.play()
                    shareVideo.controls = true

                    shareVideo.style.width = shareVideo.videoWidth / 3 + 'px'
                    shareVideo.style.height = shareVideo.videoHeight / 3  + 'px'
                }

                virtualVideo.srcObject = localStreams.main
                virtualVideo.onloadedmetadata = function(){
                    virtualVideo.play()
                    virtualVideo.controls = true

                    virtualVideo.style.width = shareVideo.videoWidth  + 'px'
                    virtualVideo.style.height = shareVideo.videoHeight  + 'px'
                    console.warn("virtualVideo: " + virtualVideo.videoWidth + "  *  " + virtualVideo.videoHeight)
                    console.warn("stream: " + virtualVideo.srcObject.id)
                }
            }else{
                console.warn("switch local videoDeviced failed")
            }
        }
        switchLocalVideoDeviced(data)
    }else if(window.record.currentRecoderType === 'video'){
        let data ={}
        data.deviceId = currentCamera
        data.callback = function(event){
            if(event.codeType === 999){
                videoBtn.textContent = "关闭视频"
                isOpenVideo = true

                startRecordBtn.disabled = false
                startRecordBtn.style.backgroundColor = 'skyblue'

                vtcanvas.style.display = 'inline-block'
                canvasRecord.style.display = "none"
                shareBtn.style.backgroundColor = "skyblue"
                localVideoBtn.style.backgroundColor = "skyblue"
                videoBtn.style.backgroundColor = "skyblue"


                localStreams.main = event.stream
                mainVideo.srcObject = localStreams.main
                mainVideo.onloadedmetadata = function(){
                    console.info("mainVideo: "+ mainVideo.videoWidth + " * " + mainVideo.videoHeight)

                    mainVideo.play()
                    if(isOpenShareScreen){
                        draw({openShare:true})
                    }else{
                        draw()
                    }
                }
            }else{
                console.warn("switch local videoDeviced failed")
            }
        }
        switchLocalVideoDeviced(data)
    } else if(window.record.currentRecoderType === 'audio'){

    }
}



/*************************************************音视频录制canvas 获取画面内容******************************************************************/

function getVideoType(data){
    let videoType = null
    if(isOpenVideo ){
        if(isOpenShareScreen){
            if(data && data.openShare){
                videoType = 'openShareOpenVideo'
            }else{
                videoType = 'openVideoOpenShare'
            }
        }else{
            videoType = 'openVideoStopShare'
        }
    }else if(isOpenShareScreen){
        if(isOpenVideo){
            if(data && data.openVideo){
                videoType = 'openVideoOpenShare'
            }else{
                videoType = 'openShareOpenVideo'
            }
        }else{
            videoType = 'openShareStopVideo'
        }
    }
    if(videoType){
        console.warn("videoType is " , videoType)
    }else{
        console.warn("videoType is null")
    }
    return videoType
}

function draw(data){
    /*处理canvas绘制video像素模糊问题*/
    let videoType = getVideoType(data)
    window.cancelAnimationFrame(switchTimeout)
    window.cancelAnimationFrame(shareTimeout)

    rangeH = vtcanvas.height
    rangeW = vtcanvas.width

    setX = rangeW * 3/4;
    setY = rangeH * 3/4;
    setWidth = rangeW * 1/4;
    setHeight = rangeH * 1/4

    context.clearRect(0, 0, vtcanvas.width ,vtcanvas.height)
    if(videoType === 'openVideoStopShare'){
        console.warn("只有视频  只有视频openVideoStopShare")
        switchToCanvas(videoType, mainVideo, 0, 0, 0, 0, 0, 0, rangeW, rangeH,)
    }

    if(videoType === 'openVideoOpenShare'){
        console.warn("两者皆有openVideoOpenShare")
        shareToCanvas(videoType, slidesVideo,0, 0, 0, 0, 0, 0, vtcanvas.width, vtcanvas.height)
        switchToCanvas(videoType, mainVideo, 0, 0, mainVideo.videoWidth, mainVideo.videoHeight, setX, setY, setWidth, setHeight)
    }

    if(videoType === 'openShareOpenVideo'){
        console.warn("两者都有openShareOpenVideo")
        shareToCanvas(videoType, slidesVideo,0, 0, 0, 0, 0, 0, vtcanvas.width, vtcanvas.height)
        switchToCanvas(videoType, mainVideo, 0, 0, mainVideo.videoWidth, mainVideo.videoHeight, setX, setY, setWidth, setHeight)
    }

    if(videoType === 'openShareStopVideo'){
        console.warn("只有共享openShareStopVideo")
        shareToCanvas(videoType, slidesVideo,0, 0, 0, 0, 0, 0, vtcanvas.width, vtcanvas.height)
    }

    if(!videoType){
        console.warn("清除canvas")
        context.fillStyle = "white"
        context.clearRect(0, 0, vtcanvas.width, vtcanvas.height)
    }

}

function shareToCanvas(type, video, sx, sy, swidth, sheight, x, y, width, height){
    if (video.ended) {
        return;
    }
    context.globalCompositeOperation="source-over";

    if(type === 'openShareOpenVideo' || type === 'openVideoOpenShare' || type === 'openShareStopVideo'){
        context.drawImage(video, x, y, width, height);

    }else if(type === 'openVideoStopShare'){
        context.drawImage(video, sx, sy, swidth, sheight, x, y, width, height);
    }

    shareTimeout = window.requestAnimationFrame(() => {
        shareToCanvas(type,video, sx, sy, swidth, sheight, x, y, width, height);
    })
}

function switchToCanvas(type, video, sx, sy, swidth, sheight, x, y, width, height) {
    if (video.ended) {
        return;
    }
    context.globalCompositeOperation="source-over";
    if( type === 'openShareStopVideo' || type === 'openVideoOpenShare' || type === 'openShareOpenVideo'  ){
        context.drawImage(video, sx, sy, swidth, sheight, x, y, width, height);
    }else if(type === 'openVideoStopShare'){
        context.drawImage(video, x, y, width, height)
    }

    switchTimeout = window.requestAnimationFrame(() => {
        switchToCanvas(type, video, sx, sy, swidth, sheight, x, y, width, height);
    })

}



// *********************************************区域录制获取区域阶段**************************************************************
function finish() {
    if(window.record.currentRecoderType !== 'areaVideo'){
        console.warn("current recoderType is not areaVvideo")
        return
    }
    if(videoBtn.textContent === '开启视频'){
        videoBtn.disabled = true
        videoBtn.style.backgroundColor = '#8c818a'
    }

    if(shareBtn.textContent === '开启共享'){
        shareBtn.disabled = true
        shareBtn.style.backgroundColor = '#8c818a'
    }

    if(localVideoBtn.textContent === '上传视频'){
        localVideoBtn.disabled = true
        localVideoBtn.style.backgroundColor = '#8c818a'
    }

    // if(muteBtn.textContent === '静音'){
    //     muteBtn.disabled = true
    //     muteBtn.style.backgroundColor = '#8c818a'
    // }

    window.cancelAnimationFrame(stopTimeout)
    isDrawCanvas = true
    let rangeW
    let rangeH
    let videoHeight
    let videoWidth
    let sx = window.startPositionX
    let sy = window.startPositionY

    startRecordBtn.disabled = false
    startRecordBtn.style.backgroundColor = 'skyblue'

    if(window.record.isUploadVideo){
        videoHeight = shareLocalVideo.videoHeight;
        videoWidth =  shareLocalVideo.videoWidth;
        width = Math.abs(window.endPositionX - window.startPositionX);
        height = Math.abs( window.endPositionY - window.startPositionY);
        rangeW = videoWidth * (width / shareLocalVideo.offsetWidth);
        rangeH = videoHeight * (height / shareLocalVideo.offsetHeight);
        shareLocalVideo.width = videoWidth
        shareLocalVideo.height = videoHeight
        shareCanvas.style.display = 'inline-block'
        shareCanvas.height = rangeH ;
        shareCanvas.width  = rangeW ;
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        playCanvas(shareLocalVideo, shareCanvas, ctx, sx, sy, rangeW, rangeH, canvasX, canvasY, text);
    }else{
        videoHeight = shareVideo.videoHeight ;
        videoWidth = shareVideo.videoWidth ;
        console.warn("shareVideo:" + videoWidth + " * " + videoHeight)
        width = Math.abs(window.endPositionX    - window.startPositionX );
        height = Math.abs( window.endPositionY   - window.startPositionY );
        rangeW = videoWidth * (width / shareVideo.offsetWidth) ;
        rangeH = videoHeight * (height / shareVideo.offsetHeight);

        sx = window.startPositionX * 3
        sy = window.startPositionY * 3
        shareCanvas.style.display = 'inline-block'
        // let rect = document.getElementsByClassName('rect')[0].getBoundingClientRect()
        // shareCanvas.height = rect.height ;
        // shareCanvas.width  = rect.width ;
        // shareCanvas.style.height = rect.width + 'px';
        // shareCanvas.style.width  = rect.height + 'px';
        // shareCanvas.height = rangeH  ;
        // shareCanvas.width  = rangeW  ;
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        playCanvas(virtualVideo, shareCanvas, ctx, sx, sy, rangeW, rangeH, canvasX, canvasY, text);
    }

    console.warn("rangeH:",rangeH)
    console.warn("rangeW:",rangeW)
}



/*
* video视频转换到canvas中
* */
function playCanvas(video,canvas,ctx,sx,sy,rangeW,rangeH, canvasX, canvasY, text){
    ctx.drawImage(video, sx, sy, rangeW, rangeH, 0, 0, canvas.width, canvas.height);
    if(text ){
        writeTextOnCanvas(ctx, 22,40,text)
    }
    stopTimeout = requestAnimationFrame(() => {
        playCanvas(video, canvas, ctx, sx, sy, rangeW, rangeH, canvasX, canvasY, text);
    })
}


// *****************************************录制阶段*********************************************************

function beginRecord() {
    if (!record ) {
        console.warn('record is not initialized')
        return
    }
    if ( !(localStreams.audio || localStreams.main || localStreams.slides || localStreams.localVideo) ) {
        console.warn("localStream is null")
        return
    }
    console.warn("start record...")
    let audioTrack
    let mixAudioStream
    let mixStream = []
    let data = {}
    let canvasStream
    let canvasTrack

    if(window.record.currentRecoderType === 'areaVideo'){
        canvasStream = shareCanvas.captureStream(60)
    }else if(window.record.currentRecoderType === 'video'){
        canvasStream = vtcanvas.captureStream(60)
    }

    if(canvasStream){
        canvasTrack = canvasStream.getTracks()[0]
    }
    if (canvasTrack) {
        mixStream.push(canvasTrack)
    }
    if(localStreams.localVideo){
        if(localStreams.audio && localStreams.localVideo.getAudioTracks().length > 0){
            mixAudioStream = window.record.mixingStream(localStreams.localVideo, localStreams.audio)
            audioTrack = mixAudioStream.getTracks()[0]
            mixStream.push(audioTrack)
        }
    }else if(localStreams.slides){
        if(localStreams.audio && localStreams.slides.getAudioTracks().length > 0){
            mixAudioStream = window.record.mixingStream(localStreams.slides, localStreams.audio)
            audioTrack = mixAudioStream.getTracks()[0]
            mixStream.push(audioTrack)
        }else{
            audioTrack = localStreams.audio.getAudioTracks()[0]
            mixStream.push(audioTrack)
        }
    }else{
        audioTrack = localStreams.audio.getTracks()[0]
        mixStream.push(audioTrack)
    }

    data.stream = new MediaStream(mixStream)
    console.warn("RecordStream:", data.stream)

    if (window.record.currentRecoderType === 'areaVideo') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("begin Record success:",event)
                isRecording = true

                startRecordBtn.disabled = true
                stopRecordBtn.disabled = false
                pauseRecordBtn.disabled = false
                resumeRecordBtn.disabled = true
                downloadBtn.disabled = false
                // restartRecordBtn.disabled = false
                gifImgBtn.disabled = false
                startRecordBtn.style.backgroundColor = '#8c818a'
                stopRecordBtn.style.backgroundColor = 'skyblue'
                pauseRecordBtn.style.backgroundColor = 'skyblue'
                resumeRecordBtn.style.backgroundColor = '#8c818a'
                downloadBtn.style.backgroundColor = '#8c818a'
                // restartRecordBtn.style.backgroundColor = "skyblue"
                gifImgBtn.style.backgroundColor = 'skyblue'

                shareRecord.style.display = "inline-block"
                shareRecord.srcObject = canvasStream ||event.stream.stream

                shareRecord.onloadedmetadata = function (e) {
                    shareRecord.play();
                };
            }else{
                console.warn("begin Record failed")
            }
        }
        window.record.videoRecord(data)
    } else if (window.record.currentRecoderType === 'video') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("begin Record success:",event)
                isRecording = true

                startRecordBtn.disabled = true
                stopRecordBtn.disabled = false
                pauseRecordBtn.disabled = false
                resumeRecordBtn.disabled = true
                downloadBtn.disabled = false
                gifImgBtn.disabled = false
                // restartRecordBtn.disabled = false
                startRecordBtn.style.backgroundColor = '#8c818a'
                stopRecordBtn.style.backgroundColor = 'skyblue'
                pauseRecordBtn.style.backgroundColor = 'skyblue'
                resumeRecordBtn.style.backgroundColor = '#8c818a'
                downloadBtn.style.backgroundColor = '#8c818a'
                // restartRecordBtn.style.backgroundColor = "skyblue"
                gifImgBtn.style.backgroundColor = 'skyblue'

                if(videoBtn.textContent === '开启视频'){
                    videoBtn.disabled = true
                    videoBtn.style.backgroundColor = '#8c818a'
                }

                if(shareBtn.textContent === '开启共享'){
                    shareBtn.disabled = true
                    shareBtn.style.backgroundColor = '#8c818a'
                }

                if(localVideoBtn.textContent === '上传视频'){
                    localVideoBtn.disabled = true
                    localVideoBtn.style.backgroundColor = '#8c818a'
                }

                // if(muteBtn.textContent === '静音'){
                //     muteBtn.disabled = true
                //     muteBtn.style.backgroundColor = '#8c818a'
                // }


                canvasRecord.style.display = 'inline-block'
                canvasRecord.srcObject = canvasStream || event.stream.stream
                canvasRecord.onloadedmetadata = function (e) {
                    canvasRecord.play();
                };
            }else{
                console.warn("begin Record failed")
            }
        }
        window.record.videoRecord(data)
    }else if(window.record.currentRecoderType === 'audio'){
        data.callback = function(event){
            if(event.codeType === 999){
                console.warn("audio recorder success:", event)
                localAudio.srcObject = event.stream.stream


                startRecordBtn.disabled = true
                stopRecordBtn.disabled = false
                pauseRecordBtn.disabled = false
                resumeRecordBtn.disabled = true
                downloadBtn.disabled = false
                // restartRecordBtn.disabled = false
                gifImgBtn.disabled = true
                startRecordBtn.style.backgroundColor = '#8c818a'
                stopRecordBtn.style.backgroundColor = 'skyblue'
                pauseRecordBtn.style.backgroundColor = 'skyblue'
                resumeRecordBtn.style.backgroundColor = '#8c818a'
                downloadBtn.style.backgroundColor = '#8c818a'
                // restartRecordBtn.style.backgroundColor = "skyblue"
                gifImgBtn.style.backgroundColor = '#8c818a'

                localAudio.style.display = 'block'
                localAudio.ondataavailable = function(){
                    localAudio.play()
                }
            }else{
                console.warn("audio recorder failed")
            }
        }
        window.record.videoRecord(data)
    }
}

 function handleStopGif(){
     if(window.record.currentRecoderType === 'areaVideo' || window.record.currentRecoderType === 'video'){
         downloadBtn.style.width = '80px'
         downloadBtn.style.height = '50px'
         downloadBtn.style.borderColor = 'white'
         downloadBtn.style.borderWidth = '1px'
         downloadBtn.style.borderStyle = 'solid'
         downloadBtn.textContent = '下载视频'
         downloadBtn.style.fontSize = 'small'
         downloadGifImg.style.display = 'block'
         gifCtx.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
         window.cancelAnimationFrame(canvasTimer)
         if(window.record.currentRecoderType === 'areaVideo'){
             if(gifVideoOfAreaVideo.srcObject){
                 let tracks = gifVideoOfAreaVideo.srcObject.getTracks();
                 tracks.forEach(track => {
                     track.stop()
                 });
                 gifVideoOfAreaVideo.srcObject = null
             }
             gifVideoOfAreaVideo.src = ''
             document.getElementById('imgResult').src = ''
             gif_container_videoArea.style.display = 'none'
         }else{
             if(gifVideo.srcObject){
                 let tracks = gifVideo.srcObject.getTracks();
                 tracks.forEach(track => {
                     track.stop()
                 });
                 gifVideo.srcObject = null
             }
             gifVideo.src = ''
             document.getElementById('result').src = ''
             gifContainer.style.display = "none"
         }
     }else if(window.record.currentRecoderType === 'audio'){
         downloadBtn.style.width = '90px'
         downloadBtn.style.height = '50px'
         downloadBtn.style.border = 'none'
         downloadBtn.textContent = '下载音频'
         downloadBtn.style.fontSize = 'medium'
         downloadGifImg.style.display = 'none'
     }
 }

function stopRecord() {
    if (!record) {
        console.warn('record is not initialized')
        return
    }
    if (!(localStreams.audio || localStreams.main || localStreams.slides || localStreams.localVideo)) {
        console.warn("localStream is null")
        return
    }
    console.warn("stop record...")

    let data = {}

    handleStopGif()

    if (window.record.currentRecoderType === 'areaVideo') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("stop recorder success:", event)
                isRecording = false
                virtualVideo.srcObject = null
                let buffer = event.stream.recordedBlobs
                shareRecord.srcObject = event.stream.stream

                ctx.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
                let rect = document.getElementsByClassName('rect')[0]
                if(rect){
                    rect.style.display = "none"
                }
                ctx.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
                window.cancelAnimationFrame(stopTimeout)
                shareVideo.style.display = 'none'
                shareCanvas.style.display = 'none'
                shareVideo.style.width = '0px'
                shareVideo.style.height = '0px'

                startRecordBtn.disabled = false
                stopRecordBtn.disabled = true
                pauseRecordBtn.disabled = true
                resumeRecordBtn.disabled = true
                restartRecordBtn.disabled = false
                downloadBtn.disabled = false
                gifImgBtn.disabled = true
                startRecordBtn.style.backgroundColor = 'skyblue'
                stopRecordBtn.style.backgroundColor = '#8c818a'
                pauseRecordBtn.style.backgroundColor = '#8c818a'
                resumeRecordBtn.style.backgroundColor = '#8c818a'
                downloadBtn.style.backgroundColor = 'skyblue'
                restartRecordBtn.style.backgroundColor = 'skyblue'
                gifImgBtn.style.backgroundColor = '#8c818a'

                /**停止录制后需要关闭流**/
                let tracks = shareRecord.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop()
                });


                Object.keys(localStreams).forEach(function (key) {
                    if(key === 'audio'){
                        stopCategory({type: 'audio'})
                    }else if (key === 'main'){
                        stopCategory({type: 'main'})
                    }else if(key ==='localVideo'){
                        stopCategory({type: 'localVideo'})
                    } else if(key === 'slides'){
                        stopCategory({type: 'slides'})
                    }
                    localStreams[key] = null
                })


                /***录制内容返回播放***/
                let blob = new Blob(buffer, {'type': 'video/webm'});
                let url = window.URL.createObjectURL(blob);
                shareRecord.controls = true
                shareRecord.srcObject = null;
                shareRecord.src = url;
                shareRecord.play();
            } else {
                console.warn("stop recorder failed")
            }
        }
        window.record.stopVideoRecord(data)
    } else if (window.record.currentRecoderType === 'video') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("stop recorder success:", event)
                isRecording = false
                let buffer = event.stream.recordedBlobs
                canvasRecord.srcObject = event.stream.stream
                window.cancelAnimationFrame(switchTimeout)
                window.cancelAnimationFrame(shareTimeout)
                context.clearRect(0, 0, vtcanvas.width, vtcanvas.height)
                vtcanvas.style.display = 'none'

                startRecordBtn.disabled = false
                stopRecordBtn.disabled = true
                pauseRecordBtn.disabled = true
                resumeRecordBtn.disabled = true
                restartRecordBtn.disabled = false
                downloadBtn.disabled = false
                gifImgBtn.disabled = true
                startRecordBtn.style.backgroundColor = 'skyblue'
                stopRecordBtn.style.backgroundColor = '#8c818a'
                pauseRecordBtn.style.backgroundColor = '#8c818a'
                resumeRecordBtn.style.backgroundColor = '#8c818a'
                downloadBtn.style.backgroundColor = 'skyblue'
                restartRecordBtn.style.backgroundColor = 'skyblue'
                gifImgBtn.style.backgroundColor = '#8c818a'

                /**停止录制后需要关闭流**/
                let tracks = canvasRecord.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop()
                });

                Object.keys(localStreams).forEach(function (key) {
                    if(key === 'audio'){
                        stopCategory({type: 'audio'})
                    }else if (key === 'main'){
                        stopCategory({type: 'main'})
                    }else if(key ==='localVideo'){
                        stopCategory({type: 'localVideo'})
                    } else if(key === 'slides'){
                        stopCategory({type: 'slides'})
                    }
                    localStreams[key] = null
                })

                /***录制内容返回播放***/
                let blob = new Blob(buffer, {'type': 'video/webm'});
                let url = window.URL.createObjectURL(blob);
                canvasRecord.controls = true
                canvasRecord.srcObject = null;
                canvasRecord.src = url;
                canvasRecord.play();
            } else {
                console.warn("stop recorder failed")
            }
        }
        window.record.stopVideoRecord(data)
    }else if(window.record.currentRecoderType === 'audio'){
         data.callback = function(event){
             if(event.codeType === 999){
                 console.warn("stop audio recorder success")
                 let buffer = event.stream.recordedBlobs

                 startRecordBtn.disabled = false
                 stopRecordBtn.disabled = true
                 pauseRecordBtn.disabled = true
                 resumeRecordBtn.disabled = true
                 restartRecordBtn.disabled = false
                 downloadBtn.disabled = false
                 gifImgBtn.disabled = true
                 startRecordBtn.style.backgroundColor = 'skyblue'
                 stopRecordBtn.style.backgroundColor = '#8c818a'
                 pauseRecordBtn.style.backgroundColor = '#8c818a'
                 resumeRecordBtn.style.backgroundColor = '#8c818a'
                 downloadBtn.style.backgroundColor = 'skyblue'
                 restartRecordBtn.style.backgroundColor = 'skyblue'
                 gifImgBtn.style.backgroundColor = '#8c818a'


                 /**停止录制后需要关闭流**/
                 let tracks = localAudio.srcObject.getTracks();
                 tracks.forEach(track => {
                     track.stop()
                 });

                 Object.keys(localStreams).forEach(function (key) {
                     if(key === 'audio'){
                         stopCategory({type: 'audio'})
                     }
                     localStreams[key] = null
                 })

                 /***录制内容返回播放***/
                 let blob = new Blob(buffer, {'type': 'audio/webm'});
                 let url = window.URL.createObjectURL(blob);
                 localAudio.controls = true
                 localAudio.srcObject = null;
                 localAudio.src = url;
                 localAudio.play();
             }else{
                 console.warn("stop audio recorder failed")
             }
         }
         window.record.stopVideoRecord(data)
    }
}

function pauseRecord(){
    if (!record) {
        console.warn('record is not initialized')
        return
    }
    if (!(localStreams.audio || localStreams.main || localStreams.slides || localStreams.localVideo)) {
        console.warn("localStream is null")
        return
    }
    console.warn("pause record...")

    let data = {}
    startRecordBtn.disabled = true
    stopRecordBtn.disabled = false
    pauseRecordBtn.disabled = true
    resumeRecordBtn.disabled = false
    downloadBtn.disabled = false
    startRecordBtn.style.backgroundColor = '#8c818a'
    stopRecordBtn.style.backgroundColor = 'skyblue'
    pauseRecordBtn.style.backgroundColor = '#8c818a'
    resumeRecordBtn.style.backgroundColor = 'skyblue'
    downloadBtn.style.backgroundColor = '#8c818a'

    if (window.record.currentRecoderType === 'areaVideo') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("pause record success:", event)
                shareRecord.pause();
            } else {
                console.warn("pause record failed")
            }
        }
        window.record.videoMediaRecorder.pause()
        shareRecord.pause();
    } else if (window.record.currentRecoderType === 'video') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("pause record success:", event)
                canvasRecord.pause();
            } else {
                console.warn("pause record failed")
            }
        }
        window.record.videoMediaRecorder.pause()
        canvasRecord.pause();
    }else if(window.record.currentRecoderType === 'audio'){
        window.record.videoMediaRecorder.pause()
        localAudio.pause();
    }
}


function resumeRecord(){
    if (!record) {
        console.warn('record is not initialized')
        return
    }
    if (!(localStreams.audio || localStreams.main || localStreams.slides || localStreams.localVideo)) {
        console.warn("localStream is null")
        return
    }
    console.warn("resume record...")

    let data = {}
    startRecordBtn.disabled = true
    stopRecordBtn.disabled = false
    pauseRecordBtn.disabled = false
    resumeRecordBtn.disabled = true
    downloadBtn.disabled = true
    startRecordBtn.style.backgroundColor = '#8c818a'
    stopRecordBtn.style.backgroundColor = 'skyblue'
    pauseRecordBtn.style.backgroundColor = 'skyblue'
    resumeRecordBtn.style.backgroundColor = '#8c818a'
    downloadBtn.style.backgroundColor = '#8c818a'
    if (window.record.currentRecoderType === 'areaVideo') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("resume record success:", event)
                shareRecord.play();
            } else {
                console.warn("resume record failed")
            }
        }
        window.record.videoMediaRecorder.resume()
        shareRecord.play()
    } else if (window.record.currentRecoderType === 'video') {
        data.callback = function (event) {
            if (event.codeType === 999) {
                console.warn("resume record success:", event)
                canvasRecord.play();
            } else {
                console.warn("resume record failed")
            }
        }
        window.record.videoMediaRecorder.resume()
        canvasRecord.play()
    } else if(window.record.currentRecoderType === 'audio'){
        window.record.videoMediaRecorder.resume()
        localAudio.play()
    }
}


function download(){
    if (!record) {
        console.warn('record is not initialized')
        return
    }

    let data = {}
    data.callback = function (event) {
        if (event.codeType === 999) {
            console.warn("download record success:", event)
        } else {
            console.warn("download record failed")
        }
    }
    if (window.record.currentRecoderType === 'areaVideo' || window.record.currentRecoderType === 'video') {
        window.record.videoDownload(data)
    } else if (window.record.currentRecoderType === 'audio') {
        window.record.videoDownload(data)
    }
}

function downloadImg(){
    if (!record) {
        console.warn('record is not initialized')
        return
    }

    let data = {}
    data.callback = function (event) {
        if (event.codeType === 999) {
            console.warn("download record success:", event)
        } else {
            console.warn("download record failed")
        }
    }
    if (window.record.currentRecoderType === 'areaVideo' || window.record.currentRecoderType === 'video') {
        // window.record.videoDownload(data)
        let element = document.createElement('a');
        element.href = URL.createObjectURL(imgBlobs);
        element.download = 'draw-demo-name';
        //设置下载文件名称
        document.body.appendChild(element);
        let evt = document.createEvent("MouseEvents");
        evt.initEvent("click", false, false);
        element.dispatchEvent(evt);
        document.body.removeChild(element);
        let img = document.createElement('img')
        img.src = URL.createObjectURL(imgBlobs);
    }
}


function restartRecord(){

    if (!record) {
        console.warn('record is not initialized')
        return
    }

    // if(!(localStreams.audio || localStreams.main || localStreams.slides || localStreams.localVideo)){
    //     console.warn("localStreams has  been closed")
    //     Object.keys(localStreams).forEach(function (key) {
    //         let stream = localStreams[key]
    //         if (stream) {
    //             window.record.closeStream(stream)
    //         }
    //         localStreams[key] = null
    //     })
    // }

    if(window.record.currentRecoderType === 'areaVideo'  || window.record.currentRecoderType === 'video'){
        if(videoBtn.textContent === '开启视频'){
            videoBtn.disabled = false
            videoBtn.style.backgroundColor = 'skyblue'
        }

        if(shareBtn.textContent === '开启共享'){
            shareBtn.disabled = false
            shareBtn.style.backgroundColor = 'skyblue'
        }

        if(localVideoBtn.textContent === '上传视频'){
            localVideoBtn.disabled = false
            localVideoBtn.style.backgroundColor = 'skyblue'
        }

        if(muteBtn.textContent === '静音'){
            muteBtn.disabled = false
            muteBtn.style.backgroundColor = 'skyblue'
        }

        if (window.record.currentRecoderType === 'areaVideo' ) {
            shareVideo.style.display = "none"
            shareCanvas.style.display = 'none'
            shareRecord.style.display = 'none'
            let rect = document.getElementsByClassName('rect')[0]
            if(rect){
                rect.style.display = "none"
            }
            ctx.clearRect(0, 0, shareCanvas.width, shareCanvas.height)
            window.cancelAnimationFrame(stopTimeout)
            gif_container_videoArea.style.display = 'none'

        } else if (window.record.currentRecoderType === 'video') {
            vtcanvas.style.display = 'none'
            canvasRecord.style.display = "none"
            gifContainer.style.display = 'none'
        }
        getCategory({type: 'audio'})
    }else if(window.record.currentRecoderType === 'audio'){
        startRecordBtn.disabled = true
        stopRecordBtn.disabled = true
        pauseRecordBtn.disabled = true
        resumeRecordBtn.disabled = true
        restartRecordBtn.disabled = true
        downloadBtn.disabled = true
        startRecordBtn.style.backgroundColor = '#8c818a'
        stopRecordBtn.style.backgroundColor = '#8c818a'
        pauseRecordBtn.style.backgroundColor = '#8c818a'
        resumeRecordBtn.style.backgroundColor = '#8c818a'
        downloadBtn.style.backgroundColor = '#8c818a'
        restartRecordBtn.style.backgroundColor = '#8c818a'

        videoBtn.disabled = true
        shareBtn.disabled = true
        localVideoBtn.disabled = true
        muteBtn.disabled = false
        videoBtn.style.backgroundColor = "#8c818a"
        shareBtn.style.backgroundColor = "#8c818a"
        localVideoBtn.style.backgroundColor = "#8c818a"
        muteBtn.style.backgroundColor = "skyblue"
        getCategory({type: 'audio'})
    }
    restartRecordBtn.disabled = true
    restartRecordBtn.style.backgroundColor = "#8c818a"

}

/**********************************生成gif 动图********************************************/

async function gifImg(){
    if(window.record.currentRecoderType === 'areaVideo'){
        gif_container_videoArea.style.display = 'block'
        drawCanvas(shareCanvas)
    }else if(window.record.currentRecoderType === 'video'){
        gifContainer.style.display = 'block'
        drawCanvas(vtcanvas)
    }
    setFormatSelect(format)
    await handleGIF()
}

function handleGIF(){
    downloadGifImg.disabled = true
    downloadGifImg.style.backgroundColor = "#8c818a"
    let imgWidth
    let imgHeight
    if(window.record.currentRecoderType === 'areaVideo'){
        if(isUploadVideo){
            imgWidth = shareRecord.width
            imgHeight = shareRecord.height
        }else{
            imgWidth = shareRecord.videoWidth
            imgHeight = shareRecord.videoHeight
        }
        gifCtx.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
        if(gifVideoOfAreaVideo.srcObject){
            let tracks = gifVideoOfAreaVideo.srcObject.getTracks();
            tracks.forEach(track => {
                track.stop()
            });
            gifVideoOfAreaVideo.srcObject = null
        }
        gifVideoOfAreaVideo.src = ''
        document.getElementById('imgResult').src = ''
        drawCanvas(vtcanvas)
    }else if(window.record.currentRecoderType === 'video'){
        imgWidth = canvasRecord.videoWidth
        imgHeight = canvasRecord.videoHeight
        gifCtx.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
        if(gifVideo.srcObject){
            let tracks = gifVideo.srcObject.getTracks();
            tracks.forEach(track => {
                track.stop()
            });
            gifVideo.srcObject = null
        }
        gifVideo.src = ''
        document.getElementById('result').src = ''
        drawCanvas(vtcanvas)
    }
    // if(gif){
    //     gif.abort();
    //     gif.frames = [];
    // }

    recorder.start(10);
    inter = setInterval(fun, 1000)

    console.warn("img size:", imgWidth+ "  *  " + imgHeight)
    gif = new GIF({
        workers: 4,
        workerScript: './gif.worker.js',
        width: imgWidth,
        height: imgHeight
    });

    gif.on('start', function() {
        return startTime = new Date().getTime();
    });
    gif.on('progress', function(p) {
        if(window.record.currentRecoderType === 'areaVideo'){
            return load.textContent =  "rendering: " + (Math.round(p * 100)) + "%" ;
        }else if(window.record.currentRecoderType === 'video'){
            return info.textContent =  "rendering: " + (Math.round(p * 100)) + "%" ;
        }
    });
    gif.on('finished', function(blob) {
        gif.abort();
        gif.frames = [];
        let delta, img
        imgBlobs = blob
        downloadGifImg.disabled = false
        downloadGifImg.style.backgroundColor = "skyblue"
        if(window.record.currentRecoderType === 'areaVideo'){
            img = document.getElementById('imgResult');
        }else if(window.record.currentRecoderType === 'video'){
            img = document.getElementById('result');
        }

        img.src = URL.createObjectURL(blob);
        delta = new Date().getTime() - startTime;
        if(window.record.currentRecoderType === 'areaVideo'){
            return load.textContent =  "done in\n" + ((delta / 1000).toFixed(2)) + "sec,\nsize " + ((blob.size / 1000).toFixed(2)) + "kb";
        }else if(window.record.currentRecoderType === 'video'){
            return info.textContent =  "done in\n" + ((delta / 1000).toFixed(2)) + "sec,\nsize " + ((blob.size / 1000).toFixed(2)) + "kb";
        }
    });
}


function fun() {
    t--;
    if(t <= 0) {
        let span = document.createElement("span")
        span.id = 'span'
        span.style.color = 'color:#7A0099 !important'
        span.textContent = 'Generate gif animation'
        if(window.record.currentRecoderType === 'areaVideo'){
            load.textContent = ' Please click the '+ span.textContent + ' button '
        }else if(window.record.currentRecoderType === 'video'){
            info.textContent =  ' Please click the '+ span.textContent  + ' button '
        }
        recorder.stop()
        clearInterval(inter)
        t = 6
    }else{
        if(window.record.currentRecoderType === 'areaVideo'){
            load.textContent = "loading... "+ t
        }else if(window.record.currentRecoderType === 'video'){
            info.textContent = "loading... "+ t
        }
        console.warn("t: ", t)
    }
}
/*********************canvas 绘制 video ********************************/
function drawCanvas(canvas){
    gifCtx.drawImage(canvas, 0, 0, gifCanvas.width, gifCanvas.height);
    canvasTimer = window.requestAnimationFrame(() => {
        drawCanvas(canvas)
    })
}
/********************************录制canvas*************************************/
function setFormatSelect(format){
    if(!MediaRecorder.isTypeSupported(format)){
        alert(format)
        alert("当前浏览器不支持该编码类型");
        return;
    }
    setRecorder(format)
}

function setRecorder(format) {
    let canvasStream = gifCanvas.captureStream(60); // 60 FPS recording
    console.warn("canvasStream:",canvasStream)
    recorder = new MediaRecorder(canvasStream, {
        mimeType: format
    });

    recorder.ondataavailable = e => {
        allChunks.push(
            e.data
        );
    }

    recorder.onstop = function () {
        if(window.record.currentRecoderType === 'areaVideo'){
            /****停止后刪除video流****/
            if(gifVideoOfAreaVideo.srcObject){
                let tracks = gifVideoOfAreaVideo.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop()
                });
            }
            gifVideoOfAreaVideo.srcObject = null;

            /***录制内容返回播放***/
            console.warn("recorder stop...")
            let blob = new Blob(allChunks, {'type': 'video/webm'});
            let url = window.URL.createObjectURL(blob);
            gifVideoOfAreaVideo.src = url;
            // gifVideo.play();
            // gifVideo.pause()

        }else if(window.record.currentRecoderType === 'video'){
            if(gifVideo.srcObject){
                let tracks = gifVideo.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop()
                });
            }
            gifVideo.srcObject = null;
            /***录制内容返回播放***/
            console.warn("recorder stop...")
            let blob = new Blob(allChunks, {'type': 'video/webm'});
            let url = window.URL.createObjectURL(blob);
            gifVideo.src = url;
            // gifVideo.play();
            // gifVideo.pause()
        }
        gif.abort();
        gif.frames = []
    }
}

/*************************关于gif 生成*****************************/

// sample = document.getElementById("sample")
load = document.getElementById("load")
go = document.getElementById("goes")
begin = document.getElementById("begin")

info = document.getElementById("info")
button = document.getElementById("go")
start = document.getElementById("start")

startTime = null;
sampleInterval = null;
timer = null;
// sample.addEventListener('change', sampleUpdate);
// gifVideo.addEventListener('canplay', listenCanPlayofGif);
// button.addEventListener('click', listenClickofGif);
// gifVideo.addEventListener('play', listenPlayofGif);
// gifVideo.addEventListener('ended', listenVideoEnded);



gifVideoOfAreaVideo.addEventListener('canplay', listenCanPlayofGif);
go.addEventListener('click', listenClickofAreaVideoGif);
gifVideoOfAreaVideo.addEventListener('play', listenPlayofAreaVideoGif);
gifVideoOfAreaVideo.addEventListener('ended', listenVideoEnded);

/***************************************更新代码**********************************************/
function listenCanPlayofGif(){
    button.disabled = false;
    go.disabled = false
    // sample.disabled = false;
    if(window.record.currentRecoderType === 'areaVideo'){
        return  update();
    }else if(window.record.currentRecoderType === 'video'){
        return  updateOfAeraVideo();
    }
}


function listenPlayofGif(){
    clearInterval(timer);
    return timer = setInterval(addFrame, sampleInterval);
}


function listenPlayofAreaVideoGif(){
    console.warn("video play...")
    clearInterval(timer);
    return timer = setInterval(addFrameOfAreaVideo, sampleInterval);
}

function listenVideoEnded(){
    clearInterval(timer);
    gif.setOption('repeat', 0);
    gif.abort()
    return gif.render();
}

function addFrame(){
    info.textContent =  "capturing at " + gifVideo.currentTime
    return gif.addFrame(gifVideo, {
        copy: true,
        delay: sampleInterval
    });
}


function addFrameOfAreaVideo(){
    load.textContent =  "capturing at " + gifVideoOfAreaVideo.currentTime
    return gif.addFrame(gifVideoOfAreaVideo, {
        copy: true,
        delay: sampleInterval
    });
}

function listenClickofGif(){
    gifVideo.pause();
    gifVideo.currentTime = 0;
    gif.abort();
    gif.frames = [];
    return gifVideo.play();
}


function listenClickofAreaVideoGif(){
    gifVideoOfAreaVideo.pause()
    gifVideoOfAreaVideo.currentTime = 0
    gif.abort();
    gif.frames = [];
    return gifVideoOfAreaVideo.play();
}

function update(){
    sampleInterval =  400;
    gif.abort();
    return info.textContent = "ready to start with a sample interval of " + sampleInterval + "ms";
}


function updateOfAeraVideo(){
    sampleInterval =  400;
    gif.abort();
    return  load.textContent = "ready to start with a sample interval of " + sampleInterval + "ms";
}
/*****************************************初始化阶段****************************************************/

window.addEventListener('load', async function () {
    if (Record) {
        Record.prototype.preInit()
    }
    await navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
    window.record.currentRecoderType = 'areaVideo'
    getCategory({type: 'audio'})
})


$(document).ready(function(){
    $('.videoArea').frameSelection({
        mask:true,
        callback:function(){
            console.log('rendering!!!');
        },
        done:function(result){
            console.log('rendering done',result);
        }
    }) ;
})
