## 重点：关于AudioContext 占用内存问题：
   - 如下所示初始化创建AudioContext对象，即使没有处理任何音频内容，依然会触发 1-2ms 每次 的task，导致CPU空耗.
   
    ```javascript
    window.AudioContext = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)
    let audioCtx = new window.AudioContext()
    ```
   - 为了减少内存的消耗，在不使用的情况下可以采用`AudioContext.close()`释放内存，如下所示操作即可。资料请点击
   [AudioContext.close](https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext/close)
  
    ```javascript
    audioCtx.close()
    ```
   - `AudioContext状态改变`：
   
    ```javascript
       // report the state of the audio context to the console, when it changes
       audioCtx.onstatechange = function() {
        console.log(audioCtx.state);
       }
    ```  
   - 若在使用过程中要不间断的使用AudioContext，且在不重新初始化的情况下，可以采用`AudioContext.suspend()`来暂停，再次使用时采用`AudioContext.resume() ` 来恢复；

    ```javascript
      susresBtn.onclick = function() {
        if(audioCtx.state === 'running') {
           audioCtx.suspend().then(function() {
           susresBtn.textContent = 'Resume context';
           });
        } else if(audioCtx.state === 'suspended') {
           audioCtx.resume().then(function() {
           susresBtn.textContent = 'Suspend context';
           });
        }
      }            
    ```
   - 关于`suspend()、resume()和close()`相关demo，请点击[AudioContext states demo](https://mdn.github.io/webaudio-examples/audiocontext-states/) 查看         
   - 关于`suspend()` 资料请点击[AudioContext.suspend()](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend)
   - 关于`resume() ` 资料请点击[AudioContext.resume()](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume)

----------


## 一、关于Audio的API

 1. audio 元素的某些参数
    ```
    navigator.getUserMedia({
            audio: {
                echoCancellation: true,    // 是否去除回音
                noiseSuppression: true,   // 是否去除噪音
                autoGainControl: false,
            }
        }
    ```

  -  某些设备上有回声，WebRTC 标准提供了一套 3A 算法，可以通过指定 audio 的 MediaTrackConstrains 中的 AEC、ANS、AGC 开关控制 3A 的处理，当遇到回声、噪声、杂音、声音小等问题时，在 web 端的 localstream 中，creatStream 时，通过控制echoCancellation、noiseSuppression、autoGainControl 这三个属性来分别控制回声消除、噪声抵制、音量增益进行测试。
      > 1、如果 echoCancellation 设置为 true，依然存在回声问题，
      > 2、如果 noiseSuppression 设置为 true，依然存在背景噪声，
      > 3、如果 autoGainControl 设置为 true，依然存在声音偏小，
      > 以上三种情况，说明是浏览器不兼容这个硬件设备，建议更换硬件设备

 2. webAudio （`实例化音频对象`）
    - window.AudioContext对媒体播放之前对它进行信号拦截，并获取音频数据信息；

    ```
     AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext
     
     let audioContext = new AudioContext()     
    ```

 3. AudioNode (`音频节点`)
    - AudioNode是一个处理音频的通用模块(`比如音量控制器如 GainNode`)；一个AudioNode 既有输入也有输出。输入与输出都有一定数量的通道。只有一个输出而没有输入的 AudioNode 叫做音频源。

        ```
        let audioCtx = new window.AudioContext,
            //频率及时间域分析器，声音可视化就用这个
            analyser = audioCtx.createAnalyser(),
            //音量变更模块
            gainNode = audioCtx.createGain(),
            //波形控制器模块
            distortion = audioCtx.createWaveShaper(),
            //低频滤波器模块
            biquadFilter = audioCtx.createBiquadFilter(),
            //创建源
            source = audioCtx.createMediaStreamSource(stream);
            //通过connect方法从音频源连接到AudioNode处理模块，再连接到输出设备，
            //当我们修改前面的模块时，就会影响到后面AudioNode，以及我们最终听见的声音
            source.connect(analyser);
            analyser.connect(distortion);
            distortion.connect(biquadFilter);
            biquadFilter.connect(convolver);
            convolver.connect(gainNode);
            gainNode.connect(audioCtx.destination);
        ```
    
 4. createAnalyser(`频谱能量值节点`)
 
    ```
    let analyser = audioCtx.createAnalyser();
        //频域的FFT大小，默认是2048
        analyser.fftSize;
        //fftSize的一半
        analyser.frequencyBinCount;
        //快速傅立叶变化的最大范围的双精度浮点数
        analyser.maxDecibels;
        //最后一个分析帧的平均常数
        analyser.smoothingTimeConstant;
        //将当前频域数据拷贝进Float32Array数组
        analyser.getFloatFrequencyData()
        //将当前频域数据拷贝进Uint8Array数组
        analyser.getByteFrequencyData()
        将当前波形，或者时域数据拷贝进Float32Array数组
        analyser.getFloatTimeDomainData()
        //将当前波形，或者时域数据拷贝进 Uint8Array数组
        analyser.getByteTimeDomainData()
    ```

 5. createGain(`声音处理模块`)

    ```
    if(!audioContext){
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser(); // analyser为analysernode，具有频率的数据，用于创建数据可视化；即创建频谱能量值节点。
        gainnode = context.createGain(); // gain为gainNode，音频的声音处理模块
        gainnode.gain.value = 1;
        }
    ```

 6. `在每个阶段 media → filter → analyser → destination的处理过程`

    
    

----------


## 二 、 获取音频流并绘制频谱

 - 首先通过`FileReader`获取音频文件并通过`decodeAudioData`解码成buffer

    ```
    fr = new FileReader(); //实例化一个FileReader用于读取文件
    fr.onload = function(e) { //文件读取完后调用此函数
        var fileResult = e.target.result; //这是读取成功得到的结果ArrayBuffer数据
        var audioContext = that.audioContext;
        
        //从Visualizer得到最开始实例化的AudioContext用来做解码ArrayBuffer
        audioContext.decodeAudioData(fileResult, function(buffer) {   //解码成功则调用此函数，参数buffer为解码后得到的结果  
            that._visualize(audioContext, buffer); //调用_visualize进行下一步处理，此方法在后面定义并实现
        }, function(e) { //这个是解码失败会调用的函数
            console.log("!哎玛，文件解码失败:(");});
        };
        //将上一步获取的文件传递给FileReader从而将其读取为ArrayBuffer格式
        fr.readAsArrayBuffer(file);
    }
    ```

 - 创建Analyser分析器及播放音频
    - 首先将buffer赋值给audioContext:

        ```
        var audioBufferSouceNode = audioContext.createBufferSource();
        audioBufferSouceNode.buffer = buffer;
        ```
    - 播放音频：(`此刻是听不到声音的`)
    
        ```
        audioBufferSouceNode.start(0);
        ```
      - 此时是听不到声音的，需要将`audioBufferSouceNode`连接到`audioContext.destination`，这个`AudioContext的destination也就相关于speaker（扬声器）`,修改如下即可。
      
          ```
          audioBufferSouceNode.connect(audioContext.destination);
          audioBufferSouceNode.start(0);
          ```
          
         ```
         _visualize: function(audioContext, buffer) {
            var audioBufferSouceNode = audioContext.createBufferSource();
            audioBufferSouceNode.connect(audioContext.destination);
            audioBufferSouceNode.buffer = buffer;
            audioBufferSouceNode.start(0);
         }
         ```
    - 创建获取频谱能量值的analyser节点 :
    
       ```
         var analyser = audioContext.createAnalyser();
       ```
        
        - 上面是直接将audioBufferSouceNode与audioContext.destination相连的，音频就直接输出到扬声器开始播放了，现在为了将音频在播放前截取，所以要把`analyser插在audioBufferSouceNode与audioContext.destination之间`。明白了这个道理，代码也就很简单了，audioBufferSouceNode连接到analyser,analyser连接destination。  
        
        ```
        audioBufferSouceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        ```
      - 开始播放
       
        ```
        _visualize: function(audioContext, buffer) {
        var audioBufferSouceNode = audioContext.createBufferSource(),
        analyser = audioContext.createAnalyser();
        //将source与分析器连接
        audioBufferSouceNode.connect(analyser);
        //将分析器与destination连接，这样才能形成到达扬声器的通路
        analyser.connect(audioContext.destination);
        //将上一步解码得到的buffer数据赋值给source
        audioBufferSouceNode.buffer = buffer;
        //播放
        audioBufferSouceNode.start(0);
        //音乐响起后，把analyser传递到另一个方法开始绘制频谱图了，因为绘图需要的信息要从analyser里面获取
        this._drawSpectrum(analyser);}
        ```
         - _drawSpectrum(analyser)此接口表示在canvas绘制频谱的接口;
            - 从analyser中得到此刻的音频中各频率的能量值 
            
            ```
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            ```
        - 让频谱动起来

            ```
            var canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //能量条的宽度
            gap = 2, //能量条间的间距
            meterNum = 800 / (10 + 2), //计算当前画布上能画多少条
            ctx = canvas.getContext('2d');
            //定义一个渐变样式用于画图
            gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(1, '#0f0');
            gradient.addColorStop(0.5, '#ff0');
            gradient.addColorStop(0, '#f00');
            ctx.fillStyle = gradient;
            var drawMeter = function() {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var step = Math.round(array.length / meterNum); //计算采样步长
            ctx.clearRect(0, 0, cwidth, cheight); //清理画布准备画画
            for (var i = 0; i < meterNum; i++) {
            var value = array[i * step];
            ctx.fillRect(i * 12 /*频谱条的宽度+条间间距*/ , cheight - value + capHeight, meterWidth, cheight);
            }
            requestAnimationFrame(drawMeter);
            }
            requestAnimationFrame(drawMeter);
            ```
            
## 三、案例

 - [webAudio demo](https://www.cnblogs.com/Wayou/p/html5_audio_api_visualizer.html)

 - [webAudio API](https://segmentfault.com/a/1190000010561222)

 - [webAudio 接口解析](https://www.cnblogs.com/zhishaofei/p/12465705.html)

 - [webAudio 接口解析2](https://www.cnblogs.com/hustskyking/p/webAudio-listen.html)

 - [Web Audio API 介绍和 web 音频应用案例分析](https://cloud.tencent.com/developer/article/1006406)