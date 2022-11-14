let peerArray = []
let localChannel

function createNewPeer(){
    console.warn('create new peer')
    let localPeer;
    let remotePeer;
    const offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };
    localPeer = new RTCPeerConnection();
    remotePeer = new RTCPeerConnection();
    localPeer.onicecandidate = function (event){
        handlePeerCandidate(event.candidate, remotePeer, 'pc2: ', 'local')
    };

    localChannel = localPeerConnection.createDataChannel('sendDataChannel')
    localChannel.binaryType = 'arraybuffer';
    console.log(" created send data channel")

    localChannel.onopen = onSendChannelStateChange
    localChannel.onclose = onSendChannelStateChange
    localChannel.onerror = onError

    remotePeer.ondatachannel = receiveChannelCallback
    remotePeer.onicecandidate = function (event){
        handlePeerCandidate(event.candidate, localPeer, 'pc2: ', 'remote')
    }
    console.log('pc2: created local and remote peer connection objects');


    localPeer.createOffer(offerOptions).then(function (desc){
        desc.sdp = processSdpBeforeSetLocal(desc.sdp)

        localPeer.setLocalDescription(desc);
        console.log(`Offer from localPeer\n${desc.sdp}`);
        remotePeer.setRemoteDescription(desc);
        remotePeer.createAnswer().then(function (desc){
            remotePeer.setLocalDescription(desc);
            console.log(`Answer from remotePeer\n${desc.sdp}`);
            localPeer.setRemoteDescription(desc);
        }).catch(function (error){
            console.log(`Failed to add ICE candidate: ${error.toString()}`);
        })
    }).catch(function (error){
        console.log(`Failed to add ICE candidate: ${error.toString()}`);
    })

    peerArray.push(localPeer)
    peerArray.push(remotePeer)
}

/**
 * 设置收到的candidate
 * @param candidate
 * @param dest
 * @param prefix
 * @param type
 */
function handlePeerCandidate(candidate, dest, prefix, type) {
    dest.addIceCandidate(candidate).then(onAddIceCandidateSuccess, onAddIceCandidateError);
    console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

/**
 * 获取 msid、ssrc和ssrcGroups 信息
 * @param sdp
 * @returns {*}
 */
function processSdpBeforeSetLocal(sdp){
    let targetSdp = remotePeerConnection.currentRemoteDescription.sdp
    let parsedSdp = SDPTools.parseSDP(targetSdp)
    console.warn(parsedSdp)
    let offerSdp = SDPTools.parseSDP(sdp)
    for (let i = 0; i < parsedSdp.media.length; i++){
        let media = parsedSdp.media[i]
        if(media.msid){
            offerSdp.media[i].msid = media.msid
        }
        if(media.ssrcs){
            offerSdp.media[i].ssrcs = media.ssrcs
        }
        if(media.ssrcGroups){
            offerSdp.media[i].ssrcGroups = media.ssrcGroups
        }
        offerSdp.media[i].direction = 'sendrecv'
    }

    if(parsedSdp.msidSemantics){
        offerSdp.msidSemantics = parsedSdp.msidSemantics
    }

    sdp = SDPTools.writeSDP(offerSdp)
    console.warn('processed SDP:\r\n', sdp)
    return sdp
}
