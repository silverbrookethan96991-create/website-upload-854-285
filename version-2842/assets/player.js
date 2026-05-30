(function () {
  function startMoviePlayer(videoId, coverId, streamUrl) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    var hls = null;
    var attached = false;

    if (!video || !cover || !streamUrl) {
      return;
    }

    function attach() {
      if (attached) {
        return Promise.resolve();
      }

      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        return Promise.resolve();
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        return new Promise(function (resolve) {
          var done = false;
          function finish() {
            if (!done) {
              done = true;
              resolve();
            }
          }
          hls.on(window.Hls.Events.MANIFEST_PARSED, finish);
          window.setTimeout(finish, 1200);
        });
      }

      video.src = streamUrl;
      return Promise.resolve();
    }

    function play() {
      cover.classList.add('is-hidden');
      attach().then(function () {
        var action = video.play();
        if (action && typeof action.catch === 'function') {
          action.catch(function () {
            cover.classList.remove('is-hidden');
          });
        }
      });
    }

    cover.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', function () {
      cover.classList.add('is-hidden');
    });
    video.addEventListener('ended', function () {
      cover.classList.remove('is-hidden');
    });
    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.startMoviePlayer = startMoviePlayer;
})();
