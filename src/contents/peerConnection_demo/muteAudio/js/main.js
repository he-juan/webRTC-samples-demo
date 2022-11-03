let  createOrjoin = document.getElementsByClassName("createOrjoin")[0]
let  containerWrapper = document.getElementById("container_wrapper")

let showLocalOffer = document.getElementById("showLocalOffer")
let showLocalAnswer = document.getElementById("showLocalAnswer")
let getRemoteOffer = document.getElementById("getRemoteOffer")
let getRemoteAnswer = document.getElementById("getRemoteAnswer")

let localOffer = document.getElementById("localOffer")
let localAnswer = document.getElementById("localAnswer")
let remoteOffer = document.getElementById("remoteOffer")
let remoteAnswer = document.getElementById("remoteAnswer")

let offerSentBtn = document.getElementById("offerSentBtn")
let answerSentBtn = document.getElementById("answerSentBtn")
let offerRecdBtn = document.getElementById("offerRecdBtn")
let answerRecdBtn = document.getElementById("answerRecdBtn")

let messageTextBox = document.getElementById("messageTextBox")
let sendMessageBtn = document.getElementById("sendMessageBtn")

let chatLog = document.getElementById('chatlog')


let config ={}, RTCpeerConnectionOptional = {'optional': [{'DtlsSrtpKeyAgreement': true}]}
let activedc;

/**********************监听事件*************************/
offerSentBtn.onclick = function(){
    showLocalOffer.style.display = 'none'
    getRemoteAnswer.style.display = 'block'
}

answerSentBtn.onclick = function(){
    showLocalAnswer.style.display = 'none'
    containerWrapper.style.opacity = 1
    body.removeChild(mb);
    // getRemoteOffer.style.display = 'block'
}

offerRecdBtn.onclick = function(){
    getRemoteOffer.style.display = 'none'
    let offer = remoteOffer.value
    let offerDesc = new RTCSessionDescription(JSON.parse(offer))
    console.log('Received remote offer', offerDesc.sdp.toString())
    handleOfferFromPC1(offerDesc)

    showLocalAnswer.style.display = "block"
    setInterval(function() { ReGetStats()},1000)
    // $('#showLocalAnswer').modal('show')
}

answerRecdBtn.onclick = function(){
    getRemoteAnswer.style.display = 'none'
    containerWrapper.style.opacity = 1
    var answer = remoteAnswer.value
    var answerDesc = new RTCSessionDescription(JSON.parse(answer))
    handleAnswerFromPC2(answerDesc)
    body.removeChild(mb);
    setInterval(function() { ReGetStats()},1000)
}




/****************创建peerConnection***********/
let pc1 = new RTCPeerConnection(config, RTCpeerConnectionOptional);
let pc2 = new RTCPeerConnection(config, RTCpeerConnectionOptional);
let offerConstraints = {offerToReceiveAudio: false, offerToReceiveVideo: true};
let pc1DataChannel, pc2DataChannel;
let constraints ={audio: true, video:false}

function join(){
    function getSuccess(stream){
        pc2.localStream = stream
        streamMuteSwitch({stream: stream, type: 'audio', mute: true})
        pc2.addStream(stream)
        var video = document.getElementById('localVideo')
        if(stream.getAudioTracks().length > 0){
            video = handleReplaceElement('localVideo')
        }
        video.srcObject = stream
        video.play()

        setInterval(function() {ReGetStats()},1000)

    }

    function getFailed(error){
        console.log('Error adding stream to pc2: ' + error)
    }
    navigator.getUserMedia(constraints,function(stream){
        getSuccess(stream)
    },function(e){
        getFailed(e)
        console.warn("error:",e)
    })
    createOrjoin.style.display = 'none'
    getRemoteOffer.style.display = 'block'
}

function create(){
    createOrjoin.style.display = 'none'
    // containerWrapper.style.opacity = 1
    showLocalOffer.style.display = 'block'
    createLocalOffer()
}

