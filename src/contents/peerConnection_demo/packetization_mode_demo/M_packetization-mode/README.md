## 目前测试packetization-mode 的情况说明：

### 一、关于chrome：

1. 关于打包模式设置为1，如packetization-mode=1 
2. 关于打包模式设置为0，如packetization-mode=0

> 以上情况都可行，当主流M行与演示流的M行同一个pt的打包模式不一样，端口为9，获取流是正常的；


### 二、关于firefox
1. 关于打包模式设置为0，如packetization-mode=0
   - 当同一个pt主流和演示流的打包模式不一致，端口都是0，且本地端获取的流存在问题；
  
2. 关于打包模式设置为1，如packetization-mode=1  
   - 当同一个pt主流和演示流的打包模式一致，端口都是0，且本地端获取的流正常；