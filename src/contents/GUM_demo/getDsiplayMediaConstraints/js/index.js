/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var getMediaButton = document.querySelector('button#getMedia');
var connectButton = document.querySelector('button#connect');
var hangupButton = document.querySelector('button#hangup');

getMediaButton.onclick = getMedia;
connectButton.onclick = createPeerConnection;
hangupButton.onclick = hangup;

var getUserMediaConstraintsDiv = document.querySelector('textarea#getUserMediaConstraints');
var bitrateDiv = document.querySelector('div#bitrate');
var peerDiv = document.querySelector('div#peer');
var senderStatsDiv = document.querySelector('div#senderStats');
var receiverStatsDiv = document.querySelector('div#receiverStats');

var localVideo = document.querySelector('div#localVideo video');
var remoteVideo = document.querySelector('div#remoteVideo video');
var localVideoStatsDiv = document.querySelector('div#localVideo div');
var remoteVideoStatsDiv = document.querySelector('div#remoteVideo div');

var localPeerConnection;
var remotePeerConnection;
var localStream;
var bytesPrev;
var timestampPrev;

var defaultCon ={
    audio: true,
    video: {
        width: { max: '1920' },
        height: { max: '1080' },
        frameRate: { max: '5' }
    }
};
getUserMediaConstraintsDiv.value = JSON.stringify(defaultCon, null, '    ' );

main();

function main() {
    displayGetUserMediaConstraints();
}

function getMedia() {
    console.warn('GetUserMedia start!');
    getMediaButton.disabled = true;
    if (localStream) {
        localStream.getTracks().forEach(function(track) {
            track.stop();
        });
        var videoTracks = localStream.getVideoTracks();
        for (var i = 0; i !== videoTracks.length; ++i) {
            videoTracks[i].stop();
        }
    }
    var constraints = getUserMediaConstraints()
    console.warn('getDisplayMedia constraints: \n', JSON.stringify(constraints, null, '    '));

    if('getDisplayMedia' in window.navigator){
        navigator.getDisplayMedia(constraints)
            .then(gotStream)
            .catch(function(e) {
                console.error(e)
                console.warn("getUserMedia failed!");
                var message = 'getUserMedia error: ' + e.name + '\n' +
                    'PermissionDeniedError may mean invalid constraints.';
                alert(message);
                console.log(message);
                getMediaButton.disabled = false;
            });
    }else if('getDisplayMedia' in window.navigator.mediaDevices){
        navigator.mediaDevices.getDisplayMedia(getUserMediaConstraints())
            .then(gotStream)
            .catch(function(e) {
                console.error(e);
                var message = 'getUserMedia error: ' + e.name + '\n' +
                    'PermissionDeniedError may mean invalid constraints.';
                alert(message);
                console.log(message);
                getMediaButton.disabled = false;
            });
    }else {
        console.warn("该浏览器不支持getDisplayMedia接口");
    }
}


function gotStream(stream) {
    connectButton.disabled = false;
    console.warn('GetUserMedia succeeded:');
    localStream = stream;
    localVideo.srcObject = stream;
}

function getUserMediaConstraints() {
    var constraints = editGetUserMediaConstraints();
    return constraints;
}

function displayGetUserMediaConstraints() {
    var constraints = getUserMediaConstraints();
    getUserMediaConstraintsDiv.value = JSON.stringify(constraints, null, '    ');
}

function editGetUserMediaConstraints() {
    var constraints = { };
    if (getUserMediaConstraintsDiv.value) {
        constraints = JSON.parse(getUserMediaConstraintsDiv.value);
    }
    return constraints;
}


