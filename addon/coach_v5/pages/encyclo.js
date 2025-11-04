/* ==========================================================
   Encyclopédie — liste d’exercices + insertion dans A/B
   Utilise window.V5 (exposée par router.js) pour lire/écrire l’état
   ========================================================== */
(function(){
  if(!window.V5){ console.warn('V5 API manquante'); return; }

  const $ = sel => document.querySelector(sel);
  const listEl   = $('#enc-list');
  const qInput   = $('#enc-search');
  const selCat   = $('#enc-filter-cat');
  const selProg  = $('#enc-target-prog');
  const selDay   = $('#enc-target-day');

  // --- Base d’exercices (seed) — FR/EN + groupes
  // (Tu peux en ajouter autant que tu veux via l’UI «Créer un exo»)
  const seed = [
    ex('Développé couché barre', 'muscu',  ['pecs','triceps','ant delts'], 'Barbell Bench Press', 2),
    ex('Goblet Squat',           'muscu',  ['cuisses','fessiers','abdos'], 'Goblet Squat',        1),
    ex('Rowing barre penché',    'muscu',  ['dos','biceps'],               'Barbell Row',         1),
    ex('Soulevé de terre JT',    'muscu',  ['ischios','fessiers','lombaires'],'RDL',              2),
    ex('Élévations latérales',   'muscu',  ['épaules latérales'],          'Lateral Raise',       1),
    ex('Développé militaire',    'muscu',  ['épaules','triceps'],          'Overhead Press',      2),
    ex('Front Squat',            'muscu',  ['quads','core'],               'Front Squat',         3),
    ex('Tirage menton',          'muscu',  ['trapèzes','biceps'],          'Upright Row',         2),
    ex('Fentes arrière',         'muscu',  ['fessiers','cuisses'],         'Reverse Lunge',       2),
    ex('Planche',                'core',   ['core','transverse'],          'Plank',               1),
    ex('Crunch au sol',          'core',   ['abdos'],                      'Crunch',              1),
    ex('Crunch jambes levées',   'core',   ['abdos'],                      'Reverse Crunch',      1),
    ex('Gainage genoux relevés', 'core',   ['core'],                       'Knee Plank',          1),
    ex('Marche + Run',           'cardio', ['aérobie'],                    'Walk/Run',            1),
    ex('Vélo 30/30',             'cardio', ['aérobie'],                    'Bike 30/30',          2),
    ex('TIBO Extrm',             'tibo',   ['HIIT'],                       'TIBO Extreme',        2),
  ];

  // ---- Récupère/merge avec la base locale (si déjà enrichie par l’utilisateur)
  const K_EXO = 'coach_v5_exercises';
  function loadExoDB(){
    try{ return JSON.parse(localStorage.getItem(K_EXO)||'[]'); }catch{ return []; }
  }
  function saveExoDB(arr){ localStorage.setItem(K_EXO, JSON.stringify(arr)); }

  // merge unique par id
  const userDB = loadExoDB();
  const ENC = mergeUnique(seed, userDB);

  // --- Création utilitaires
  function ex(name, type, groups=[], alias='', diff=1){
    return {
      id: slug(name),
      name, type, groups, alias, diff
    };
  }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
  function mergeUnique(a,b){
    const map = new Map();
    [...a,...b].forEach(x=> map.set(x.id, x));
    return [...map.values()];
  }

  // --- Rendu
  function card(exo){
    const wrap = document.createElement('div');
    wrap.className = 'cardExo';

    const title = document.createElement('div');
    title.className = 'title';
    title.innerHTML = `${exo.name} ${exo.alias?`<span class="meta">(${exo.alias})</span>`:''}`;
    wrap.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${labelType(exo.type)} — ${exo.groups.join(', ')} — diff ${exo.diff}`;
    wrap.appendChild(meta);

    const btns = document.createElement('div');
    btns.className = 'buttons';

    const bFav = document.createElement('button');
    bFav.className = 'btn small';
    bFav.textContent = '⭐';
    bFav.title = 'Marquer favori (local)';
    bFav.onclick = ()=> toggleFav(exo.id, bFav);
    btns.appendChild(bFav);

    const bAdd = document.createElement('button');
    bAdd.className = 'btn small primary';
    bAdd.textContent = `+ Ajouter au ${selProg.value} — ${V5.dayLabel(Number(selDay.value))}`;
    bAdd.onclick = ()=> addToProgram(exo);
    btns.appendChild(bAdd);

    wrap.appendChild(btns);
    return wrap;
  }

  function labelType(t){
    return t==='muscu' ? 'Muscu' : t==='cardio' ? 'Cardio' : t==='tibo' ? 'TIBO' : 'Gainage';
  }

  function render(){
    if(!listEl) return;
    const q = (qInput?.value||'').trim().toLowerCase();
    const cat = selCat?.value || 'all';
    listEl.innerHTML = '';

    ENC.filter(exo=>{
      if(cat!=='all' && exo.type!==cat) return false;
      if(!q) return true;
      const hay = [exo.name, exo.alias, exo.type, ...(exo.groups||[])].join(' ').toLowerCase();
      return hay.includes(q);
    }).forEach(x => listEl.appendChild(card(x)));

    if(!listEl.children.length){
      const p=document.createElement('p'); p.className='hint'; p.textContent='Aucun résultat.';
      listEl.appendChild(p);
    }
  }

  qInput?.addEventListener('input', render);
  selCat?.addEventListener('change', render);
  selProg?.addEventListener('change', render);
  selDay?.addEventListener('change', render);

  // --- Favoris (simple stockage local des ids)
  const K_FAV = 'coach_v5_favorites';
  function loadFav(){ try{ return new Set(JSON.parse(localStorage.getItem(K_FAV)||'[]')); }catch{ return new Set(); } }
  function saveFav(set){ localStorage.setItem(K_FAV, JSON.stringify([...set])); }
  const favs = loadFav();
  function toggleFav(id, btn){
    if(favs.has(id)) favs.delete(id); else favs.add(id);
    saveFav(favs);
    btn.style.filter = favs.has(id) ? 'brightness(1.2)' : '';
  }

  // --- Ajout d’un exo au programme A ou B
  function addToProgram(exo){
    const progKey = selProg.value === 'A' ? 'programA' : 'programB';
    const dayIdx  = Number(selDay.value||1);

    const s = V5.getState();
    if(!s[progKey]) s[progKey] = {};
    if(!s[progKey][dayIdx]) s[progKey][dayIdx] = { type: inferDayType(exo.type), items: [] };

    const item = exoToItem(exo);
    s[progKey][dayIdx].items.push(item);
    V5.saveState(s);
    alert(`Ajouté à ${progKey==='programA'?'Programme A':'Programme B'} — ${V5.dayLabel(dayIdx)} ✅`);
  }

  function inferDayType(t){
    if(t==='cardio' || t==='tibo') return 'cardio';
    if(t==='muscu' || t==='core') return 'full';
    return 'off';
  }

  // Remap ency -> format item (comme app.js)
  function exoToItem(exo){
    const base = { id: exo.id, name: exo.name, type: exo.type, vals:{} };
    switch(exo.type){
      case 'muscu': base.vals = { sets:4, reps:12, tempo:'2-1-1', rpe:7, load:'PDC', rest:'90s' }; break;
      case 'cardio':base.vals = { total:30, wu:5, cd:5, bloc:'4’+1’ × 5' }; break;
      case 'tibo':  base.vals = { total:30, wu:5, cd:5, bloc:'3’/3’ × 4' }; break;
      case 'core':  base.vals = { sets:3, sec:30, rpe:6 }; break;
    }
    return base;
  }

  // --- Création d’un exo perso (ajout à la DB locale)
  const cxName = $('#cx-name'), cxType=$('#cx-type'), cxGroups=$('#cx-groups'), cxAlias=$('#cx-alias'), cxDiff=$('#cx-diff');
  $('#enc-create-open')?.addEventListener('click', ()=> cxName?.focus());
  $('#cx-add')?.addEventListener('click', ()=>{
    const name=(cxName?.value||'').trim();
    if(!name){ alert('Nom requis'); return; }
    const type=(cxType?.value||'muscu');
    const groups=(cxGroups?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const alias=(cxAlias?.value||'').trim();
    const diff= Number(cxDiff?.value||1);

    const item = ex(name, type, groups, alias, diff);
    // ajoute à la base locale
    const db = loadExoDB(); db.push(item); saveExoDB(db);
    // merge en mémoire puis re-render
    ENC.push(item);
    cxName.value=''; cxGroups.value=''; cxAlias.value='';
    render();
  });

  // Première peinture
  render();
})();
