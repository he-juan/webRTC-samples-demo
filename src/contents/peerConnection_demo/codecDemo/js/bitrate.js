
/**
 * 设置带宽和优先编码
 * @param sdp
 * @param media
 * @param TIASBitrate
 * @param CodecName
 * @returns {string}
 */
function setMediaBitrateAndCodecPriority(sdp, media,TIASBitrate, CodecName) {
    var lines = sdp.split("\n");
    var line = -1;
    var newLinesForBitrate;
    var newLinesForStartBitrate;
    var PTnumber;
    var codecsReorder;
    var codecs = [];
    var priorityCodecs = [];  // An encoder may have multiple PT values
    var serverUsedCode = [];
    var count = 0;
    var ASBitrate = (TIASBitrate / 1000) + 192
    CodecName = 'H264'

    for(var i = 0; i < lines.length; i++){
        if(lines[i].indexOf("m="+media) >= 0) {
            line = i;
            line++;
            while (lines[line].indexOf("i=") >= 0 || lines[line].indexOf("c=") >= 0) {
                line++;
            }
            if (lines[line].indexOf("b=") >= 0) {
                lines[line] = "b=AS:" + ASBitrate + "\r\nb=TIAS:" + TIASBitrate;
                return lines.join("\n");
            }

            newLinesForBitrate = lines.slice(0, line);
            newLinesForBitrate.push("b=AS:" + ASBitrate + "\r\nb=TIAS:" + TIASBitrate);
            newLinesForBitrate = newLinesForBitrate.concat(lines.slice(line, lines.length));
            break;
        }
    }

    for(var j = line; j < lines.length; j++){
        if(lines[j].indexOf("a=rtpmap") >= 0) {
            line = j;
            line++;
            if (lines[j].indexOf("VP8") >= 0) {
                PTnumber = lines[j].substr(9, 3);
                line++;
                newLinesForStartBitrate = newLinesForBitrate.slice(0, line);
                newLinesForStartBitrate.push("a=fmtp:" + PTnumber + " x-google-start-bitrate=" + ASBitrate);
                newLinesForBitrate = newLinesForStartBitrate.concat(
                    newLinesForBitrate.slice(line, newLinesForBitrate.length)
                );
                count++;

                // Use the slide_video_in Codec , only for chrome
                // Currently unable to get the codec type used by firefox
                if(CodecName !== ""){
                    CodecName === "VP8"?serverUsedCode.push(PTnumber):priorityCodecs.push(PTnumber);
                }
            }
            else if (lines[j].indexOf("H264") >= 0) {
                PTnumber = lines[j].substr(9, 3);
                line++;
                line = line + count;
                newLinesForStartBitrate = newLinesForBitrate.slice(0, line);
                newLinesForStartBitrate.push("a=fmtp:" + PTnumber + " x-google-start-bitrate=" + ASBitrate);
                newLinesForBitrate = newLinesForStartBitrate.concat(
                    newLinesForBitrate.slice(line, newLinesForBitrate.length)
                );
                count++;

                // Use the slide_video_in Codec , only for chrome
                // Currently unable to get the codec type used by firefox
                if(CodecName !== "" ){
                    CodecName === "H264"?serverUsedCode.push(PTnumber):priorityCodecs.push(PTnumber);
                }
            }
            else {
                codecs.push(lines[j].substr(9, 3));
            }
        }
    }

    if(CodecName !== "" && media === "video"){
        var mLineRegex = /^m=video\s[0-9]{1,}\s\w{3,5}(\/\w{3,5})*?\s/;
        codecsReorder = serverUsedCode.concat(priorityCodecs.concat(codecs)).join(" ").replace(/\s+/g, " ");
        for(var k = 0; k < newLinesForBitrate.length; k++){
            if(newLinesForBitrate[k].indexOf("m="+media) === 0) {
                newLinesForBitrate[k] = newLinesForBitrate[k].match(mLineRegex)[0] + codecsReorder;
            }
        }
    }
    console.warn("codecs:",codecs)
    console.warn("priorityCodecs:",priorityCodecs)
    console.warn("serverUsedCode:",serverUsedCode)
    newLinesForBitrate = trimH264Codec(newLinesForBitrate)
    return newLinesForBitrate.join("\n");
}

function setMediaBitrateAndCodecPrioritys(sdp, CodecName) {
    return setMediaBitrateAndCodecPriority(sdp, "video", 8000000)
}

var profileIdc = document.getElementById('profileIdc').value;
var profileIop = document.getElementById('profileIop').value;
var packetizationMode = document.getElementById('packetizationMode').value;
/**
 * 处理H264编码
 */
function trimH264Codec(lines) {
    if(profileIdc && profileIop && packetizationMode){
        var levelIdReplacement = 'profile-level-id=' + profileIdc + profileIop;
        var modeReplacement = 'packetization-mode=' + packetizationMode;
        console.warn("levelIdReplacement: ", levelIdReplacement)
        console.warn("modeReplacement： ", modeReplacement)

        for(var i = 0; i<lines.length; i++){
            if(lines[i].indexOf('profile-level-id=') >= 0){
                lines[i] = lines[i].replace(/profile-level-id=([a-zA-Z0-9]{4})/, levelIdReplacement);
                lines[i] = lines[i] + ';max-mbps=40800;max-fs=8160;x-google-start-bitrate=2000;x-google-min-bitrate=100;x-google-max-bitrate=8000'
            }

            if(lines[i].indexOf('packetization-mode=' >= 0)){
                lines[i] = lines[i].replace(/packetization-mode=([a-zA-Z0-9]{1})/, modeReplacement);
            }
        }
    }

    return lines
}

