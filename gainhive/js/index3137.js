var zoom  = 1;
var zoom2  = 1;
var adaptViewport = (function() {
  function detectIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.match(/MSIE (\d+)/g);
    if (msie != null) {
      return parseInt(msie[0].match(/\d+/g)[0]);
    }
    // IE 11
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    return false;
  }
  var minWidth = 1400; // 最小宽度
  var minheight = 700; // 最小高度
  var designWidth = 1920; // 设计稿宽度
  var designHeight = 1000; // 设计稿高度
  var isFirefox = navigator.userAgent.indexOf("Firefox") != -1
  var ieVersion = detectIE();

  function resize() {
    // doc.clientWidth不包含滚动栏宽度
    var ww = document.documentElement.clientWidth || window.innerWidth;
    var hh = document.documentElement.clientHeight || window.innerHeight;

    var realWid = Math.max(ww, minWidth);
    var realHei = Math.max(hh, minheight);
    zoom = realWid / designWidth
    zoom2 = realHei / designHeight
    var trueZoom = Math.min(zoom, zoom2);
    if (ieVersion && ieVersion < 9) {
      return;
    }
    // firefox不支持zoom. ie9,10,11 zoom表现奇怪
    if (isFirefox || ieVersion >= 9) {
      if (trueZoom !== 1) {
        $('.zomc').css({"transform": 'scale('+zoom+')','height':hh/zoom,'width':designWidth,'transform-origin':'0% 0%'});
        $('.anydeath_page_char.zomc').css({"transform": 'scale('+trueZoom+')','height':hh/trueZoom,'width':designWidth,'transform-origin':'0% 0%'});
        $('.anydeath_head_inner.zomc').css({'margin': zoom > 1 ? '0': '0 auto'})
        $('.anydeath_detail_zindex.zomc').css({'transform': 'scale('+zoom+') translate(-50%, 0)'})
        $('.side_bar.zomc').css({'height':330*zoom, 'margin-top': 330*zoom/2*-1,'transform-origin': '100% 0%'});
      }
    } else {
      $('.zomc').css({
        'width': designWidth,
        'zoom': trueZoom
      });
      $('.anydeath_head_inner.zomc').css('width', '100%');
      $('.reverszomc').css({
        'zoom': 1/trueZoom
      });
    }
  }
  resize();
  window.onresize = resize;
  // 当切换tab等情形导致.wrap高度改变时，调用此函数。

  function resizeWrapScale() {
    $('.wrap-scale').css({
      'height': $('.anydeath_wrap').outerHeight() * zoom
    })
  }
  return {
    zoom: zoom,
    resizeWrapScale: resizeWrapScale
  }
})();

//top nav
var nvlistPage = 0;
$('.anydeath_nvlist').on('click','a',function(){
  var index = $(this).index();
  nvlistPage = index;
  $(this).addClass('cur').siblings().removeClass('cur');

  $(this).parent().attr('class','anydeath_nvlist cn' + (index+1));

  swiperPage.fullChange.slideTo(index);
});

$('.anydeath_nvlist').on('mouseenter','a',function(){
  var index = $(this).index();
  $(this).addClass('cur').siblings().removeClass('cur');

  $(this).parent().attr('class','anydeath_nvlist cn' + (index+1));
});

$('.anydeath_nvlist').on('mouseout',function(ev){
  var index = $(this).index();
  $('.anydeath_nvlist').find('a').eq(nvlistPage).addClass('cur').siblings().removeClass('cur');

  $('.anydeath_nvlist').attr('class','anydeath_nvlist cn' + (nvlistPage+1));
});




function addZero(n){
  return n < 10 ? '0' + n : n;
}

