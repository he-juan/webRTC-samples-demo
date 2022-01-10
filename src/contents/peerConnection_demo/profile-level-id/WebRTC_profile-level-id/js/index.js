'use strict';

let getMediaButton = document.querySelector('button#getMedia');
let connectButton = document.querySelector('button#connect');
let hangupButton = document.querySelector('button#hangup');

getMediaButton.onclick = getMedia;
connectButton.onclick = createPeerConnection;
hangupButton.onclick = hangup;

let bitrateDiv = document.querySelector('div#bitrate');
let peerDiv = document.querySelector('div#peer');
let senderStatsDiv = document.querySelector('div#senderStats');
let receiverStatsDiv = document.querySelector('div#receiverStats');

let localVideo = document.querySelector('div#localVideo video');
let remoteVideo = document.querySelector('div#remoteVideo video');
let localVideoStatsDiv = document.querySelector('div#localVideo div');
let remoteVideoStatsDiv = document.querySelector('div#remoteVideo div');

let localPeerConnection;
let remotePeerConnection;
let localStream;
let bytesPrev;
let timestampPrev;
// getMedia();

/**
 * 是否修改sdp带宽值
 */
function bitrateChoose() {
    let bitrateSet = document.getElementById('bitrateSet')
    let bitrateList = document.getElementById('bitrateEnabled').options
    if(bitrateList && bitrateList.length > 0){
        let select= bitrateList[bitrateList.selectedIndex]
        if(select.value === 'true'){
            log.info('启用带宽设置')
            bitrateSet.style.display = 'block'
        }else {
            log.info('不启用带宽设置')
            bitrateSet.style.display = 'none'
        }
        log.warn("bitrate select: ", select.label)
    }else {
        alert('No device here! plug device and Try again!')
    }
}

function getResolution(value) {
    var constraints = {}
    if(value){
        let res = parseInt(value)
        constraints = {}
        switch (res) {
            case 2160:
                constraints = {
                    width: 3840,
                    height: 2160
                }
                break
            case 1080:
                constraints = {
                    width: 1920,
                    height: 1080
                }
                break
            case 720:
                constraints = {
                    width: 1280,
                    height: 720
                }
                break
            case 480:
                constraints = {
                    width: 848,
                    height: 480
                }
                break
            case 360:
                constraints = {
                    width: 640,
                    height: 360
                }
                break
            case 272:
                constraints = {
                    width: 480,
                    height: 272
                }
                break
            default:
                constraints = {
                    width: 640,
                    height: 360
                }
                break
        }
    }else {
        log.warn("invalid value!!")
    }

    return constraints
}

function getMedia() {
    log.warn('GetUserMedia start!');
    // getMediaButton.disabled = true;
    if (localStream) {
        localStream.getTracks().forEach(function(track) {
            track.stop();
        });
        let videoTracks = localStream.getVideoTracks();
        for (let i = 0; i !== videoTracks.length; ++i) {
            videoTracks[i].stop();
        }
    }

    let resolutionList = document.getElementById('setResolution').options
    let select= resolutionList[resolutionList.selectedIndex]
    log.warn("select Resolution: ", select.value)

    var frameRate = document.getElementById('setFrameRate').value
    frameRate = parseInt(frameRate) || 15
    console.warn("get frameRate " + frameRate)
    var getCons = getResolution(select.value)
    let constraints = {
        audio: false,
        video: {
            frameRate: frameRate,
            width: {
                ideal: getCons.width || 1280,
                max: getCons.width || 1280
            },
            height: {
                ideal: getCons.height || 720,
                max: getCons.height || 720
            }
        }
    }

    log.warn("getNewStream constraint: \n" + JSON.stringify(constraints, null, '    ') );

    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(function(e) {
        log.warn("getUserMedia failed!");
        let message = 'getUserMedia error: ' + e.name + '\n' + 'PermissionDeniedError may mean invalid constraints.';
        if(e.name === "OverconstrainedError" || e.name === "ConstraintNotSatisfiedError"){
            // constraints can not be satisfied by avb.device
            log.warn('constraints can not be satisfied by avb.device')
        }else {
            if(e.name === "NotFoundError" || e.name === "DeviceNotFoundError"){
                // require track is missing
                log.warn('require track is missing')
            }else if(e.name === "NotReadableError" || e.name === "TrackStartError"){
                // webcam or mic are already in use
                log.warn('webcam or mic are already in use')
            }else if(e.name === "NotAllowedError" || e.name === "PermissionDeniedError" || e.name === "PermissionDismissedError"){
                // permission denied in browser
                log.warn('permission denied in browser')
            }else if(e.name === "TypeError"){
                // empty constraints object
                log.warn('empty constraints object')
            }else {
                // other errors
                log.warn('other errors ' + e.name)
            }
        }
        log.warn(message);
        // getMediaButton.disabled = false;
    });
}
// getMedia();

