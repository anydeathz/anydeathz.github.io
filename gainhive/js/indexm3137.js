// landscape hint
function landscape(isVertical, config) {
    var showWay = isVertical ? "@media screen and (min-aspect-ratio: 12/7){#orientLayer{display:block;} }" :
        "@media all and (orientation : portrait){#orientLayer{display: block;} }";
    var color = config && config.color ? config.color : "#000",
        images = config && config.images ? config.images :
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIYAAADaCAMAAABU68ovAAAAXVBMVEUAAAD29vb////x8fH////////x8fH5+fn29vby8vL////5+fn39/f6+vr////x8fH////////+/v7////09PT////x8fH39/f////////////////////x8fH///+WLTLGAAAAHXRSTlMAIpML+gb4ZhHWn1c2gvHBvq1uKJcC6k8b187lQ9yhhboAAAQYSURBVHja7d3blpowFIDhTUIAOchZDkre/zE7ycySrbUUpsRN2/1fzO18KzEqxEVgTiZNfgmmtxRc8iaR8HNe8x4BtjQePKayYCIoyBSgvNNE1AkNSHqZyLqk97EgUCCHBzZ5mkg7ScvIJuIyOyXBRFxgpqWZyGsAZLB1KjsJi8nutHU4JCRbFRH8tmirI9k8Jx2sqNs8K/m0LQkrktO2crgcgXGB4AiTEsB0hJfo9MGgX7CGcYiYwQxmMOOvZwRhBG8tCoMXjBDeXvWCEcHbi14wgCBmMIMZzGAGM5jxETNwzMAxA8cMHDNwzMAxA8cMHDNwzMAxA8cMHDNwzMAxY6E2rUQxnH2tz9cirlJFwFBJedaPnUv0M7++egPDE8iAJcIDmxwH5wwv9vUviw2kLbVO3TJU5uul/EyB0FoLp4x60PdGUd3qPurrWyjGGTc05u+1dcgI7/+tCCPARWGhH7o5Y7RCf+bH9ctXLp6v2BVDxfqz0oPXeSVaNtINo/1SXDv4dck8IIkbhtC2ol+iouEonTBCbYvVMnXOjxww6s/RFrBUpXHh/gw1rHj5d/qhYn9Gpk2FWh6xRBRX5Oj3Znh2Sq49/L6+y8pB26q9GbE2dbA2mVbx6I+7MfBglLCttm73ZQi7AD3iL4HqjFYJHSPRppqaUaJ3ATpGa+ckpGak2hRRMyqjGMkvl+xyFeSMwjAqcsZgGDdyhl0oNTnDN4yenJGZFGxNChP5/Y3efh6SM2rDOJMzboYxkDMqwyjIGcIw6F+io2FU1IxIm1JqRmgXSkvNKNCXeTpGrU0JNSO2c6LIGPgCS8AuDHz9ta0SXWDtxoDRH+MqlbC2Dt2G2JFRadtQZt2qq/orGowdGb2euxYiqWEpVWhTBnszoNAPdStuQwxqf0aocdWKW4Z+DfszIh8pxJqbuCE4YAC+4bm0evtipjpgJHeFnyyt1Ku2xa0bhjxr27p75rECNwyI9ZwvXkHq+7aTaMEV44YYy/spfgjgjNHaWW+GeUhGEX7tLlVinIFDDSgnOwhi1V6bU0b6tVS9eAERe863g4dRrtiHdc6o+nn5vtyVVgR79Cqt4uL6gfHPQyGqtP2vf7HADGbcYwaOGThm4JiBYwaOGThm4JiBYwaOGThm4JiBYwaOGThm4JiBYwaOGThm4JjhtOM+J/AgT008yDMkN/dPP9hzS8zAMQN3OEYeekp5YU7KOKXwVXqiY+QS7smcinGKABWdiBgpPJTSMHJ4KidhhPBUSMLw4CmPhKHgKUXCkHsygum71ftNSgCX6bsl8FQyfbcL5EdYsDk0R3j7aiA5wpt5AjKg/2gLJEBD/0Hf2OOf/vRrj6z/7GtP4B3nMKyjHA12kIPSjnJs3FEO0TvKkYJHOWCR+rjJH0Vn6fI5PjNbAAAAAElFTkSuQmCC";
    // style
    var nodeStyle = document.createElement('style');
    nodeStyle.setAttribute('type', 'text/css');
    nodeStyle.innerHTML =
        '@-webkit-keyframes rotation{10%{transform: rotate(90deg); -webkit-transform: rotate(90deg)} 50%, 60%{transform: rotate(0deg); -webkit-transform: rotate(0deg)} 90%{transform: rotate(90deg); -webkit-transform: rotate(90deg)} 100%{transform: rotate(90deg); -webkit-transform: rotate(90deg)} } @keyframes rotation{10%{transform: rotate(90deg); -webkit-transform: rotate(90deg)} 50%, 60%{transform: rotate(0deg); -webkit-transform: rotate(0deg)} 90%{transform: rotate(90deg); -webkit-transform: rotate(90deg)} 100%{transform: rotate(90deg); -webkit-transform: rotate(90deg)} } #orientLayer{display: none; z-index: 999999;} ' +
        showWay +
        ' .mod-orient-layer{display: none; position: fixed; height: 100%; width: 100%; left: 0; top: 0; right: 0; bottom: 0; background: ' +
        color +
        '; z-index: 9997} .mod-orient-layer__content{position: absolute; width: 100%; top: 50%; margin-top: -75px; text-align: center} .mod-orient-layer__icon-orient{background-image: url(' +
        images +
        '); display: inline-block; width: 67px; height: 109px; transform: rotate(90deg); -webkit-transform: rotate(90deg); -webkit-animation: rotation infinite 1.5s ease-in-out; animation: rotation infinite 1.5s ease-in-out; -webkit-background-size: 67px; background-size: 67px} .mod-orient-layer__desc{margin-top: 20px; font-size: 15px; color: #fff}'
    document.getElementsByTagName('body')[0].appendChild(nodeStyle);
    // dom
    var nodeDom = document.createElement('div');
    nodeDom.setAttribute('id', 'orientLayer');
    nodeDom.setAttribute('class', 'mod-orient-layer');
    nodeDom.innerHTML =
        '<div class="mod-orient-layer__content"> <i class="icon mod-orient-layer__icon-orient"></i> </div>';
    document.getElementsByTagName('body')[0].appendChild(nodeDom);
};
landscape(1);
//top nav
$('.anydeath_nvlist').on('click','a',function(){
  var index = $(this).index();
  $(this).addClass('cur').siblings().removeClass('cur');

  $(this).parent().attr('class','anydeath_nvlist cn' + (index+1));
  $('.anydeath_tnv_drawer').removeClass('show')
  swiperPage.fullChange.slideTo(index);
});
$('.anydeath_menu').on('click',function(){
  $('.anydeath_tnv_drawer').addClass('show')
});
$('.anydeath_menu_close').on('click', function(){
  $('.anydeath_tnv_drawer').removeClass('show')
})

