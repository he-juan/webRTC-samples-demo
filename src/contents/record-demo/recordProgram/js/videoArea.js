; (function ($) {

    $.fn.frameSelection = function (options) {
        var defaultOpts = {
            callback: function () { },
            mask: false,
            done: function (result) { console.log(result) }
        };
        var options = $.extend({}, defaultOpts, options);
        new FrameSelection($(this), options);

    }
    /**
     * 坐标点
     * @param {*} x
     * @param {*} y
     */
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * 框选构造函数
     * @param {*} $rangeEl 容器元素
     * @param {*} options 选择项
     */
    function FrameSelection($rangeEl, options) {
        this.$rangeEl = $rangeEl;
        this.options = options;

        this.init();
    }
    /**
     * 框选初始化
     */
    FrameSelection.prototype.init = function () {
        this.unbind();
        this.bind();
    }
    /**
     * 解除事件绑定
     */
    FrameSelection.prototype.unbind = function () {

        this.$rangeEl.off('mousedown');
        this.$rangeEl.off('mousemove');
        this.$rangeEl.off('mouseup');
    }
    /**
     * 绘制接口
     */
    FrameSelection.prototype.render = function (p1, p2) {
        this.options.mask && this.renderMask(p1, p2);
        this.renderRect(p1, p2);
    }
    /**
     * 清理元素
     */
    FrameSelection.prototype.clear = function () {
        this.$rangeEl.find('.rect,.mask').remove();
    }

    /**
     * 创建
     *
     */
    FrameSelection.prototype.renderMask = function (p1, p2) {
        var $rect = this.$rangeEl.find('div.rect');
        // var shareVideo = document.getElementsByClassName("container_middle")[0]
        // var container = document.getElementById("container")
        // window.rectWidth = $rect.outerWidth();
        // window.rectHeight = $rect.outerHeight();
        // var $top = this.$rangeEl.find('div.mask:eq(0)'),
        //     $left = this.$rangeEl.find('div.mask:eq(1)'),
        //     $right = this.$rangeEl.find('div.mask:eq(2)'),
        //     $bottom = this.$rangeEl.find('div.mask:eq(3)');
        //
        //
        //
        // $top.css({
        //     // top: this.$rangeEl.css('top'),
        //     // left: this.$rangeEl.css('left') ,
        //     // width: this.$rangeEl.width(),
        //     // height:this.$rangeEl.height(),
        //     top: shareVideo.offsetTop,
        //     left: shareVideo.offsetLeft ,
        //     width: this.$rangeEl.width(),
        //     height:  window.tops
        //
        // });
        // // window.containerTop = this.$rangeEl.left();
        // // window.containerLeft = this.$rangeEl.top();
        // window.containerWidth = this.$rangeEl.width();
        // window.containerHeight = this.$rangeEl.height();
        // $left.css({
        //     // top: $rect.css('top'),
        //     top: $top.height()  ,
        //     left:  window.lefts - shareVideo.offsetLeft - container.offsetLeft,
        //     width: $rect.css('left'),
        //     // width: window.startPositionX- window.startLeftX,
        //     height: $rect.height()
        // });
        //
        // $right.css({
        //     top: $top.height() + shareVideo.offsetTop,
        //     left:  window.mouseDownLeft + $rect.width(),
        //     width: this.$rangeEl.width() - ($left.width() + $rect.width()),
        //     height: $left.height()
        // });
        //
        // $bottom.css({
        //     // top: $top.height() + $left.height(),
        //     // left: this.$rangeEl.css('left'),
        //     top: $top.height() + $left.height() + shareVideo.offsetTop,
        //     left:this.$rangeEl.css('left'),
        //     width: $top.width(),
        //     height: this.$rangeEl.height() - ($top.height() + $left.height())
        // });

    }

    /**
     * 创建矩形选框
     */
    FrameSelection.prototype.renderRect = function (p1, p2) {
        var $rect = this.$rangeEl.find('div.rect');
        var container = document.getElementById("container")

        $rect.css({
            top: Math.min(p1.y, p2.y) - container.offsetTop,
            left: Math.min(p1.x, p2.x) - container.offsetLeft,
            width: Math.abs(p1.x - p2.x),
            height: Math.abs(p1.y - p2.y),
        })
    }


    /**
     * 创建元素
     */
    FrameSelection.prototype.create = function (eleDes, n, callback) {
        var desArr = eleDes.split('.');
        var eleName = desArr[0], className = desArr[1] || '', eles = '';

        for (var i = 0; i < n; i++) {
            eles += `<${eleName} class="${className}"></${eleName}>`;
        }
        callback && typeof callback === "function" && callback($(eles));
    }
    FrameSelection.prototype.createElToDom = function () {
        //默认不绘制mask
        var fn = ($eles) => {
            $eles.appendTo(this.$rangeEl);
        }
        this.options.mask && this.create('div.mask', 4, fn);
        this.create('div.rect', 1, fn);

        typeof this.options.callback === 'function' && this.options.callback();
    }

    /**
     * 注册事件绑定
     */
    FrameSelection.prototype.bind = function () {
        var self = this;
        let container = document.getElementById("container")
        let shareVideo = document.getElementsByClassName("shareVideo")[0]

        this.$rangeEl.bind('mousedown', function (event) {
            if(window.record.currentRecoderType !== 'areaVideo'){
                console.warn("current recoderType is not areaVvideo")
                return
            }
            if(window.record.isUploadVideo){
                console.warn("上传视频文件")
                shareVideo =  document.getElementsByClassName("shareLocalVideo")[0]
            }


            event.preventDefault();

            window.startPositionX = event.pageX - container.offsetLeft - shareVideo.offsetLeft ;
            window.startPositionY = event.pageY - container.offsetTop - shareVideo.offsetTop ;
            window.lefts = event.offsetX
            window.tops = event.offsetY;
            window.mouseDownLeft = event.clientX
            window.mouseDownTop  = event.clientY



            var start = new Point(event.pageX, event.pageY);

            //清理
            self.clear();
            self.createElToDom();

            self.$rangeEl.bind('mousemove', function (e) {
                var end = new Point(e.pageX, e.pageY);

                //绘制
                self.render(start, end);

            })

        });

        this.$rangeEl.bind('mouseup', function (e) {
            if(window.record.isUploadVideo){
                console.warn("上传视频文件...")
                shareVideo =  document.getElementsByClassName("shareLocalVideo")[0]
            }


            window.endPositionX = e.pageX  - container.offsetLeft -  shareVideo.offsetLeft  ;
            window.endPositionY = e.pageY  - container.offsetTop - shareVideo.offsetTop  ;


            window.endLeft = e.offsetX
            window.endTop = e.offsetY

            finish()
            self.$rangeEl.off('mousemove');
        })

    }



})(window.jQuery);