document.getElementById('setResolution').onchange = function () {
    getMedia()
}

function gotStream(stream) {
    getMediaButton.disabled = true;
    connectButton.disabled = false;
    log.warn('GetUserMedia succeeded:');
    localStream = stream;
    localVideo.srcObject = stream;
}

function legalCheck() {
    let result = true
    let bitrateList = document.getElementById('bitrateEnabled').options
    let select= bitrateList[bitrateList.selectedIndex]
    if(select.value === 'true'){
        let ASBitrate = document.getElementById('ASBitrate').value

        if(isNaN(ASBitrate.trim())){
            log.warn('ASBitrate is required to be a number')
            result = false
        }
        if(ASBitrate.trim().length === 0 ){
            log.warn('至少设置ASBitrate或TIASBitrate')
            result = false
        }

    }
    return result
}

function levelCheck(){
    let result = true
    var levelIdc = document.getElementById('setLevelId').value
    if(levelIdc.trim().length === 0 ){
        log.warn('至少设置profile-level-id')
        result = false
    }

    return result
}

function createPeerConnection() {
    if(!legalCheck()){
        alert('请输入ASBitrate、TIASBitrate并确保为数字')
        return
    }
    if(!levelCheck()){
        alert("请输入profile-level-id值")
        return
    }

    log.info("begin create peerConnections");
    connectButton.disabled = true;
    hangupButton.disabled = false;

    bytesPrev = 0;
    timestampPrev = 0;
    localPeerConnection = new RTCPeerConnection(null);
    remotePeerConnection = new RTCPeerConnection(null);
    localStream.getTracks().forEach(
        function(track) {
            log.info("localPeerConnection addTack!");
            localPeerConnection.addTrack(
                track,
                localStream
            );
        }
    );
    log.info('localPeerConnection creating offer');
    localPeerConnection.onnegotiationeeded = function() {
        log.info('Negotiation needed - localPeerConnection');
    };
    remotePeerConnection.onnegotiationeeded = function() {
        log.info('Negotiation needed - remotePeerConnection');
    };
    localPeerConnection.onicecandidate = function(e) {
        log.info('Candidate localPeerConnection');
        remotePeerConnection.addIceCandidate(e.candidate)
            .then(
                onAddIceCandidateSuccess,
                onAddIceCandidateError
            );
    };
    remotePeerConnection.onicecandidate = function(e) {
        log.info('Candidate remotePeerConnection');
        localPeerConnection.addIceCandidate(e.candidate)
            .then(
                onAddIceCandidateSuccess,
                onAddIceCandidateError
            );
    };
    remotePeerConnection.ontrack = function(e) {
        if (remoteVideo.srcObject !== e.streams[0]) {
            log.info('remotePeerConnection got stream');
            remoteVideo.srcObject = e.streams[0];
        }
    };
    localPeerConnection.createOffer().then(
        function(offer) {
            log.info('localPeerConnection setLocalDescription:\n', offer.sdp);
            localPeerConnection.setLocalDescription(offer).then(function () {

                var sender = localPeerConnection.getSenders()[0]
                var videoParameters = sender.getParameters();
                if (JSON.stringify(videoParameters) === '{}') {
                    videoParameters.encodings = []
                    videoParameters.encodings[0] = {}
                }

                var maxBitRate = document.getElementById('maxBitrate').value
                if(maxBitRate){
                    if(!maxBitRate){
                        console.warn('get invalid maxBitRate: ' + maxBitRate)
                        maxBitRate = 1024000
                    }else {
                        maxBitRate = maxBitRate * 1000
                    }

                    videoParameters.encodings[0].maxBitrate = maxBitRate
                    videoParameters.degradationPreference =  'maintain-framerate'    // maintain-framerate维持帧率；maintain-resolution 维持分辨率，balanced 保持平衡

                    console.warn("videoParameters: \n", JSON.stringify(videoParameters, null, '   '))
                    sender.setParameters(videoParameters).then(function () {
                        console.warn("setParameters set success!!!")
                    }).catch(function (error) {
                        console.error(error)
                    })
                }else {
                    console.warn("maxBitrate 不存在，不设置！！")
                }

            }).catch(function (error) {
                console.error(error)
            })

            // console.warn("22222:",offer.sdp)
            // let parseSdp = SDPTools.parseSDP(offer.sdp)
            // console.warn("parseSdp:",parseSdp)
            // for(let i = 0; i < parseSdp.media.length; i++){
            //     /*修改profile-level-id*/
            //     var levelIdc = document.getElementById('setLevelId').value
            //     console.warn("offer_level-id:",levelIdc)
            //     if(!levelIdc){
            //         console.warn("empty string")
            //         return
            //     }
            //     console.warn("设置的offer_profile-level-id为:",levelIdc)
            //     SDPTools.modifyProfilelevelId(parseSdp,i,levelIdc)
            //     console.warn("vp8_parseSdp:",parseSdp)
            //     /*删除vp8 vp9*/
            //     let codec = ['VP9','VP8']
            //     console.warn("删除VP8、VP9编码")
            //     SDPTools.removeCodecByName(parseSdp, i, codec)
            //     console.warn("parseSdp:",parseSdp)
            // }
            // offer.sdp = SDPTools.writeSDP(parseSdp)
            // console.warn("juanhe:",offer.sdp)


            // log.info(`remotePeerConnection setRemoteDescription 1: \n${offer.sdp}`);
            console.warn("juanhejuanhejuanhejuaneh")
            remotePeerConnection.setRemoteDescription(offer).then(function () {
                console.warn("ihhuihuhuh")
                // console.warn("22222he:",offer.sdp)
                let parseSdp = SDPTools.parseSDP(offer.sdp)
                console.warn("parseSdp:",parseSdp)
                for(let i = 0; i < parseSdp.media.length; i++){
                    /*修改profile-level-id*/
                    var levelIdc = document.getElementById('setLevelId').value
                    console.warn("offer_level-id:",levelIdc)
                    if(!levelIdc){
                        console.warn("empty string")
                        return
                    }
                    console.warn("设置的offer_profile-level-id为:",levelIdc)
                    SDPTools.modifyProfilelevelId(parseSdp,i,levelIdc)
                    console.warn("vp8_parseSdp:",parseSdp)
                    /*删除vp8 vp9*/
                    let codec = ['VP9','VP8']
                    console.warn("删除VP8、VP9编码")
                    SDPTools.removeCodecByName(parseSdp, i, codec)
                    // console.warn("parseSdp:",parseSdp)

                    // 修改端口
                    // let type = parseSdp.media[i]
                    // console.warn("type:",type)
                    // if (type.content === 'main' ){
                    //     console.warn("111111")
                    //     if (type.port === 0){
                    //         console.warn("lalalal  lalal")
                    //         parseSdp.media[i].port = 9
                    //     }
                    //     if (type.setup === 'actpass') {
                    //         parseSdp.media[i].setup = 'passive'
                    //     }
                    // }

                }
                offer.sdp = SDPTools.writeSDP(parseSdp)
                log.info('remotePeerConnection setRemoteDescription success')
            }).catch(function (err) {
                log.error(err)
            })

            remotePeerConnection.createAnswer().then(
                function(answer) {
                    log.info('remotePeerConnection setLocalDescription: \n', answer.sdp);
                    remotePeerConnection.setLocalDescription(answer).then(function () {
                        let parsedSdp = SDPTools.parseSDP(answer.sdp)
                        for(let i = 0; i < parsedSdp.media.length; i++){
                            let media = parsedSdp.media[i]
                            let codec = ['VP9','VP8']
                            console.warn("准备删除VP8、VP9编码")
                            var ASBitrate= document.getElementById('ASBitrate').value
                            ASBitrate = ASBitrate || 4096
                            SDPTools.removeCodecByName(parsedSdp, i, codec)
                            SDPTools.setXgoogleBitrate(parsedSdp, ASBitrate, i)
                            SDPTools.removeRembAndTransportCC(parsedSdp, i)
                            media.payloads = media.payloads.trim()

                            // /*修改profile-level-id*/
                            // var levelIdc = document.getElementById('setLevelId').value
                            // console.warn("answer_level-id:",levelIdc)
                            // if(!levelIdc){
                            //     console.warn("empty string")
                            //     return
                            // }
                            // console.warn("设置的answer_profile-level-id为： ", levelIdc)
                            // SDPTools.modifyProfilelevelId(parsedSdp,i,levelIdc)
                        }
                        answer.sdp = SDPTools.writeSDP(parsedSdp)
                        log.info('setLocalDescription success')
                    }).catch(function (err) {
                        log.error(err)
                    })

                    let parsedSdp = SDPTools.parseSDP(answer.sdp)
                    for(let i = 0; i < parsedSdp.media.length; i++){
                        let media = parsedSdp.media[i]
                        let codec = ['VP9','VP8']
                        console.warn("VP8、VP9编码后")
                        var ASBitrate= document.getElementById('ASBitrate').value
                        ASBitrate = ASBitrate || 4096
                        SDPTools.removeCodecByName(parsedSdp, i, codec)
                        SDPTools.setXgoogleBitrate(parsedSdp, ASBitrate, i)
                        SDPTools.removeRembAndTransportCC(parsedSdp, i)
                        media.payloads = media.payloads.trim()

                        /*修改profile-level-id*/
                        var levelIdc = document.getElementById('setLevelId').value
                        console.warn("answer_level-id:",levelIdc)
                        if(!levelIdc){
                            console.warn("empty string")
                            return
                        }
                        console.warn("设置的answer_profile-level-id为： ", levelIdc)
                        SDPTools.modifyProfilelevelId(parsedSdp,i,levelIdc)
                    }
                    answer.sdp = SDPTools.writeSDP(parsedSdp)
                    // console.warn("local remote sdp:",answer.sdp)

                    // log.warn(`localPeerConnection setRemoteDescription:\n${answer.sdp}`);
                    localPeerConnection.setRemoteDescription(answer).then(function () {
                        let parseSdp = SDPTools.parseSDP(answer.sdp)
                        for(let i = 0; i < parseSdp.media.length; i++){
                            let type = parseSdp.media[i]
                            console.warn("type:",type)
                            if (type.content === 'main' ){
                                console.warn("111111")
                                if (type.port === 0){
                                    console.warn("lalalal  lalal")
                                    parseSdp.media[i].port = 9
                                }
                                if (type.setup === 'actpass') {
                                    parseSdp.media[i].setup = 'passive'
                                }
                            }

                        }
                        answer.sdp = SDPTools.writeSDP(parsedSdp)
                        console.warn("local remote sdp:",answer.sdp)


                        log.info('localPeerConnection setRemoteDescription success')
                    }).catch(function (err) {
                        log.error(err)
                    })
                },
                function(err) {
                    log.info(err);
                }
            );
        },
        function(err) {
            log.info(err);
        }
    );
}