async function createLocalOffer() {
    function getFailed(error){
        console.log('Error adding stream to pc1: ' + error)
    }
    navigator.getUserMedia(constraints,function(stream){
        getSuccess(stream)
    },function(e){
        getFailed(e)
        console.warn("error:",e)
    })

    async function getSuccess(stream){
        pc1.localStream = stream
        streamMuteSwitch({stream: stream, type: 'audio', mute: true})
        // console.log("get stream success constraints: " + JSON.stringify(constraints, null, '  '))
        pc1.addStream(stream)
        await setupDataChannel()

        var video = document.getElementById('localVideo')
        if(stream.getAudioTracks().length > 0){
            video = handleReplaceElement('localVideo')
        }
        video.srcObject = stream
        video.play()
        try {
            let offer = await pc1.createOffer()
            await onCreateOfferSuccess(offer)
            console.info(`Offer setLocalDescription sdp: ` + ` \n${offer.sdp}`)
            console.info('setLocalDescription success')
        } catch (e) {
            console.error('Failed to create setLocalDescription description: ', e);
        }

        setInterval(function() { LoGetStats()},1000)
    }

    async function onCreateOfferSuccess(desc) {
        console.info('start setLocalDescription')
        try {
            desc = dealWithSdp(desc)
            console.info(`modify Offer setLocalDescription sdp: ` + ` \n${desc.sdp}`)
            await pc1.setLocalDescription(desc)
            setLocalDescriptionSuccess(pc1)
        } catch (error) {
            console.error('Failed to create setLocalDescription description: ', e);
        }
    }

    function setLocalDescriptionSuccess(pc) {
        console.info('setLocalDescription success ( ' + pc.type + ')')
        if (pc.iceGatheringState === 'complete') {
            console.info('onSetLocalDescriptionSuccess send invite( PC: ' + pc.type + ' )')
            // this.onIceGatheringCompleted()
        }
    }
}

async function handleOfferFromPC1 (offerDesc) {
    pc2.setRemoteDescription(offerDesc)
    try {
        const answer = await pc2.createAnswer();
        console.log('Created local answer: ', answer.sdp.toString())
        await gotRemoteDescription(answer);
    } catch (e) {
        console.log('Failed to create session description: ', e);
    }
}
async function gotRemoteDescription(desc) {
    desc = dealWithSdp(desc)
    console.info(`modify Answer from remoteConnection: ` + ` \n${desc.sdp}`)
    await pc2.setLocalDescription(desc);
}

function handleAnswerFromPC2 (answerDesc) {
    console.log('Received remote answer: ', answerDesc)
    // answerDesc = dealWithSdp(answerDesc,leveId)
    // console.log('remote answer:',answerDesc.sdp.toString())
    setInterval(function() { ReGetStats()},1000)
    // writeToChatLog('Received remote answer', 'text-success')
    pc1.setRemoteDescription(answerDesc)
}

function handleOnconnection () {
    console.log('Datachannel connected')
    // writeToChatLog('Datachannel connected', 'text-success')
    // $('#waitForConnection').modal('hide')
    // // If we didn't call remove() here, there would be a race on pc2:
    // //   - first onconnection() hides the dialog, then someone clicks
    // //     on answerSentBtn which shows it, and it stays shown forever.
    // $('#waitForConnection').remove()
    // $('#showLocalAnswer').modal('hide')
    // $('#messageTextBox').focus()
}

function handleOnaddstream (e) {
    console.log('handOnaddsteam, Got remote stream', e.stream)
    pc1.remoteStream = e.stream
    let el = document.getElementById('remoteVideo')
    if(e.stream.getAudioTracks().length > 0){
        el =  handleReplaceElement('remoteVideo')
    }
    el.autoplay = true
    el.srcObject = e.stream
}

function handleOnaddremotestream(event){
    console.log('handleOnaddremotestream, Got remote stream', event.stream)
    pc2.remoteStream = event.stream
    let remoteVideo = document.getElementById('remoteVideo')
    if(event.stream.getAudioTracks().length > 0){
        remoteVideo = handleReplaceElement('remoteVideo')
    }
    remoteVideo.autoplay = true
    remoteVideo.srcObject = event.stream
}

