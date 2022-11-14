
let localPeerConnection,  remotePeerConnection;
let sendChannel,receiveChannel,fileReader;


const fileInput = document.querySelector('input#fileInput');
const sendFileButton = document.querySelector('button#sendFile');
const createButton = document.querySelector('button#create');
const abortButton = document.querySelector('button#abortButton');

const statusMessage = document.querySelector('span#status');
const bitrateDiv = document.querySelector('div#bitrate');
const downloadAnchor = document.querySelector('a#download');
const receiveProgress = document.querySelector('progress#receiveProgress');
const sendProgress = document.querySelector('progress#sendProgress');

let receiveBuffer = [];
let receivedSize = 0;

let bytesPrev = 0;
let timestampPrev = 0;
let timestampStart;
let statsInterval = null;
let bitrateMax = 0;

fileInput.addEventListener('change', handleFileInputChange, false);
abortButton.addEventListener('click', () => {
    if (fileReader && fileReader.readyState === 1) {
        console.log('Abort read!');
        fileReader.abort();
    }
});



function handleFileInputChange(){
    const file = fileInput.files[0];
    if (!file) {
        console.log('No file chosen');
    } else {
        sendFileButton.disabled = false;
    }
}

async function createPeerConnection(){
    abortButton.disabled = false
    sendFileButton.disabled = true
    localPeerConnection = new RTCPeerConnection()
    console.log("created local peerConnection  object")

    sendChannel = localPeerConnection.createDataChannel('sendDataChannel')
    sendChannel.binaryType = 'arraybuffer';
    console.log(" created send data channel")

    sendChannel.onopen = onSendChannelStateChange
    sendChannel.onclose = onSendChannelStateChange
    sendChannel.onerror = onError
    // sendChannel.addEventListener("open",onSendChannelStateChange);
    // sendChannel.addEventListener("close", onSendChannelStateChange);
    // sendChannel.addEventListener("error",onError)

    localPeerConnection.addEventListener('icecandidate',async event=>{
        console.log('local ice candidate:', event.candidate)
        await remotePeerConnection.addIceCandidate(event.candidate)
    })

    remotePeerConnection = new RTCPeerConnection()
    console.log("created remote peerConnection object")
    remotePeerConnection.addEventListener('icecandidate', async event => {
        console.log('Remote ICE candidate: ', event.candidate);
        await localPeerConnection.addIceCandidate(event.candidate);
    });
    // remotePeerConnection.addEventListener('datachannel', receiveChannelCallback);
    remotePeerConnection.ondatachannel = receiveChannelCallback

    try {
        const offer = await localPeerConnection.createOffer();
        console.info(`Offer setLocalDescription sdp: ` + ` \n${offer.sdp}`)
        await gotLocalDescription(offer);
    } catch (e) {
        console.log('Failed to create session description: ', e);
    }

    fileInput.disabled = true;
}
async function gotLocalDescription(desc) {
    await localPeerConnection.setLocalDescription(desc);
    console.log(`Offer from localConnection\n ${desc.sdp}`);
    await remotePeerConnection.setRemoteDescription(desc);
    try {
        const answer = await remotePeerConnection.createAnswer();
        await gotRemoteDescription(answer);
    } catch (e) {
        console.log('Failed to create session description: ', e);
    }
}

async function gotRemoteDescription(desc) {
    await remotePeerConnection.setLocalDescription(desc);
    console.log(`Answer from remoteConnection\n ${desc.sdp}`);
    await localPeerConnection.setRemoteDescription(desc);
}
function onSendChannelStateChange(){
    if( sendChannel== null || sendChannel === undefined){
        return
    }
    console.log("sendChannel:"+ + JSON.stringify(sendChannel, null, '    '))

    let {readyState} = sendChannel
    console.log(`Send channel state is: ${readyState}`);
    if(readyState === 'open'){
        sendData()
    }else if(readyState ==='close'){
        console.log("dataChannel is close")
    }
}

function onError(error) {
    if (sendChannel) {
        console.error('Error in sendChannel:', error);
        return;
    }
    console.log('Error in sendChannel which is already closed:', error);
}

