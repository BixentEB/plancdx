/* ==========================================================
   COACH V6 — ROUTER
   Charge chaque sous-page dans <main id="subview">
   et met à jour l’onglet actif + le bandeau 4 blocs.
   ========================================================== */

(function () {
  const SUB  = document.getElementById('subview');
  const TABS = document.querySelectorAll('.nav .tab');

  const routes = {
    '#/planA'    : { file: 'pages/planA.html' },
    '#/planB'    : { file: 'pages/planB.html' },
    '#/encyclo'  : { file: 'pages/encyclo.html', js: 'pages/encyclo.js' },
    '#/templates': { file: 'pages/templates.html', js: 'pages/templates.js' },
    '#/lexique'  : { file: 'pages/lexique.html' },
    '#/settings' : { file: 'pages/settings.html' },
    '#/tutoriel' : { file: 'pages/tutoriel.html' }
  };

  function setActive(hash) {
    const h = hash || '#/planA';
    TABS.forEach(a => a.classList.toggle('active', a.getAttribute('href') === h));
  }

  async function load(hash) {
    const r = routes[hash] || routes['#/planA'];
    setActive(hash);

    if (!SUB) return;
    try {
      const html = await fetch(r.file + '?v=' + Date.now(), { cache: 'no-store' }).then(res => res.text());
      SUB.innerHTML = html;

      // Script spécifique de la page (si présent)
      if (r.js) {
        const s = document.createElement('script');
        s.src = r.js + '?v=' + Date.now();
        s.defer = true;
        SUB.appendChild(s);
      }

      // Redessiner le bandeau selon la page
      if (window.V6 && typeof V6.renderTopband === 'function') {
        V6.renderTopband(hash || '#/planA');
      }
    } catch (e) {
      SUB.innerHTML = `<div class="card"><h2>Erreur</h2><p>Impossible de charger <b>${r.file}</b></p></div>`;
    }
  }

  // Navigation par hash
  window.addEventListener('hashchange', () => load(location.hash || '#/planA'));
  load(location.hash || '#/planA');

  /* ====== Actions globales : Export / Import / Reset ====== */
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const fileInput = document.getElementById('fileImport');
  const btnReset  = document.getElementById('btnReset');

  btnExport?.addEventListener('click', () => {
    if (window.V6 && typeof V6.downloadJSON === 'function') {
      const raw = localStorage.getItem('coach_v6_state') || '{}';
      V6.downloadJSON('coach_v6_state.json', raw);
    } else {
      // fallback
      const blob = new Blob([localStorage.getItem('coach_v6_state') || '{}'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'coach_v6_state.json'; a.click(); URL.revokeObjectURL(url);
    }
  });

  btnImport?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      JSON.parse(text); // validation rapide
      localStorage.setItem('coach_v6_state', text);
      alert('Import réussi ✅ — rechargement.');
      location.reload();
    } catch {
      alert('Fichier JSON invalide 🤕');
    } finally {
      e.target.value = '';
    }
  });

  btnReset?.addEventListener('click', () => {
    if (!confirm('Tout réinitialiser (programmes, encyclo locale, extras, calendrier) ?')) return;
    localStorage.removeItem('coach_v6_state');
    location.reload();
  });
})();
