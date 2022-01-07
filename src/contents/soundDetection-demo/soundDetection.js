let SoundMeter = function () {
    if (this instanceof SoundMeter) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = null;
        this.instant = 0.0;
        this.slow = 0.0;
        this.clip = 0.0;
        this.currentVolumeLevel = 0
        this.script = null
        this.mic = null
        this.showMicVolumnTimer = null
        this.soundDetectionStream = null
        this.audioStream = null
    }else{
        return new SoundMeter()
    }
}

SoundMeter.prototype.connectToSource = function(stream, callback) {
    if(!stream){
       console.info("Invalid audio stream parameter ")
        return
    }
   console.info('SoundMeter connecting');
    let This = this
    if(This.context.state === 'suspended') {
        This.context.resume()
    }
    try {
        This.mic = This.context.createMediaStreamSource(stream);
        This.mic.connect(This.script);
        // necessary to make sample run, but should not be.
        This.script.connect(This.context.destination);
        if (typeof callback !== 'undefined') {
            callback(null);
        }
    } catch (e) {
        console.error(e);
        if (typeof callback !== 'undefined') {
            callback(e);
        }
    }
};

SoundMeter.prototype.getVolume = function(event) {
    // 获得缓冲区的输入音频，转换为包含了PCM通道数据的32位浮点数组
    const buffer = event.inputBuffer.getChannelData(0);
    // 获取缓冲区中最大的音量值
    this.instant = Math.max(...buffer);
}

SoundMeter.prototype.stop = function() {
   console.info('SoundMeter stopping');
    let This = this
    clearInterval(This.showMicVolumnTimer)
    This.showMicVolumnTimer = null
    if(This.soundDetectionStream){
        This.soundDetectionStream.getTracks().forEach(track => {track.stop()});
        This.soundDetectionStream = null
    }
    if(This.mic){
        This.mic.disconnect();
        This.script.disconnect();
        This.mic = null
        This.script = null
    }
    if(This.context){
        This.context.close()
        This.context = null
    }
    This.audioStream = null
};

SoundMeter.prototype.getVolumeLevel = function(nMicVolumn){
    let This = this
    let volumeLevel
    nMicVolumn = nMicVolumn * 2.5
    if(This.getBrowserDetail().browser === 'firefox'){
        if(nMicVolumn < 0.02 && nMicVolumn > 0){
            volumeLevel = 1;
        }else if(nMicVolumn > 0.15){
            volumeLevel = 10;
        }else if(nMicVolumn >= 0.02 && nMicVolumn < 0.05){
            nMicVolumn -= 0.02;
            volumeLevel = Math.round(nMicVolumn * 100 )+2;
        }else if(nMicVolumn >= 0.05 && nMicVolumn <= 0.10){
            nMicVolumn -= 0.05;
            volumeLevel = Math.round(nMicVolumn * 60 )+5;
        }else if(nMicVolumn > 0.10 && nMicVolumn <= 0.15){
            nMicVolumn -= 0.10;
            volumeLevel = Math.round(nMicVolumn * 20 ) + 8;
        }else{
            volumeLevel = 0
        }
    }else if(This.getBrowserDetail().browser === 'edge'){
        if(nMicVolumn < 0.04 && nMicVolumn > 0){
            volumeLevel = 1;
        }else if(nMicVolumn > 0.24){
            volumeLevel = 10;
        }else if(nMicVolumn >= 0.04 && nMicVolumn <= 0.14){
            nMicVolumn -= 0.04;
            volumeLevel = Math.round(nMicVolumn * 50 )+1;
        }else if(nMicVolumn > 0.14 && nMicVolumn <= 0.24){
            nMicVolumn -= 0.14;
            volumeLevel = Math.round(nMicVolumn * 30 ) + 6;
        }else{
            volumeLevel = 0
        }
    }else{
        if(nMicVolumn < 0.05 && nMicVolumn > 0){
            volumeLevel = 1;
        }else if(nMicVolumn > 0.25){
            volumeLevel = 10;
        }else if(nMicVolumn >= 0.05 && nMicVolumn <= 0.15){
            nMicVolumn -= 0.05;
            volumeLevel = Math.round(nMicVolumn * 50 )+1;
        }else if(nMicVolumn > 0.15 && nMicVolumn <= 0.25){
            nMicVolumn -= 0.15;
            volumeLevel = Math.round(nMicVolumn * 30 ) + 6;
        }else{
            volumeLevel = 0
        }
    }
    return volumeLevel
}

