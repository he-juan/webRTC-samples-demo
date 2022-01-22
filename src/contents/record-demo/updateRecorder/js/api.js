


Record.prototype.openAudio = function(data){
    let This = this
    console.info("share audio: " + JSON.stringify(data, null, '    '))
    if (!data || !data.type) {
        console.warn('share audio: invalid parameters! ')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }

    let type = 'audio'

    let stream = This.getStream(type, true)
    if(stream){
        This.closeStream(stream)
    }
    let audioRefreshResult = function (event){
        console.info('audio refresh result: ' + JSON.stringify(event, null, '    '))
        if(event.codeType === 999){
            console.info('shareAudio result success')

        }else {
            console.warn('shareAudio result failed')
        }
        data.callback && data.callback({ codeType: event.codeType , stream: event.stream})
    }

    let getMediaCallBack = async function (args) {
        if (args.stream) {
            console.info('get stream: ' + args.stream ? args.stream.id : null)
            // This.processAddStream(stream, session.pc, type)
            This.setStream(args.stream, type, true)
            audioRefreshResult({codeType: This.CODE_TYPE.ACTION_SUCCESS, stream: args.stream})
        } else if (args.error) {
            console.warn('Get audio stream failed: ' + args.error)
            audioRefreshResult({codeType: This.prototype.getGumErrorCode('audio', args.error.name)})
        }
    }

    if (stream) {
        console.warn("暂时不会出现")
        // This.streamMuteSwitch({stream: stream, type: type, mute: false})
        // audioRefreshResult({codeType: This.CODE_TYPE.ACTION_SUCCESS})
    } else {
        console.info('getting new stream')
        This.getStreamFromDevice({ streamType: 'audio', constraints: data.constraints, callback: getMediaCallBack })
    }
}


