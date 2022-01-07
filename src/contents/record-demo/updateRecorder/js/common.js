Record.prototype.getBrowserDetail = function () {
    function extractVersion (uastring, expr, pos) {
        let match = uastring.match(expr)
        return match && match.length >= pos && parseInt(match[pos], 10)
    }

    var navigator = window && window.navigator

    // Returned result object.
    var result = {}
    result.browser = null
    result.version = null
    result.UIVersion = null
    result.chromeVersion = null
    result.systemFriendlyName = null

    if(navigator.userAgent.match(/Windows/)){
        result.systemFriendlyName = 'windows'
    }else if(navigator.userAgent.match(/Mac/)){
        result.systemFriendlyName = 'mac'
    }else if(navigator.userAgent.match(/Linux/)){
        result.systemFriendlyName = 'linux'
    }

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.'
        return result
    }

    // Edge.
    if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        result.browser = 'edge'
        result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2)
        result.UIVersion = navigator.userAgent.match(/Edge\/([\d.]+)/)[1] // Edge/16.17017
    } else if (!navigator.mediaDevices && (!!window.ActiveXObject || 'ActiveXObject' in window || navigator.userAgent.match(/MSIE (\d+)/) || navigator.userAgent.match(/rv:(\d+)/))) {
        // IE
        result.browser = 'ie'
        if (navigator.userAgent.match(/MSIE (\d+)/)) {
            result.version = extractVersion(navigator.userAgent, /MSIE (\d+).(\d+)/, 1)
            result.UIVersion = navigator.userAgent.match(/MSIE ([\d.]+)/)[1] // MSIE 10.6
        } else if (navigator.userAgent.match(/rv:(\d+)/)) {
            /* For IE 11 */
            result.version = extractVersion(navigator.userAgent, /rv:(\d+).(\d+)/, 1)
            result.UIVersion = navigator.userAgent.match(/rv:([\d.]+)/)[1] // rv:11.0
        }

        // Firefox.
    } else if (navigator.mozGetUserMedia) {
        result.browser = 'firefox'
        result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1)
        result.UIVersion = navigator.userAgent.match(/Firefox\/([\d.]+)/)[1] // Firefox/56.0

        // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
        // Chrome, Chromium, Webview, Opera, Vivaldi all use the chrome shim for now
        var isOpera = !!navigator.userAgent.match(/(OPR|Opera).([\d.]+)/)
        // var isVivaldi = navigator.userAgent.match(/(Vivaldi).([\d.]+)/) ? true : false;
        if (isOpera) {
            result.browser = 'opera'
            result.version = extractVersion(navigator.userAgent, /O(PR|pera)\/(\d+)\./, 2)
            result.UIVersion = navigator.userAgent.match(/O(PR|pera)\/([\d.]+)/)[2] // OPR/48.0.2685.39
            if (navigator.userAgent.match(/Chrom(e|ium)\/([\d.]+)/)[2]) {
                result.chromeVersion = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2)
            }
        } else {
            result.browser = 'chrome'
            result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2)
            result.UIVersion = navigator.userAgent.match(/Chrom(e|ium)\/([\d.]+)/)[2] // Chrome/61.0.3163.100
        }
    } else if ((!navigator.webkitGetUserMedia && navigator.userAgent.match(/AppleWebKit\/([0-9]+)\./)) || (navigator.webkitGetUserMedia && !navigator.webkitRTCPeerConnection)) {
        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
            result.browser = 'safari'
            result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1)
            result.UIVersion = navigator.userAgent.match(/Version\/([\d.]+)/)[1] // Version/11.0.1
        } else { // unknown webkit-based browser.
            result.browser = 'Unsupported webkit-based browser ' + 'with GUM support but no WebRTC support.'
            return result
        }
        // Default fallthrough: not supported.
    } else {
        result.browser = 'Not a supported browser.'
        return result
    }

    return result
}

/**
 * 判断共享桌面时是否支持共享音频
 * */