function createPeerConnection() {
    console.log("begin create peerConnections");
    console.log(localStream);
    connectButton.disabled = true;
    hangupButton.disabled = false;

    bytesPrev = 0;
    timestampPrev = 0;
    localPeerConnection = new RTCPeerConnection(null);
    remotePeerConnection = new RTCPeerConnection(null);
    localStream.getTracks().forEach(
        function(track) {
            console.log("localPeerConnection addTack!");
            localPeerConnection.addTrack(
                track,
                localStream
            );
        }
    );
    console.log('localPeerConnection creating offer');
    localPeerConnection.onnegotiationeeded = function() {
        console.log('Negotiation needed - localPeerConnection');
    };
    remotePeerConnection.onnegotiationeeded = function() {
        console.log('Negotiation needed - remotePeerConnection');
    };
    localPeerConnection.onicecandidate = function(e) {
        console.log('Candidate localPeerConnection');
        remotePeerConnection.addIceCandidate(e.candidate)
            .then(
                onAddIceCandidateSuccess,
                onAddIceCandidateError
            );
    };
    remotePeerConnection.onicecandidate = function(e) {
        console.log('Candidate remotePeerConnection');
        localPeerConnection.addIceCandidate(e.candidate)
            .then(
                onAddIceCandidateSuccess,
                onAddIceCandidateError
            );
    };
    remotePeerConnection.ontrack = function(e) {
        console.warn("localPeerConnection iceConnectionState: ", localPeerConnection.iceConnectionState)
        console.warn("remotePeerConnectioniceConnectionState: ", remotePeerConnection.iceConnectionState)
        if (remoteVideo.srcObject !== e.streams[0]) {
            console.log('remotePeerConnection got stream');
            remoteVideo.srcObject = e.streams[0];
        }
    };
    localPeerConnection.createOffer().then(
        function(desc) {
            console.log('localPeerConnection offering');
            desc.sdp  = removeNack(desc.sdp)
            console.log(`Offer from pc1 ${desc.sdp}`);
            localPeerConnection.setLocalDescription(desc);
            remotePeerConnection.setRemoteDescription(desc);
            remotePeerConnection.createAnswer().then(
                function(desc2) {
                    // firefox
                    var replacement = 'max-fs=3600';
                    desc2.sdp = desc2.sdp.replace(/max-fs=([a-zA-Z0-9]{3,5})/, replacement);

                    var replacement2 = 'max-fr=15';
                    desc2.sdp = desc2.sdp.replace(/max-fr=([a-zA-Z0-9]{1,3})/, replacement2);

                    // // chrome
                    // var parseSdp = SDPTools.parseSDP(desc2.sdp)
                    // SDPTools.removeCodecByPayload(parseSdp, 0, [97, 98, 99 ,100, 101, 122, 127 ,121, 125 ,107, 108, 109, 124, 120 ,123, 119, 114 ,115, 116])
                    // desc2.sdp = SDPTools.writeSDP(parseSdp)
                    //
                    // var replacement3 = 'profile-level-id=420016';
                    // desc2.sdp = desc2.sdp.replace(/profile-level-id=([a-zA-Z0-9]{6})/, replacement3);
                    // desc2.sdp = desc2.sdp + 'a=imageattr:102 send [x=1920,y=1080] recv [x=1280,y=720]\n'

                    console.log('remotePeerConnection answering');
                    console.warn(`Answer from pc2:\n${desc2.sdp}`);
                    
                    remotePeerConnection.setLocalDescription(desc2);
                    localPeerConnection.setRemoteDescription(desc2);
                },
                function(err) {
                    console.log(err);
                }
            );
        },
        function(err) {
            console.log(err);
        }
    );
}

function removeNack(sdp){
    let  parseSdp = SDPTools.parseSDP(sdp)
    SDPTools.removeRembAndTransportCC(parseSdp)
    // SDPTools.removeCodecByPayload(parseSdp, 0, [97, 98, 99 ,100, 101, 122, 127 ,121, 125 ,107, 108, 109, 124, 120 ,123, 119, 114 ,115, 116])
    sdp = SDPTools.writeSDP(parseSdp)
    return sdp
}

function onAddIceCandidateSuccess() {
    console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
    console.log('Failed to add Ice Candidate: ' + error.toString());
}


function hangup() {
    console.log('Ending call');
    localPeerConnection.close();
    remotePeerConnection.close();
    window.location.reload();

    // query stats one last time.
    Promise.all([
        remotePeerConnection.getStats(null)
            .then(showRemoteStats, function(err) {
                console.log(err);
            }),
        localPeerConnection.getStats(null)
            .then(showLocalStats, function(err) {
                console.log(err);
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
    getMediaButton.disabled = false;
}

function showRemoteStats(results) {
    var statsString = dumpStats(results);

    receiverStatsDiv.innerHTML = '<h2>Receiver stats</h2>' + statsString;
    // calculate video bitrate
    results.forEach(function(report) {
        var now = report.timestamp;

        var bitrate;
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            var bytes = report.bytesReceived;
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
    var activeCandidatePair = null;
    var remoteCandidate = null;

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
    var statsString = dumpStats(results);
    senderStatsDiv.innerHTML = '<h2>Sender stats</h2>' + statsString;
}
// Display statistics
setInterval(function() {
    if (localPeerConnection && remotePeerConnection) {
        remotePeerConnection.getStats(null)
            .then(showRemoteStats, function(err) {
                console.log(err);
            });
        localPeerConnection.getStats(null)
            .then(showLocalStats, function(err) {
                console.log(err);
            });
    } else {
        console.log('Not connected yet');
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

// Dumping a stats variable as a string.1
// might be named toString?
function dumpStats(results) {
    var statsString = '';
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

