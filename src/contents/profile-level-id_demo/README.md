### 问题背景

> Chrome/firefox/safari 三大浏览器使用的profile-level-id的情况简表

-----


### H264 软件编码支持对比分析

> `说明：以下测试列表中，profile_idc值为42/58/4d/64时，在firefox浏览器开启屏幕共享，answer端生成的sdp没有H264的编解码(生成的是vp8解码器)`

| profile_idc  | profile-level-id |    chrome                         |    firefox                        |   safari                       | 编码    |
|--------------|------------------|-----------------------------------|---------------------------------- |--------------------------------|---------|
|  42          | 420028           | <font color=red>支持</font>        | 不支持                             | 不支持                          |  H264|
|              | 42e028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 42d028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 421028           | <font color=red>支持</font>        | 不支持                             | 不支持                          |      |
|              | 420c28           | 不支持                              | 不支持                            | 不支持                          |      |
|              | 42f028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|   4d         | 4d0028           | <font color=red>支持</font>        | 不支持                             | 不支持                          |      |
|              | 4de028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 4d0c28           | 不支持                              | 不支持                            | 不支持                          |      |
|              | 4df028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 4dd028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 4d1028           | <font color=red>支持</font>        | 不支持                             | 不支持                          |      |
|   58         | 580028           | 不支持                              | 不支持                            | 不支持                          |      |
|              | 58d028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 58e028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 58f028           | <font color=red>支持</font>        |   <font color=red>支持</font>      |  <font color=red>支持</font>    |      |
|              | 581028           | 不支持                             |  不支持                            |   不支持                        |      |
|              | 580c28           | 不支持                             |  不支持                            |   不支持                        |      |
|   64         | 640028           |<font color=red>支持</font>         |  不支持                            |   不支持                        |      |
|              | 64e028           | 不支持                             |  不支持                            |   不支持                        |      |
|              | 640c28           | 不支持                             |  不支持                            |  <font color=red>支持</font>    |      |



###分解 profile-level-id ###

   profile-level-id由三部分组成：对应profile_idc（8bits）、profile_iop（8 bits）、level_idc（8 bits）
 
 1. **profile_idc**
    **Max video bit rate(kbit/s)：最大视频码率**。H.264中定义了四种常用的档次profile，每个profile支持一组特定的编码功能，并支持一类特定的应用,分别是BP、EP、MP、HP：
    > 基准档次：baseline profile (多应用于实时通信领域;); 
    > 主要档次：main profile (多应用于流媒体领域);
    > 扩展档次：extended profile (多应用于广电和存储领域);
    > 扩展档次：high profile(多用于商业场合，比如蓝光、电影、高清电视等)

  - 区别：
    - (1) baseline profile:
        - 仅支持I P Slice types
        - 仅支持CAVLC熵编码
        - 环路滤波
        - 仅支持无交错的视频格式
    - (2) main profile
        - 兼容Baseline profile
        - 仅支持I P B
        - CABAC+CAVLC熵编码
        - 又支持interlaced 场视频格式
        - 加权预测
    - (3) extended profile
        -  支持 I P B SP SI
        -  仅支持CAVLC熵编码
        -  仅支持无交错的视频格式
    - (4) high Profile  
        - 兼容Main Profile
        - 仅支持I P B
        - 支持8x8 transform内部预测

    注意：在H.264的SPS中，第一个字节表示profile_idc，根据profile_idc的值可以确定码流符合哪一种档次。判断规律为：
    
    - **profile_idc = 66 → baseline profile**;
    - **profile_idc = 77 → main profile**;
    - **profile_idc = 88 → extended profile**;
    - **profile_idc = 100 → high profile**
        - 在新版的标准中，还包括了High、High 10、High 4:2:2、High 4:4:4、High 10 Intra、High 4:2:2 Intra、High 4:4:4 Intra、CAVLC 4:4:4 Intra等，每一种都由不同的profile_idc表示。
        - 另外，constraint_set0_flag ~ constraint_set5_flag是在编码的档次方面对码流增加的其他一些额外限制性条件。
        - profile_idc = 0x42 = 66，因此码流的档次为baseline profile