/************************************处理sdp ********************************************/
function dealWithSdp(desc,leveId= '42e028'){
    let parsedSdp = SDPTools.parseSDP(desc.sdp)
    for(let i = 0; i < parsedSdp.media.length; i++){
        let media = parsedSdp.media[i]
        if (media.type === 'audio') {
            let codec = []
            let opus = localStorage.getItem('opus')
            let pcmu = localStorage.getItem('pcmu')
            if(opus === 'true'){
                codec.push('opus')
                console.warn("存在opus")
            }
            if(pcmu === 'true'){
                codec.push('PCMU')
                console.warn("存在pcmu")
            }
            codec.push('CN')  // only keep ['G722', 'opus', 'PCMU', 'PCMA', 'telephone-event']
            SDPTools.removeCodecByName(parsedSdp, i, codec, true)
        }else if(media.type === 'video'){
            let media = parsedSdp.media[i]
            let codec = ['VP9','VP8']
            SDPTools.removeCodecByName(parsedSdp, i, codec)
            SDPTools.setXgoogleBitrate(parsedSdp, 10240, i)
            SDPTools.setMediaBandwidth(parsedSdp, i, 2048)
            SDPTools.removeRembAndTransportCC(parsedSdp, i)
            console.warn("media_payloads:",media.payloads)

            /**修改levelId*/
            if(!leveId){
                console.warn("empty string")
                return
            }
            console.warn("设置的profile-level-id为： ", leveId)
            SDPTools.modifyProfilelevelId(parsedSdp,i,leveId)

            /**修改fmtp*/
            SDPTools.modifyFmtp(parsedSdp, i)

            /**修改ext*/
            SDPTools.modifyExt(parsedSdp, i)
        }
    }
    desc.sdp = SDPTools.writeSDP(parsedSdp)
    return  desc
}

/***********************************dataChannel相关处理*******************************/

function setupDataChannel(){
   try{
       pc1DataChannel = pc1.createDataChannel('sendDataChannel', {reliable: true, ordered: true})
       pc1DataChannel.binaryType = 'arraybuffer';
       activedc = pc1DataChannel
       console.log("created dataChannel (PC1)")

       // pc1DataChannel.onopen = onSendChannelStateChange
       // pc1DataChannel.onclose = onSendChannelStateChange
       // pc1DataChannel.onerror = onError
       // pc1DataChannel.onmessage = onHandleReceiveMessage(event)
       pc1DataChannel.onopen = function(){
           console.log('(pc1)data channel connect')
       }
       pc1DataChannel.onmessage = function(e){
           console.log(`Got message (pc1) ${e.data}`)
           var fileReceiver1 = new FileReceiver()
           if (e.data.size) {
               fileReceiver1.receive(e.data, {})
           } else {
               if (e.data.charCodeAt(0) == 2) {
                   // The first message we get from Firefox (but not Chrome)
                   // is literal ASCII 2 and I don't understand why -- if we
                   // leave it in, JSON.parse() will barf.
                   return
               }
               console.log(e)
               var data = JSON.parse(e.data)
               if (data.type === 'file') {
                   fileReceiver1.receive(e.data, {})
               } else {
                   // writeToChatLog(data.message, 'text-info')
                   // // Scroll chat text area to the bottom on new input.
                   // $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
                   // chatLog.scrollTop(chatLog.scrollHeight)
                   chatLog.scrollTo(0,chatLog.scrollHeight)
               }
           }
       }
   }catch(e){
       console.warn('No data channel (pc1)', e);
   }
}
pc2.ondatachannel =  function(e){
    var fileReceiver2 = new FileReceiver()
    var datachannel = e.channel || e; // Chrome sends event, FF sends raw channel
    console.log('Received datachannel (pc2)', arguments)
    pc2DataChannel = datachannel
    activedc = datachannel
    pc2DataChannel.onopen = function (e) {
        console.log('(pc2dc) data channel connect')
        // $('#waitForConnection').modal('hide')
        // $('#waitForConnection').remove()
    }
    pc2DataChannel.onmessage = function (e) {
        console.log('Got message (pc2)', e.data)
        if (e.data.size) {
            fileReceiver2.receive(e.data, {})
        } else {
            var data = JSON.parse(e.data)
            if (data.type === 'file') {
                fileReceiver2.receive(e.data, {})
            } else {
                // writeToChatLog(data.message, 'text-info')
                // Scroll chat text area to the bottom on new input.
                // $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
                // chatLog.scrollTop(chatLog.scrollHeight)
                chatLog.scrollTo(0,chatLog.scrollHeight)
            }
        }
    }
}

function onSendChannelStateChange(){
    if( sendChannel== null || sendChannel === undefined){
        alert("no cheated dataChannel")
        return
    }
    console.log("sendChannel:"+ JSON.stringify(sendChannel, null, '    '))

    let {readyState} = sendChannel
    console.log(`Send channel state is: ${readyState}`);
    if(readyState === 'open'){
        // 弹框复制内容
        // sendData()

    }else if(readyState ==='close'){
        console.log("dataChannel is close")
    }
}

