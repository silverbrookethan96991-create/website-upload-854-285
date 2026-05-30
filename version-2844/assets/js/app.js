(function () {
  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupMobileMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHeroSlider() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var previous = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(targetIndex) {
      if (!slides.length) {
        return;
      }
      index = (targetIndex + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle('is-active', current === index);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle('is-active', current === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (previous) {
      previous.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('.js-filter-scope'));
    scopes.forEach(function (scope) {
      var input = scope.querySelector('.js-filter-input');
      var selects = Array.prototype.slice.call(scope.querySelectorAll('.js-filter-select'));
      var items = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
      var count = scope.querySelector('[data-result-count]');

      function apply() {
        var query = normalize(input ? input.value : '');
        var activeSelects = selects.map(function (select) {
          return {
            field: select.getAttribute('data-filter-field'),
            value: normalize(select.value)
          };
        });
        var visible = 0;

        items.forEach(function (item) {
          var haystack = normalize(item.getAttribute('data-filter'));
          var matched = !query || haystack.indexOf(query) !== -1;

          activeSelects.forEach(function (filter) {
            if (!filter.value) {
              return;
            }
            var itemValue = normalize(item.getAttribute('data-' + filter.field));
            if (itemValue !== filter.value) {
              matched = false;
            }
          });

          item.classList.toggle('is-hidden', !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });

      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q && input) {
        input.value = q;
      }

      apply();
    });
  }

  function setupImageFallbacks() {
    var images = Array.prototype.slice.call(document.querySelectorAll('[data-fallback-image]'));
    images.forEach(function (image) {
      image.addEventListener('error', function () {
        image.classList.add('is-missing');
      }, { once: true });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupHeroSlider();
    setupFilters();
    setupImageFallbacks();
  });
})();
