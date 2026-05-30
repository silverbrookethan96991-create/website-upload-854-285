(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-hero-slider]').forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle('is-active', itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle('is-active', itemIndex === index);
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
        timer = null;
      }
    }

    dots.forEach(function (dot, itemIndex) {
      dot.addEventListener('click', function () {
        show(itemIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
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
  });

  document.querySelectorAll('[data-filter-form]').forEach(function (panel) {
    var root = panel.parentElement || document;
    var cards = Array.prototype.slice.call(root.querySelectorAll('.movie-card'));
    var input = panel.querySelector('[data-search-input]');
    var category = panel.querySelector('[data-category-filter]');
    var region = panel.querySelector('[data-region-filter]');
    var genre = panel.querySelector('[data-genre-filter]');
    var reset = panel.querySelector('[data-reset-filter]');
    var empty = root.querySelector('[data-empty-state]');

    function valueOf(field) {
      return field ? field.value.trim().toLowerCase() : '';
    }

    function apply() {
      var query = valueOf(input);
      var categoryValue = valueOf(category);
      var regionValue = valueOf(region);
      var genreValue = valueOf(genre);
      var visible = 0;

      cards.forEach(function (card) {
        var search = (card.getAttribute('data-search') || '').toLowerCase();
        var cardCategory = (card.getAttribute('data-category') || '').toLowerCase();
        var cardRegion = (card.getAttribute('data-region') || '').toLowerCase();
        var cardGenre = (card.getAttribute('data-genre') || '').toLowerCase();
        var matched = true;

        if (query && search.indexOf(query) === -1) {
          matched = false;
        }
        if (categoryValue && cardCategory !== categoryValue) {
          matched = false;
        }
        if (regionValue && cardRegion.indexOf(regionValue) === -1 && search.indexOf(regionValue) === -1) {
          matched = false;
        }
        if (genreValue && cardGenre.indexOf(genreValue) === -1 && search.indexOf(genreValue) === -1) {
          matched = false;
        }

        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, category, region, genre].forEach(function (field) {
      if (!field) {
        return;
      }
      field.addEventListener('input', apply);
      field.addEventListener('change', apply);
    });

    if (reset) {
      reset.addEventListener('click', function () {
        [input, category, region, genre].forEach(function (field) {
          if (field) {
            field.value = '';
          }
        });
        apply();
      });
    }
  });
})();
