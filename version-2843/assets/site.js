(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initImageFallbacks() {
    document.querySelectorAll("img").forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("image-failed");
      });
    });
  }

  function initMobileNavigation() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHeroCarousel() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var prev = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = null;
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function cardMatches(card, keyword, type) {
    var haystack = normalize([
      card.getAttribute("data-title"),
      card.getAttribute("data-region"),
      card.getAttribute("data-genre"),
      card.getAttribute("data-year"),
      card.getAttribute("data-tags")
    ].join(" "));

    var typeText = normalize([
      card.getAttribute("data-genre"),
      card.getAttribute("data-tags")
    ].join(" "));

    var keywordOk = !keyword || haystack.indexOf(keyword) !== -1;
    var typeOk = !type || typeText.indexOf(type) !== -1;
    return keywordOk && typeOk;
  }

  function initLocalFilters() {
    document.querySelectorAll("[data-filter-panel]").forEach(function (panel) {
      var section = panel.closest("section") || document;
      var input = panel.querySelector("[data-filter-input]");
      var typeSelect = panel.querySelector("[data-filter-type]");
      var status = panel.querySelector("[data-filter-status]");
      var cards = Array.prototype.slice.call(section.querySelectorAll("[data-card]"));

      if (!cards.length) {
        return;
      }

      function apply() {
        var keyword = normalize(input ? input.value : "");
        var type = normalize(typeSelect ? typeSelect.value : "");
        var visibleCount = 0;

        cards.forEach(function (card) {
          var visible = cardMatches(card, keyword, type);
          card.classList.toggle("is-hidden", !visible);
          if (visible) {
            visibleCount += 1;
          }
        });

        if (status) {
          status.textContent = "当前显示 " + visibleCount + " / " + cards.length + " 部影片";
        }
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      if (typeSelect) {
        typeSelect.addEventListener("change", apply);
      }
      apply();
    });
  }

  function getSearchParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || "",
      category: params.get("category") || "",
      type: params.get("type") || ""
    };
  }

  function renderSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return "" +
      "<article class=\"movie-card medium\" data-card>" +
      "<a class=\"poster-frame\" href=\"" + escapeHtml(movie.url) + "\" aria-label=\"观看 " + escapeHtml(movie.title) + "\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"play-hover\">▶</span>" +
      "<span class=\"duration-badge\">" + escapeHtml(movie.duration) + "</span>" +
      "</a>" +
      "<div class=\"movie-card-body\">" +
      "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.description) + "</p>" +
      "<div class=\"meta-line\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "<div class=\"tag-list\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  function initGlobalSearch() {
    var container = document.querySelector("[data-global-search]");
    if (!container || !window.MOVIE_INDEX) {
      return;
    }

    var input = container.querySelector("[data-global-query]");
    var categorySelect = container.querySelector("[data-global-category]");
    var typeSelect = container.querySelector("[data-global-type]");
    var status = container.querySelector("[data-global-status]");
    var results = container.querySelector("[data-global-results]");
    var initial = getSearchParams();

    if (input) {
      input.value = initial.q;
    }
    if (categorySelect) {
      categorySelect.value = initial.category;
    }
    if (typeSelect) {
      typeSelect.value = initial.type;
    }

    function matches(movie, keyword, category, type) {
      var haystack = normalize([
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.categoryName,
        (movie.tags || []).join(" ")
      ].join(" "));
      var categoryOk = !category || movie.categoryName === category;
      var typeOk = !type || haystack.indexOf(normalize(type)) !== -1;
      var keywordOk = !keyword || haystack.indexOf(keyword) !== -1;
      return categoryOk && typeOk && keywordOk;
    }

    function apply() {
      var keyword = normalize(input ? input.value : "");
      var category = categorySelect ? categorySelect.value : "";
      var type = typeSelect ? typeSelect.value : "";
      var matched = window.MOVIE_INDEX.filter(function (movie) {
        return matches(movie, keyword, category, type);
      });
      var limited = matched.slice(0, 120);

      if (results) {
        results.innerHTML = limited.map(renderSearchCard).join("");
        initImageFallbacks();
      }
      if (status) {
        status.textContent = "共匹配 " + matched.length + " 部影片" + (matched.length > limited.length ? "，当前显示前 " + limited.length + " 部" : "");
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    if (categorySelect) {
      categorySelect.addEventListener("change", apply);
    }
    if (typeSelect) {
      typeSelect.addEventListener("change", apply);
    }
    apply();
  }

  function initPlayers() {
    document.querySelectorAll("[data-player-shell]").forEach(function (shell) {
      var video = shell.querySelector(".hls-player");
      var playButton = shell.querySelector("[data-player-play]");
      var message = shell.querySelector("[data-player-message]");
      var src = video ? video.getAttribute("data-video-src") : "";
      var initialized = false;
      var manifestReady = false;
      var pendingPlay = false;
      var hls = null;

      function setMessage(text) {
        if (message) {
          message.textContent = text || "";
        }
      }

      function attemptVideoPlay() {
        if (!video) {
          return;
        }
        var playPromise = video.play();
        shell.classList.add("is-playing");
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            shell.classList.remove("is-playing");
            setMessage("请再次点击播放器开始播放。");
          });
        }
      }

      function initialize() {
        if (!video || !src || initialized) {
          return;
        }
        initialized = true;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            manifestReady = true;
            setMessage("");
            if (pendingPlay) {
              pendingPlay = false;
              attemptVideoPlay();
            }
          });
          hls.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (data && data.fatal) {
              shell.classList.remove("is-playing");
              setMessage("播放源加载失败，请稍后重试。");
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          manifestReady = true;
        } else {
          setMessage("当前浏览器需要支持 HLS 或加载 hls.js 后播放。");
        }
      }

      function play() {
        initialize();
        if (!video) {
          return;
        }
        if (hls && !manifestReady) {
          pendingPlay = true;
          shell.classList.add("is-playing");
          setMessage("正在加载播放源...");
          return;
        }
        attemptVideoPlay();
      }

      if (playButton) {
        playButton.addEventListener("click", play);
      }
      if (video) {
        video.addEventListener("play", function () {
          shell.classList.add("is-playing");
          setMessage("");
        });
        video.addEventListener("pause", function () {
          shell.classList.remove("is-playing");
        });
      }

      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });

    document.querySelectorAll("[data-scroll-player]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var player = document.querySelector(".player-card");
        if (player) {
          player.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  ready(function () {
    initImageFallbacks();
    initMobileNavigation();
    initHeroCarousel();
    initLocalFilters();
    initGlobalSearch();
    initPlayers();
  });
})();
