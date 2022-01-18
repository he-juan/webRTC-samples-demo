

Record.prototype.getMedia = async function (data, constraints) {
    console.warn(' getMedia ')
    function onGetStreamSuccess (stream) {
        console.info('get stream success constraints: ' + JSON.stringify(constraints, null, '  '))
        data.callback({stream: stream ||data.stream})
    }

    function onGetStreamFailed (error) {
        data.error = error
        console.warn('get stream failed: ' + JSON.stringify(constraints, null, '  '))
        console.warn('onGetStreamFailed error message: ' + error.message)
        console.warn('error name: ' + error.name)
        console.warn('error constraint: ' + error.constraints)
        if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            // constraints can not be satisfied by avb.device
            console.info('constraints can not be satisfied by avb.device')
            data.callback({ error: error, constraints: constraints})
        } else {
            if (error.name === 'NotFoundError' || error.name === 'DeviceNotFoundError') {
                // require track is missing
                console.info('require track is missing')
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                // webcam or mic are already in use
                console.info('webcam or mic are already in use')
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.name === 'PermissionDismissedError') {
                // permission denied in browser
                console.info('permission denied in browser')
            } else if (error.name === 'TypeError') {
                // empty constraints object
                console.info('empty constraints object')
            } else {
                // other errors
                console.info('other errors ' + error.name)
            }
            data.callback({ error: error })
        }
    }

    if (data.streamType === 'audio' ) {
        navigator.mediaDevices.getUserMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
    } else if(data.streamType === 'video'){
        if (!data.isFirefox && data.stream && data.stream.getVideoTracks().length && data.stream.active) {
            let videoTrack
            let constraintsOfApply = {
                width:{exact: constraints.video.width.exact},
                height:{exact: constraints.video.height.exact},
            }
            videoTrack = data.stream.getVideoTracks()[0]
            if (videoTrack && videoTrack.applyConstraints) {
                console.info('applyConstraints constraints: ' + JSON.stringify(constraintsOfApply, null, '    '))
                videoTrack.applyConstraints(constraintsOfApply).then(function(){
                    console.info('video applyConstraints success!')
                    data.callback({ stream: data.stream})
                }).catch(onGetStreamFailed)
            }
        }else{
            navigator.mediaDevices.getUserMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
        }
    } else if (data.streamType === 'screenShare') {
        if(window.ipcRenderer){
            console.info('ipcRenderer getUserMedia for screen')
            navigator.mediaDevices.getUserMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
        }else {
            if (navigator.getDisplayMedia) {
                // for Edge old version
                navigator.getDisplayMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
            } else if (navigator.mediaDevices.getDisplayMedia) {
                // for all supported getDisplayMedia browser versions
                navigator.mediaDevices.getDisplayMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
            } else if (navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
            } else {
                console.info('getDisplayMedia is not supported by current browser')
            }
        }
    }
}



Record.prototype.setStream = function (stream, type, isLocal, msid) {
    let This = this
    if (!type) {
        console.warn('setStream: Invalid parameter!')
        return
    }

    let streamId = stream ? stream.id : null
    console.info('set ' + type + ' stream id: ' + streamId)
    if(isLocal){
        if(This.localStreams[type]){
            This.closeStream(This.localStreams[type])  // clear before first
        }
        This.localStreams[type] = stream
    }else {
        if(type === 'audio' || type === 'main' || type === 'slides'){
            // This.remoteStreams[type] = stream
        } else {
            if(!stream){
                // delete This.remoteStreams.mainVideos[type]
            } else {
                // This.remoteStreams.mainVideos[type] = stream
            }
        }
    }
}



Record.prototype.getStream = function(type,isLocal){
    if (!type) {
        console.warn('getStream: Invalid parameter!')
        return
    }

    let stream
    if(isLocal){
        stream = this.localStreams[type]
    }else {
        if(type === 'audio' || type === 'main' || type === 'slides'){
            // stream = this.remoteStreams[type]
        }else {
            // stream = this.remoteStreams.mainVideos[type]
        }
    }

    if (stream) {
        console.info('get ' + type + ' stream id :' + stream.id)
    } else {
        console.warn(type + ' stream does not exist')
    }
    return stream
}



