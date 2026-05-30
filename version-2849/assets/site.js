(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", panel.classList.contains("is-open") ? "true" : "false");
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 4800);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalise(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initFilters() {
    var roots = Array.prototype.slice.call(document.querySelectorAll("[data-filter-root]"));

    roots.forEach(function (root) {
      var input = root.querySelector("[data-filter-input]") || root.querySelector("[data-search-input]");
      var cards = Array.prototype.slice.call(root.querySelectorAll("[data-filter-card]"));
      var chips = Array.prototype.slice.call(root.querySelectorAll("[data-filter-value]"));
      var empty = root.querySelector("[data-empty-state]");
      var activeChip = "all";

      function applyFilter() {
        var query = normalise(input ? input.value : "");
        var visibleCount = 0;

        cards.forEach(function (card) {
          var searchText = normalise(card.getAttribute("data-search"));
          var genreText = normalise(card.getAttribute("data-genre"));
          var chipMatches = activeChip === "all" || genreText.indexOf(activeChip) !== -1 || searchText.indexOf(activeChip) !== -1;
          var queryMatches = !query || searchText.indexOf(query) !== -1;
          var visible = chipMatches && queryMatches;

          card.hidden = !visible;

          if (visible) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.hidden = visibleCount !== 0;
        }
      }

      if (input) {
        input.addEventListener("input", applyFilter);
      }

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          chips.forEach(function (otherChip) {
            otherChip.classList.remove("active");
          });

          chip.classList.add("active");
          activeChip = normalise(chip.getAttribute("data-filter-value"));
          applyFilter();
        });
      });

      applyFilter();
    });
  }

  function initSearchPage() {
    var searchRoot = document.querySelector("[data-search-page]");
    var form = document.querySelector("[data-search-form]");
    var input = document.querySelector("[data-search-input]");

    if (!searchRoot || !input) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";

    if (query) {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var nextUrl = window.location.pathname + "?q=" + encodeURIComponent(input.value.trim());
        window.history.replaceState(null, "", nextUrl);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }

  function initPlayer() {
    var player = document.querySelector("[data-player]");

    if (!player) {
      return;
    }

    var video = player.querySelector("video");
    var button = player.querySelector("[data-play-button]");
    var message = player.querySelector("[data-player-message]");
    var hlsInstance = null;
    var isPrepared = false;

    if (!video || !button) {
      return;
    }

    function showMessage(text) {
      if (!message) {
        return;
      }

      message.textContent = text;
      message.hidden = !text;
    }

    function preparePlayer() {
      return new Promise(function (resolve, reject) {
        var source = video.getAttribute("data-src");

        if (isPrepared) {
          resolve();
          return;
        }

        if (!source) {
          showMessage("当前影片暂未绑定播放源。");
          reject(new Error("Missing video source"));
          return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          isPrepared = true;
          player.classList.add("is-ready");
          resolve();
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            isPrepared = true;
            player.classList.add("is-ready");
            resolve();
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (data && data.fatal) {
              showMessage("播放源加载失败，请稍后重试。");
              reject(new Error("Fatal HLS error"));
            }
          });
          return;
        }

        showMessage("当前浏览器不支持 HLS 播放，请更换现代浏览器访问。");
        reject(new Error("HLS is not supported"));
      });
    }

    function playVideo() {
      preparePlayer()
        .then(function () {
          return video.play();
        })
        .then(function () {
          player.classList.add("is-playing");
          button.classList.add("is-hidden");
          showMessage("");
        })
        .catch(function () {
          player.classList.remove("is-playing");
        });
    }

    button.addEventListener("click", playVideo);

    video.addEventListener("play", function () {
      player.classList.add("is-playing");
      button.classList.add("is-hidden");
    });

    video.addEventListener("pause", function () {
      player.classList.remove("is-playing");
      button.classList.remove("is-hidden");
    });

    video.addEventListener("click", function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });

    preparePlayer().catch(function () {
      return null;
    });
  }

  ready(function () {
    initMobileMenu();
    initHeroSlider();
    initFilters();
    initSearchPage();
    initPlayer();
  });
})();
