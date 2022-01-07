
(function(){

    let canvas = document.getElementById('cas')
    let ctx = canvas.getContext('2d')
    let outCanvas = document.createElement('canvas')
    let outCtx = outCanvas.getContext('2d')
    outCanvas.width = canvas.width
    outCanvas.height = canvas.height

    let audioSource;  // 音频源
    let bufferSource;  // buffer 源
    let context = null
    let analyser
    let gainnode
    let playType =  document.getElementsByClassName('play-type')[0]
    let mute = document.getElementsByClassName('muti')[0]
    let stop = document.getElementsByClassName('stop')[0]
    let addMusic = document.getElementsByClassName("add-music")[0]
    let musicFile = document.getElementsByClassName('music-file')[0]
    let musicList = document.getElementsByClassName('music-list')[0]
    let isMute
    let li
    let musicArray= []

    let AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;  // 实例化音频对象
    if(!AudioContext){
        alert("This browser does not support audioContext interface, please try it with chrome or firefox")
        return;
    }

    if(!context){
        try {
            context = new AudioContext()
            analyser = context.createAnalyser(); // analyser为analysernode，具有频率的数据，用于创建数据可视化
            gainnode = context.createGain(); // gain为gainNode，音频的声音处理模块
            gainnode.gain.value = 1;
        } catch (e) {
            console.log('!Your browser does not support AudioContext');
        }

    }

    //计时器
    let time = (function(){
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame || function(callback){window.setTimeout(callback,1000/60)}
    })();

    // 播放音乐
    let audio = document.getElementsByClassName("music-player")[0]
    let musics = [
        {
            name: '目及皆是你',
            src: '目及皆是你.mp3',
        },
    ]

    let nowIndex = 0   // 当前播放到的音乐索引
    let singleLoop = false; // 是否单曲循环
    let app = {
        init: function(){
            this.render(musics,musicArray)
            this.bind()
            this.trigger(0)
        },

        bind: function(){
            let This = this
            audio.onended = function(){
                app.trigger(singleLoop ? nowIndex : (nowIndex + 1));
            }

            playType.addEventListener('click',function(){
                singleLoop = !singleLoop
                playType.innerText = singleLoop ? "列表循环" : "单曲循环"
            })

            mute.addEventListener('click',function(){
                isMute = !!gainnode.gain.value
                gainnode.gain.value = isMute ? 0 : 1;
                mute.innerText = isMute ? '取消静音' : '静音'
            })

            addMusic.addEventListener('click', function(){
                musicFile.click()
            })
            stop.addEventListener('click',function(){
                app.stop()
            })

            // 如果用户选取本地音乐则通过fileReader读取
            musicFile.addEventListener('change',function(){
                if(this.files.length === 0) return;
                let files = Array.prototype.slice.call(this.files)
                files.forEach(function(file){
                    let fr = new FileReader()
                    fr.readAsArrayBuffer(file)
                    let medata = {
                        name: file.name.substring(0,file.name.lastIndexOf(".")),
                        buffer: null,
                        decoding: true
                    };
                    musics.push(medata)

                    fr.onload = function (e) {
                        decodeBuffer(e.target.result, function (buffer) {
                            medata.buffer = buffer;
                            medata.decoding = false;
                            $(".music-list li").eq(musics.indexOf(medata)).html(medata.name);
                        })
                    };
                })
                This.render(musics,musicArray);
            })

            $(".music-list").on("click", "li", function() {
                var index = $(".music-list li").index($(this));
                This.trigger(index);
            });
        },

        trigger: function(index) {
            index = index >= musics.length ? 0 : index;
            if (musics[index].decoding)return;

            this.stop();

            nowIndex = index;

            // $(".music-list li").eq(index).addClass("playing").siblings().removeClass("playing");
            li = document.getElementsByClassName("music-list")[0].getElementsByTagName("li")
            for(let i = 0 ; i<= li.length; i++){
                if(i == index){
                    li[i].removeAttribute("class","playing")
                }
            }

            if (musics[index].src) {
                chooseMusic(musics[index].src);
            } else if (musics[index].buffer) {
                playMusic(musics[index].buffer);
            }
        },

        stop: function() {
            isMute  = !!gainnode.gain.value;

            if (!isMute) {
                gainnode.gain.value = 0;
            }

            if (!audio.ended || !audio.paused) audio.pause();

            if (bufferSource && ('stop' in bufferSource)) bufferSource.stop();

            try {
                if (bufferSource) {
                    bufferSource.disconnect(analyser);
                    bufferSource.disconnect(context.destination);
                }

                if (audioSource) {
                    audioSource.disconnect(analyser);
                    audioSource.disconnect(context.destination);
                }
            } catch (e) {
            }

            if (!isMute) {
                gainnode.gain.value = 1;
            }
        },

        render: function(musics,musicArray) {
            let mus = []
            for(let i = 0; i < musics.length; i++ ){
                let musobj1 = musics[i].name
                let isExist = false
                if(musicArray.length > 0){
                    let j
                    for(j = 0; j < musicArray.length; j++ ){
                        let musobj2 = musicArray[j].name
                        if(musobj1 === musobj2){
                            isExist = true
                            break;
                        }

                        if(j+1 == musicArray.length  && !isExist){
                            mus.push(musics[i])
                        }
                    }
                }else{
                    mus.push(musics[i])
                }
            }
            if(mus.length > 0){
                for(let k = 0; k < mus.length; k++){
                    musicArray.push(mus[k])
                    let li = document.createElement('li')
                    li.setAttribute("title","music.name")
                    li.innerText = mus.decoding? "解码中..." : mus[k].name
                    musicList.appendChild(li)
                }
            }
            // $(".music-list li").eq(nowIndex).addClass("playing");
            li = document.getElementsByClassName("music-list")[0].getElementsByTagName("li")
            for(let i = 0 ; i<= li.length; i++){
                if(i == nowIndex){
                    li[i].setAttribute("class","playing")
                }
            }
        }
    }

    //选择audio作为播放源
    function chooseMusic(src) {
        audio.src = src;
        audio.load();
        playMusic(audio);
    }

    //对音频buffer进行解码
    function decodeBuffer(arraybuffer, callback) {
        context.decodeAudioData(arraybuffer, function(buffer) {
            callback(buffer);
        }, function(e) {
            alert("文件解码失败")
        })
    }

    //音频播放
    function playMusic(arg) {
        console.warn("arg:",arg)
        var source;
        //如果arg是audio的dom对象，则转为相应的源
        if (arg.nodeType) {
            audioSource = audioSource || context.createMediaElementSource(arg);
            source = audioSource;
        } else {
            bufferSource = context.createBufferSource();

            bufferSource.buffer = arg;

            bufferSource.onended = function() {
                app.trigger(singleLoop ? nowIndex : (nowIndex + 1));
            };

            //播放音频
            setTimeout(function() {
                bufferSource.start()
            }, 0);

            source = bufferSource;
        }

        //连接analyserNode
        source.connect(analyser);

        //再连接到gainNode
        analyser.connect(gainnode);

        //最终输出到音频播放器
        gainnode.connect(context.destination);
    }

    //绘制音谱的参数
    let rt_array = [],	//用于存储柱形条对象
        rt_length = 30;		//规定有多少个柱形条

    let grd = ctx.createLinearGradient(0, 110, 0, 270);
    grd.addColorStop(0, "red");
    grd.addColorStop(0.3, "yellow");
    grd.addColorStop(1, "#00E800");

    function showTxt(msg) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "20px 微软雅黑";
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }

    //动画初始化，获取analyserNode里的音频buffer
    function initAnimation() {
        //每个柱形条的宽度，及柱形条宽度+间隔
        var aw = canvas.width / rt_length;
        var w = aw - 5

        for (var i = 0; i < rt_length; i++) {
            rt_array.push(new Retangle(w, 5, i * aw, canvas.height / 2))
        }

        animate();
    }

    function animate() {
        if (!musics[nowIndex].decoding) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            outCtx.clearRect(0, 0, canvas.width, canvas.height);

            //出来的数组为8bit整型数组，即值为0~256，整个数组长度为1024，即会有1024个频率，只需要取部分进行显示
            var array_length = analyser.frequencyBinCount;
            var array = new Uint8Array(array_length);
            analyser.getByteFrequencyData(array);	//将音频节点的数据拷贝到Uin8Array中

            //数组长度与画布宽度比例
            var bili = array_length / canvas.width;

            for (var i = 0; i < rt_array.length; i++) {
                var rt = rt_array[i];
                //根据比例计算应该获取第几个频率值，并且缓存起来减少计算
                rt.index = ('index' in rt) ? rt.index : ~~(rt.x * bili);
                rt.update(array[rt.index]);
            }

            draw();
        } else {
            showTxt("音频解码中...")
        }

        time(animate);
    }

    //制造半透明投影
    function draw() {
        ctx.drawImage(outCanvas, 0, 0);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI);
        ctx.scale(-1, 1);
        ctx.drawImage(outCanvas, -canvas.width / 2, -canvas.height / 2);
        ctx.restore();
        ctx.fillStyle = 'rgba(0, 0, 0, .8)';
        ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    }

    // 音谱条对象
    function Retangle(w, h, x, y) {
        this.w = w;
        this.h = h; // 小红块高度
        this.x = x;
        this.y = y;
        this.jg = 3;
        this.power = 0;
        this.dy = y; // 小红块位置
        this.num = 0;
    }

    let  Rp = Retangle.prototype;

    Rp.update = function(power) {
        this.power = power;
        this.num = ~~(this.power / this.h + 0.5);

        //更新小红块的位置，如果音频条长度高于红块位置，则红块位置则为音频条高度，否则让小红块下降
        var nh = this.dy + this.h;//小红块当前位置
        if (this.power >= this.y - nh) {
            this.dy = this.y - this.power - this.h - (this.power == 0 ? 0 : 1);
        } else if (nh > this.y) {
            this.dy = this.y - this.h;
        } else {
            this.dy += 1;
        }

        this.draw();
    };

    Rp.draw = function() {
        outCtx.fillStyle = grd;
        var h = (~~(this.power / (this.h + this.jg))) * (this.h + this.jg);
        outCtx.fillRect(this.x, this.y - h, this.w, h);
        for (var i = 0; i < this.num; i++) {
            var y = this.y - i * (this.h + this.jg);
            outCtx.clearRect(this.x - 1, y, this.w + 2, this.jg);
        }
        outCtx.fillStyle = "#950000";
        outCtx.fillRect(this.x, ~~this.dy, this.w, this.h);
    };

    app.init();
    initAnimation();

}())