Record.prototype.getGumErrorCode = function (streamType, errorName){
    let This = this
    let errorCode
    if(streamType === 'audio'){
        if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
            //required track is missing
            errorCode = Record.prototype.CODE_TYPE.MIC_NOT_FOUND
        } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
            //webcam or mic are already in use
            errorCode = Record.prototype.CODE_TYPE.MIC_NOT_READABLE
        } else if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError" || (errorName && errorName.indexOf("denied") !== -1)) {
            //permission denied in browser
            errorCode = Record.prototype.CODE_TYPE.MIC_REQUEST_REFUSE;
        } else if (errorName === "TypeError") {
            //empty constraints object
            errorCode = Record.prototype.CODE_TYPE.MIC_TYPE_ERROR;
        } else {
            //other errors
            errorCode = Record.prototype.CODE_TYPE.MIC_REQUEST_FAIL
        }
    }else if(streamType === 'video'){
        if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError" || errorName === "InternalError") {
            //constraints can not be satisfied by avb. devices
            errorCode = Record.prototype.CODE_TYPE.VIDEO_REQUEST_OVER_CONSTRAINTS
        }else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
            //required track is missing
            errorCode = Record.prototype.CODE_TYPE.VIDEO_NOT_FOUND
        } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
            //webcam or mic are already in use
            errorCode = Record.prototype.CODE_TYPE.VIDEO_NOT_READABLE
        } else if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError" || (errorName && errorName.indexOf("denied") !== -1)) {
            //permission denied in browser
            errorCode = Record.prototype.CODE_TYPE.VIDEO_REQUEST_REFUSE;
        } else if (errorName === "TypeError") {
            //empty constraints object
            errorCode = Record.prototype.CODE_TYPE.VIDEO_TYPE_ERROR
        } else {
            //other errors
            errorCode = Record.prototype.CODE_TYPE.VIDEO_REQUEST_FAIL
        }
    } else if(streamType === 'slides'){
        if(errorName === 'NotReadableError'){
            errorCode = Record.prototype.CODE_TYPE.SCREEN_NOT_READABLE
        }else if(errorName === 'NotAllowedError'){
            errorCode = Record.prototype.CODE_TYPE.SCREEN_REQUEST_REFUSE
        }else if(errorName === 'OverconstrainedError'){
            errorCode = Record.prototype.CODE_TYPE.SCREEN_REQUEST_OVER_CONSTRAINTS
        }else if(errorName === 'NotFoundError'){
            // There is no screen video source available for capture
            errorCode = Record.prototype.CODE_TYPE.SCREEN_NOT_FOUND
        }else if(errorName === 'InvalidStateError'){
            // The document in the context is not fully activated
            errorCode = Record.prototype.CODE_TYPE.SCREEN_INVALID_STATE
        }else if(errorName === 'AbortError'){
            // Mismatched errors or malfunctions.
            errorCode = Record.prototype.CODE_TYPE.SCREEN_ABORT_ERROR
        }else if(errorName === 'TypeError'){
            // Unsupported constraints
            errorCode = Record.prototype.CODE_TYPE.SCREEN_TYPE_ERROR
        }else {
            //other errors
            errorCode = Record.prototype.CODE_TYPE.FAILED_TO_SCREEN_SHARE
        }
    }

    console.info("gum error " + errorName + ", code " + errorCode)
    return errorCode
}


Record.prototype.getStreamFromDevice = function (data){
    let This = this
    if(!data ){
        console.error('getStreamFromDevice: invalid parameters')
        return
    }else{
        console.warn("getStreamFromDevice constraints:",data)
    }

    let constraints = {}
    switch (data.streamType){
        case 'audio':
            constraints = {
                audio: data.constraints.audio.deviceId ? { deviceId: { exact: data.constraints.audio.deviceId }}: true,
                video: false
            }

            break
        case 'video':
            constraints = {
                // data.constraints.audio ? (data.constraints.audio.deviceId ? {deviceId: { exact: data.constraints.audio.deviceId }} : data.constraints.audio) :data.constraints.audio,
                audio: false,
                video: {
                    width: { exact: data.constraints.video.width ? data.constraints.video.width : 640 },
                    height: { exact: data.constraints.video.height ? data.constraints.video.height : 360 },
                    deviceId: data.constraints.video.deviceId ? { exact: data.constraints.video.deviceId } : ''
                }
            }
            if(Record.prototype.getBrowserDetail().browser !== 'firefox'){
                constraints.video.frameRate = { exact: (data.constraints.video.frameRate ? data.constraints.video.frameRate : 15) }
            }
            break
        case 'screenShare':
            if(window.ipcRenderer){
                console.info('desktop share')
                constraints = {
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: data.constraints.video.mandatory.chromeMediaSource || 'desktop',
                            chromeMediaSourceId: data.constraints.video.mandatory.chromeMediaSourceId,
                            maxWidth: data.constraints.video.mandatory.maxWidth || 1920,
                            maxHeight: data.constraints.video.mandatory.maxHeight || 1080,
                            minWidth: data.constraints.video.mandatory.minWidth || 1280,
                            minHeight: data.constraints.video.mandatory.minHeight || 720,
                            maxFrameRate: data.constraints.video.mandatory.maxFrameRate || 5,
                        }
                    }
                }
                if(data.constraints.video.mandatory.chromeMediaSource){
                    constraints.video.mandatory.chromeMediaSource = data.constraints.video.mandatory.chromeMediaSource
                }
            }else {
                constraints = {
                    // audio: Record.prototype.isSystemAudioShareSupport(),
                    // video: data.constraints.video.mediaSource,
                    video: {
                        width: { max: data.constraints.video.width ? data.constraints.video.width : 1920 },
                        height: { max: data.constraints.video.height ? data.constraints.video.height : 1080 },
                        frameRate: { max: data.constraints.video.frameRate ? data.constraints.video.frameRate : 15 }
                    }
                }
            }
            break
        default:
            console.warn('Unknown type: ' + data.streamType)
            break
    }

    let parameters = {
        streamType: data.streamType,
        stream: data.stream,
        // isFirefox: GsRTC.prototype.getBrowserDetail().browser === 'firefox',
        callback: data.callback
    }
    record.getMedia(parameters, constraints)
}


