
Record.prototype.preInit = function() {
    console.info('create new Record object');
    try {
        window.record = new Record({})
    }catch (e) {
        console.error(e.toString())
    }
}


 function Record(){
     console.warn("init record....")
     this.constraints = {audio:true, video: {width:640,height:360} }
     this.videoUpResolution = null  ;      // 当前主流上行分辨率

     // 录制内容
     this.mediaRecorder = null;
     this.recordedBlobs = null;
     this.currentRecoderType = null;
     this.isUploadVideo = false
     this.isMute = false

     this.localStreams = {
         audio: null,
         main: null,
         slides: null,
     }
    this.RESOLUTION = {
        VIDEO_DEFAULT:{ width: 640, height: 360 },
        VIDEO_CURRENT_UP: null, // 主流当前上行分辨率
        VIDEO_EXPECT_RECV: null, // 期望收到的下行分辨率
        SLIDES_CURRENT_UP: null,
    }

 }

Record.prototype.CODE_TYPE = {
    // 接口参数错误时的统一错误码
    PARAMETER_ERROR: 16,
    COMMON_ERROR: 17,

    // 业务错误码 100 - 199
    INCOMING_CALL_CANCELED: 101,  // 来电被取消
    COULD_NOT_ESTABLISH_NEW_CALL: 102,
    FAILED_TO_CALL: 103,
    UNSUPPORT_CALL_TYPE: 104,
    FAILED_TO_REGISTER: 105,
    REQUEST_RESPONSE_TIMEOUT: 106,

    // MIC业务错误码
    FAILED_TO_MUTE_MIC: 110,
    FAILED_TO_UNMUTE_MIC: 111,

    // 摄像头业务错误码
    FAILED_TO_ADJUST_RESOLUTION:113,
    FAILED_TO_VIDEO_ON: 114,
    CAMERA_NOT_SUPPORT: 115,
    SERVER_RESOURCE_REACHED_LIMIT: 116,
    FAILED_TO_CLOSE_LOCAL_VIDEO: 117,
    FAILED_TO_OPEN_LOCAL_VIDEO: 118,

    // 服务器错误码
    CODE_NOT_SUPPORT: 119,
    SERVER_CPU_LIMIT: 120,

    // 桌面共享错误码
    CANCEL_TO_SCREEN_SHARE: 121,
    FAILED_TO_SCREEN_SHARE: 122,
    SHARE_STREAM_STOPPED_BY_CONTROL_BAR: 124,
    FAILED_TO_STOP_SCREEN_SHARE: 125,
    FAILED_TO_SWITCH_SCREEN_STREAM: 127,
    FAILED_TO_SWITCH_CALL: 128,

    FAILED_TO_SEND_INFO: 133,
    FAILED_TO_SEND_MESSAGE: 134,
    FAILED_TO_HOLD: 135,
    FAILED_TO_RESUME: 136,

    // websocket重连
    WEBSOCKET_RECONNECTION_FAILED: 137,
    WEBSOCKET_CONNECTING: 138,
    WEBSOCKET_CLOSE: 139,

    // ICE 重连
    ICE_CONNECTION_FAILED: 151,
    ICE_RECONNECTING: 152,
    ICE_RECONNECTED_FAILED: 153,

    // 麦克风请求错误码
    MIC_NOT_FOUND: 932,                  // 没有找到可以设备
    MIC_NOT_READABLE: 933,               // 无法读取麦克风设备
    MIC_REQUEST_REFUSE: 941,            // 麦克风禁用
    MIC_REQUEST_FAIL: 942,              // 麦克风开启失败
    MIC_REQUEST_CLOSE: 943,
    MIC_TYPE_ERROR: 944,                 // 必须至少请求一个音频或视频

    // 摄像头请求错误码
    VIDEO_REQUEST_REFUSE: 945,           // 摄像头禁用
    VIDEO_REQUEST_OCCUPY: 946,
    VIDEO_REQUEST_BEYOND: 948,
    VIDEO_REQUEST_FAIL: 949,                // 摄像头开启失败
    VIDEO_NOT_FOUND: 950,                 // 没有找到可以设备
    VIDEO_TYPE_ERROR: 951,                // 必须至少请求一个音频或视频
    VIDEO_NOT_READABLE: 952,              // 无法读取摄像头设备
    VIDEO_REQUEST_OVER_CONSTRAINTS: 953,  // 取流约束超出设备限制能力

    // 共享桌面请求错误码
    SCREEN_NOT_READABLE: 954,
    SCREEN_REQUEST_REFUSE: 955,
    SCREEN_NOT_FOUND: 956,
    SCREEN_INVALID_STATE: 957,
    SCREEN_ABORT_ERROR: 958,
    SCREEN_TYPE_ERROR: 959,
    SCREEN_REQUEST_OVER_CONSTRAINTS: 960,

    // success code
    ACTION_SUCCESS: 999
}