SoundMeter.prototype.checkAudioOutputVolume = async function (data) {
   console.info('soundDetection: ' + JSON.stringify(data, null, '    '))
    let This = this
    let checkAudioInputVolumeNum = 0;
    let lastCheckAudioInputVolumeNum = 0
    let lastVolumeLevel = 0
    let isLowSound = null
    let continuouslySmallSound = 0
    let level
    let levelCount = 0
    let stopSoundDetection = false

    if(This.context){
        await This.stop()
    }

    if (!This.context) {
        This.context = new AudioContext();
        This.script = This.context.createScriptProcessor(2048, 1, 1);
        This.script.onaudioprocess = This.getVolume.bind(This)
    }

    if (data.isMute) {
        This.audioStream = await navigator.mediaDevices.getUserMedia(constraints)
        // Prevent the sound detection interface from being called continuously, thereby clearing the previous audio stream
        if(This.soundDetectionStream){
            This.closeStream(This.soundDetectionStream)
        }
        This.soundDetectionStream = This.audioStream
    } else {
        This.audioStream = data.stream
    }


    if(This.showMicVolumnTimer){
        clearInterval(This.showMicVolumnTimer)
        This.showMicVolumnTimer = null
    }

    This.connectToSource(This.audioStream, function (e) {
        if (e) {
           console.warn(e.toString());
            return;
        }
        startShowMicVolumnTimer()
    })

    function soundLevelComparison() {
        let message
        level = This.getVolumeLevel(This.instant.toFixed(2))
        if(checkAudioInputVolumeNum <= 300){
            if((checkAudioInputVolumeNum - lastCheckAudioInputVolumeNum) === 1){
                if(level >= 5){
                    if( stopSoundDetection === false){
                        stopSoundDetection = true
                        console.info("stop sound Detection")
                        message = 'stop sound Detection'

                    }
                    if( isLowSound === true){
                        isLowSound = false
                        console.info("The sound is detected to have returned to normal")
                        message = "The sound is detected to have returned to normal"
                        // gsRTC.trigger("onMicStatusChange", {isSoundDetected: true})
                    }
                    data.callback({message:message,isSoundDetected: true})
                }else{
                    if((lastVolumeLevel === 0 || level === 0 )|| (lastVolumeLevel === 1 || level === 1)){
                        continuouslySmallSound++
                        if (continuouslySmallSound === 300  && checkAudioInputVolumeNum === 300) {
                            continuouslySmallSound = 0
                            lastVolumeLevel = 0
                            lastCheckAudioInputVolumeNum = 0
                            checkAudioInputVolumeNum = 0
                            isLowSound = true
                            console.info("Unable to detect the sound or the sound is too low, please check your audio device ")
                            message = "Unable to detect the sound or the sound is too low, please check your audio device "
                            data.callback({message:message, isSoundDetected: false})
                            // gsRTC.trigger("onMicStatusChange", {isSoundDetected: false})
                        }
                        if(checkAudioInputVolumeNum === 300){
                            continuouslySmallSound = 0
                            lastVolumeLevel = 0
                            lastCheckAudioInputVolumeNum = 0
                            checkAudioInputVolumeNum = 0
                        }
                    }else{
                        continuouslySmallSound = 0
                        if(checkAudioInputVolumeNum === 300){
                            continuouslySmallSound = 0
                            lastVolumeLevel = 0
                            lastCheckAudioInputVolumeNum = 0
                            checkAudioInputVolumeNum = 0
                        }
                    }
                }
                lastVolumeLevel = level
                lastCheckAudioInputVolumeNum = checkAudioInputVolumeNum
                checkAudioInputVolumeNum++
            } else{
                lastVolumeLevel = level
                lastCheckAudioInputVolumeNum = checkAudioInputVolumeNum
                checkAudioInputVolumeNum++
            }
        }
    }

    function volumeLevelCount(){
        let message
        level = This.getVolumeLevel(This.instant.toFixed(2))
        if(checkAudioInputVolumeNum <= 60){
            levelCount += level

            if(checkAudioInputVolumeNum == 60){
                if(levelCount >= 120){
                    levelCount = 0
                    checkAudioInputVolumeNum = 0
                    console.info("Detect the current sound, whether it is necessary to change the current microphone state")
                    message = "Detect the current sound, whether it is necessary to change the current microphone state"
                    // gsRTC.trigger("onMicStatusChange", {isSoundDetected: true})
                    data.callback({message:message,isSoundDetected: true})
                }else {
                    levelCount = 0
                    checkAudioInputVolumeNum = 0
                }
            }
        }
    }

    function startShowMicVolumnTimer() {
        if (data.isMute === true) {
            This.showMicVolumnTimer = setInterval(function () {
                This.currentVolumeLevel = This.getVolumeLevel(This.instant.toFixed(2))
                checkAudioInputVolumeNum++
                volumeLevelCount()
            }, 100)
        } else {
            This.showMicVolumnTimer = setInterval(function () {
                This.currentVolumeLevel = This.getVolumeLevel(This.instant.toFixed(2))
                if(stopSoundDetection === false){
                    soundLevelComparison()
                }
            }, 100)
        }
    }
}