function onAddIceCandidateSuccess() {
    log.info('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
    log.info('Failed to add Ice Candidate: ' + error.toString());
}


function hangup() {
    log.info('Ending call');
    localPeerConnection.close();
    remotePeerConnection.close();
    window.location.reload();

    // query stats one last time.
    Promise.all([
        remotePeerConnection.getStats(null)
            .then(showRemoteStats, function(err) {
                log.info(err);
            }),
        localPeerConnection.getStats(null)
            .then(showLocalStats, function(err) {
                log.info(err);
            })
    ]).then(() => {
        localPeerConnection = null;
        remotePeerConnection = null;
    });

    localStream.getTracks().forEach(function(track) {
        track.stop();
    });
    localStream = null;

    hangupButton.disabled = true;
    // getMediaButton.disabled = false;
}

function showRemoteStats(results) {
    let statsString = dumpStats(results);

    receiverStatsDiv.innerHTML = '<h2>Receiver stats</h2>' + statsString;
    // calculate video bitrate
    results.forEach(function(report) {
        let now = report.timestamp;

        let bitrate;
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            let bytes = report.bytesReceived;
            if (timestampPrev) {
                bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev);
                bitrate = Math.floor(bitrate);
            }
            bytesPrev = bytes;
            timestampPrev = now;
        }
        if (bitrate) {
            bitrate += ' kbits/sec';
            bitrateDiv.innerHTML = '<strong>Bitrate:</strong> ' + bitrate;
        }
    });

    // figure out the peer's ip
    let activeCandidatePair = null;
    let remoteCandidate = null;

    // Search for the candidate pair, spec-way first.
    results.forEach(function(report) {
        if (report.type === 'transport') {
            activeCandidatePair = results.get(report.selectedCandidatePairId);
        }
    });
    // Fallback for Firefox and Chrome legacy stats.
    if (!activeCandidatePair) {
        results.forEach(function(report) {
            if (report.type === 'candidate-pair' && report.selected ||
                report.type === 'googCandidatePair' &&
                report.googActiveConnection === 'true') {
                activeCandidatePair = report;
            }
        });
    }
    if (activeCandidatePair && activeCandidatePair.remoteCandidateId) {
        remoteCandidate = results.get(activeCandidatePair.remoteCandidateId);
    }
    if (remoteCandidate) {
        if (remoteCandidate.ip && remoteCandidate.port) {
            peerDiv.innerHTML = '<strong>Connected to:</strong> ' +
                remoteCandidate.ip + ':' + remoteCandidate.port;
        } else if (remoteCandidate.ipAddress && remoteCandidate.portNumber) {
            // Fall back to old names.
            peerDiv.innerHTML = '<strong>Connected to:</strong> ' +
                remoteCandidate.ipAddress +
                ':' + remoteCandidate.portNumber;
        }
    }
}

