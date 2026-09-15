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

  function showView(viewId, { silent } = {}) {
    views.forEach(v => v.classList.toggle('active', v.id === (viewId === 'home' ? 'view-home' : viewId === 'world' ? 'view-world' : viewId === 'book' ? 'view-book' : viewId)));
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
  function enterWorld() {
    const DISSOLVE = 1000;
    const FADE_IN = 1100;
    const FADE_OUT = 600;

    grillzTrigger.classList.add('opening');

    setTimeout(() => {
      grillzTrigger.classList.add('sinking');
      portalFlash.classList.add('grow');
    }, DISSOLVE);

    setTimeout(() => {
      showView('world', { silent: false });
      portalFlash.classList.remove('grow');
      portalFlash.classList.add('shrink');
    }, DISSOLVE + FADE_IN);

    setTimeout(() => {
      portalFlash.classList.remove('shrink');
      grillzTrigger.classList.remove('opening', 'sinking');
    }, DISSOLVE + FADE_IN + FADE_OUT);
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
      }
    }

    if (window.SC && scIframe) {
      scWidget = SC.Widget(scIframe);
      scWidget.bind(SC.Widget.Events.READY, () => {
        scReady = true;
      });
      scWidget.bind(SC.Widget.Events.PLAY, () => setPlayingUI(true));
      scWidget.bind(SC.Widget.Events.PAUSE, () => setPlayingUI(false));
      scWidget.bind(SC.Widget.Events.FINISH, () => setPlayingUI(false));
    }

    function openAudioWindow() {
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

  // Hash-based routing on load / back-forward
  window.addEventListener('hashchange', () => showView(idFromHash(), { silent: true }));

  const initial = idFromHash();
  if (initial === 'world') worldField.classList.add('enter');
  showView(initial, { silent: true });
})();
