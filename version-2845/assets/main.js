const Hls = window.Hls;

const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function initMenu() {
  const toggle = select('.js-menu-toggle');
  const nav = select('.js-mobile-nav');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function initHero() {
  const slides = selectAll('[data-hero-slide]');
  const dots = selectAll('[data-hero-dot]');
  const prev = select('.js-hero-prev');
  const next = select('.js-hero-next');

  if (!slides.length) {
    return;
  }

  let current = 0;
  let timer = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => slide.classList.toggle('active', idx === current));
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === current));
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 5200);
  };

  prev?.addEventListener('click', () => {
    show(current - 1);
    restart();
  });

  next?.addEventListener('click', () => {
    show(current + 1);
    restart();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      show(Number(dot.dataset.heroDot || 0));
      restart();
    });
  });

  restart();
}

function initSearch() {
  const inputs = selectAll('.js-search-input');

  inputs.forEach((input) => {
    const scope = input.closest('main') || document;
    const cards = selectAll('.movie-card', scope);
    const empty = select('.js-empty-state', scope);

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const haystack = (card.dataset.search || card.textContent || '').toLowerCase();
        const matched = !query || haystack.includes(query);
        card.classList.toggle('hidden-by-search', !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    });
  });
}

function initPlayers() {
  selectAll('.js-player').forEach((player) => {
    const video = select('video', player);
    const overlay = select('.player-overlay', player);
    const status = select('.player-status', player);
    const stream = player.getAttribute('data-stream');
    let ready = false;
    let hls = null;

    if (!video || !stream) {
      return;
    }

    const setStatus = (text) => {
      if (status) {
        status.textContent = text;
      }
    };

    const attach = () => {
      if (ready) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        ready = true;
        return;
      }

      if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => setStatus('点击继续播放'));
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data && data.fatal) {
            setStatus('播放暂时不可用');
            player.classList.remove('is-playing');
          }
        });
        ready = true;
        return;
      }

      setStatus('播放暂时不可用');
    };

    const start = () => {
      attach();
      player.classList.add('is-playing');
      video.play().catch(() => setStatus('点击继续播放'));
    };

    overlay?.addEventListener('click', start);

    video.addEventListener('click', () => {
      if (!ready || video.paused) {
        start();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', () => {
      player.classList.add('is-playing');
      setStatus('正在播放');
    });

    video.addEventListener('pause', () => {
      if (!video.ended) {
        setStatus('继续播放');
      }
    });

    window.addEventListener('pagehide', () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initHero();
  initSearch();
  initPlayers();
});
