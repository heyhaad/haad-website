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

  // Diary: decorative menu highlight
  document.querySelectorAll('.diary-menu li').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.diary-menu li').forEach(li => li.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Hash-based routing on load / back-forward
  window.addEventListener('hashchange', () => showView(idFromHash(), { silent: true }));

  const initial = idFromHash();
  if (initial === 'world') worldField.classList.add('enter');
  showView(initial, { silent: true });
})();
