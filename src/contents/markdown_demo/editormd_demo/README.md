## 一、editor.md 使用注意事项：

  1. css 下的路径需要换成自己改过之后的路径。如下案例：
  
        ```javascript
        @font-face {
          font-family: 'editormd-logo';
          src: url("../public/fonts/editormd-logo.eot?-5y8q6h");
          src: url("../public/fonts/editormd-logo.eot?#iefix-5y8q6h") format("embedded-opentype"), url("../public/fonts/editormd-logo.woff?-5y8q6h") format("woff"), url("../public/fonts/editormd-logo.ttf?-5y8q6h") format("truetype"), url("../public/fonts/editormd-logo.svg?-5y8q6h#icomoon") format("svg");
          font-weight: normal;
          font-style: normal;
        }         
        ```
        
        ```javascript
        @media only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2) {
          .editormd-container-mask,
          .editormd-dialog-mask-con {
            background-image: url(../public/images/loading@2x.gif);
          }
        }
        ```
  2. script 正常引用的文件路径：

        ```javascript
        <script src="public/js/jquery.min.js"></script>
        <script src="public/editormd.js"></script>
        <script type="text/javascript">
               var editor
               $(function() {
                   editor = editormd("test-editormd", {
                       width: "80%",
                       height: 800,
                       path: 'public/lib/',
                       theme: "dark",
                       previewTheme: "dark",
                       // editorTheme: "pastel-on-dark",
                       markdown: "",
                       codeFold: true,
                       //syncScrolling : false,
                       saveHTMLToTextarea: true,    // 保存 HTML 到 Textarea
                       searchReplace: true,
                       //watch : false,                // 关闭实时预览
                       htmlDecode: "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启
                       //toolbar  : false,             //关闭工具栏
                       //previewCodeHighlight : false, // 关闭预览 HTML 的代码块高亮，默认开启
                       emoji: true,
                       taskList: true,
                       tocm: true,         // Using [TOCM]
                       tex: true,                   // 开启科学公式TeX语言支持，默认关闭
                       flowChart: true,             // 开启流程图支持，默认关闭
                       sequenceDiagram: true,       // 开启时序/序列图支持，默认关闭,
                       //dialogLockScreen : false,   // 设置弹出层对话框不锁屏，全局通用，默认为true
                       //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为true
                       //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为true
                       //dialogMaskOpacity : 0.4,    // 设置透明遮罩层的透明度，全局通用，默认值为0.1
                       //dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为#fff
                       imageUpload: true,
                       imageFormats: ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
                       imageUploadURL: "/Center/RichTextUpload",
                       onload: function () {
                           console.log('onload', this);
                           this.fullscreen();
                           this.unwatch();
                           this.watch().fullscreen();
       
                           this.setMarkdown("#欢迎来到我的编辑器");
                           this.width("100%");
                           this.height(720);
                           this.resize("100%", 640);
                       }
                   });
               });
         </script>
        ```
  
  3. [editor.md 的github](https://pandao.github.io/editor.md/ )                  