/**
 * 设置上行编码码率参数
 */
function setEncodingParameters(pc) {
    var sender = pc.getSenders()[0]
    var videoParameters = sender.getParameters();
    if (JSON.stringify(videoParameters) === '{}') {
        videoParameters.encodings = []
        videoParameters.encodings[0] = {}
    }

    videoParameters.encodings[0].maxBitrate = 1500000
    // videoParameters.encodings[0].degradationPreference = 'maintain-framerate';   // for firefox
    videoParameters.degradationPreference = 'maintain-framerate';
    // videoParameters.degradationPreference = 'maintain-resolution';
    // videoParameters.encodings[0].scaleResolutionDownBy = 2

    // console.info("set encoding maxBitrate: " +  videoParameters.encodings[0].maxBitrate)
    console.info("set encoding degradationPreference: " +  JSON.stringify(videoParameters, null, '   '))
    sender.setParameters(videoParameters).then(function () {
    }).catch(function (error) {
        console.info('set encoding parameters error')
        console.error(error)
    })
}

function handleCodec(sdp, param){
    let codec = []
    let deleteCodec = []
    param = param && param.trim() && param.split(',')
    console.warn("param:",param)
    if(param.length){
        for(let i = 0; i < param.length; i++){
            let content = param[i]
            deleteCodec.push(content)
            codec.push(content)
        }
    }

    let parsedSdp = SDPTools.parseSDP(sdp)
    if (parsedSdp.media && parsedSdp.media.length) {
        for (let i = 0; i < parsedSdp.media.length; i++) {
            let media = parsedSdp.media[i]
            if (media.type === 'video'){
                // move red_ulpfec
                // let codec = ['VP8','VP9']
                if (localStorage.getItem('redulpfecEnabled') !== 'true') {
                    console.info('move red && ulpfec')
                    codec.push('red', 'ulpfec')
                }

                // trimCodec(parsedSdp, i, deleteCodec)
                SDPTools.removeCodecByName(parsedSdp, i, codec)
            }
        }
    } else {
        console.warn('trimCodec error media: ' + parsedSdp.media)
    }
    sdp = SDPTools.writeSDP(parsedSdp)
    return sdp
}

async function trimCodec (parsedSdp, index, deleteCodec) {
    console.warn("deleteCcodec:",deleteCodec)

    /** 处理codec **/
    let getArrDifference = (arr1, arr2) => {
        let userCodec = []
        for(let i = 0 ; i < arr1.length; i++){
            let arr = arr1[i].toLowerCase()
            for(let j= 0; j < arr2.length; j ++){
                let next = arr2[j].toLowerCase()
                if(arr === next){
                    userCodec.push(next)
                }
            }
        }
        return Array.from(new Set(userCodec));
    };
    let knowCodec = ['VP8','VP9','H264','AV1']
    let useCodec = await getArrDifference(knowCodec, deleteCodec)
    console.warn("useCodec:",useCodec)

    /*** 处理sdp **/
    let media = parsedSdp.media[index]
    let priorityCodec = await getExternalEncoder(media)
    let h264Codec = await SDPTools.getCodecByName(parsedSdp, index, useCodec)
    console.warn("h264Codec:",h264Codec)
    if (h264Codec && h264Codec.length) {
        let removeList = []
        if (!priorityCodec) {
            let topPriorityCodec = h264Codec.splice(1, h264Codec.length)
            removeList.push(topPriorityCodec)

            // If profile-level-id does not exist, set to 42e028
            for (let i = 0; i < media.fmtp.length; i++) {
                if (media.fmtp[i].payload === topPriorityCodec) {
                    let config = media.fmtp[i].config
                    if (config.indexOf('profile-level-id') < 0) {
                        config = config + ';profile-level-id=42e028'
                    }
                }
            }
        } else {
            h264Codec.forEach(function (pt) {
                if (pt !== priorityCodec) {
                    removeList.push(pt)
                }
            })
        }
        SDPTools.removeCodecByPayload(parsedSdp, index, removeList)
    }
}

 function getExternalEncoder(media) {
    let codec
    if (media && media.fmtp && media.fmtp.length) {
        for (let i = 0; i < media.fmtp.length; i++) {
            let config = media.fmtp[i].config
            if (config.indexOf('packetization-mode=1') >= 0 && config.indexOf('profile-level-id=42e0') >= 0) {
                codec = media.fmtp[i].payload
                break
            }
        }
        if (!codec) {
            for (let i = 0; i < media.fmtp.length; i++) {
                let config = media.fmtp[i].config
                if (config.indexOf('packetization-mode=1') >= 0 && config.indexOf('profile-level-id=4200') >= 0) {
                    codec = media.fmtp[i].payload
                    break
                }
            }
        }
    }

    return codec
}
