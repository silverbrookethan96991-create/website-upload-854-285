(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  var menuButton = $('[data-menu-toggle]');
  var mobileNav = $('[data-mobile-nav]');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var heroSlides = $all('[data-hero-slide]');
  var heroDots = $all('[data-hero-dot]');
  if (heroSlides.length > 1) {
    var current = 0;
    var showSlide = function (index) {
      current = (index + heroSlides.length) % heroSlides.length;
      heroSlides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      heroDots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    };
    heroDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        showSlide(i);
      });
    });
    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  var searchInput = $('[data-search-input]');
  var typeSelect = $('[data-type-select]');
  var yearSelect = $('[data-year-select]');
  var cards = $all('[data-card]');
  var emptyState = $('[data-no-results]');

  function applyFilter() {
    if (!cards.length) {
      return;
    }
    var keyword = normalize(searchInput && searchInput.value);
    var typeValue = normalize(typeSelect && typeSelect.value);
    var yearValue = normalize(yearSelect && yearSelect.value);
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute('data-filter'));
      var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
      var matchType = !typeValue || haystack.indexOf(typeValue) !== -1;
      var matchYear = !yearValue || haystack.indexOf(yearValue) !== -1;
      var matched = matchKeyword && matchType && matchYear;
      card.style.display = matched ? '' : 'none';
      if (matched) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('is-visible', visible === 0);
    }
  }

  [searchInput, typeSelect, yearSelect].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilter);
      control.addEventListener('change', applyFilter);
    }
  });

  var player = $('[data-player]');
  if (player) {
    var video = $('video', player);
    var playButton = $('[data-play]', player);
    var status = $('[data-player-status]');
    var ready = false;
    var hlsInstance = null;

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function prepareVideo() {
      if (!video || ready) {
        return;
      }
      var stream = video.getAttribute('data-stream');
      if (!stream) {
        setStatus('影片加载失败');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('高清播放');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus('播放连接重试中');
            try {
              hlsInstance.destroy();
            } catch (error) {}
            hlsInstance = null;
            video.src = stream;
          }
        });
      } else {
        video.src = stream;
        setStatus('高清播放');
      }
      ready = true;
    }

    function startVideo() {
      prepareVideo();
      if (!video) {
        return;
      }
      player.classList.add('is-playing');
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          player.classList.remove('is-playing');
          setStatus('点击播放');
        });
      }
    }

    if (playButton) {
      playButton.addEventListener('click', startVideo);
    }
    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startVideo();
        }
      });
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        player.classList.remove('is-playing');
      });
    }
  }
})();