Record.prototype.isSystemAudioShareSupport = function () {
    let result = false
    let browserDetail = this.getBrowserDetail()
    if ((browserDetail.browser === 'chrome' && navigator.userAgent.indexOf('Edg') > 0 && browserDetail.version >= 79) || // chrome 内核Edge
        (browserDetail.browser === 'chrome' && navigator.userAgent.indexOf('Edg') < 0 && browserDetail.version >= 74) ||
        (browserDetail.browser === 'opera' && browserDetail.version >= 74)) {
        result = true
    }
    return result
}


Record.prototype.setVideoUpResolution = function (constraints) {
    if (!constraints || !constraints.video || !constraints.video.height || !constraints.video.width) {
        return
    }

    this.RESOLUTION.VIDEO_CURRENT_UP = {
        width: constraints.video.width.exact || constraints.video.width.ideal || constraints.video.width.max || constraints.video.width,
        height: constraints.video.height.exact || constraints.video.height.ideal || constraints.video.height.max || constraints.video.height
    }
    console.info('set video up resolution: ' + this.RESOLUTION.VIDEO_CURRENT_UP.width + '*' + this.RESOLUTION.VIDEO_CURRENT_UP.height)
}


Record.prototype.mixingStream = function (stream1, stream2) {
    console.info('mixing audio stream')
    // 混音参数
    let context
    window.AudioContext = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)
    if (window.AudioContext) {
        context = new window.AudioContext()
    } else {
        console.error('not support web audio api')
    }

    // 混音
    let destinationParticipant1 = context.createMediaStreamDestination()
    if (stream1) {
        let source1 = context.createMediaStreamSource(stream1)
        source1.connect(destinationParticipant1)
    }
    if (stream2) {
        let source2 = context.createMediaStreamSource(stream2)
        source2.connect(destinationParticipant1)
    }

    return destinationParticipant1.stream
}


Record.prototype.enumDevices = function (deviceInfoCallback) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("browser don't support enumerateDevices() .")
        return
    }

    function getDeviceInfos (deviceInfos){
        var microphone = []
        var speaker = []
        var camera = []
        var screenResolution = []
        var isConstraintsKeywordSupport = true
        for (var i = 0; i < deviceInfos.length; i++) {
            var deviceInfo = deviceInfos[i]
            if (deviceInfo.deviceId === 'default' || deviceInfo.deviceId === 'communications') {
                continue
            }
            if (deviceInfo.kind === 'audioinput') {
                microphone.push({
                    label: deviceInfo.label,
                    deviceId: deviceInfo.deviceId,
                    groupId: deviceInfo.groupId,
                    status: 'available'
                })
            }
            if (deviceInfo.kind === 'audiooutput') {
                speaker.push({
                    label: deviceInfo.label,
                    deviceId: deviceInfo.deviceId,
                    groupId: deviceInfo.groupId,
                    status: 'available'
                })
            }
            if (deviceInfo.kind === 'videoinput') {
                camera.push({
                    label: deviceInfo.label,
                    deviceId: deviceInfo.deviceId,
                    groupId: deviceInfo.groupId,
                    status: 'available',
                    capability: []
                })
            }
        }

        // screenResolution.push({
        //     width: window.screen.width,
        //     height: window.screen.height
        // })

        let getDeviceds = {
            microphones: microphone,
            speakers: speaker,
            cameras: camera,
            // screenResolution: screenResolution,
            // isConstraintsKeywordSupport: isConstraintsKeywordSupport
        }
        if (deviceInfoCallback) {
            console.warn(" getDeviceds:", getDeviceds)
            deviceInfoCallback && deviceInfoCallback.callback(getDeviceds)
        } else {
            return {
                microphones: microphone,
                speakers: speaker,
                cameras: camera,
                // screenResolution: screenResolution,
                // isConstraintsKeywordSupport: isConstraintsKeywordSupport
            }
        }
    }

    function getDeviceInfosFailed(err){
        console.error(err)
        deviceInfoCallback && deviceInfoCallback.callback(err)
    }

    navigator.mediaDevices.enumerateDevices().then(getDeviceInfos).catch(getDeviceInfosFailed)
}