function addZero(n){
  return n < 10 ? '0' + n : n;
}
// swiper change
var swiperPage = function(){
  // fullpage
  var fullChange = new Swiper('.anydeath_wrap',{
      direction : 'vertical',
      touchRatio : 0.1,
      mousewheel: false,
      // autoHeight:true,
      slidesPerView :'auto',
      pagination: {
        el: '.anydeath_rpg',
        type: 'custom',
        renderCustom(swiper, current, total){
          // return number<10?'0'+number:number;
          return addZero(current) + '<span class="anydeath_spac">/</span>' + addZero(total);
        }
      },
      on:{
        slideChange(){
          var actIndex = this.activeIndex;
          $('.anydeath_nvlist a').eq(actIndex).addClass('cur').siblings().removeClass('cur')
          // sideChange.slideTo(actIndex);

          $('.anydeath_nvlist').find('a').eq(actIndex).addClass('cur').siblings().removeClass('cur');
          $('.anydeath_nvlist').attr('class','anydeath_nvlist cn' + (actIndex+1));
        }
      }
  })
  function updateFullChange() {
    fullChange && fullChange.update(true)
    visitionChange && visitionChange.update(true)
    charSwiper && charSwiper.update(true)
  }
  document.addEventListener('DOMContentLoaded', updateFullChange, false);
  window.addEventListener('resize', updateFullChange, false);
  window.addEventListener('load', updateFullChange, false);

  // vision
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

  // character
  var charSwiper;
  function initCharSwipe(index) {
    if (charSwiper) charSwiper.destroy();
    charSwiper = new Swiper('.anydeath_char_ct'+(index+1)+' .anydeath_char_woman', {
      direction: 'horizontal',
      slidesPerView: 1,
      loop: true,
      navigation: {
        prevEl: '.anydeath_role_prev',
        nextEl: '.anydeath_role_next'
      },
      on: {
        transitionStart: function() {
          $('.anydeath_char_ct'+(index+1)).find('.anydeath_rolechange li').eq(this.realIndex).addClass('swiper-slide-active').siblings().removeClass('swiper-slide-active');
        }
      }
    })
  }
  $('.anydeath_char_side').on('click','a',function(){
    var index = $(this).index();
    $(this).addClass('cur').siblings().removeClass('cur');
    $('.anydeath_char_ct').eq(index).addClass('show').siblings().removeClass('show');
    initCharSwipe(index)
  })
  initCharSwipe(0);

  $('.anydeath_rolechange').on('click','li',function(){
    var index = ~~$(this).index();
    charSwiper && charSwiper.slideToLoop(index);
  })
  // boss
  $('.anydeath_bos').on('click','li',function(){
    var index = $(this).index();
    bossDetailChange(index);
  })
  $('.anydeath_bos_back').on('click',function(){
    detailChange(false)
    $('.anydeath_detail_box').removeClass('show');
    $('.anydeath_detail_box').addClass('hide');
    setTimeout(function(){
      $('.anydeath_detail_box').removeClass('show hide');
    }, 600)
  })


  var bossDetail = null;
  var roleDetail = null;
  function bossDetailChange(n){
    if(bossDetail){bossDetail.destroy();bossDetail = null;}

    detailChange(true)
    $('.anydeath_detail_box').removeClass('hide');
    $('.anydeath_detail_box').addClass('show');
    bossDetail = new Swiper('.anydeath_detail_bos',{
      direction: 'horizontal',
      slidesPerView: 1,
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
    setTimeout(function(){
      bossDetail && bossDetail.update(true);
    }, 600);
  }
  // is inner page?
  function detailChange(open){

    if(open==true){
      $('.anydeath_tnv').addClass('hide');
      fullChange.detachEvents();
    }else{
      $('.anydeath_tnv').removeClass('hide');
      fullChange.attachEvents()
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
            translate = slideProgress * modify * 120 + 'px';
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
 return { fullChange: fullChange }
}();

// media show
$('.anydeath_media_list').on('click','li',function(){
  var index = $(this).index();
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
})

// $('.anydeath_media_prg').on('click','li',function(){
//   var index = $(this).index();
//   $(this).addClass('cur').siblings().removeClass('cur');

//   $('.anydeath_media_list').find('li').eq(index).addClass('cur').siblings().removeClass('cur');

// })


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
