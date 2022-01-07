本笔记主要来源于[Video processing with WebCodecs](https://web.dev/webcodecs/#demo)


## 一、 体验流程
  1. 在 Chrome >= 86 的版本进行体验
      - Chrome地址栏输入：`**chrome://flags/#enable-experimental-web-platform-features**`，设置成 Enabled(`本人是chrome Canary 95版本验证`)
      - 以上设置后，点击**【relaunch】** 重新打开浏览器
  2. 浏览器验证是否支持：
        ```javascript
        // 通过 VideoEncoder API 检查当前浏览器是否支持
        if ('VideoEncoder' in window) {
          // 支持 WebCodecs API
           console.warn("the browser is support")
        }else{
            console.warn("the browser is not support")
        }
        ```  
  3. 关于webCodecs的出处
     - w3c： https://www.w3.org/TR/webcodecs/#configurations
     - github：https://github.com/w3c/webcodecs   
  ------------
     
 ## 二、Web 编解码器 API 的出现
  
   1. 原因
      - [ Media Stream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API) 、[Media Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API)  、 [Media Source API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) 、[WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)   
      - 以上接口上都不是提供一些底层 API 给到 Web 开发者进行帧操作或者对已经编码的视频进行解封装操作。 
      - 即出现了[WebCodecs API](https://w3c.github.io/webcodecs/)，暴露媒体 API 来使用浏览器已经有的一些能力;
   2. 各API接口
        ```javascript
           Video and audio decoders  //视频和音频解码
           Video and audio encoders  // 视频和音频编码
           Raw video frames    // 原始视频帧
           Image decoders    //图像解码器      
        ```   
   3. 视频处理工作流程
      -  目前在 WebCodecs 中，在页面上显示框架的唯一方法是将其转换为[ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap)并在画布上绘制位图或将其转换为[WebGLTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture).
         
         > 帧是视频处理的核心。因此，在 WebCodec 中，大多数类要么使用帧，要么生成帧。视频编码器将帧转换为编码块。视频解码器则相反。轨道阅读器将视频轨道转换为帧序列。按照设计，所有这些转换都是异步发生的。WebCodecs API 试图通过将视频处理的繁重工作从主线程中分离出来来保持 Web 响应。
      
     
        
 ##  三、WebCodecs 应用之**Encoding**
   1. 将图片转换成VideoFrame（`两种方式`）
      - 方法一：通过 `ImageBitmap` 创建 frame框架， 然后调用 VideoFrame() 构造函数并为其提供位图和演示时间戳即可
      - 方法二：通过 VideoTrackReader 设置方法来处理从 [MediaStreamTrack](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack) 产生的 frame，若需要从摄像机或屏幕捕获视频流时，即此 API 可用；
   2. **ImageBitmap方法模型**   
       - 图片
       - 调用`VideoFrame`的代码流程
        ```javascript
        let cnv = document.createElement('canvas');
        // draw something on the canvas
        …
        let bitmap = await createImageBitmap(cnv);
        let frame_from_bitmap = new VideoFrame(bitmap, { timestamp: 0 });
        ```
   3. **VideoTrackReader方法模型**    
      - 图片
      - 调用`VideoTrackReader`的相关流程
        ```javascript
        let frames_from_stream = [];
        let stream = await navigator.mediaDevices.getUserMedia({ … });
        let vtr = new VideoTrackReader(stream.getVideoTracks()[0]);
        vtr.start((frame) => {
          frames_from_stream.push(frame);
        });
        ```
      - <font color=red>注意：No matter where they are coming from, frames can be encoded into EncodedVideoChunk objects with a VideoEncoder. </font> 
   4. 在编码之前，VideoEncoder 需要被赋予两个 JavaScript 对象
      - Init dictionary with two functions for `handling encoded chunks and errors`. **These functions are developer-defined and can't be changed after they're passed to the VideoEncoder constructor.**
      - Encoder configuration object, which contains parameters for the output video stream. **You can change these parameters later by calling `configure()`**.
        ```javascript
        const init = {
          output: handleChunk,
          error: (e) => {
            console.log(e.message);
          }
        };
        
        let config = {
          codec: 'vp8',
          width: 640,
          height: 480,
          bitrate: 8_000_000, // 8 Mbps
          framerate: 30,
        };
        
        let encoder = new VideoEncoder(init);
        encoder.configure(config);
        
        ```   
      - 设置好 encoder 后，可以接受 frames 了，当开始从 media stream 接受 frames 的时候，传递给 `VideoTrackReader.start()` 的 callback 就会被执行，把 frame 传递给 `encoder`，需要定时检查 frame 防止过多的 frames 导致处理问题。注意：encoder.configure() 和 encoder.encode() 会立即返回，不会等待真正处理完成。如果处理完成 output()方法会被调用，入参是 encoded chunk。再注意：encoer.encode() 会消耗掉 frame，如果 frame 需要后面使用，需要调用 clone 来复制它
        ```javascript
        let frameCounter = 0;
        let pendingOutputs = 0;
        const vtr = new VideoTrackReader(stream.getVideoTracks()[0]);
        
        vtr.start((frame) => {
          if (pendingOutputs > 30) {
            // 有太多帧正在处理中，编码器承受不过来，不添加新的处理帧了
            return;
          }
          frameCounter++;
          pendingOutputs++;
          const insert_keyframe = frameCounter % 150 === 0;
          encoder.encode(frame, { keyFrame: insert_keyframe });
        });
        
        ```      
      - 最后就是完成 handleChunk 方法，通常，此功能是通过网络发送数据块或将它们封装到到媒体容器中  
        ```javascript
        function handleChunk(chunk) {
          let data = new Uint8Array(chunk.data);  // actual bytes of encoded data
          let timestamp = chunk.timestamp;        // media time in microseconds
          let is_key = chunk.type == 'key';       // can also be 'delta'
          pending_outputs--;
          fetch(`/upload_chunk?timestamp=${timestamp}&type=${chunk.type}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: data
          });
        }
        
        ```
      - 有时候需要确保所有 pending 的 encoding 请求完成，调用 `flush()  `
            
 ## 四、WebCodecs 应用之**Decoding**
 
    设置 VideoDecoder 类似于为 VideoEncoder 所做的：创建解码器时传递两个函数，并将编解码器参数提供给 configure()。 编解码器参数集可能因编解码器而异，例如，对于 H264，您当前需要使用 AVCC 额外数据指定二进制 blob。 
   1. 模型
     - 图片
     - 渲染 decoded frame 到页面上分为三步：
       > (1) 把 VideoFrame 转换为 [ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap)
       
       > (2) 等待合适的时机显示 frame
       
       > (3) 将 image 画到 canvas 上
       

   2. 设置 VideoDecoder 和上面类似，需要传递 init 和 config 两个对象
        ```javascript
        const init = {
          output: handleFrame,
          error: (e) => {
            console.log(e.message);
          },
        };
        
        const config = {
          codec: "vp8",
          codedWidth: 640,
          codedHeight: 480,
        };
        
        const decoder = new VideoDecoder(init);
        decoder.configure(config);
        
        ``` 
   3. 创建好 decoder 之后就可以创建 EncodedVideoChunk 对象了，通过 [BufferSouce](https://developer.mozilla.org/en-US/docs/Web/API/BufferSource) 来创建 chunk
        ```javascript
        let responses = await downloadVideoChunksFromServer(timestamp);
        for (let i = 0; i < responses.length; i++) {
          let chunk = new EncodedVideoChunk({
            timestamp: responses[i].timestamp,
            data: new Uint8Array ( responses[i].body )
          });
          decoder.decode(chunk);
        }
        await decoder.flush();
        ```  
   4. 当一个 frame 不再需要的时候，调用 destroy() 在垃圾回收之前手动销毁他，这可以减少页面内存占用
        ```javascript
        let cnv = document.getElementById('canvas_to_render');
        let ctx = cnv.getContext('2d', { alpha: false });
        let ready_frames = [];
        let underflow = true;
        let time_base = 0;
        
        function handleFrame(frame) {
          ready_frames.push(frame);
          if (underflow)
            setTimeout(render_frame, 0);
        }
        
        function delay(time_ms) {
          return new Promise((resolve) => {
            setTimeout(resolve, time_ms);
          });
        }
        
        function calculateTimeTillNextFrame(timestamp) {
          if (time_base == 0)
            time_base = performance.now();
          let media_time = performance.now() - time_base;
          return Math.max(0, (timestamp / 1000) - media_time);
        }
        
        async function render_frame() {
          if (ready_frames.length == 0) {
            underflow = true;
            return;
          }
          let frame = ready_frames.shift();
          underflow = false;
        
          let bitmap = await frame.createImageBitmap();
          // Based on the frame's timestamp calculate how much of real time waiting
          // is needed before showing the next frame.
          let time_till_next_frame = calculateTimeTillNextFrame(frame.timestamp);
          await delay(time_till_next_frame);
          ctx.drawImage(bitmap, 0, 0);
        
          // Immediately schedule rendering of the next frame
          setTimeout(render_frame, 0);
          frame.destroy();
        }
        ```         
             
   
   
 ## 五、WebCodecs 案例
   1. [four demo](https://w3c.github.io/webcodecs/samples/) 