// swiper change
var swiperPage = function(){
  var roleJlTime = null;
  var logoChoose = 0;
  // fullpage
  var fullChange = new Swiper('.anydeath_wrap',{
      direction : 'vertical',
      touchRatio : 0.1,
      mousewheel: true,
      autoHeight:true,
      slidesPerView :'auto',
      pagination: {
        el: '.anydeath_rpg',
        type: 'custom',
        renderCustom(swiper, current, total){
          // return number<10?'0'+number:number;
          var len = swiper.slides.length - 1;
          if(current>len){current = len};
          if(total>len){total = len};
          return addZero(current) + '<span class="anydeath_spac">/</span>' + addZero(total);
        }
      },
      on:{
        slideChange(){
          var actIndex = this.activeIndex;
          sideChange.slideTo(actIndex);

          $('.anydeath_nvlist').find('a').eq(actIndex).addClass('cur').siblings().removeClass('cur');

          $('.anydeath_nvlist').attr('class','anydeath_nvlist cn' + (actIndex+1));
        }
      }
  })

  // sidebar
  var sideChange = new Swiper('.side_bar',{
      direction : 'vertical',
      slidesPerView : 5,
      centeredSlides : true,
  })

  var visitionChange = new Swiper('.anydeath_visition',{
      effect:'fade',
      loop:true,
      observer:true,
      observeParents:true,
      observeSlideChildren:true,
      autoplay:{
        delay:10000,
        disableOnInteraction: false,
      },
      on:{
        transitionStart:function(){
          var index = this.previousIndex;
          var actindex = this.activeIndex;
          var realIndex = this.realIndex;

          $(this.slides).removeClass('hideAni');
          $(this.slides).removeClass('showAni');
          $(this.slides).eq(index).addClass('hideAni');
          $(this.slides).eq(actindex).addClass('showAni');

          $('.anydeath_vis_cirprg').find('span').eq(realIndex).addClass('swiper-pagination-bullet-active').siblings().removeClass('swiper-pagination-bullet-active')

        }
      },
      pagination: {
        el: '.anydeath_vis_prg',
        clickable: true,
        renderBullet: function (index, className) {
          $('.anydeath_vis_cirprg').append('<span class="' + className + ' '+(index==0?'swiper-pagination-bullet-active':'')+'"></span>')
          return '<span class="' + className + ' anydeath_p2_kv'+(index+ 1)+'"></span>';
        },
      },
  })


  $('.anydeath_vis_cirprg').on('click','span',function(){
    var index = $(this).index();
    visitionChange.slideToLoop(index);
  })

  $('.side_bar').on('click','li',function(){
    var index = $(this).index();
    fullChange.slideTo(index);
  })

  // character

  $('.anydeath_char_side').on('click','a',function(){
    var index = $(this).index();
    $(this).addClass('cur').siblings().removeClass('cur');
    $(this).find('span').addClass('canshow').siblings().removeClass('canshow');
    $('.anydeath_char_woman').eq(index).show().siblings().hide();
    $('.roledct').eq(index).show().siblings('.roledct').hide();
    logoChoose = index;
  })


  $('.anydeath_bos').on('click','.anydeath_box_namepara',function(){
    var index = $(this).parent().parent().index();
    console.log(index)
    bossDetailChange(index);
  })
  $('.anydeath_bos_back').on('click',function(){
    detailChange(false)
    $('.anydeath_detail_box').css({'transform':'translate(0,0)'});
  })


  var bossDetail = null;
  var roleDetail = null;
  function bossDetailChange(n){
    if(bossDetail){bossDetail.destroy();bossDetail = null;}

    detailChange(true)
    $('.anydeath_detail_box').css({'transform':'translate(-100%,0)'});

    bossDetail = new Swiper('.anydeath_detail_bos',{
      effect:'fade',
      initialSlide:n,
      loop:true,
      navigation: {
        nextEl: '.anydeath_bos_next',
        prevEl: '.anydeath_bos_prev',
      },
      on:{
        transitionStart:function(){
          var realIndex = this.realIndex;
          $('.anydeath_det_left').attr('class','anydeath_det_left ndg'+(realIndex+1));
          $('.anydeath_det_right').attr('class','anydeath_det_right ndg'+(realIndex+1));
        }
      }
    })
  }

  // role detail show

  $('.anydeath_char_woman').on('click','a',function(){
    var index = ~~$(this).attr('data-rolewoman');
    roleDetailChange(index)
  })

  var anmList = {
  };

  $('.anydeath_char_woman').on('mouseenter','a',function(){

    var that = this;
    var canshow = $(this).attr('data-cans');
    $(this).addClass('showjl');
    if(canshow){
      $(this).find('.anydeath_woman_img1').hide();
      $(this).find('.anydeath_woman_img2').show();
      $(this).find('.anydeath_woman_img2').attr("src",$(this).find('.anydeath_woman_img2').attr("gif-src"));
      if(this.timeout){clearTimeout(that.timeout)}
      this.timeout = setTimeout(function(){
        $(that).find('.anydeath_woman_img1').show();
        $(that).find('.anydeath_woman_img2').hide();
        $(that).find('.anydeath_woman_img2').attr("src","");
      },7000)
    }

    // 逐帧动画
    var anmIndex = $(this).attr('class').split(' ')[0];
    var anmInfo = anmList[anmIndex];
    $(this).attr('data-enter', 1)
    renderCharAnm(anmInfo, this)
  })

  function renderCharAnm(anmInfo, charDom) {
    var anmDom = $(charDom).find('.anm');
    if (anmInfo) {
      if (anmInfo.hasLoaded) {
        showCharAnm(anmInfo, charDom)
      } else {
        if (!anmInfo.loading) {
          anmInfo.loading = true;
          preloadImage([anmInfo.file+'.png'], function(){
            anmInfo.loading = false;
            anmInfo.hasLoaded = true;
            if ($(charDom).attr('data-enter') == 1) {
              showCharAnm(anmInfo, charDom)
            }
          }, imgurl+'sprite/')
        }
      }
    }
  }
  function showCharAnm(anmInfo, charDom){
    $(charDom).find('img').hide();
    var anmDom = $(charDom).find('.anm');
    if ($(charDom).attr('data-ainit') == 1) {
      $(anmDom).show().animateSprite('resume');
    } else {
      var anmArr = [];
      for (var i = 0; i < anmInfo.frame - 1; i++) {
        anmArr.push(i);
      }
      $(anmDom).show().animateSprite({
        fps: 24,
        animations: {
          walkRight: anmArr
        },
        loop: true
      });
      $(charDom).attr('data-ainit', 1)
    }
  }

  $('.anydeath_char_woman').on('mouseleave','a',function(){
    $(this).find('img').show();
    $(this).find('.anm').hide();
    $(this).removeAttr('data-enter')
    try {
      $(this).find('.anm').animateSprite('stop');
    } catch(e) {}
  })

  $('.anydeath_role_back').on('click',function(){
    detailChange(false);
    $('.anydeath_cont_cbg2').css({'transform':'translate(0,0)'});
    $('.anydeath_role_det').css({'transform':'translate(0,0)'});
  })

  $('.anydeath_rolechange').on('click','li',function(){
    var index = ~~$(this).attr('data-swiper-slide-index');
    var actIndex = roleDetail.realIndex;

    var next = actIndex + 1 > 2 ? 0 :actIndex + 1;
    var prev = actIndex - 1 < 0 ? 2 :actIndex - 1;

    if(index==next){
      roleDetail.slideNext();
    }else if(index==prev){
      roleDetail.slidePrev();
    }
  })
  function roleDetailChange(n){
    if(roleDetail){roleDetail.destroy(false);roleDetail = null;}
    detailChange(true)
    $('.anydeath_role_det').css({'transform':'translate(-100%,0)'});
    roleDetail = new Swiper($('.roledct').eq(logoChoose).find('.anydeath_rolechange').get(0),{
      initialSlide:n,
      loop:logoChoose==3?false:true,
      slidesPerView : 3,
      centeredSlides : true,
      centeredSlidesBounds: true,
      // slideToClickedSlide:true,
      navigation: {
        nextEl: '.anydeath_role_next',
        prevEl: '.anydeath_role_prev',
      },
      on:{
        transitionStart:function(){
          if(roleJlTime){ clearTimeout(roleJlTime);roleJlTime = null;}
          var index = ~~$(this.slides).eq(this.previousIndex).attr('data-swiper-slide-index');
          var realIndex = this.realIndex;
          console.log(realIndex)

          $('.roledct').eq(logoChoose).find('.rolechange').removeClass('hide');
          $('.roledct').eq(logoChoose).find('.rolechange').removeClass('show');
          $('.roledct').eq(logoChoose).find('.rolechange').eq(index).addClass('hide');
          $('.roledct').eq(logoChoose).find('.rolechange').eq(realIndex).addClass('show');

          $('.roledct').eq(logoChoose).find('.anydeath_role_mhimg').eq(realIndex).addClass('show').siblings().removeClass('show');

        }
      }
    })
  }

  // is inner page?
  function detailChange(open){

    if(open==true){
      $('.side_bar').addClass('hide');
      fullChange.mousewheel.disable();
    }else{
      $('.side_bar').removeClass('hide');
      fullChange.mousewheel.enable()
    }

  }

  // system
  var systemSwiper = new Swiper('.focus_swip', {
      watchSlidesProgress: true,
      slidesPerView: 'auto',
      centeredSlides: true,
      loop: true,
      loopedSlides: 5,
      autoplay: true,
      navigation: {
        nextEl: '.next_btn',
        prevEl: '.prev_btn',
      },
      pagination: {
        el: '.focus_prg',
        clickable :true,
      },
      on: {
        progress: function(progress) {
          for (i = 0; i < this.slides.length; i++) {
            var slide = this.slides.eq(i);
            var slideProgress = this.slides[i].progress;
            modify = 1;
            if (Math.abs(slideProgress) > 1) {
              modify = (Math.abs(slideProgress) - 1) * 0.1 + 1;
            }
            translate = slideProgress * modify * 240 + 'px';
            scale = 1 - Math.abs(slideProgress) / 6.5;
            zIndex = 999 - Math.abs(Math.round(10 * slideProgress));
            slide.transform('translateX(' + translate + ') scale(' + scale + ')');
            slide.css('zIndex', zIndex);
            slide.css('opacity', 1);
            if (Math.abs(slideProgress) > 2.5) {
              slide.css('opacity', 0);
            }
          }
        },
        setTransition: function(swiper, transition) {
          for (var i = 0; i < this.slides.length; i++) {
            var slide = this.slides.eq(i)
            slide.transition(transition);
          }

        }
      }
    })
  return {fullChange}
}()


