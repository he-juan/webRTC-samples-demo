[关于噪音检测流程](https://github.com/ivicos-GmbH/lib-jitsi-meet/issues/4)

[宋伟搭建的jitsi环境](https://192.168.131.178:8443/)（可直接访问使用）

[jitsi官网](https://meet.jit.si/)

## 重点：噪音检测的思想

 - 说明（`VADNoiseDetetction.js文件`）
 
    ```
    // 检测提供的VAD分数和PCM数据是否被视为噪声
    Detect if provided VAD score and PCM data is considered noise
    ```

## 一、关于噪音检测的流程

 1. 首先获取音频流；
 2. 对获取的音频流通过`createMediaStreamSource`得到`source`,通过`createScriptProcessor`得到`单通道处理节点`,并通过监听事件`audioprocess`得到`流数据样本`,接下来是对音频流数据样本进行处理；
 
    ```
    This.mediaStreamSource = This.noiseDetectionContext.createMediaStreamSource(data.stream);
        This.scriptProcessor = This.noiseDetectionContext.createScriptProcessor(This.vadEmitterSampleRate, 1, 1);
        This.mediaStreamSource.connect(This.scriptProcessor);
        This.scriptProcessor.connect(This.noiseDetectionContext.destination);
        This.scriptProcessor.addEventListener("audioprocess", function (audioEvent) {
         // 处理audioEvent
        }
    ```
 3. 关于音频流样本的处理流程：
    - 首先判断当前音频流的状态（`靜音或非靜音`）
    - 对非静音的音频流进行分频带处理，对每个分频带的样本数据进行处理：(`阵列的大小必须是完全480个样本，这一约束来自rnnoise库，输出VAD分数`)
      - 将32位浮动PCM样本转换为16位浮动PCM样本并将其存储为32位浮点数。功能接口`convertTo16BitPCM `
      - 将输入PCM音频样本复制到WASM输入缓冲区。功能接口`copyPCMSampleToWasmBuffer`
      - 计算原始Float32 PCM样本阵列的语音活动检测,输出VAD 的分数，此值是通过rnnoise.wasm计算返回的，并标记为vadScore;

            ```
            This.scriptProcessor.addEventListener("audioprocess", function (audioEvent) {
                    let inData = audioEvent.inputBuffer.getChannelData(0);
                    let completeInData = [...bufferResidue, ...inData]
                    for (let i=0; i + This.rnnoiseSampleLength < completeInData.length; i += This.rnnoiseSampleLength) {
                        let pcmSample = completeInData.slice(i, i + This.rnnoiseSampleLength);
                        let vadScore = This.calculateAudioFrameVAD(pcmSample.slice());
                        if(data.stream.getAudioTracks()[0].enabled){
                            This.processVADScore(vadScore, pcmSample);
                        }
                    }
                    bufferResidue = completeInData.slice(completeInData.length);
                })
            ```
   - 对输出的VAD分数进行处理（`主要是根据rnnoise返回的值查看`）：
      - 原则：如果样本的VAD分数低，音频电平具有足够高的水平，即可以开始收听噪音 
      - 一旦预设超时执行最终就会计算出最终分数（`过滤PCM样本值并进行平均计算`）。

            ```
            NoiseDetection.prototype.processVADScore = function(score, pcmData) {
                let This = this
                if (This.processing) {
                    let posAudioLevels = This.filterPositiveValues(pcmData);
                    This.recordValues(score, This.calculateAverage(posAudioLevels))
                    return;
                }
            
                /* If the VAD score for the sample is low and audio level has a high enough level we can start listening for noise */
                if (score < This.vadScoreTrigger) {
                    let posAudioLevels = This.filterPositiveValues(pcmData);
                    let avgAudioLvl = This.calculateAverage(posAudioLevels);
                    if (avgAudioLvl > This.audioLevelScoreTrigger) {
                        This.processing = true;
                        This.recordValues(score, avgAudioLvl);
                        // Once the preset timeout executes the final score will be calculated.
                        This.processTimeout = setTimeout(This.calculateNoisyScore(), This.processTimeFrameSpanMs);
                    }
                }
            }
            ``` 
      - 为了降低灵敏度，对检测出PCM样本进行次数处理，若满足条件且存在五次以上则触发前端；
    
            ```
            NoiseDetection.prototype.calculateNoisyScore = function() {
                let This = this
                let audioLevelAvg = This.calculateAverage(This.audioLvlArray);
                let scoreAvg = This.calculateAverage(This.scoreArray);
                if (scoreAvg < This.vadNoiseAvgThreshold && audioLevelAvg > This.noisyAudioLevelThreshold) {
                    This.numberOfTrigger++
                    if(This.numberOfTrigger >= 5){
                        log.info("Please that there is already noise ")
                        gsRTC.trigger('onNoiseCheck',{isExistNoise: true})
                        This.numberOfTrigger = null
                    }
            
                }
                This.reset();
            }
            ```
            
            
            
            

----------

## 二、重新构建的噪音检测逻辑



噪音检测流程：
  
  > 主要是根据jitsi 会议流程处理，并对wave中噪音检测进行了新的改进且保持和jitsi一致
  
  - 前提条件：
     添加当前需要检测的音频流,根据`_StreamAdded`接口开始处理噪音检测流程；此接口主要是通过音频监听事件来触发接下来的逻辑处理
  

----------


  噪音检测流程：
  
  > 主要是根据jitsi 会议流程处理，并对wave中噪音检测进行了新的改进且保持和jitsi一致
  
  > 前提条件：
     添加当前需要检测的音频流,根据`_StreamAdded`接口开始处理噪音检测流程；此接口主要是创建音频监听事件来触发接下来的逻辑处理
  
  1. 在`未开启强降噪音`的前提下，首先是根据当前状态是否静音
      - 如若静音，则不处理噪音检测流程；即暂时停止噪音检测逻辑，对应函数为`trackMuteChanged `;
      - 如若非静音，则处理噪音检测流程；若流存在对应函数为`trackMuteChanged `，重新取流则处理对应函数为 `setupNewTrack`;
  2. 在`未开启强降噪音`的前提下，若处于` 非静音`模式下，处理流程大致如下：
      -  根据 `onAudioProcess` 函数 获取音频事件处理相关逻辑，从而对音频数据进行处理，处理噪音检测逻辑主要是根据`processVADScore`函数来执行；
      -  在不切换设备的前提下，当前线路检测到噪音则不会继续检测；否则直到检测到噪音为止
      
  3. 重新检测逻辑是对之前的参数和逻辑进行重置和销毁，并重新添加新的流和处理逻辑，对应的函数接口为： `cancelNoiseDetection(清除当前逻辑) `接口、`setupNewTrack(重新添加流和逻辑)`接口
  
  4. 关于WAVE 噪音检测情况说明：
    -  在不切换设备的前提下，当前线路检测到噪音则不会继续检测；否则直到检测到噪音为止
    -  当前线路若切换设备，则重新进行噪音检测；若开启强降噪音则停止噪音检测 
    -  hold时，根据当前线路的事件来判断调用对应接口进行处理；接口为`isNoiseDetectionForCurrent`
        - 若当前线路不处理切换线路逻辑，即不调用switcCall接口且直接调用hold接口逻辑；对噪音检测逻辑 只是 通过`启动/停止`噪音逻辑处理；
        - 若当前线路处理切换线路逻辑，即调用SwitchCall接口且调用hold接口逻辑；首先处于hold状态的线路需要清除噪音检测逻辑，并且处于活跃状态的线路重新进行噪音检测；
    - 挂断线路时，根据当前线路的活跃状态来判断是否需要进行销毁和清除处理；对应接口为`cancelNoiseDetection`
      
  5. 特别说明：
     - 切换线路和切换设备的情况下，才会处理重新进行噪音检测逻辑；

----------


## 三、噪音检测流程

  

 1. 测试方法：根据获取的音频流,通过监听事件`audioprocess`得到`流数据样本`,并对音频数据样本进行处理；
 2. 验证标准：实时获取音频数据样本，并获取处理后VAD分数和PCM数据，从而检测VAD分数和PCM数据是否超过设置的阈值，在一定范围内超过则被视为噪声；
 3. 存在不足：只能通过VAD分数和PCM数据进行数值比较，不能保证所有的声音不超过阈值就不是噪音；

         