function showLocalStats(results) {
    let statsString = dumpStats(results);
    senderStatsDiv.innerHTML = '<h2>Sender stats</h2>' + statsString;
}
// Display statistics
setInterval(function() {
    if (localPeerConnection && remotePeerConnection) {
        remotePeerConnection.getStats(null)
            .then(showRemoteStats, function(err) {
                log.info(err);
            });
        localPeerConnection.getStats(null)
            .then(showLocalStats, function(err) {
                log.info(err);
            });
    } else {
        // log.info('Not connected yet');
    }
    // Collect some stats from the video tags.
    if (localVideo.videoWidth) {
        localVideoStatsDiv.innerHTML = '<strong>Video dimensions:</strong> ' +
            localVideo.videoWidth + 'x' + localVideo.videoHeight + 'px';
    }
    if (remoteVideo.videoWidth) {
        remoteVideoStatsDiv.innerHTML = '<strong>Video dimensions:</strong> ' +
            remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight + 'px';
    }
}, 1000);

// Dumping a stats letiable as a string.
// might be named toString?
function dumpStats(results) {
    let statsString = '';
    results.forEach(function(res) {
        statsString += '<h3>Report type=';
        statsString += res.type;
        statsString += '</h3>\n';
        statsString += 'id ' + res.id + '<br>\n';
        statsString += 'time ' + res.timestamp + '<br>\n';
        Object.keys(res).forEach(function(k) {
            if (k !== 'timestamp' && k !== 'type' && k !== 'id') {
                statsString += k + ': ' + res[k] + '<br>\n';
            }
        });
    });
    return statsString;
}