// media show
$('.anydeath_media_list').on('click','li',function(){
  var index = $(this).index();

  if($(this).hasClass('cur')){
    if(index==0){
      // videoPlay.showVideo('AxeLyENYmCI',true)
      dialog.showDialog('d1');
    }else if(index==1){
      // videoPlay.showVideo('mVK5jX6ToSk',true)
      dialog.showDialog('d1');
    }else if(index==2){
      // videoPlay.showVideo('UHPPVkAPIqY',true)
      dialog.showDialog('d1');
    }else{
      // videoPlay.showVideo('OUnbopZN_zg',true)
      dialog.showDialog('d1');
    }

  }

  $(this).addClass('cur').siblings().removeClass('cur');

  $('.anydeath_media_prg').find('li').eq(index).addClass('cur').siblings().removeClass('cur');

})

$('.anydeath_media_prg').on('click','li',function(){
  var index = $(this).index();
  $(this).addClass('cur').siblings().removeClass('cur');

  $('.anydeath_media_list').find('li').eq(index).addClass('cur').siblings().removeClass('cur');

})




// init YT player
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('videoytb', {
    height: '100%',
    width: '100%'
  });
}
// play YT video
function playVideo(videoId) {
  player.loadVideoById(videoId)
  player.playVideo();
}


/*dialog video*/
// video
var videoPlay = function(){
  var vp = document.getElementById('audio');

  function showVideo(vlink,ytb){

    var isytb = ytb | false;
    $('#videobox').show();

    if(!isytb){
      $('.video_bd').show();
      $('.video_in').hide();
      vp.src = vlink;
      vp.play();
    }else{
      $('.video_in').show();
      $('.video_bd').hide();
      playVideo(vlink);
    }

  }
  function closeVideo(){
    $('#videobox').hide();
    player.pauseVideo();
    $('.video_bd').attr("src","");
  }
  return {showVideo,closeVideo}
}()
// dialog
var dialog = function(){
  function showDialog(id){
    $('#'+id).show();
  }
  function closeDialog(){
    $('.dia').hide();
  }

  $('.dia').on('click',function(ev){
    if($(ev.target).hasClass('dia')){
      $(this).hide();
    }
  })
  return {showDialog,closeDialog}
}()

