function openAudio(data){
    console.warn("openAudio:"+ JSON.stringify(data, null, '    ') )
    if(!data || !data.callback){
        console.warn("openAudio: invalid parameters")
    }
    data.constraints ={
        audio: {deviceId: data && data.deviceId} || false
    }
    window.record.openAudio(data)
}

function switchLocalAudioDeviced(data){
    console.warn("switchAudio:"+ JSON.stringify(data, null, '    ') )
    if(!data || !data.callback){
        console.warn("switchAudio: invalid parameters")
    }
    data.constraints ={
        audio: {deviceId: data && data.deviceId} || true
    }
    delete data.deviceId
    window.record.switchLocalAudioDevice(data)
}

function stopAudio(data){
    console.warn("stopAudio:"+ JSON.stringify(data, null, '    ') )
    if(!data || !data.callback){
        console.warn("stopAudio: invalid parameters")
    }
    window.record.stopAudio(data)
}

function openVideo(data){
    console.warn("openVideo:"+ JSON.stringify(data, null, '    ') )
    if(!data || !data.callback){
        console.warn("openVideo: invalid parameters")
    }

    if(window.record.currentRecoderType === 'areaVideo'){
        data.constraints = {
            audio:  false,
            video: {
                width: 1920,   // 必须
                height: 1080,  // 必须
                frameRate: 15,  // 可缺省，默认15fps
                deviceId: data && data.deviceId ? data.deviceId : ''
            }
        }
    }else {
        data.constraints = {
            audio:  false,
            video: {
                width: 1080,   // 必须
                height: 720,  // 必须
                frameRate: 15,  // 可缺省，默认15fps
                deviceId: data && data.deviceId ? data.deviceId : ''
            }
        }
    }
    window.record.openVideo(data)
}


function switchLocalVideoDeviced(data){
    console.warn("switchVideo:"+ JSON.stringify(data, null, '    ') )
    if(!data  || !data.deviceId || !data.callback){
        console.warn("switchVideo: invalid parameters")
    }

    if(window.record.currentRecoderType === 'areaVideo'){
        data.constraints = {
            audio:  false,
            video: {
                width: 1920,   // 必须
                height: 1080,  // 必须
                frameRate: 15,  // 可缺省，默认15fps
                deviceId: data && data.deviceId ? data.deviceId : ''
            }
        }
    }else {
        data.constraints = {
            audio:  false,
            video: {
                width: 1080,   // 必须
                height: 720,  // 必须
                frameRate: 15,  // 可缺省，默认15fps
                deviceId: data && data.deviceId ? data.deviceId : ''
            }
        }
    }
    window.record.switchLocalVideoDevice(data)
}

function stopVideo(data) {
    console.warn("stopVideo:"+ JSON.stringify(data, null, '    ') )
    if(!data || !data.callback){
        console.warn("openAreaVideo: invalid parameters")
    }
    window.record.stopVideo(data)
}

function openShare(data){
    console.warn("openAreaVideo:"+ JSON.stringify(data, null, '    ') )
    if(!data){
        console.warn("openAreaVideo: invalid parameters")
    }
    if(window.record.currentRecoderType === 'areaVideo'){
        data.constraints = {
            audio: false ,
            // video: {mediaSource: 'screen'}
            video: {
                width: 1920,   // 必须
                height: 1080,  // 必须
                frameRate: 15,  // 可缺省，默认15fps
            }
        }
    }else{
        data.constraints = {
            audio: false ,
            video: {
                width: 1920,   // 必须
                height: 1080,  // 必须
                frameRate: 15,  // 可缺省，默认15fps
            }
        }
    }

    window.record.openShare(data)
}

function stopShare(data){
    console.warn("stopShare:"+ JSON.stringify(data, null, '    ') )
    if(!data || !data.callback){
        console.warn("stopVideo: invalid parameters")
    }
    window.record.stopShare(data)
}

















