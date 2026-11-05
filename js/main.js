(() => {
  const views = document.querySelectorAll('.view');
  const navLinks = document.querySelectorAll('[data-nav]');
  const grillzTrigger = document.getElementById('grillzTrigger');
  const portalFlash = document.getElementById('portalFlash');
  const worldField = document.getElementById('worldField');

  function setActiveNav(viewId) {
    const group = viewId === 'book' ? 'book' : 'home';
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === group);
    });
  }

  // Only the home view loads up front; other sections load when needed or once the page is idle.
  function hydrate(root = document) {
    root.querySelectorAll('[data-src]').forEach(el => {
      el.src = el.dataset.src;
      el.removeAttribute('data-src');
    });
    root.querySelectorAll('video[data-poster]').forEach(el => {
      el.poster = el.dataset.poster;
      el.removeAttribute('data-poster');
    });
  }

  function syncAutoplayVideos() {
    document.querySelectorAll('video[data-autoplay]').forEach(v => {
      if (v.closest('.view.active')) v.play().catch(() => {});
      else v.pause();
    });
  }

  let initSoundCloud = () => {};

  function afterLoad(fn) {
    const run = () => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 800));
    document.readyState === 'complete' ? run() : window.addEventListener('load', run, { once: true });
  }

  function showView(viewId, { silent } = {}) {
    const targetId = viewId === 'home' ? 'view-home' : viewId === 'world' ? 'view-world' : viewId === 'book' ? 'view-book' : viewId;
    views.forEach(v => v.classList.toggle('active', v.id === targetId));
    const targetView = document.getElementById(targetId);
    if (targetView) hydrate(targetView);
    if (targetId === 'section-diary' && window.loadDiary) window.loadDiary();
    if (targetId === 'section-files') initSoundCloud();
    syncAutoplayVideos();
    setActiveNav(viewId);
    if (viewId === 'world') worldField.classList.add('enter');
    if (!silent) location.hash = viewId;
  }

  function idFromHash() {
    const h = location.hash.replace('#', '');
    return h || 'home';
  }

  // Nav clicks
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.nav;
      showView(target);
    });
  });

  // Sticker clicks -> section views
  document.querySelectorAll('.sticker').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  // Grillz open transition: dissolve to open mouth, then dive forward/down into it, fading to black
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Resolves once every image in `root` has loaded, or after `timeout` ms on slow connections
  function imagesReady(root, timeout) {
    const pending = [...root.querySelectorAll('img')]
      .filter(i => i.getAttribute('src') && !(i.complete && i.naturalWidth > 0));
    if (!pending.length) return Promise.resolve();
    const loaded = Promise.all(pending.map(i => new Promise(res => {
      i.addEventListener('load', res, { once: true });
      i.addEventListener('error', res, { once: true });
    })));
    return Promise.race([loaded, sleep(timeout)]);
  }

  let entering = false;

  async function enterWorld() {
    if (entering) return;
    entering = true;

    const DISSOLVE = 1000;
    const FADE_IN = 1100;
    const FADE_OUT = 600;
    const homeView = document.getElementById('view-home');
    const worldView = document.getElementById('view-world');

    hydrate(homeView);
    hydrate(worldView);
    await imagesReady(homeView, 2500);

    grillzTrigger.classList.add('opening');
    await sleep(DISSOLVE);

    grillzTrigger.classList.add('sinking');
    portalFlash.classList.add('grow');
    const worldReady = imagesReady(worldView, 4000);
    await sleep(FADE_IN);
    await worldReady;

    showView('world', { silent: false });
    portalFlash.classList.remove('grow');
    portalFlash.classList.add('shrink');
    await sleep(FADE_OUT);

    portalFlash.classList.remove('shrink');
    grillzTrigger.classList.remove('opening', 'sinking');
    entering = false;
  }

  grillzTrigger.addEventListener('click', enterWorld);
  grillzTrigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enterWorld();
    }
  });

  // Diary: CRT filter toggle
  const crtToggle = document.getElementById('crtToggle');
  const diaryPage = document.getElementById('diaryPage');
  if (crtToggle && diaryPage) {
    crtToggle.addEventListener('change', () => {
      diaryPage.classList.toggle('crt-on', crtToggle.checked);
    });
  }

  // Diary: menu jumps to the matching panel and highlights it
  document.querySelectorAll('.diary-menu li').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.diary-menu li').forEach(li => li.classList.remove('active'));
      item.classList.add('active');

      const target = document.getElementById(item.dataset.target);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.remove('win--pulse');
      void target.offsetWidth;
      target.classList.add('win--pulse');
    });
  });

  // Haad Files: retro desktop audio window
  const cdIcon = document.getElementById('cdIcon');
  const audioWindow = document.getElementById('audioWindow');
  const audioMinBtn = document.getElementById('audioMinBtn');
  const audioCloseBtn = document.getElementById('audioCloseBtn');
  const audioTaskbarBtn = document.getElementById('audioTaskbarBtn');
  const audioPlayBtn = document.getElementById('audioPlayBtn');
  const audioNowTitle = document.getElementById('audioNowTitle');
  const audioWaveform = document.getElementById('audioWaveform');
  const audioFilelist = document.getElementById('audioFilelist');
  const retroClock = document.getElementById('retroClock');

  const scIframe = document.getElementById('scPlayer');

  if (cdIcon && audioWindow) {
    // Build fake waveform bars once
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('span');
      bar.className = 'bar';
      bar.style.height = (20 + Math.random() * 80) + '%';
      bar.style.animationDelay = (Math.random() * 0.9) + 's';
      audioWaveform.appendChild(bar);
    }

    let scWidget = null;
    let scReady = false;
    let scStarted = false;
    let pendingFile = null;
    let isPlayingNow = false;

    function setPlayingUI(playing) {
      isPlayingNow = playing;
      audioPlayBtn.textContent = playing ? '⏸' : '▶';
      audioWaveform.classList.toggle('is-playing', playing);
    }

    function selectFile(file, { autoplay } = {}) {
      audioFilelist.querySelectorAll('.audio-file').forEach(f => f.classList.remove('is-playing'));
      file.classList.add('is-playing');
      audioNowTitle.textContent = file.dataset.title;
      if (scReady && file.dataset.sc) {
        scWidget.load(file.dataset.sc, { auto_play: !!autoplay, show_artwork: false });
      } else {
        pendingFile = file;
        initSoundCloud();
      }
    }

    initSoundCloud = () => {
      if (scStarted || !scIframe) return;
      scStarted = true;
      const api = document.createElement('script');
      api.src = 'https://w.soundcloud.com/player/api.js';
      api.onload = () => {
        scIframe.src = scIframe.dataset.scSrc;
        scWidget = SC.Widget(scIframe);
        scWidget.bind(SC.Widget.Events.READY, () => {
          scReady = true;
          if (pendingFile && pendingFile.dataset.sc) {
            scWidget.load(pendingFile.dataset.sc, { auto_play: true, show_artwork: false });
          }
          pendingFile = null;
        });
        scWidget.bind(SC.Widget.Events.PLAY, () => setPlayingUI(true));
        scWidget.bind(SC.Widget.Events.PAUSE, () => setPlayingUI(false));
        scWidget.bind(SC.Widget.Events.FINISH, () => setPlayingUI(false));
      };
      document.head.appendChild(api);
    };

    function openAudioWindow() {
      initSoundCloud();
      audioWindow.hidden = false;
      audioTaskbarBtn.hidden = false;
    }
    function closeAudioWindow() {
      audioWindow.hidden = true;
      audioTaskbarBtn.hidden = true;
      if (scReady) scWidget.pause();
      setPlayingUI(false);
    }
    function minimizeAudioWindow() {
      audioWindow.hidden = true;
    }
    function toggleAudioWindow() {
      audioWindow.hidden ? openAudioWindow() : minimizeAudioWindow();
    }

    cdIcon.addEventListener('click', openAudioWindow);
    audioCloseBtn.addEventListener('click', closeAudioWindow);
    audioMinBtn.addEventListener('click', minimizeAudioWindow);
    audioTaskbarBtn.addEventListener('click', toggleAudioWindow);

    audioPlayBtn.addEventListener('click', () => {
      if (!scReady) return;
      isPlayingNow ? scWidget.pause() : scWidget.play();
    });

    audioFilelist.querySelectorAll('.audio-file').forEach(file => {
      file.addEventListener('click', () => selectFile(file, { autoplay: true }));
    });
  }

  if (retroClock) {
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      retroClock.textContent = h + ':' + m;
    }
    updateClock();
    setInterval(updateClock, 15000);
  }

  // As soon as the closed grillz are on screen, fetch what the next step needs (open grillz + world
  // stickers); the remaining sections follow once the page is idle.
  const warmNext = () => {
    hydrate(document.getElementById('view-home'));
    hydrate(document.getElementById('view-world'));
  };
  const grillzClosed = document.querySelector('.grillz-closed');
  if (grillzClosed.complete) {
    warmNext();
  } else {
    grillzClosed.addEventListener('load', warmNext, { once: true });
    grillzClosed.addEventListener('error', warmNext, { once: true });
  }
  afterLoad(() => {
    warmNext();
    setTimeout(() => hydrate(), 2000);
  });

  // Hash-based routing on load / back-forward
  window.addEventListener('hashchange', () => showView(idFromHash(), { silent: true }));

  const initial = idFromHash();
  if (initial === 'world') worldField.classList.add('enter');
  showView(initial, { silent: true });
})();