// audio(cv) play

function autoPlay(id, callback){
  var audio = document.getElementById(id);
  audio.play();
  $(audio).off('ended');
  $(audio).on('ended', function(){
    callback && callback()
  })
}

$('.anydeath_rolecv').on('click',function(){
  var vid = $(this).attr('data-cv');
  var target = this;
  $(target).addClass('on');
  autoPlay(vid, function(){
    $(target).removeClass('on')
  })
})




var imgurl = 'images/';

function preloadImage(names, cb, prefix){
    window.gkaCache = window.gkaCache || [];
    var n = 0,img,imgs = {};
    names.forEach(function(name) {
        img = new Image();
        window.gkaCache.push(img);
        img.onload = (function(name, img) {
            return function() {
                imgs[name] = img;
                (++n === names.length) && cb && cb(imgs);
            }
        })(name, img);
        img.src = (prefix || '') + name;
    });
}

preloadImage(["Elysion_white_sq_63.png"], function() {
  $('.anydeath_char_logo1').addClass('canshow');
}, imgurl+'elysion/')


preloadImage(["Missilis_white_sq_76.png"], function() {
  $('.anydeath_char_logo2').addClass('canshow');
}, imgurl+'missilis/')


preloadImage(["Pilgrim_white_sq_65.png"], function() {
  $('.anydeath_char_logo3').addClass('canshow');
}, imgurl+'polgrim/')

preloadImage(["Tetra_white_sq_57.png"], function() {
  $('.anydeath_char_logo4').addClass('canshow');
}, imgurl+"tetra/")
