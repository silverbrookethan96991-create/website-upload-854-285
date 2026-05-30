(function () {
  function setMessage(root, message) {
    var messageNode = document.querySelector('[data-player-message]');
    if (messageNode) {
      messageNode.textContent = message;
    }
  }

  function initPlayer(root) {
    var video = root.querySelector('video');
    var overlay = root.querySelector('[data-player-overlay]');
    var playButton = root.querySelector('[data-player-play]');
    var sourceButtons = Array.prototype.slice.call(document.querySelectorAll('[data-source-url]'));
    var hls = null;
    var currentSource = root.getAttribute('data-primary-source');

    if (!video || !currentSource) {
      return;
    }

    function destroyHls() {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    }

    function loadSource(sourceUrl, autoplay) {
      currentSource = sourceUrl;
      destroyHls();

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setMessage(root, '播放源已加载，可以开始播放。');
          if (autoplay) {
            video.play().catch(function () {
              setMessage(root, '浏览器阻止了自动播放，请再次点击播放器播放。');
            });
          }
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage(root, '当前线路加载异常，请切换备用线路或稍后重试。');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = sourceUrl;
        if (autoplay) {
          video.play().catch(function () {
            setMessage(root, '浏览器阻止了自动播放，请再次点击播放器播放。');
          });
        }
        setMessage(root, '正在使用浏览器原生 HLS 播放能力。');
      } else {
        video.src = sourceUrl;
        setMessage(root, '浏览器暂不支持 HLS.js 或原生 m3u8，请更换现代浏览器访问。');
      }
    }

    function beginPlayback() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      loadSource(currentSource, true);
    }

    if (playButton) {
      playButton.addEventListener('click', beginPlayback);
    }

    if (overlay) {
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          beginPlayback();
        }
      });
    }

    sourceButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        sourceButtons.forEach(function (item) {
          item.classList.remove('is-active');
        });
        button.classList.add('is-active');
        var sourceUrl = button.getAttribute('data-source-url');
        if (sourceUrl) {
          if (overlay) {
            overlay.classList.add('is-hidden');
          }
          loadSource(sourceUrl, true);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('.js-player');
    if (root) {
      initPlayer(root);
    }
  });
})();
