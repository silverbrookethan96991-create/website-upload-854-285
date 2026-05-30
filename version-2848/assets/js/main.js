(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    var search = document.querySelector('.nav-search');

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        nav.classList.toggle('is-open');
        if (search) {
          search.classList.toggle('is-open');
        }
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var index = 0;
    var timer = null;

    function showSlide(next) {
      if (!slides.length) {
        return;
      }
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function startSlider() {
      if (slides.length < 2) {
        return;
      }
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5600);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        showSlide(Number(dot.getAttribute('data-slide')) || 0);
        startSlider();
      });
    });

    startSlider();

    Array.prototype.slice.call(document.querySelectorAll('.filter-input')).forEach(function (input) {
      var target = input.getAttribute('data-target') || '.movie-card';
      var cards = Array.prototype.slice.call(document.querySelectorAll(target));
      input.addEventListener('input', function () {
        var keyword = input.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
          card.hidden = keyword.length > 0 && text.indexOf(keyword) === -1;
        });
      });
    });

    var searchResults = document.getElementById('search-results');
    var searchInput = document.getElementById('search-input');
    var searchData = window.SEARCH_MOVIES || [];

    function movieTemplate(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return '<a class="movie-card card-hover" href="' + movie.url + '" data-search="' + escapeHtml(movie.search) + '">' +
        '<span class="poster-wrap">' +
        '<img src="' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
        '<span class="poster-shade"></span><span class="play-badge">▶</span>' +
        '</span>' +
        '<span class="movie-card-body">' +
        '<strong>' + escapeHtml(movie.title) + '</strong>' +
        '<em>' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</em>' +
        '<span class="card-desc">' + escapeHtml(movie.desc) + '</span>' +
        '<span class="tag-row">' + tags + '</span>' +
        '</span>' +
        '</a>';
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    }

    function renderSearch() {
      if (!searchResults || !searchData.length) {
        return;
      }
      var params = new URLSearchParams(window.location.search);
      var keyword = (params.get('q') || '').trim();
      if (searchInput) {
        searchInput.value = keyword;
      }
      var list = searchData;
      if (keyword) {
        var lower = keyword.toLowerCase();
        list = searchData.filter(function (movie) {
          return movie.search.toLowerCase().indexOf(lower) !== -1;
        });
      } else {
        list = searchData.slice(0, 48);
      }
      searchResults.innerHTML = list.slice(0, 120).map(movieTemplate).join('');
    }

    renderSearch();
  });
})();