Record.prototype.streamMuteSwitch = function (data) {
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

   data && data.callback({stream: data.stream})
}

Record.prototype.setConstraintsOfGetStream = function(data,constraints) {
    console.info("set Constraints of Get Stream")
    let This = this
    let setConstraints = {}
    switch (data.streamType) {
        case 'audio':
            setConstraints = data.constraints
            break
        case 'video':
            if (!data.action) {
                console.info('get stream constraints: ' + JSON.stringify(constraints, null, '   '))
                setConstraints = {
                    audio: data.constraints.audio ? (data.constraints.audio.deviceId ? {deviceId: { exact: data.constraints.audio.deviceId }} : data.constraints.audio) :data.constraints.audio,
                    video: {
                        width: {ideal: constraints.video.width.exact},
                        height: {ideal: constraints.video.height.exact},
                        // frameRate: {exact: constraints.video.frameRate && constraints.video.frameRate.exact || ' '},
                        // deviceId: {exact: constraints.video.deviceId && constraints.video.deviceId.exact || ' '}
                    },
                }
            } else if (data.action === 'adjustResolution') {
                console.info('adjustResolution get stream constraints: ' + JSON.stringify(constraints, null, '   '))
                setConstraints = {
                    video: {
                        width: {exact: constraints.video.width.exact},
                        height: {exact: constraints.video.height.exact},
                        frameRate: {exact: constraints.video.frameRate && constraints.video.frameRate.exact || ' '},
                        deviceId: {exact: constraints.video.deviceId.exact}
                    }
                }
                if (Number(constraints.video.width.exact) === 640 && Number(constraints.video.height.exact) === 360) {
                    delete setConstraints.video.height.exact
                    setConstraints.video.height.ideal = constraints.video.height.exact
                }
            } else if (data.action === 'switchLocalVideoDevice') {
                console.info('switch Local video Device get stream constraints: ' + JSON.stringify(constraints, null, '   '))
                if (Number(constraints.video.width.exact) === 1920) {
                    constraints.video.width.exact = 1280
                    constraints.video.height.exact = 720
                } else if (Number(constraints.video.width.exact) === 1280) {
                    constraints.video.width.exact = 640
                    constraints.video.height.exact = 360
                } else if (Number(constraints.video.width.exact) === 640) {
                    constraints.video.width.ideal = constraints.video.width.exact
                    constraints.video.height.ideal = constraints.video.height.exact
                    delete constraints.video.width.exact
                    delete constraints.video.height.exact
                } else {
                    console.warn(" The constraints parameter is not satisfied ")
                    data.callback({error: data.error})
                }
                setConstraints = constraints
            }
            if (This.getBrowserDetail().browser === 'firefox') {
                delete setConstraints.video.frameRate
            }
            break
        case 'screenShare':
            constraints = This.getScreenShareConstraints(data)
            break
        default:
            console.warn('unknown type ' + data.streamType)
            break
    }
    return setConstraints
}


Record.prototype.closeStream = function (stream) {
    let This = this
    if (!stream) {
        console.info('closeStream:stream is null')
        return
    } else {
        console.info('close stream id: ' + stream.id)
    }

    try {
        Object.keys(This.localStreams).forEach(function (key) {
            let getStream = localStreams[key]
            if(getStream){
                if (stream.id === getStream.id) {
                    This.localStreams[key] = null
                }
            }
        })
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



/***
 * get file url
 * @param file
 * @returns {*}
 */
Record.prototype.getObjectURL = function(file) {
    let url = null;
    if (window.createObjectURL !== undefined) { // basic
        url = window.createObjectURL(file);
    } else if (window.URL !== undefined) { // mozilla(firefox)
        url = window.URL.createObjectURL(file);
    } else if (window.webkitURL !== undefined) { // webkit or chrome
        url = window.webkitURL.createObjectURL(file);
    }
    return url;
}