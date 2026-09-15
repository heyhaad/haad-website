(() => {
  async function loadDiary() {
    let data;
    try {
      const res = await fetch('content/diary.json', { cache: 'no-store' });
      if (!res.ok) return;
      data = await res.json();
    } catch (e) {
      return;
    }

    const entryDate = document.getElementById('entryDate');
    if (entryDate && data.entry) {
      entryDate.textContent = `${data.entry.date} · ${data.entry.time}`;
    }

    const entryPhoto = document.getElementById('entryPhoto');
    if (entryPhoto && data.entry?.photo) entryPhoto.src = data.entry.photo;

    const entryText = document.getElementById('entryText');
    if (entryText && data.entry?.paragraphs) {
      entryText.innerHTML = data.entry.paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    const entrySign = document.getElementById('entrySign');
    if (entrySign && data.entry?.sign) entrySign.textContent = data.entry.sign;

    const fillGrid = (id, urls) => {
      const grid = document.getElementById(id);
      if (!grid || !urls) return;
      grid.innerHTML = urls.map(u => `<img src="${u}" alt="">`).join('');
    };
    fillGrid('referencesGrid', data.references);
    fillGrid('randomGrid', data.random);

    if (data.obsession) {
      const name = document.getElementById('obsessionName');
      const role = document.getElementById('obsessionRole');
      const desc = document.getElementById('obsessionDesc');
      if (name) name.textContent = data.obsession.name;
      if (role) role.textContent = data.obsession.role;
      if (desc) desc.textContent = data.obsession.desc;
    }

    const watchedGrid = document.getElementById('watchedGrid');
    if (watchedGrid && data.watched) {
      watchedGrid.innerHTML = data.watched
        .map(w => `<div class="watched-tile"><span>${w.title}</span><small>${w.year}</small></div>`)
        .join('');
    }

    const songsList = document.getElementById('songsList');
    if (songsList && data.songs) {
      songsList.innerHTML = data.songs
        .map(s => `<li>${s} <span>&#9825;</span></li>`)
        .join('');
    }

    const quotesBlock = document.getElementById('quotesBlock');
    if (quotesBlock && data.quotes) {
      quotesBlock.innerHTML = data.quotes.map(q => `<p>&#8220;${q}&#8221;</p>`).join('');
    }

    const note = document.getElementById('diaryNote');
    if (note && data.note) note.textContent = data.note;
  }

  loadDiary();
})();
