

## 一、关于MediaStreamTrack的Insertable streams
  1. MediaStreamTrack
     - 该接口主要是代表流的单媒体轨道，主要分为音频和视频轨道，也包括其他其他类型轨道；
     - `MediaStream`对象由零个或多个`MediaStreamTrack`对象组成，代表各类音频或视频轨道。
     - 每个MediaStreamTrack可以有一个或多个通道。通道是媒体流的最小单位。`比如与给定扬声器相关的音频信号，以及立体声音频轨道中的左声道或右声道`
     
  2. 什么是MediaStreamTrack的insertable stream？
     - MediaStreamTrac的insertable stream背后的核心思想是将MediaStreamTrack的内容作为（WHATWG Streams API所定义的）流集合公开。这些流经操作可以用于引入新的组件。
     - 授予开发者对视频（或音频）流的直接访问权，允许他们直接对流进行修改。相比之下，用传统方法实现同样的视频操作任务，需要开发者使用元素这样的中介。（关于上述过程的细节，请看示例[video + canvas = magic](https://html5doctor.com/video-canvas-magic/)）
     - 关于使用此场景不限于：[Insertable streams场景和案例](https://w3c.github.io/mediacapture-transform/)
        ```javascript
          （1）Funny Hats
          （2）Machine Learning
          （3）Virtual Reality Gaming
        
        ```     
     - 主要场景逻辑处理【案例】：
       ```javascript
        （1） Video Processing
        （2） Multi-source processing
        （3） Custom sink
       ```
       
  3. 关于使用 MediaStreamTrack的insertable stream的前提：（`在origin trial 阶段启用支持`）
     - 从Chrome 90开始，MediaStreamTrack的insertable stream就作为Chrome中WebCodecs origin trial的一部分可用了。
     - origin trial允许用户尝试新功能，并就其可用性、实用性和有效性向web标准社区提供反馈。欲了解更多信息，参见[Origin Trials Guide for Web Developers](https://github.com/GoogleChrome/OriginTrials/blob/gh-pages/developer-guide.md)。要报名参加这项或其他origin trial，请访问[注册页面](https://developers.chrome.com/origintrials/#/trials/active)。
     - 注册origin trial 
       - 给你的origin申请一个token。
       - 有两种方法可以把token添加到你自己的页面：
          - (1) 在每个页面上方添加一个 origin-trial 标签。例如：
             ```javascript
              <meta http-equiv="origin-trial" content="TOKEN_GOES_HERE">
             ```
          - (2) 如果配置自己的服务器，也可以使用Origin-Trial HTTP报文来添加token。由此产生的响应报文如下：
             ```javascript
              Origin-Trial: TOKEN_GOES_HERE
             ```   
             - **通过`chrome://flags ` 启用,要在本地试验MediaStreamTrack的insertable stream，不需要origin trial token，用户可以在chrome://flags中启用`enable-experimental-web-platform-features`标志,即设置为Enabled**。
                      
  4. <font color=blue>**验证浏览器版本是否支持MediaStreamTrack的insertable stream 的方法**</font>：
     ```javascript
        if ('MediaStreamTrackProcessor' in window && 'MediaStreamTrackGenerator' in window) {
        
        // Insertable streams for `MediaStreamTrack` is supported.
           console.warn("the browser is support")
        }else{
           console.warn("the browser is not support")
        }
     ```
     
  5. **以防Chrome版本的不稳定性，最好在 最新Chrome Canary 版本 进行验证**（`本人验证是chrome Canary95版本`）
     - [Chrome canary 版本](https://www.google.cn/intl/zh-CN/chrome/canary/) 
  -------
  
  
  ##  二、关于MediaStreamTrack的Insertable streams 的核心接口之 ==`MediaStreamTrackProcessor`== 
  
  1. **MediaStreamTrackProcessor**
     - 将MediaStreamTrack对象的流生成媒体帧流，主要是`VideoFrame`和`AudioFrame` [VideoFrame + AudioFrame](https://w3c.github.io/mediacapture-transform/)
     - 可以看成是轨道sink，并把轨道上未编码的帧作为ReadableStream公开。同时也为反方向的信号提供了一个控制通道。
  
  2. **MediaStreamTrackProcessor 属性**：(`Readable`、`writableControl`)
     - Readable (`可读`)
       - 允许从MediaStreamTrack中读取帧。如果该轨道是一个视频轨道，从readable读取的块会是是VideoFrame的对象。如果该轨道是音频轨道，从可读的块中读取的会是AudioFrame的对象
     - writableControl (`可写控制`)
       - 允许向轨道发送控制信号。控制信号是MediaStreamTrackSignal类型的对象。
  3. 案例(`单线程`)
      ```javascript
          const stream = await navigator.mediaDevices.getUserMedia({video:true});
          const videoTrack = stream.getVideoTracks()[0];
          const processor = new MediaStreamTrackProcessor({track: videoTrack});
          // const generator = new MediaStreamTrackGenerator({kind: 'video'});
          const transformer = new TransformStream({
             async transform(videoFrame, controller) {
                let facePosition = await detectFace(videoFrame);
                let newFrame = blurBackground(videoFrame, facePosition);
                videoFrame.close();
                controller.enqueue(newFrame);
            }
          });
          
          processor.readable.pipeThrough(transformer).pipeTo(generator.writable);
          const videoBefore = document.getElementById('video-before');
          const videoAfter = document.getElementById('video-after');
          videoBefore.srcObject = stream;
          const streamAfter = new MediaStream([generator]);
          videoAfter.srcObject = streamAfter;
      ```     
      
------------


##  三、关于MediaStreamTrack的Insertable streams 的核心接口之 ==`MediaStreamTrackGenerator`== 

  1. **MediaStreamTrackGenerator**
     - 消耗一个媒体帧流并开放一个MediaStreamTrack接口。
     - 类似getUserMedia()的接口及轨道，它可以被提供给任何sink，可以接受媒体帧输入。此外，它还提供访问由sink产生的控制信号的路径。
  
  2. **MediaStreamTrackProcessor 属性**：(`writable`、`readableControl`)
     - writable (`可写`)
       - WritableStream允许将媒体帧写入MediaStreamTrackGenerator，它本身就是一个MediaStreamTrack。如果kind属性是“audio”，流会接受AudioFrame对象，不接受任何其他类型的对象。如果是“video”，流接受VideoFrame对象，不接受任何其他类型的对象。当一个框架被写入writable时，框架的close()方法会被自动调用，这样就不再能从JavaScript中访问它的媒体源了
     - readableControl 
       - ReadableStream允许读取从任何连接到MediaStreamTrackGenerator的sink中发送的控制信号。控制信号是MediaStreamTrackSignal类型的对象。
  3. 案例(`多线程`) 
      ```javascript
        // main.js
        const stream = await navigator.mediaDevices.getUserMedia({audio:true, video:true});
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        const audioProcessor = new MediaStreamTrackProcessor({track: audioTrack});
        const videoProcessor = new MediaStreamTrackProcessor({track: videoTrack});
        const audioGenerator = new MediaStreamTrackGenerator({kind: 'audio'});
        const worker = new Worker('worker.js');
        worker.postMessage({
            audioReadable: audioProcessor.readable,
            videoReadable: videoProcessor.readable,
            audioWritable: audioGenerator.writable
          }, [
            audioProcessor.readable,
            videoProcessor.readable,
            audioGenerator.writable
          ]);
        
         // worker.js
        self.onmessage = async function(e) {
          const model = new AudioVideoModel();
          const audioTransformer = new TransformStream({
            async transform(audioData, controller) {
                const speechData = model.getSpeechData(audioData);
                audioData.close();
                controller.enqueue(speechData);
            }
          });
        
          const audioPromise = e.data.audioReadable
              .pipeThrough(audioTransformer)
              .pipeTo(e.data.audioWritable);
        
          const videoReader = e.data.videoReadable.getReader();
          const videoPromise = new Promise(async resolve => {
            while (true) {
              const result = await videoReader.read();
              if (result.done) {
                break;
              } else {
                model.updateVideo(result.value);
                result.value.close();
              }
            }
            resolve();
          }
        
          await Promise.all([audioPromise, videoPromise]);
          model.close();
        }
      ```  
  
  
  4. 区别：
     - 在MediaStream模型中，除了从源流向sink的媒体之外，还有反向流动的控制信号（即通过轨道从汇到源头）。
     - 一个MediaStreamTrackProcessor是一个sink，它允许通过其writableControl（可写控制）属性向其轨道和源发送控制信号。
     - MediaStreamTrackGenerator是一个轨道，可以通过向其writable可写字段写入媒体帧来实现自定义源。这样的源可以通过其readableControl（可读控制）属性接收sink发送的控制信号    
    
  -------  

## 四、相关案例

  1. [video processing demo](https://webrtc.github.io/samples/src/content/insertable-streams/video-processing/)和[audio processing demo](https://webrtc.github.io/samples/src/content/insertable-streams/audio-processing/)。你可以在[GitHub](https://github.com/webrtc/samples/tree/gh-pages/src/content/insertable-streams)上找到这两个演示的源代码。  
  2. [MediaStreamTrackProcessor](https://mganeko.github.io/videotrackreader_demo/mediastreamtrackprocessor.html#)
  
  3. [webrtc-insertable-stream-play](https://github.com/notedit/webrtc-insertable-stream-play)
  
  4. [webrtc-insertable-stream 解读](https://github.com/w3c/mediacapture-transform/blob/main/explainer.md)
  
  5. [Video made greyscale with canvas manipulation](https://html5doctor.com/demos/video-canvas-magic/demo2.html) + [HTML5 Video playing in Chrome](https://html5doctor.com/demos/video-canvas-magic/demo1.html)
  
  6. **本文章来自作者[Thomas Steiner 的解读](https://web.dev/mediastreamtrack-insertable-media-processing/)**
  