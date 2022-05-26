
function getLocalSDP(sdp){
    let parsedSdp = SDPTools.parseSDP(sdp)
    trimCodec(parsedSdp)
    SDPTools.increaseSessionVersion(parsedSdp)
    // Set fingerprint/icePwd/iceUfrag to session level
    parsedSdp.fingerprint = parsedSdp.fingerprint || parsedSdp.media[0].fingerprint
    parsedSdp.icePwd = parsedSdp.icePwd || parsedSdp.media[0].icePwd
    parsedSdp.iceUfrag = parsedSdp.iceUfrag || parsedSdp.media[0].iceUfrag
    parsedSdp.setup = parsedSdp.setup || parsedSdp.media[0].setup

    if(localStorage.packetizationMode === 'true'){
        console.info('modified packetization-mode')
        trimPacketizationMode(parsedSdp)
    }

    sdp = SDPTools.writeSDP(parsedSdp)
    return sdp
}

/**
 * modified packetization-mode of m-section with mid='1'
 */
function trimPacketizationMode(parsedSdp){
    for (let i = 0; i < parsedSdp.media.length; i++) {
        let media = parsedSdp.media[i]
        delete media.fingerprint
        delete media.icePwd
        delete media.iceUfrag
        delete media.setup

        if(parseInt(media.mid) === 1){
            if(media.fmtp && media.fmtp.length){
                for(let j = 0; j<media.fmtp.length; j++){
                    if(media.fmtp[j].config.match('packetization-mode')){
                        media.fmtp[j].config = media.fmtp[j].config.replace(/packetization-mode=[0, 1]/g, 'packetization-mode=0')
                        console.warn("Set the packetization-mode=0 of the m-section with mid='1'")
                    }
                }
            }
        }
    }
}

function trimH264Codec(parsedSdp, index){
    let media = parsedSdp.media[index]
    let priorityCodec = this.getExternalEncoder(media)

    let h264Codec = SDPTools.getCodecByName(parsedSdp, index, ['H264'])
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

function getExternalEncoder(media){
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


/***************************************处理sdp的相关逻辑********************************************************/

/**
 * add useDTX
 * @param sdp
 * @param codec
 */
function addUsedtx(sdp, codec){
    let session = SDPTools.parseSDP(sdp)
    let payloads = []
    for(let i = 0; i < session.media.length; i++){
        let mediaSession = session.media[i]
        if(mediaSession.type === 'audio') {
            console.info(codec + ' codec enable usedtx')
            for (let j = 0; j < mediaSession.rtp.length; j++) {
                let rtp = mediaSession.rtp[j]
                if (rtp.codec === codec) {
                    payloads.push(rtp.payload)
                }
            }
            for (let index = 0; index < payloads.length; index++) {
                let pt = payloads[index]
                for (let item = 0; item < mediaSession.fmtp.length; item++) {
                    let fmtp = mediaSession.fmtp[item]
                    if (fmtp.payload === pt) {
                        if (fmtp.config === '') {
                            fmtp.config = 'usedtx=1'
                        } else {
                            if (fmtp.config.indexOf('usedtx=1') < 0) {
                                fmtp.config = fmtp.config + ';usedtx=1'
                            }
                        }
                    }
                }
            }
            break
        }
    }
    sdp = SDPTools.writeSDP(session)
    return sdp
}

/**
 * Set the media line of session level
 * @param sdp
 * @returns {string}
 */
function setSessionLevelMediaLine(sdp){
    // todo: Solve the problem of incorrect createOffer SDP caused by
    //  different packetization-mode settings for the same PT in different media lines
    sdp = SDPTools.removeInvalidCode(sdp)

    let parsedSdp = SDPTools.parseSDP(sdp)
    // Delete codes other than H624 and H264 only keep one
    trimCodec(parsedSdp)

    // set media level
    parsedSdp.fingerprint = parsedSdp.fingerprint || parsedSdp.media[0].fingerprint
    parsedSdp.icePwd = parsedSdp.icePwd || parsedSdp.media[0].icePwd
    parsedSdp.iceUfrag = parsedSdp.iceUfrag || parsedSdp.media[0].iceUfrag
    parsedSdp.setup = parsedSdp.setup || parsedSdp.media[0].setup
    let trickleIce = localStorage.getItem('trickle_ice')
    if(trickleIce === 'true'){
        parsedSdp.iceOptions = parsedSdp.iceOptions || parsedSdp.media[0].iceOptions
    }

    if(parsedSdp.media && parsedSdp.media.length && parsedSdp.media.length > 3){
        parsedSdp.groups[0].mids = ''
        for (let i = 0; i < parsedSdp.media.length; i++) {
            let media = parsedSdp.media[i]
            if(!parsedSdp.groups[0].mids){
                parsedSdp.groups[0].mids = parsedSdp.groups[0].mids + media.mid
            }else {
                parsedSdp.groups[0].mids = parsedSdp.groups[0].mids + ' ' + media.mid
            }

            // todo: (Firefox) When the port sent to UCM is 0, UCM will not send stream
            if(parseInt(media.port) === 0){
                media.port = 9
            }

            // delete session level
            delete media.iceOptions
            delete media.fingerprint
            delete media.icePwd
            delete media.iceUfrag
            delete media.setup
            delete media.ext
        }
        sdp = SDPTools.writeSDP(parsedSdp)
    }

    return sdp
}

/**
 * Remove redundant codes
 * @param parsedSdp
 */
function trimCodec(parsedSdp) {

    let attr = {
        setCodec: null,
        roCodec: null,
        roVideoResolution: null,
        roVideoFramerate: null
    }
    if (parsedSdp.media && parsedSdp.media.length) {
        for (let i = 0; i < parsedSdp.media.length; i++) {
            let media = parsedSdp.media[i]
            let codec = ['VP8', 'VP9']
            if (media.mid === 0) {
                codec = ['G722', 'opus', 'PCMU', 'PCMA', 'telephone-event'] // only keep ['G722', 'opus', 'PCMU', 'PCMA', 'telephone-event']
                SDPTools.removeCodecByName(parsedSdp, i, codec, true)
            } else {
                // move red_ulpfec
                if (localStorage.getItem('test_red_ulpfec_enabled') !== 'true') {
                    console.info('move red && ulpfec')
                    codec.push('red', 'ulpfec')
                }

                trimH264Codec(parsedSdp, i)
                SDPTools.removeCodecByName(parsedSdp, i, codec)
                if (media.mid === 1) {
                    if (attr.roCodec) {
                        console.info('remote codec ' + attr.roCodec)
                        SDPTools.removeCodecByName(parsedSdp, i, [attr.roCodec], true)
                        attr.roCodec = null
                    }
                    if (attr.setCodec) {
                        console.info('set codec ' + attr.setCodec)
                        SDPTools.removeCodecByName(parsedSdp, i, [attr.setCodec], true)
                        attr.setCodec = null
                    }
                }
            }
        }
    } else {
        console.warn('trimCodec error media: ' + parsedSdp.media)
    }
}
