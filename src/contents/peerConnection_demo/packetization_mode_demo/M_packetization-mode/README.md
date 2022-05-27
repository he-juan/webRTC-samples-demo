
## 重点条件：

  1. **存在pc1(本端)** 
      > let pc1 = new RTCPeerConnection(config, RTCpeerConnectionOptional)
  
  2. **存在 pc2（对端）**
     > let pc2 = new RTCPeerConnection(config)

  3.  <font color=red>demo 是处于bundle模式，并且目前只针对主流存在pt携带打包模式字段的值修改为0，演示流的打包模式正常</font>
  4. <font color=red>针对H264的pt都有携带打包模式，默认情况的打包模式为0，即不携带打包模式字段；</font>
     - 存在一个pt的打包模式packetization-mode=1
     - 存在一个pt的打包模式packetization-mode=0
     - 携带模式如下所示：

        ```
        a=fmtp:126 profile-level-id=42e028;level-asymmetry-allowed=1;packetization-mode=1
        a=fmtp:97 profile-level-id=42e028;level-asymmetry-allowed=1
        ```

## 一、在firefox浏览器测试情况一（`126优先级高于97`）

  1. pc1通过pc1.setLocalDescription获取到本端的sdp中携带的打包模式如下：

       ```
        m=video 0 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98
        c=IN IP4 0.0.0.0
        a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1
        a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:120 max-fs=12288;max-fr=60
        a=fmtp:124 apt=120
        a=fmtp:121 max-fs=12288;max-fr=60
        a=fmtp:125 apt=121
        ...
    
       ```
    
  2. pc2 通过pc2.setRemoteDescription(offerSDP)获取到pc1的sdp，即得到的打包模式如下：

       ```
        m=video 0 UDP/TLS/RTP/SAVPF 126 127 97 98
        c=IN IP4 0.0.0.0
        a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=0
        a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:127 apt=126
        ...
       ```

  3. pc2通过pc2.createAnswer() 获取本地sdp，即得到的打包模式如下：
    
       ```
        m=video 9 UDP/TLS/RTP/SAVPF 126 127
        c=IN IP4 0.0.0.0
        a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:127 apt=126
        ...
       ```

  4. pc1通过pc1.setRemoteDescription(answerSDP)获取到pc2的sdp ,  即得到的打包模式如下:

       ```
        m=video 64088 UDP/TLS/RTP/SAVPF 126 127
        c=IN IP4 192.168.216.1
        a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:127 apt=126
        ...
       ```

 - 情况说明：<font color=red>此时视频现象是本地获取的对端流是黑屏</font>,但远端获取到本端的流是正常的
      >（1）pc1 本端获取的是pt为126，打包模式为1； pt为97，打包模式为0；发送到对端不同pt的打包模式都为0；
    （2）pc2本端获取到的pt只有126，打包模式默认为0；
    （3）pc1 本端和获取到对端的sdp同一个pt的打包模式不同，如pt 126

----------

## 二、在firefox浏览器测试情况二（`97的优先级高于126`）

  1. pc1通过pc1.setLocalDescription获取到本端的sdp中携带的打包模式如下：

       ```
        m=video 0 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98
        c=IN IP4 0.0.0.0
        a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1
        a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:120 max-fs=12288;max-fr=60
        a=fmtp:124 apt=120
        a=fmtp:121 max-fs=12288;max-fr=60
        a=fmtp:125 apt=121
        ...
    
       ```
    
  2. pc2 通过pc2.setRemoteDescription(offerSDP)获取到pc1的sdp，即得到的打包模式如下：

       ```
        m=video 0 UDP/TLS/RTP/SAVPF 98 97 127 126
        c=IN IP4 0.0.0.0
        a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=0
        a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:127 apt=126
        ...
       ```

  3. pc2通过pc2.createAnswer() 获取本地sdp，即得到的打包模式如下：

       ```
        m=video 9 UDP/TLS/RTP/SAVPF 97 98
        a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:98 apt=97
        ...
       ```

  4. pc1通过pc1.setRemoteDescription(answerSDP)获取到pc2的sdp ,  即得到的打包模式如下:

       ```
        m=video 60195 UDP/TLS/RTP/SAVPF 97 98
        c=IN IP4 192.168.216.1
        a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1
        a=fmtp:98 apt=97
        ...
       ```

 - 情况说明：<font color=red>此时视频现象是本地获取的对端流是正常的，远端获取到本端的流是正常的</font>
      >（1）pc1 本端获取的是pt为126，打包模式为1； pt为97，打包模式为0；发送到对端不同pt的打包模式都为0；
    （2）pc2本端获取到的pt只有97，打包模式默认为0；
    （3）pc1 本端和获取到对端的sdp同一个pt的打包模式相同，如pt 97

-------------------

- 根据以上得出的结论是：
   - 在firefox浏览器中，同一个pt 本端的打包模式和远端的打包模式不一样，导致流存在问题；这属于浏览器的行为问题。
   - chrome不存在此问题
- 解决方案：
  - wave这边针对H264所得pt的打包模式放开，至少存在一个pt的打包模式为0，一个pt的打包模式为1 的情况；
  - ucm 或者其他产品根据pt和打包模式来协商处理；
