# recorder
  - 本demo录制类型总共分为三种，分别为`区域录制类型、混合录制类型和音频录制类型`
  - demo 地址：[录制demo](https://he-juan.github.io/RecordVideo/recordProgram/index.html)

-----
# 录制内容功能主要有： 
  - 开启视频、开启共享、上传视频 以及音频;
   
  - 类型说明：
      -  区域录制主要是指对录制内容进行区域选择，从而进行录制；`此录制内容是对每个功能进行单独处理（这里指视频、屏幕 和上传视频是分开的）`
      -  混合录制是指可以对屏幕共享和视频以及音频同时进行录制，也可以分开录制。上传视频是单独录制
      -  音频录制只进行音频录制的功能，相对比较简单；
  - 功能说明：
      - 录制中都添加了输入文字的功能
      - 上传视频录制添加声音录制功能； 
      - 添加静音和非静音功能；
      - 添加切换摄像头和切换麦克风处理；   
      - 添加混音录制功能
      - 添加gif动图功能
   
  -------
  
# 难点：
  1. 区域录制：
     - 主要是截取区域后在canvas上绘制的像素存在问题；这边主要是根据真正的像素去处理的；
 
  2. 混合录制：
     - 主要是两个屏幕的摆放位置问题以及开启视频和开启摄像头来回切换的逻辑处理流程； 
     - 主要是如何对获取到的流放到固定的canvas中且像素保持不变或者画质清晰   
       
  3. 关于录制中采用captureStream获取画面存在的问题：
     - 场景： 录制整个windows发现，切换不同的页面或者应用不能录制成功，只能显示在当前页面；
     - 解决方案： 通过getDisplayMedia获取到流放在video中，对video转化为canvas时需要ontimeupdate 事件处理

```javascript
        virtualVideo.ontimeupdate = function(){
            playCanvas(virtualVideo, shareCanvas, ctx, sx, sy, rangeW, rangeH, canvasX, canvasY, text);
        }
```     
 
 -------------
 
 # 参考：
  1. gif：https://github.com/imgss/gif_rain_code
  2. gif：http://jnordberg.github.io/gif.js/
  3. gif: https://npmmirror.com/package/gif.jsify
  4. gif: https://yahoo.github.io/gifshot/demo.html
  
 -------------
 
 # demo
  1. demo地址：[demo 录屏大小](https://he-juan.github.io/RecordVideo/getPosition/demo_record.html) 
  2. demo地址：[demo 截图](https://he-juan.github.io/RecordVideo/getPosition/demo4.html)  
  3. demo地址：[demo 图片获取颜色](https://he-juan.github.io/RecordVideo/getPosition/demo5.html)
  4. demo地址：[demo 截取视频图片](https://he-juan.github.io/RecordVideo/webReal/videoScreenshots/vss.html)
  5. demo地址：[webrtc-demo](https://www.webrtc-experiment.com/RecordRTC/simple-demos/)
  6. 扫描分辨率官方demo地址：[resolution-demo](https://udta.github.io/WCRS/)
  7. 关于官方录制demo： [不同场景下录制demo](https://www.webrtc-experiment.com/)和[30+ Simple Demos using RecordRTC](https://www.webrtc-experiment.com/RecordRTC/simple-demos/)