/**************************************************以下不是关于噪音检测的主要接口***************************/

SoundMeter.prototype.closeStream = function (stream) {
    if (!stream) {
       console.info('closeStream:stream is null')
        return
    } else {
       console.info('close stream id: ' + stream.id)
    }

    try {
        stream.oninactive = null
        let tracks = stream.getTracks()
        for (let track in tracks) {
            tracks[track].onended = null
           console.info('close stream')
            tracks[track].stop()
        }
    } catch (error) {
       console.info('closeStream: Failed to close stream')
       console.info(error)
    }
    stream = null
}


SoundMeter.prototype.streamMuteSwitch = function (data) {
    let This = this
    if (data.stream != null) {
       console.info('MuteStream: stream id = ' + data.stream.id)
    } else {
       console.warn('stream is not exist!')
        return
    }

    if (data && data.stream && data.type === 'audio' && data.stream.getAudioTracks().length > 0) {
        for (let i = 0; i < data.stream.getAudioTracks().length; i++) {
            if (data.mute) {
                if (data.stream.getAudioTracks()[i].enabled === true) {
                   console.info('MuteStream exec mute audio')
                    data.stream.getAudioTracks()[i].enabled = false
                    This.isMute = true
                }
            } else {
                if (data.stream.getAudioTracks()[i].enabled === false) {
                   console.info('MuteStream exec unmute audio')
                    data.stream.getAudioTracks()[i].enabled = true
                    This.isMute = false
                }
            }
        }
    } else if ((data.type === 'video' || data.type === 'slides') && data.stream.getVideoTracks().length > 0) {
        for (let j = 0; j < data.stream.getVideoTracks().length; j++) {
            if (data.mute) {
                if (data.stream.getVideoTracks()[j].enabled === true) {
                   console.info('MuteStream exec mute video/slides')
                    data.stream.getVideoTracks()[j].enabled = false
                }
            } else {
                if (data.stream.getVideoTracks()[j].enabled === false) {
                   console.info('MuteStream exec unmute video/slides')
                    data.stream.getVideoTracks()[j].enabled = true
                }
            }
        }
    }
}

