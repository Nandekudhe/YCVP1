/* ==========================================================================
   Ember — Product Buy & Showcase Script · product.js
   Slider logic, theme toggle, and SVG rendering.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. Showcase Graphic Variants ---------- */
  function wavePath(base, amp, phase) {
    var d = '';
    for (var x = -80; x <= 400; x += 10) {
      var y = base + amp * Math.sin(x / 26 + phase);
      d += (x === -80 ? 'M' : 'L') + x + ' ' + y.toFixed(1) + ' ';
    }
    return d;
  }

  var ART_VARIANTS = {
    bars: function () {
      var h = [60, 95, 75, 120, 90, 140, 110, 150];
      var k = [1.5, .8, 1.35, .7, 1.25, .75, 1.2, .8];
      var out = '<line class="fg-s" x1="20" y1="200.5" x2="300" y2="200.5"/>';
      h.forEach(function (v, i) {
        out += '<rect class="bar ' + (i === 5 ? 'ac' : 'fg') + '" style="--i:' + i + ';--k:' + k[i] +
          '" x="' + (28 + i * 34) + '" y="' + (200 - v) + '" width="22" height="' + v + '" rx="3"/>';
      });
      return out;
    },
    squares: function () {
      return '<rect class="fg-s" x="40" y="30" width="240" height="160" rx="6"/>' +
        '<rect class="sq-a fg" x="70" y="50" width="90" height="90" rx="6"/>' +
        '<rect class="sq-b ac" x="160" y="90" width="90" height="90" rx="6"/>';
    },
    nodes: function () {
      return '<rect class="n2 fg-s" x="70" y="20" width="180" height="180" rx="26"/>' +
        '<rect class="n1 ac-s" x="100" y="50" width="120" height="120" rx="18"/>' +
        '<rect class="n3 fg" x="125" y="75" width="70" height="70" rx="12"/>';
    },
    network: function () {
      var pts = [[58, 58], [252, 52], [62, 168], [258, 170], [160, 28], [160, 196]];
      var out = '';
      pts.forEach(function (p) {
        out += '<line class="edge fg-s" x1="160" y1="110" x2="' + p[0] + '" y2="' + p[1] + '"/>';
      });
      pts.forEach(function (p) { out += '<circle class="fg" cx="' + p[0] + '" cy="' + p[1] + '" r="7"/>'; });
      return out + '<circle class="hub ac" cx="160" cy="110" r="18"/>';
    }
  };

  /* ---------- 2. Dynamic Slider & Snap Observer ---------- */
  function initShowcase() {
    var track = $('#slider-track');
    var slides = $$('.slide-card', track);
    var dots = $$('.dot');
    var prev = $('#slide-prev');
    var next = $('#slide-next');

    if (!track || !slides.length) return;

    function getIndex() {
      var scrollLeft = track.scrollLeft;
      var slideWidth = slides[0].offsetWidth + 16;
      return Math.round(scrollLeft / slideWidth);
    }

    function scrollToIndex(idx) {
      idx = Math.max(0, Math.min(idx, slides.length - 1));
      var slideWidth = slides[0].offsetWidth + 16;
      track.scrollTo({ left: idx * slideWidth, behavior: 'smooth' });
      updateUI(idx);
    }

    function updateUI(idx) {
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
      });
      slides.forEach(function (s, i) {
        s.classList.toggle('is-active', i === idx);
      });
    }

    // Scroll listener for native thumb swipe on mobile
    var scrollTimer;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        updateUI(getIndex());
      }, 50);
    }, { passive: true });

    // Arrow button triggers
    if (prev) prev.addEventListener('click', function () { scrollToIndex(getIndex() - 1); });
    if (next) next.addEventListener('click', function () { scrollToIndex(getIndex() + 1); });

    // Dot navigation
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { scrollToIndex(i); });
    });
  }

  /* ---------- 3. Theme Toggle ---------- */
  function initTheme() {
    var toggle = $('#theme-toggle');
    if (!toggle) return;

    function setTheme(t) {
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('ember-theme', t); } catch (e) {}
    }

    toggle.addEventListener('click', function () {
      var isDark = root.getAttribute('data-theme') !== 'light';
      setTheme(isDark ? 'light' : 'dark');
    });
  }
  /* ---------- 3b. On-Page Policy Modals ---------- */
  function initPolicyModals() {
    var overlay = $('#policy-overlay');
    var closeBtn = $('#modal-close-btn');
    var bodyContent = $('#modal-body-content');
    var triggerButtons = $$('.policy-link-btn');

    if (!overlay || !bodyContent) return;

    function openModal(contentId) {
      var source = $('#' + contentId);
      if (!source) return;
      bodyContent.innerHTML = source.innerHTML;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    triggerButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modalType = btn.getAttribute('data-modal');
        if (modalType === 'privacy-modal') openModal('privacy-content');
        if (modalType === 'return-modal') openModal('return-content');
        if (modalType === 'terms-modal') openModal('terms-content');
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeModal();
      }
    });
  }