function sendData(){
    let file = fileInput.files[0]
    console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);

    // Handle 0 size files.
    statusMessage.textContent = '';
    downloadAnchor.textContent = '';
    if (file.size === 0) {
        bitrateDiv.innerHTML = '';
        statusMessage.textContent = 'File is empty, please select a non-empty file';
        closeDataChannels();
        return;
    }
    sendProgress.max = file.size;
    receiveProgress.max = file.size;
    const chunkSize = 16384;
    fileReader = new FileReader();
    let offset = 0;
    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', e => {
        console.log('FileRead.onload ', e);
        sendChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        sendProgress.value = offset;
        if (offset < file.size) {
            readSlice(offset);
        }
    });
    const readSlice = o => {
        console.log('readSlice ', o);
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
}

function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.binaryType = 'arraybuffer';
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;

    receivedSize = 0;
    bitrateMax = 0;
    downloadAnchor.textContent = '';
    downloadAnchor.removeAttribute('download');
    if (downloadAnchor.href) {
        URL.revokeObjectURL(downloadAnchor.href);
        downloadAnchor.removeAttribute('href');
    }
}

function onReceiveMessageCallback(event) {
    console.log(`Received Message ${event.data.byteLength}`);
    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;
    receiveProgress.value = receivedSize;

    // we are assuming that our signaling protocol told
    // about the expected file size (and name, hash, etc).
    const file = fileInput.files[0];
    if (receivedSize === file.size) {
        const received = new Blob(receiveBuffer);
        receiveBuffer = [];

        downloadAnchor.href = URL.createObjectURL(received);
        downloadAnchor.download = file.name;
        downloadAnchor.textContent =
            `Click to download '${file.name}' (${file.size} bytes)`;
        downloadAnchor.style.display = 'block';

        const bitrate = Math.round(receivedSize * 8 /
            ((new Date()).getTime() - timestampStart));
        bitrateDiv.innerHTML =
            `<strong>Average Bitrate:</strong> ${bitrate} kbits/sec (max: ${bitrateMax} kbits/sec)`;

        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }

        createButton.disabled = false
        fileInput.disabled = false;
        // closeDataChannels();
    }
}

async function onReceiveChannelStateChange() {
    if(receiveChannel === null || receiveChannel === undefined){
        return
    }
    if (receiveChannel) {
        const readyState = receiveChannel.readyState;
        console.log(`Receive channel state is: ${readyState}`);
        if (readyState === 'open') {
            timestampStart = (new Date()).getTime();
            timestampPrev = timestampStart;
            statsInterval = setInterval(displayStats, 500);
            await displayStats();
        }
    }
}

// display bitrate statistics.
async function displayStats() {
    if (remotePeerConnection && remotePeerConnection.iceConnectionState === 'connected') {
        const stats = await remotePeerConnection.getStats();
        let activeCandidatePair;
        stats.forEach(report => {
            if (report.type === 'transport') {
                activeCandidatePair = stats.get(report.selectedCandidatePairId);
            }
        });
        if (activeCandidatePair) {
            if (timestampPrev === activeCandidatePair.timestamp) {
                return;
            }
            // calculate current bitrate
            const bytesNow = activeCandidatePair.bytesReceived;
            const bitrate = Math.round((bytesNow - bytesPrev) * 8 /
                (activeCandidatePair.timestamp - timestampPrev));
            bitrateDiv.innerHTML = `<strong>Current Bitrate:</strong> ${bitrate} kbits/sec`;
            timestampPrev = activeCandidatePair.timestamp;
            bytesPrev = bytesNow;
            if (bitrate > bitrateMax) {
                bitrateMax = bitrate;
            }
        }
    }
}

function closeDataChannels() {
    console.log('Closing data channels');
    sendChannel.close();
    console.log(`Closed data channel with label: ${sendChannel.label}`);
    sendChannel = null;
    if (receiveChannel) {
        receiveChannel.close();
        console.log(`Closed data channel with label: ${receiveChannel.label}`);
        receiveChannel = null;
    }
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    if(peerArray && peerArray.length){
        peerArray.forEach(function (pc){
            pc.close()
            pc = null
        })
    }
    console.log('Closed peer connections');

    // re-enable the file select
    fileInput.disabled = false;
    abortButton.disabled = true;
    sendFileButton.disabled = true;
    createButton.disabled = true
}