function onHandleReceiveMessage(e){
    console.log(`Got message (pc1) ${e.data}`)
    var fileReceiver1 = new FileReceiver()
    if (e.data.size) {
        fileReceiver1.receive(e.data, {})
    } else {
        if (e.data.charCodeAt(0) == 2) {
            // The first message we get from Firefox (but not Chrome)
            // is literal ASCII 2 and I don't understand why -- if we
            // leave it in, JSON.parse() will barf.
            return
        }
        console.log(e)
        var data = JSON.parse(e.data)
        if (data.type === 'file') {
            fileReceiver1.receive(e.data, {})
        } else {
            writeToChatLog(data.message, 'text-info')
            // Scroll chat text area to the bottom on new input.
            $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
        }
    }
}
function onError(error) {
    if (sendChannel) {
        console.error('Error in sendChannel:', error);
        return;
    }
    console.log('Error in sendChannel which is already closed:', error);
}

/*******************************ice 相关逻辑**************************************/

pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
pc1.addEventListener('icegatheringstatechange', e => onicegatheringstatechange(pc1, e))
pc1.addEventListener("signalingstatechange", e => onsignalingstatechange(pc1, e))
pc1.onconnection = handleOnconnection
pc1.onaddstream = handleOnaddstream

pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
pc2.addEventListener('icegatheringstatechange',e=> onicegatheringstatechange(pc2,e))
pc2.addEventListener("signalingstatechange", e=>onsignalingstatechange(pc2,e))
pc2.onaddstream = handleOnaddremotestream

async function onIceCandidate(pc, event) {
    try {
        // let getPc = getOtherPc(pc)
        // console.warn("getpc:",getPc)
        // await getPc.addIceCandidate((event.candidate));
        onAddIceCandidateSuccess(pc, event.candidate);
    } catch (e) {
        onAddIceCandidateError(pc, e);
    }
    console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onicegatheringstatechange (pc,state) {
    console.info(`${getName(pc)} ice gathering state change:, ${pc.iceGatheringState}`)
}

function onsignalingstatechange (pc, state) {
    console.info(`${getName(pc)} signaling state change:, ${pc.signalingState}`)
}

async function onAddIceCandidateSuccess(pc,event) {
    // console.warn("event:",event)
    console.log(`${getOtherPc(pc)} addIceCandidate success`);
    if (event === null) {
        let sdp = pc.localDescription
        if(pc === pc1){
            /******弹框处理,显示本地pc1 sdp进行交换*****/
            localOffer.innerText = JSON.stringify(sdp)
            // await pc2.addIceCandidate(event.candidate);
        }else if(pc === pc2){
            /******弹框处理,显示本地pc2 sdp进行交换*****/
            localAnswer.innerText = JSON.stringify(sdp)
            // await pc1.addIceCandidate(event.candidate);
        }
    }
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

function getName(pc) {
    return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
    return (pc === pc1) ? pc2 : pc1;
}


function sendMessage () {
    let value = messageTextBox.value
    if(value){
         let channel = new RTCMultiSession()
        console.log("channel:",channel)
         channel.send({message: value})
        messageTextBox.value = ''
        // chatLog.scrollTo(0,chatLog.scrollHeight)
        // chatLog.scrollTop(chatLog.scrollHeight)
        // $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
    }
    // if ($('#messageTextBox').val()) {
    //     var channel = new RTCMultiSession()
    //     writeToChatLog($('#messageTextBox').val(), 'text-success')
    //     channel.send({message: $('#messageTextBox').val()})
    //     $('#messageTextBox').val('')
    //
    //     // Scroll chat text area to the bottom on new input.
    //     $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
    // }

    // return false
}


/***********************************对流进行处理*************************************************/
function streamMuteSwitch(data) {
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
                }
            } else {
                if (data.stream.getAudioTracks()[i].enabled === false) {
                    console.info('MuteStream exec unmute audio')
                    data.stream.getAudioTracks()[i].enabled = true
                }
            }
        }
    }
}

function handleReplaceElement(id){
    let video = document.getElementById(id)
    let audioPreview = document.createElement('audio');
    audioPreview.controls = true;
    audioPreview.autoplay = true;

    video.replaceWith(audioPreview);
    video = audioPreview;
    return video
}