/* ---------- 3c. Video Slide ---------- */
function initVideoSlide() {
  var slide = $('.video-slide');
  if (!slide) return;

  var video   = $('.slide-video', slide);
  var playBtn = $('.video-play', slide);
  var scrub   = $('.video-scrub', slide);
  var fill    = $('.video-fill', slide);
  var timeEl  = $('.video-time', slide);
  if (!video || !playBtn) return;

  var hideTimer;

  function showUI() {
    slide.classList.add('ui-shown');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      slide.classList.remove('ui-shown');
    }, 2600);
  }

  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* Tap anywhere on the video toggles the control bar */
  slide.addEventListener('click', function (e) {
    // Let the play button and scrub bar do their own thing
    if (e.target.closest('.video-play') || e.target.closest('.video-scrub')) return;

    if (slide.classList.contains('ui-shown')) {
      slide.classList.remove('ui-shown');
      clearTimeout(hideTimer);
    } else {
      showUI();
    }
  });

  /* Play / pause */
  playBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (video.paused) { video.play().catch(function () {}); }
    else { video.pause(); }
    showUI();          // keep controls visible briefly after tap
  });

  video.addEventListener('play',  function () { slide.classList.add('is-playing'); });
  video.addEventListener('pause', function () { slide.classList.remove('is-playing'); });

  video.addEventListener('loadedmetadata', function () {
    timeEl.textContent = fmt(video.duration);
  });

  video.addEventListener('timeupdate', function () {
    if (!video.duration) return;
    fill.style.width = (video.currentTime / video.duration * 100) + '%';
    timeEl.textContent = fmt(video.currentTime);
  });

  /* Scrub — click to seek, and keep UI visible while dragging */
  scrub.addEventListener('click', function (e) {
    e.stopPropagation();
    var r = scrub.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    if (video.duration) video.currentTime = p * video.duration;
    showUI();
  });

  /* Auto play when this slide is active, pause when it isn't */
var VIDEO_INDEX = 1;   // slide 2 → index 1 (change if you move it)

function syncPlayback() {
  var track = $('#slider-track');
  if (!track) return;
  var idx = Math.round(track.scrollLeft / (slide.offsetWidth + 16));
  if (idx === VIDEO_INDEX) {
    if (video.paused) video.play().catch(function () {});
  } else {
    if (!video.paused) video.pause();
  }
}

var track = $('#slider-track');
if (track) {
  // Debounced so it doesn't fire 60×/sec while scrolling
  var playTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(playTimer);
    playTimer = setTimeout(syncPlayback, 120);
  }, { passive: true });

  // Also run once on load in case the user landed on slide 2
  syncPlayback();
}

  video.addEventListener('error', function () {
    console.warn('Video error code:', video.error && video.error.code);
  });
}
  document.addEventListener('visibilitychange', function () {
  if (!document.hidden) syncPlayback();
});
  /* ---------- 4. Boot ---------- */
  function init() {
    initTheme();
    initShowcase();
    initVideoSlide();
    initPolicyModals();
    var yr = $('#year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