SoundMeter.prototype.getBrowserDetail = function () {
    function extractVersion (uastring, expr, pos) {
        let match = uastring.match(expr)
        return match && match.length >= pos && parseInt(match[pos], 10)
    }

    var navigator = window && window.navigator

    // Returned result object.
    var result = {}
    result.browser = null
    result.version = null
    result.UIVersion = null
    result.chromeVersion = null
    result.systemFriendlyName = null

    if(navigator.userAgent.match(/Windows/)){
        result.systemFriendlyName = 'windows'
    }else if(navigator.userAgent.match(/Mac/)){
        result.systemFriendlyName = 'mac'
    }else if(navigator.userAgent.match(/Linux/)){
        result.systemFriendlyName = 'linux'
    }

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.'
        return result
    }

    // Edge.
    if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        result.browser = 'edge'
        result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2)
        result.UIVersion = navigator.userAgent.match(/Edge\/([\d.]+)/)[1] // Edge/16.17017
    } else if (!navigator.mediaDevices && (!!window.ActiveXObject || 'ActiveXObject' in window || navigator.userAgent.match(/MSIE (\d+)/) || navigator.userAgent.match(/rv:(\d+)/))) {
        // IE
        result.browser = 'ie'
        if (navigator.userAgent.match(/MSIE (\d+)/)) {
            result.version = extractVersion(navigator.userAgent, /MSIE (\d+).(\d+)/, 1)
            result.UIVersion = navigator.userAgent.match(/MSIE ([\d.]+)/)[1] // MSIE 10.6
        } else if (navigator.userAgent.match(/rv:(\d+)/)) {
            /* For IE 11 */
            result.version = extractVersion(navigator.userAgent, /rv:(\d+).(\d+)/, 1)
            result.UIVersion = navigator.userAgent.match(/rv:([\d.]+)/)[1] // rv:11.0
        }

        // Firefox.
    } else if (navigator.mozGetUserMedia) {
        result.browser = 'firefox'
        result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1)
        result.UIVersion = navigator.userAgent.match(/Firefox\/([\d.]+)/)[1] // Firefox/56.0

        // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
        // Chrome, Chromium, Webview, Opera, Vivaldi all use the chrome shim for now
        var isOpera = !!navigator.userAgent.match(/(OPR|Opera).([\d.]+)/)
        // var isVivaldi = navigator.userAgent.match(/(Vivaldi).([\d.]+)/) ? true : false;
        if (isOpera) {
            result.browser = 'opera'
            result.version = extractVersion(navigator.userAgent, /O(PR|pera)\/(\d+)\./, 2)
            result.UIVersion = navigator.userAgent.match(/O(PR|pera)\/([\d.]+)/)[2] // OPR/48.0.2685.39
            if (navigator.userAgent.match(/Chrom(e|ium)\/([\d.]+)/)[2]) {
                result.chromeVersion = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2)
            }
        } else {
            result.browser = 'chrome'
            result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2)
            result.UIVersion = navigator.userAgent.match(/Chrom(e|ium)\/([\d.]+)/)[2] // Chrome/61.0.3163.100
        }
    } else if ((!navigator.webkitGetUserMedia && navigator.userAgent.match(/AppleWebKit\/([0-9]+)\./)) || (navigator.webkitGetUserMedia && !navigator.webkitRTCPeerConnection)) {
        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
            result.browser = 'safari'
            result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1)
            result.UIVersion = navigator.userAgent.match(/Version\/([\d.]+)/)[1] // Version/11.0.1
        } else { // unknown webkit-based browser.
            result.browser = 'Unsupported webkit-based browser ' + 'with GUM support but no WebRTC support.'
            return result
        }
        // Default fallthrough: not supported.
    } else {
        result.browser = 'Not a supported browser.'
        return result
    }

    return result
}