/******************************************getStats**************************************************/
function LoGetStats(){
    if(pc1 || pc2){
        pc1.getStats(null)
            .then(showLocalStats, function(err) {
                console.log(err);
            });
        pc2.getStats(null)
            .then(showRemoteStats, function(err) {
                console.log(err);
            });
        if ( localVideo.videoWidth) {
            presentHtml.innerHTML = '<strong>Video dimensions:</strong> ' +
                localVideo.videoWidth + 'x' +  localVideo.videoHeight + 'px';
        }
        if (remoteVideo.videoWidth) {
            presentRemoteHtml.innerHTML = '<strong>Video dimensions:</strong> ' +
                remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight + 'px';
        }
    }
}

function ReGetStats(){
    if(pc1 || pc2){
        pc2.getStats(null)
            .then(showLocalStats, function(err) {
                console.log(err);
            });
        pc1.getStats(null)
            .then(showRemoteStats, function(err) {
                console.log(err);
            });
        if ( localVideo.videoWidth) {
            presentHtml.innerHTML = '<strong>Video dimensions:</strong> ' +
                localVideo.videoWidth + 'x' +  localVideo.videoHeight + 'px';
        }
        if (remoteVideo.videoWidth) {
            presentRemoteHtml.innerHTML = '<strong>Video dimensions:</strong> ' +
                remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight + 'px';
        }
    }
}
function showLocalStats(results) {
    results.forEach(function(report) {
        if(report.type === 'remote-inbound-rtp'){
           console.warn("local: remote-inbound-rtp:",report)
        }
        if (report.type === 'outbound-rtp' && (report.mediaType === 'video' ||report.mediaType === 'audio' )) {
            if(report.bytesSent){
                local_bytesSent.innerHTML = '<strong>bytesSent:</strong> ' + report.bytesSent;
            }
        }
    });
}

function showRemoteStats(results) {
    // calculate video bitrate
    results.forEach(function(report) {
        if(report.type === 'remote-inbound-rtp'){
            console.warn("Remote: remote-inbound-rtp:",report)
        }
        if (report.type === 'inbound-rtp' && (report.mediaType === 'video' ||report.mediaType === 'audio' )) {
            if(report.bytesReceived){
                remote_bytesSent.innerHTML = '<strong>bytesReceived:</strong> ' + report.bytesReceived;
            }
        }
    });
}

function handup(){
    console.warn("close peerConnection")
    pc1.close();
    pc2.close();
    if(pc1.localStream ){
       closeStream(pc1.localStream)
    }

    if(pc2.localStream){
        closeStream(pc2.stream)
    }

    if(pc1.remoteStream ){
        closeStream(pc1.remoteStream)
    }

    if(pc2.remoteStream){
        closeStream(pc2.remoteStream)
    }

    function closeStream(stream){
        let tracks = stream.getTracks()
        for (let track in tracks) {
            tracks[track].onended = null
            console.info('close stream')
            tracks[track].stop()
        }
    }

}


/********************************************选择设置和初始化处理***************************************************/
let mb= document.createElement('div');
let body = document.getElementsByTagName('body')[0];
let selectEncoding = document.getElementsByClassName("selectEncoding")[0]
let setSdp = document.getElementsByClassName("setSdp")[0]

var localVideo = document.getElementById('localVideo')
var remoteVideo = document.getElementById('remoteVideo')
var presentHtml = document.getElementById('presentHtml')
var local_bytesSent = document.getElementById('local_bytesSent')

var presentRemoteHtml = document.getElementById('presentRemoteHtml')
var remote_bytesSent = document.getElementById('remote_bytesSent')
window.onload = function(){
    console.log('页面刷新完成触发1111111111');
    setSdp.style.display = "none"
    let opus = localStorage.getItem('opus')
    let pcmu = localStorage.getItem('pcmu')
    if(opus === 'true' || pcmu === 'true'){
        selectEncoding.style.display= "none"
        setSdp.style.display = "block"
    }

    mb.className='mb';
    body.appendChild(mb);
}

window.onbeforeunload = function(){    // 处理页面刷新
    console.log('页面刷新之前触发');
    localStorage.setItem('opus', 'false')
    localStorage.setItem('pcmu', 'false')
}


window.onunload = function() {
    console.log('页面刷新完成触发');
}


function selectEncod(data){
    localStorage.setItem(data, 'true')
    selectEncoding.style.display= "none"
    setSdp.style.display = "block"
}
