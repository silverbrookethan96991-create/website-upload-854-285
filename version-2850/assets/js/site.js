(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function escapeHTML(value) {
        return String(value || '').replace(/[&<>'"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[char];
        });
    }

    function setupNavigation() {
        var toggle = $('[data-nav-toggle]');
        var nav = $('[data-site-nav]');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var slider = $('[data-hero]');
        if (!slider) {
            return;
        }
        var slides = $all('.hero-slide', slider);
        var dots = $all('.hero-dot', slider);
        var prev = $('.hero-prev', slider);
        var next = $('.hero-next', slider);
        if (!slides.length) {
            return;
        }
        var active = 0;
        var timer = null;

        function show(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === active);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === active);
                dot.setAttribute('aria-current', i === active ? 'true' : 'false');
            });
        }

        function play() {
            stop();
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                play();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                show(active - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(active + 1);
                play();
            });
        }
        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function setupFilters() {
        var panels = $all('[data-filter-panel]');
        panels.forEach(function (panel) {
            var input = $('[data-filter-search]', panel);
            var yearSelect = $('[data-filter-year]', panel);
            var regionSelect = $('[data-filter-region]', panel);
            var resetButton = $('[data-filter-reset]', panel);
            var scopeSelector = panel.getAttribute('data-filter-scope') || 'body';
            var scope = $(scopeSelector) || document;
            var cards = $all('[data-movie-card]', scope);
            var count = $('[data-filter-count]');
            var empty = $('[data-empty-result]');

            function apply() {
                var keyword = normalize(input && input.value);
                var year = normalize(yearSelect && yearSelect.value);
                var region = normalize(regionSelect && regionSelect.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.getAttribute('data-title'),
                        card.getAttribute('data-year'),
                        card.getAttribute('data-region'),
                        card.getAttribute('data-genre'),
                        card.getAttribute('data-tags'),
                        card.getAttribute('data-category')
                    ].join(' '));
                    var ok = true;
                    if (keyword && haystack.indexOf(keyword) === -1) {
                        ok = false;
                    }
                    if (year && normalize(card.getAttribute('data-year')) !== year) {
                        ok = false;
                    }
                    if (region && normalize(card.getAttribute('data-region')).indexOf(region) === -1) {
                        ok = false;
                    }
                    card.style.display = ok ? '' : 'none';
                    if (ok) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = '当前显示 ' + visible + ' 部作品';
                }
                if (empty) {
                    empty.style.display = visible ? 'none' : 'block';
                }
            }

            [input, yearSelect, regionSelect].forEach(function (el) {
                if (el) {
                    el.addEventListener('input', apply);
                    el.addEventListener('change', apply);
                }
            });
            if (resetButton) {
                resetButton.addEventListener('click', function () {
                    if (input) {
                        input.value = '';
                    }
                    if (yearSelect) {
                        yearSelect.value = '';
                    }
                    if (regionSelect) {
                        regionSelect.value = '';
                    }
                    apply();
                });
            }
            apply();
        });
    }

    function setupPlayer() {
        $all('[data-player]').forEach(function (shell) {
            var video = $('video', shell);
            var overlay = $('[data-play]', shell);
            var message = $('[data-player-message]', shell.parentNode || document);
            var src = shell.getAttribute('data-src');
            if (!video || !src) {
                return;
            }

            function setMessage(text) {
                if (message) {
                    message.textContent = text;
                }
            }

            function start() {
                if (overlay) {
                    overlay.style.display = 'none';
                }
                setMessage('正在加载播放源...');

                if (window.Hls && window.Hls.isSupported()) {
                    if (!video._hlsInstance) {
                        var hls = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        video._hlsInstance = hls;
                        hls.loadSource(src);
                        hls.attachMedia(video);
                        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                            setMessage('播放源已就绪，可正常观看。');
                            video.play().catch(function () {
                                setMessage('播放源已就绪，请点击播放器继续播放。');
                            });
                        });
                        hls.on(window.Hls.Events.ERROR, function (event, data) {
                            if (data && data.fatal) {
                                setMessage('播放源加载失败，请稍后重试或检查网络。');
                            }
                        });
                    } else {
                        video.play().catch(function () {
                            setMessage('请点击播放器继续播放。');
                        });
                    }
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    if (!video.src) {
                        video.src = src;
                    }
                    video.play().then(function () {
                        setMessage('正在使用浏览器原生 HLS 播放。');
                    }).catch(function () {
                        setMessage('播放源已绑定，请点击播放器继续播放。');
                    });
                } else {
                    video.src = src;
                    video.play().catch(function () {
                        setMessage('当前浏览器需要 HLS 支持，请使用 Safari、Chrome 新版浏览器或等待 hls.js 加载。');
                    });
                }
            }

            if (overlay) {
                overlay.addEventListener('click', start);
            }
            shell.addEventListener('click', function (event) {
                if (event.target === video) {
                    return;
                }
                start();
            });
        });
    }

    function renderMovieCard(movie) {
        return '' +
            '<article class="movie-card" data-movie-card data-title="' + escapeHTML(movie.title) + '" data-year="' + escapeHTML(movie.year) + '" data-region="' + escapeHTML(movie.region) + '" data-genre="' + escapeHTML(movie.genre) + '" data-tags="' + escapeHTML(movie.tags) + '" data-category="' + escapeHTML(movie.category) + '">' +
                '<a class="movie-poster" href="' + escapeHTML(movie.url) + '" aria-label="查看《' + escapeHTML(movie.title) + '》详情">' +
                    '<img src="' + escapeHTML(movie.cover) + '" alt="' + escapeHTML(movie.title) + '" loading="lazy" onerror="this.onerror=null; this.src=\'./assets/fallback-poster.svg\';">' +
                    '<span class="score-badge">' + escapeHTML(movie.rating) + '</span>' +
                '</a>' +
                '<div class="movie-card-body">' +
                    '<div class="movie-meta-line"><span>' + escapeHTML(movie.year) + '</span><span>' + escapeHTML(movie.region) + '</span><span>' + escapeHTML(movie.type) + '</span></div>' +
                    '<h3><a href="' + escapeHTML(movie.url) + '">' + escapeHTML(movie.title) + '</a></h3>' +
                    '<p>' + escapeHTML(movie.oneLine) + '</p>' +
                    '<div class="tag-row"><span>' + escapeHTML(movie.category) + '</span><span>' + escapeHTML(movie.genre) + '</span></div>' +
                '</div>' +
            '</article>';
    }

    function setupSearchPage() {
        var root = $('[data-search-page]');
        if (!root || !window.MOVIE_INDEX) {
            return;
        }
        var input = $('[data-search-input]', root);
        var yearSelect = $('[data-search-year]', root);
        var regionSelect = $('[data-search-region]', root);
        var typeSelect = $('[data-search-type]', root);
        var results = $('[data-search-results]', root);
        var count = $('[data-search-count]', root);
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        if (input) {
            input.value = initial;
        }

        function apply() {
            var keyword = normalize(input && input.value);
            var year = normalize(yearSelect && yearSelect.value);
            var region = normalize(regionSelect && regionSelect.value);
            var type = normalize(typeSelect && typeSelect.value);
            var matches = window.MOVIE_INDEX.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.year,
                    movie.region,
                    movie.type,
                    movie.genre,
                    movie.tags,
                    movie.category,
                    movie.oneLine
                ].join(' '));
                if (keyword && haystack.indexOf(keyword) === -1) {
                    return false;
                }
                if (year && normalize(movie.year) !== year) {
                    return false;
                }
                if (region && normalize(movie.region).indexOf(region) === -1) {
                    return false;
                }
                if (type && normalize(movie.type) !== type) {
                    return false;
                }
                return true;
            });
            var limited = matches.slice(0, 120);
            if (results) {
                results.innerHTML = limited.map(renderMovieCard).join('');
            }
            if (count) {
                count.textContent = '找到 ' + matches.length + ' 部作品' + (matches.length > limited.length ? '，当前展示前 ' + limited.length + ' 部' : '');
            }
        }

        [input, yearSelect, regionSelect, typeSelect].forEach(function (el) {
            if (el) {
                el.addEventListener('input', apply);
                el.addEventListener('change', apply);
            }
        });
        apply();
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupNavigation();
        setupHero();
        setupFilters();
        setupPlayer();
        setupSearchPage();
    });
})();
