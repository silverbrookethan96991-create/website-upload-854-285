(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMobileNav() {
        var button = $('[data-nav-toggle]');
        var nav = $('[data-mobile-nav]');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
    }

    function initHero() {
        var hero = $('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = $all('[data-hero-slide]', hero);
        var dots = $all('[data-hero-dot]', hero);
        if (!slides.length) {
            return;
        }
        var index = 0;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function (event) {
                event.preventDefault();
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
            });
        });
        window.setInterval(function () {
            show(index + 1);
        }, 5200);
    }

    function initLocalFilter() {
        var list = $('[data-filter-list]');
        var input = $('[data-page-search]');
        if (!list) {
            return;
        }
        var cards = $all('.movie-card', list);
        var selectedYear = 'all';
        function apply() {
            var query = input ? input.value.trim().toLowerCase() : '';
            cards.forEach(function (card) {
                var text = card.getAttribute('data-search') || '';
                var year = card.getAttribute('data-year') || '';
                var matchQuery = !query || text.indexOf(query) !== -1;
                var matchYear = selectedYear === 'all' || year === selectedYear;
                card.classList.toggle('is-hidden', !(matchQuery && matchYear));
            });
        }
        if (input) {
            input.addEventListener('input', apply);
        }
        $all('[data-filter-year]').forEach(function (button) {
            button.addEventListener('click', function () {
                selectedYear = button.getAttribute('data-filter-year') || 'all';
                $all('[data-filter-year]').forEach(function (item) {
                    item.classList.toggle('active', item === button);
                });
                apply();
            });
        });
    }

    function initGlobalSearch() {
        var input = $('[data-global-search]');
        var list = $('[data-search-list]');
        if (!input || !list) {
            return;
        }
        var select = $('[data-category-select]');
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        var cards = $all('.movie-card', list);
        input.value = initial;
        function apply() {
            var query = input.value.trim().toLowerCase();
            var category = select ? select.value : 'all';
            cards.forEach(function (card) {
                var text = card.getAttribute('data-search') || '';
                var cardCategory = card.getAttribute('data-category') || '';
                var matchQuery = !query || text.indexOf(query) !== -1;
                var matchCategory = category === 'all' || cardCategory === category;
                card.classList.toggle('is-hidden', !(matchQuery && matchCategory));
            });
        }
        input.addEventListener('input', apply);
        if (select) {
            select.addEventListener('change', apply);
        }
        apply();
    }

    window.initMoviePlayer = function (src) {
        var video = document.getElementById('movie-player');
        var shell = $('[data-player]');
        var button = $('[data-play]');
        if (!video || !shell || !src) {
            return;
        }
        var attached = false;
        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({ enableWorker: true });
                hls.loadSource(src);
                hls.attachMedia(video);
            } else {
                video.src = src;
            }
        }
        function start() {
            attach();
            shell.classList.add('is-playing');
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    shell.classList.remove('is-playing');
                });
            }
        }
        if (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                start();
            });
        }
        shell.addEventListener('click', function (event) {
            if (event.target === video) {
                return;
            }
            start();
        });
        video.addEventListener('click', function () {
            if (!attached) {
                start();
            }
        });
        video.addEventListener('play', function () {
            shell.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
            if (video.currentTime === 0) {
                shell.classList.remove('is-playing');
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMobileNav();
        initHero();
        initLocalFilter();
        initGlobalSearch();
    });
}());
