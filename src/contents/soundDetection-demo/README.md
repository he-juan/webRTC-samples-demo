## 声音检测DEMO ##
[audioContext API](https://xiaotianxia.github.io/blog/vuepress/js/useful_webapis_audiocontext.html)
[DEMO源码](https://github.com/Jam3)
[Web Audio API](https://www.dazhuanlan.com/2019/10/28/5db6c9cc88c33/)
[声音检测交互形式](https://192.168.120.248/KODExplorer/data/User/design/home/%E4%BA%A4%E4%BA%92%E6%96%87%E6%A1%A3/GS_Wave_Web/GS%20Wave%20Web_V0.0.6.9/#id=87xrih&p=%E3%80%90new%E3%80%9124_%E5%A3%B0%E9%9F%B3%E6%A3%80%E6%B5%8B)


### 一、声音检测场景 ###

 1. mute场景：
      检测用户是否想说话，如果在说话，提示`是否需要改变当前麦克风状态`
 2. UnMute场景：
     检测用户声音是否强度是否正常，如若当前没有声音或检测声音较小，提示`无法检测到您的声音或声音过小，请检查您的音频设备`

----------


### 二、SDK声音检测处理方案 ###

> 前端调用接口`getVolumeStatus`获取声音检测的音量和等级;

----------

 1. 主要是根据声音状态的改变处理相关流程：
     - 若改变当前audio为静音状态(mute) 时，需要重新取流；
     - 若改变当前audio为非静音状态(unMute)时，不需要重新取流；
 2. mute/unMute状态时声音检测:
     - 每100ms检测一次声音音量和声音强度，总共检测200次；
     - mute状态下：
          - 200次中当前声音强度超过上一次强度的次数为30次，则提示用户是否改变麦克风的当前状态；
     - unmute状态下：
          - 总共检测200次，200次中当前声音强度超过上一次强度的次数为70次或者声音强度为0的次数超过180次，则提示用户当前音量过小，需要检测设备；
 3. 报错形式：`The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page`
      - [解决方案](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
      - `context.resume().then(() => {  console.log('Playback resumed successfully'); });`
      

----------


  **三、修正之后的声音检测方案**
 

 1. 音量和音量级别：
     每100ms检测一次声音音量和声音强度
 2. 现在声音检测的处理方案：
    1、unmute的处理方案：
       第一步：首次检测unmute时（也就是每当麦克风的状态改变为unmute时），先延迟3s再开始进行声音检测；（这个是想解决改变麦克风状态，但前几秒没有说话）
       第二步：检测过程中是每100ms检测一次，总共检测80次，相当于8s;
              （1）如果连续8s声音的强度连续为0或者1（或者8s声音强度持续为0），则提示1“无法检测到您的声音或声音过小，请检查您的音频设备”
              （2）如果页面出现提示1【无法检测到您的声音或声音过小】，但在后续中连续检测2s且声音强度连续 > 1，则提示前端撤回提示1；
    2、mute的处理方案：
      检测时每100ms检测一次，总共检测120次，相当于12s（12s为一个周期）；
        如果在12s内声音强度的总值超过180，则提示有人在说话；否则不提示；

----------


 **四、修正之后的声音检测方案**

 1. 音量级别
     - 每100ms检测一次声音音量和音量强度，声音强度和声音音量之间的关系:
     ```
        SoundMeter.prototype.getVolumeLevel = function(nMicVolumn){
            let volumeLevel
            // 声音强度和声音音量之间的关系如下
            nMicVolumn = nMicVolumn * 2.5
            if(gsRTC.getBrowserDetail().browser === 'firefox'){
                if(nMicVolumn < 0.02 && nMicVolumn > 0){
                    volumeLevel = 1;
                }else if(nMicVolumn > 0.15){
                    volumeLevel = 10;
                }else if(nMicVolumn >= 0.02 && nMicVolumn < 0.05){
                    nMicVolumn -= 0.02;
                    volumeLevel = Math.round(nMicVolumn * 100 )+2;
                }else if(nMicVolumn >= 0.05 && nMicVolumn <= 0.10){
                    nMicVolumn -= 0.05;
                    volumeLevel = Math.round(nMicVolumn * 60 )+5;
                }else if(nMicVolumn > 0.10 && nMicVolumn <= 0.15){
                    nMicVolumn -= 0.10;
                    volumeLevel = Math.round(nMicVolumn * 20 ) + 8;
                }else{
                    volumeLevel = 0
                }
            }else if(gsRTC.getBrowserDetail().browser === 'edge'){
                if(nMicVolumn < 0.04 && nMicVolumn > 0){
                    volumeLevel = 1;
                }else if(nMicVolumn > 0.24){
                    volumeLevel = 10;
                }else if(nMicVolumn >= 0.04 && nMicVolumn <= 0.14){
                    nMicVolumn -= 0.04;
                    volumeLevel = Math.round(nMicVolumn * 50 )+1;
                }else if(nMicVolumn > 0.14 && nMicVolumn <= 0.24){
                    nMicVolumn -= 0.14;
                    volumeLevel = Math.round(nMicVolumn * 30 ) + 6;
                }else{
                    volumeLevel = 0
                }
            }else{
                if(nMicVolumn < 0.05 && nMicVolumn > 0){
                    volumeLevel = 1;
                }else if(nMicVolumn > 0.25){
                    volumeLevel = 10;
                }else if(nMicVolumn >= 0.05 && nMicVolumn <= 0.15){
                    nMicVolumn -= 0.05;
                    volumeLevel = Math.round(nMicVolumn * 50 )+1;
                }else if(nMicVolumn > 0.15 && nMicVolumn <= 0.25){
                    nMicVolumn -= 0.15;
                    volumeLevel = Math.round(nMicVolumn * 30 ) + 6;
                }else{
                    volumeLevel = 0
                }
            }
           return volumeLevel
        }

     ```

 2. 声音检测处理方案
     -  1、unMute的处理方案：<font color=red>主要是检测麦克风是否故障</font>
         - 30s内检测是否有声音强度超过5，如果有，则停止声音检测；
             - 如果没有，检测是否连续声音强度为0/1（30s），如果有，则提示1“无法检测到您的声音或声音过小，请检查您的音频设备”；
             - 如果页面出现提示1【无法检测到您的声音或声音过小】，但在后续的30s 内检测声音强度是否超过5，如果有，则提示取消提示1，并停止检测；
     - 2、mute的处理方案：<font color=red>主要是检测当前是否有人说话</font>
         - 检测时每100ms检测一次，总共检测60次，相当于6s（6s为一个周期）；
         - 如果在6s内声音强度的总值超过120，则提示有人在说话；否则不提示；

 3. 声音检测的场景：
     - 场景一：
         - 主持人禁止声音时，则停止声音检测
         - 主持人取消【禁止声音检测】，则根据当前的状态重新声音检测

     - 场景二：
         - 挂断通话时停止声音检测
         
     - 场景三：
         - hold 转发是停止声音检测（本端和远端都需要停止声音检测）
     - 场景四：
         - 切换麦克风设备时也需要对应的流处理
          