Record.prototype.switchLocalAudioDevice = function (data) {
    console.info('switch audio device: ' + JSON.stringify(data, null, '    '))
    let This = this
    if(!data || !data.constraints || !data.constraints.audio || !data.constraints.audio.deviceId){
        console.warn('deviceId mandatory')
        This.trigger('onError', {codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }

    let type = 'audio'

    let switchAudioSourceResult = function (event){
        console.info('switch audio result ' + JSON.stringify(event, null, '    '))
        if(event.codeType === 999){
            console.info('switch audio result success')
        }else {
            console.warn('switch audio result failed')
        }
        data.callback && data.callback({ codeType: event.codeType,  stream: event.stream})
    }
    // For firefox, delete the previous stream first, and then get stream again according to the device
    // bug error: Concurrent mic process limit
    let preStream = This.getStream(type, true)
    if(preStream){
        This.closeStream(preStream)
    }

    function getMediaCallBack(event) {
        if (event.stream) {
            let stream = event.stream
            if(This.isMute){
                This.streamMuteSwitch({stream: stream, type: 'audio', mute: true})
            }
            This.setStream(stream, type, true)
            switchAudioSourceResult({codeType: This.CODE_TYPE.ACTION_SUCCESS, stream: stream })
        } else {
            console.info('switch Local audio Device get stream failed', event.error)
            switchAudioSourceResult({codeType: 201})
        }
    }
    let parameters = { streamType: 'audio', constraints: data.constraints, callback: getMediaCallBack }
    This.getStreamFromDevice(parameters )
}


Record.prototype.stopAudio = function (data) {
    let This = this
    console.info("stopShareAudio: " + JSON.stringify(data, null, '    '))
    if (!data ) {
        console.warn('stopShareAudio: invalid parameters! ')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }

    let stopShareAudioCallBack = function(event){
        console.info('stop share audio data: ' + JSON.stringify(event, null, '    '))
        if(event.codeType === 999){
            This.localStreams.audio = null
            console.info('stop share audio success')
        }else {
            console.warn('stop share audio failed')
        }
        data.callback && data.callback({ codeType: event.codeType })
    }

    let stream = This.getStream('audio', true)
    if (stream) {
        This.closeStream(stream)
        // This.streamMuteSwitch({stream: stream, type: 'audio', mute: true})
        stopShareAudioCallBack({codeType: This.CODE_TYPE.ACTION_SUCCESS})
    } else {
        console.warn('audio stream is null')
        stopShareAudioCallBack({codeType: This.CODE_TYPE.FAILED_TO_MUTE_MIC})
    }
}



Record.prototype.openVideo = function (data) {
    let This = this
    console.info('open local video camera: ' + JSON.stringify(data, null, '    '))
    if (!data ||!data.callback) {
        console.warn('shareVideo: invalid parameters')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }

    let type = 'main'
    let getStreamCount = 0
    let videoStream

    function videoOnResult(event){
        console.info('video on result, isLocalVideoOn' /*+ session.isLocalVideoOn*/)
        if(event.codeType === 999 /*&& session.isLocalVideoOn || (session.isGDS && session.isGDSVideoReqSucceeded)*/){
            console.info('video on success')
            This.videoUpResolution = data.constraints.video
        }else {
            event.codeType = /*session.errorCode ||*/ This.CODE_TYPE.FAILED_TO_VIDEO_ON
            console.warn('video on failed, code ' + event.codeType)
            let stream = This.getStream(type, true)
            This.closeStream(stream)
        }
        data && data.callback({ codeType: event.codeType, stream: videoStream, type:type})

    }

    function getMediaCallBack(event) {
        if (event.stream) {
            console.info('get stream success ' + event.stream.id)
            videoStream = event.stream
            let video = document.createElement('video')
            video.srcObject = videoStream
            video.onloadedmetadata = async function(){
                console.info("video: "+ video.videoWidth + " * " + video.videoHeight)
                let constraints ={
                    video:{
                        width:video.videoWidth,
                        height:video.videoHeight
                    }
                }
                let previousStream = This.getStream(type, true)
                if (previousStream) {
                    console.info('clear previous stream')
                    This.closeStream(previousStream)
                }
                This.setVideoUpResolution(constraints)

                This.setStream(videoStream, type, true)
                This.action = 'shareVideo'
                videoOnResult({codeType: 999, stream: videoStream})
            }
        } else {
            console.info('get stream failed')
            parameters.error = event.error
            parameters.isFirefox = Record.prototype.getBrowserDetail().browser === 'firefox'
            getStreamCount++
            if(event.constraints && (event.error.name === 'OverconstrainedError' || event.error.name === 'ConstraintNotSatisfiedError' ) && getStreamCount < 5){
                let constraints
                if(getStreamCount < 2){
                    constraints = This.setConstraintsOfGetStream(parameters, event.constraints)
                }else{
                    data.action = 'switchLocalVideoDevice'
                    constraints = This.setConstraintsOfGetStream(parameters, event.constraints)
                }
                This.getMedia(parameters, constraints)
            }else{
                data.callback && data.callback({
                    codeType: Record.prototype.getGumErrorCode('video', event.error.name)
                })
            }
        }
    }

    let parameters = {
        streamType: 'video',
        constraints: data.constraints,
        callback: getMediaCallBack
    }

    This.getStreamFromDevice(parameters)
}


Record.prototype.switchLocalVideoDevice = function (data){
    console.info('switch Local video Device: ' + JSON.stringify(data, null, '   '))
    let This = this
    if(!data || !data.constraints || !data.constraints.video || !data.constraints.video.deviceId){
        console.warn('switchLocalVideoDevice: invalid parameters')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }
    let getStreamCount = 0

    let switchVideoCallback = function(evt){
        console.info('switch video callback data: ' + JSON.stringify(evt, null, '    '))
        if(evt.codeType === 999){
            console.info('video switch success')
            This.setVideoUpResolution(evt.constraints)
            This.videoUpResolution = data.constraints.video
        }else {
            console.info('video switch failed')
        }
        data.callback && data.callback({ codeType: evt.codeType, stream: evt.stream})
    }

    let getMediaCallBack = async function (event) {
        if (event.stream) {
            console.info('get stream success')
            let type = 'main'
            let preVideoStream = This.getStream(type, true)
            if(preVideoStream){
                console.info('clear before video stream: ' + preVideoStream.id)
                This.closeStream(preVideoStream)
            }

            let stream = event.stream
            This.setStream(stream, type, true)
            switchVideoCallback({codeType: This.CODE_TYPE.ACTION_SUCCESS, constraints: event.constraints, stream: stream})
        } else {
            console.info('switch Local video Device get stream failed')
            parameters.error = event.error
            let versionInfo = This.getBrowserDetail()
            parameters.isFirefox = versionInfo.browser === 'firefox'
            parameters.action = 'switchLocalVideoDevice'
            getStreamCount++
            if(event.constraints && (event.error.name === 'OverconstrainedError' || event.error.name === 'ConstraintNotSatisfiedError' || (event.error.name === 'Error' && versionInfo.browser === 'safari' && versionInfo.UIVersion == '12.1.2')) && getStreamCount < 2){
                let constraints = This.setConstraintsOfGetStream(parameters, event.constraints)
                This.getMedia(parameters, constraints)
            }else{
                switchVideoCallback({codeType: 201})
            }
        }
    }

    let  parameters = {
        streamType: 'video',
        constraints: data.constraints,
        callback: getMediaCallBack
    }
    This.getStreamFromDevice(parameters)
}


Record.prototype.stopVideo = function (data) {
    let This = this
    console.info('stop share Local video: ' + JSON.stringify(data, null, '    '))
    if(!data ){
        console.info('invalid parameters!')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }


    let stopVideoCallback = function(event){
        console.info('video off result data: ' + JSON.stringify(event, null, '    '))
        if(event.codeType === 999){
            This.localStreams.main = null
            console.info('video off success')
        }else {
            console.warn('video off failed, code ' + event.codeType)

        }

        data.callback && data.callback({ codeType: event.codeType })
    }

    let type = 'main'
    This.action = 'stopVideo'

    let stream = This.getStream(type, true)
    if (stream) {
        This.closeStream(stream)
        This.setStream(null, type, true)
        stopVideoCallback({codeType: 999})
    } else {
        console.warn('stopShareVideo: video stream is null ')
    }
}



Record.prototype.openShare = function (data) {
    let This = this
    console.info('share screen')
    if(!data || !data.constraints || !data.constraints.video){
        console.info('invalid parameters to screen share: ' + JSON.stringify(data, null, '    '))
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }

    let type = 'slides'
    function getMediaCallBack(event) {
        if (event.stream) {
            console.info('get stream success, ' + event.stream.id)
            let stream = event.stream
            let mixStream
            if (This.getBrowserDetail().browser === 'firefox') {
                let tracks = stream.getVideoTracks();
                tracks[0].onended = function () {
                    stopCategory({type: 'slides'})
                }
            }else {
                stream.oninactive = function () {
                    console.warn('user clicks the bottom share bar to stop sharing')
                    stopCategory({type: 'slides'})
                }
            }

            let localAudioStream = This.getStream('audio', true)
            if (localAudioStream && stream.getAudioTracks().length > 0) {
                mixStream = This.mixingStream(stream, localAudioStream)
                // session.processAddStream(mixStream, pc, 'audio')
            }
            This.setStream(stream, type, true)
            // session.processAddStream(stream, pc, type)

            console.info('share screen success')
            data.callback && data.callback({ codeType: This.CODE_TYPE.ACTION_SUCCESS , stream: stream , type: type})
            // session.setEncodingParameters('main')
        } else {
            console.warn('Get present stream failed: ' + event.error)
            // session.actionCallback = null
            let codeType = Record.prototype.getGumErrorCode('slides', event.error.name)
            data.callback && data.callback({ codeType: codeType })
        }
    }

    if(data.stream){
        getMediaCallBack({stream: data.stream})
    }else{
        This.getStreamFromDevice({ streamType: 'screenShare', constraints: data.constraints, callback: getMediaCallBack })
    }
}



Record.prototype.stopShare = function (data) {
    let This = this
    console.info('stop share screen')
    if(!data ){
        console.info('invalid parameters to stop screen share')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }


    let stopScreenCallback = function(event){
        console.info('stop present callback data: ' + JSON.stringify(event, null, '    '))
        if( This.mixStreamContext){
            This.mixStreamContext.close()
            This.mixStreamContext = null
            // let audioStream = This.getStream('audio', true)
            // // session.processAddStream(audioStream, pc, 'audio')
        }
        if(event.codeType === 999){
            console.info('stop present success')
            This.localStreams.slides = null
            // session.setEncodingParameters('main')
        }else {
            console.warn('stop present failed')
        }
        data.callback && data.callback({ codeType: event.codeType })
    }

    let type = 'slides'
    let stream = This.getStream(type, true)
    if (stream) {
        console.info('clear previous stream')
        // session.processRemoveStream(stream, pc, type)
        This.closeStream(stream)
        This.setStream(null, type, true)
        stopScreenCallback({codeType: This.CODE_TYPE.ACTION_SUCCESS})
    }else {
        console.warn('stop share screen: no present stream')
        stopScreenCallback({codeType: This.CODE_TYPE.FAILED_TO_STOP_SCREEN_SHARE})
    }
}


/***************************************视频录制***************************************************/

Record.prototype.videoRecord = function(data){
    console.info('recording video camera: ' + JSON.stringify(data, null, '    '))
    let This = this
    let options
    if (!data && !data.stream) {
        console.warn('shareVideo: invalid parameters')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }

    if(This.currentRecoderType === 'audio'){
        options = {
            mimeType: 'audio/webm',
            audioBitsPerSecond : 128000,  // 音频码率
            videoBitsPerSecond : 500000,  // 视频码率
            ignoreMutedMedia: true
        };
    }else{
        options = {
            mimeType: 'video/webm',
            audioBitsPerSecond : 128000,  // 音频码率
            videoBitsPerSecond : 500000,  // 视频码率
            ignoreMutedMedia: true
        };
    }


    // MediaRecorder.isTypeSupported 判断是否支持设置的视频格式
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported!`)
        return
    }

    function recordingCallback(event){
        if(event.codeType === 999){
            console.info('recording video success')
        }else {
            console.warn('recording video filed ' + event.codeType)
        }
        data.callback && data.callback({ codeType: event.codeType, stream: This.videoMediaRecorder})
    }

    try{
        This.videoMediaRecorder = new MediaRecorder(data.stream, options)
        This.videoMediaRecorder.recordedBlobs = []
    }catch(e){
        console.warn('Unable to create MediaRecorder with options Object: ', e);
    }

    This.videoMediaRecorder.start(10); // collect 10ms of data
    console.warn('MediaRecorder started', This.videoMediaRecorder);
    This.videoMediaRecorder.ondataavailable = handleDataAvailable;
    if(This.videoMediaRecorder){
        recordingCallback({codeType: 999, stream: This.videoMediaRecorder})
    }else{
        recordingCallback({codeType: 201, stream: This.videoMediaRecorder})
    }

    function handleDataAvailable(event){
        if (event.data && event.data.size > 0) {
            This.videoMediaRecorder.recordedBlobs.push(event.data);
        }
    }

    This.videoMediaRecorder.onstop = function(){
        if(This.videoMediaRecorder.state === 'inactive'){
            console.warn("********* stop success***********")
            // data.callback && data.callback({ codeType: 999, stream: This.videoMediaRecorder})
        }
    }

    This.videoMediaRecorder.onpause = function(){
        if(This.videoMediaRecorder.state === 'paused'){
            console.warn("********* pause success***********")
        }
    }

    This.videoMediaRecorder.onresume = function(){
        if(This.videoMediaRecorder.state  === 'recording'){
            console.warn("********* resume success ***********")
        }
    }

}

Record.prototype.stopVideoRecord = function(data){
    console.log('Recorder stopped: ', data);
    let This = this
    This.videoMediaRecorder.stop()
    This.videoMediaRecorder.onstop = function(){
        /**录制返回播放**/
        // let blob = new Blob(This.mediaRecorder.recordedBlobs, {'type': 'video/webm'});
        // let url = window.URL.createObjectURL(blob);
        // if (data.type === 'video' || data.type === 'shareScreen') {
        //     recordVideo.srcObject = null;
        // }
        // recordVideo.src = url;
        console.warn("********************")

    }

    This.videoMediaRecorder.addEventListener('dataavailable', function(event) {
        if (event.data && event.data.size > 0) {
            This.videoMediaRecorder.recordedBlobs.push(event.data);
        }
    })

    if(This.videoMediaRecorder.state === 'inactive'){
        console.warn("********* stop success***********")
        data.callback && data.callback({ codeType: 999, stream: This.videoMediaRecorder})
    }
}

Record.prototype.videoDownload = function(data){
    let This = this
    let type
    if(window.record.currentRecoderType === 'audio'){
        type = {type: 'audio/webm'}
    }else{
        type = {type: 'video/webm'}
    }
    var blob = new Blob(This.videoMediaRecorder.recordedBlobs, type);
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.target = "_blank";
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);

    data.callback && data.callback({ codeType: 999, file: a})
}


/***********************************************音频录制****************************************************/

Record.prototype.audioRecord = function(data){
    console.info('recording audio MIC: ' + JSON.stringify(data, null, '    '))
    let This = this
    if (!data && !data.stream) {
        console.warn('shareAudio: invalid parameters')
        data && data.callback && data.callback({codeType: This.CODE_TYPE.PARAMETER_ERROR})
        return
    }
    let options = {
        mimeType: 'audio/webm;codecs=opus;',
        audioBitsPerSecond : 128000,  // 音频码率
        videoBitsPerSecond : 500000,  // 视频码率
        ignoreMutedMedia: true
    };

    // MediaRecorder.isTypeSupported 判断是否支持设置的视频格式
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported!`)
        return
    }

    function recordingCallback(event){
        if(event.codeType === 999){
            console.info('recording video success')
        }else {
            console.warn('recording video filed ' + event.codeType)
        }
        data.callback && data.callback({ codeType: event.codeType, stream: This.audioMediaRecorder})
    }

    try{
        This.audioMediaRecorder = new MediaRecorder(data.stream, options)
        This.audioMediaRecorder.recordedBlobs = []
    }catch(e){
        console.log('Unable to create MediaRecorder with options Object: ', e);
    }

    This.audioMediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', This.audioMediaRecorder);
    This.audioMediaRecorder.ondataavailable = handleDataAvailable;
    if(This.audioMediaRecorder){
        recordingCallback({codeType: 999, stream: This.audioMediaRecorder})
    }else{
        recordingCallback({codeType: 201, stream: This.audioMediaRecorder})
    }

    function handleDataAvailable(event){
        if (event.data && event.data.size > 0) {
            This.audioMediaRecorder.recordedBlobs.push(event.data);
        }
    }

}


Record.prototype.stopAudioRecord = function(data){
    console.log('Recorder stopped: ', data);
    let This = this
    This.audioMediaRecorder.onstop = function(){
        /**录制返回播放**/
        // let blob = new Blob(This.mediaRecorder.recordedBlobs, {'type': 'video/webm'});
        // let url = window.URL.createObjectURL(blob);
        // if (data.type === 'video' || data.type === 'shareScreen') {
        //     recordVideo.srcObject = null;
        // }
        // recordVideo.src = url;
        console.warn("********************")
    }

    This.audioMediaRecorder.addEventListener('dataavailable', function(event) {
        if (event.data && event.data.size > 0) {
            This.audioMediaRecorder.recordedBlobs.push(event.data);
        }
    })

    data.callback && data.callback({ codeType: 999, Blobs: This.audioMediaRecorder.recordedBlobs,})
}


Record.prototype.audioDownload = function(data){
    let This = this
    var blob = new Blob(This.videoMediaRecorder.recordedBlobs, {type: 'audio/ogg'});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.target = "_blank";
    a.style.display = 'none';
    a.href = url;
    a.download = 'audio.ogg';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);

    data.callback && data.callback({ codeType: 999, file: a})
}