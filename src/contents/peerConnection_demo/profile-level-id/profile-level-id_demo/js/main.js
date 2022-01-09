/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

localVideo.addEventListener('loadedmetadata', function() {
    console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
    console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('resize', () => {
    console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
    // We'll use the first onsize callback as an indication that video has started
    // playing out.
    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
        startTime = null;
    }
});

let localStream;
let pc1;
let pc2;
const offerOptions = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1
};

function getName(pc) {
    return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
    return (pc === pc1) ? pc2 : pc1;
}
let constraints = {
    audio: false,
    video: {
        width: {
            ideal: 1920,
            max:  1920,
        },
        height: {
            ideal: 1080,
            max: 1080,
        },
        frameRate: {
            ideal: 15,
            max:  15
        }
    }
};
async function start() {
    console.log('Requesting local stream');
    startButton.disabled = true;
    let stream
    try {
        // const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if(navigator.getDisplayMedia){
          stream = await navigator.getDisplayMedia(constraints)

        }else if(navigator.mediaDevices.getDisplayMedia){
            stream = await navigator.mediaDevices.getDisplayMedia(constraints)
        }else {
            var screen_constraints = {
                audio: false,
                video: {
                    mozMediaSource: 'screen',
                    mediaSource: 'screen',
                    width: {min: '10',max: '1920'},
                    height: {min: '10',max: '1080'},
                    frameRate: {min: '1', max: '5'}
                }
            };
            stream = await navigator.mediaDevices.getUserMedia(screen_constraints)

            console.warn("该浏览器不支持getDisplayMedia接口");
        }
        console.log('Received local stream');
        localVideo.srcObject = stream;
        localStream = stream;
        callButton.disabled = false;
    } catch (e) {
        alert(`getUserMedia() error: ${e.name}`);
    }
}

function getSelectedSdpSemantics() {
    const sdpSemanticsSelect = document.querySelector('#sdpSemantics');
    const option = sdpSemanticsSelect.options[sdpSemanticsSelect.selectedIndex];
    return option.value === '' ? {} : {sdpSemantics: option.value};
}

async function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    console.log('Starting call');
    startTime = window.performance.now();
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
        console.log(`Using video device: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
        console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    const configuration = getSelectedSdpSemantics();
    console.log('RTCPeerConnection configuration:', configuration);
    pc1 = new RTCPeerConnection(configuration);
    console.log('Created local peer connection object pc1');
    pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
    pc2 = new RTCPeerConnection(configuration);
    console.log('Created remote peer connection object pc2');
    pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
    pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
    pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
    pc2.addEventListener('track', gotRemoteStream);

    localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
    console.log('Added local stream to pc1');

    try {
        console.log('pc1 createOffer start');
        const offer = await pc1.createOffer();
        await onCreateOfferSuccess(offer);
    } catch (e) {
        onCreateSessionDescriptionError(e);
    }
}

function onCreateSessionDescriptionError(error) {
    // console.log(`Failed to create session description: ${error.toString()}`);
    console.log('Failed to create session description: ',error);
}

async function onCreateOfferSuccess(desc) {
    console.log(`Offer from pc1\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    try {
        await pc1.setLocalDescription(desc).then(function(){
            //hejuan
            desc.sdp = dealWithSdp(desc)
            console.log('local offer pc1:',desc.sdp.toString());
        }).catch(function (error) {
            console.error(error)
        });
        onSetLocalSuccess(pc1);
    } catch (e) {
        onSetSessionDescriptionError();
    }

    console.log('pc2 setRemoteDescription start');
    try {
        await pc2.setRemoteDescription(desc);
        onSetRemoteSuccess(pc2);
    } catch (e) {
        onSetSessionDescriptionError();
    }

    console.log('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
        const answer = await pc2.createAnswer();
        await onCreateAnswerSuccess(answer);
    } catch (e) {
        onCreateSessionDescriptionError(e);
    }
}

function onSetLocalSuccess(pc) {
    console.log(`${getName(pc)} setLocalDescription complete`);
}

function onSetRemoteSuccess(pc) {
    console.log(`${getName(pc)} setRemoteDescription complete`);
}

function onSetSessionDescriptionError(error) {
    // console.log(`Failed to set session description: ${error.toString()}`);
    console.warn("Failed to set session description:",error)
}

function gotRemoteStream(e) {
    if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        console.log('pc2 received remote stream');
    }
}

async function onCreateAnswerSuccess(desc) {
    console.log(`Answer from pc2:\n${desc.sdp}`);
    console.log('pc2 setLocalDescription start');
    try {
        await pc2.setLocalDescription(desc).then(function(){
            desc.sdp = dealWithSdp(desc)
            console.log('remote ansewr pc2:',desc.sdp.toString());
        }).catch(function (error) {
            console.error(error)
        })
        onSetLocalSuccess(pc2);
    } catch (e) {
        onSetSessionDescriptionError(e);
    }
    console.log('pc1 setRemoteDescription start');
    try {
        await pc1.setRemoteDescription(desc);
        onSetRemoteSuccess(pc1);
    } catch (e) {
        onSetSessionDescriptionError(e);
    }
}

function dealWithSdp(desc){
    console.log("处理SDP")
    let parsedSdp = SDPTools.parseSDP(desc.sdp)
    for(let i = 0; i < parsedSdp.media.length; i++){
        if(parsedSdp.media[i].type == 'video') {
            let codec = ['VP9','VP8']
            console.warn("删除VP8、VP9编码")
            SDPTools.removeCodecByName(parsedSdp, i, codec)
            SDPTools.setXgoogleBitrate(parsedSdp, 2048, i)
            SDPTools.removeRembAndTransportCC(parsedSdp, i)
            console.warn("修改后的SDP:",parsedSdp)

            /*修改level-id*/
            var levelIdc = document.getElementById('setLevelId').value
            console.warn("offer_level-id:",levelIdc)
            if(!levelIdc){
                console.warn("empty string")
                return
            }
            console.warn("设置的offer_profile-level-id为:",levelIdc)
            SDPTools.modifyProfilelevelId(parsedSdp,i,levelIdc)

            /*修改方向*/
            // SDPTools.modifyVideoDirection(parsedSdp,i)

            /*修改packetization-mode*/
            SDPTools.modifyPacketizationMode(parsedSdp,i)
        }
    }
    desc.sdp = SDPTools.writeSDP(parsedSdp)
    return  desc.sdp
}


async function onIceCandidate(pc, event) {
    try {
        await (getOtherPc(pc).addIceCandidate(event.candidate));
        onAddIceCandidateSuccess(pc);
    } catch (e) {
        onAddIceCandidateError(pc, e);
    }
    console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(pc) {
    console.log(`${getName(pc)} addIceCandidate success`);
}

function onAddIceCandidateError(pc, error) {
    console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(pc, event) {
    if (pc) {
        console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
        console.log('ICE state change event: ', event);
    }
}

function hangup() {
    console.log('Ending call');
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
}
