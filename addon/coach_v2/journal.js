// ===== Données d'exercices =====
const CATS = [
  {name:'Échauffement', color:'c1'},
  {name:'Haut du corps', color:'c2'},
  {name:'Bas du corps', color:'c3'},
  {name:'Core/Abdos', color:'c4'},
  {name:'Étirements', color:'c5'}
];

const EXOS = {
  'Échauffement': [
    {name:'Jumping jacks', gear:'PDC', muscles:'Cardio, épaules, hanches', desc:"Ouverture dynamique corps entier.", mode:'time', base:{time:45, sets:2}},
    {name:'Corde à sauter (ou simulée)', gear:'PDC', muscles:'Mollets, cardio', desc:"Sauts rythmés, pieds légers.", mode:'time', base:{time:60, sets:2}},
    {name:'Mobilité épaules (bâton/serviette)', gear:'Bâton/Serviette', muscles:'Épaules, poitrine', desc:"Amplitude sans douleur.", mode:'reps', base:{reps:12, sets:2}},
    {name:'Squats PDC (pré-activation)', gear:'PDC', muscles:'Quadriceps, fessiers', desc:"Squat profond, talons au sol.", mode:'reps', base:{reps:12, sets:2}}
  ],
  'Haut du corps': [
    {name:'Développé couché — barre', gear:'Barre + banc', muscles:'Pecs, triceps, épaules', desc:'Pieds ancrés, trajectoire en J.', mode:'reps', base:{weight:10,reps:8,sets:3,rpe:7}},
    {name:'Développé haltères — banc', gear:'Haltères + banc', muscles:'Pecs, triceps', desc:'Poignets neutres, amplitude contrôlée.', mode:'reps', base:{weight:6,reps:10,sets:3,rpe:7}},
    {name:'Écartés haltères — banc', gear:'Haltères + banc', muscles:'Pectoraux (ouverture)', desc:'Coudes souples, grand étirement.', mode:'reps', base:{weight:4,reps:12,sets:3,rpe:7}},
    {name:'Rowing barre penché', gear:'Barre', muscles:'Dos, biceps, lombaires', desc:'Dos à 45°, tirage nombril.', mode:'reps', base:{weight:10,reps:10,sets:3,rpe:7}},
    {name:'Développé militaire — assis', gear:'Barre/Haltères + banc', muscles:'Épaules, triceps', desc:'Trajectoire verticale.', mode:'reps', base:{weight:6,reps:8,sets:3,rpe:7}},
    {name:'Curl biceps (haltères) / marteau', gear:'Haltères', muscles:'Biceps, brachial', desc:'Coudes fixes, montée contrôlée.', mode:'reps', base:{weight:6,reps:10,sets:3,rpe:7}},
    {name:'Triceps — barre front', gear:'Barre', muscles:'Triceps', desc:'Coudes serrés, descente au front.', mode:'reps', base:{weight:0,reps:12,sets:3,rpe:7}},
    {name:'Pompes au sol', gear:'PDC', muscles:'Pecs, triceps, core', desc:'Poitrine proche du sol.', mode:'reps', base:{reps:12,sets:3,rpe:6}}
  ],
  'Bas du corps': [
    {name:'Soulevé de terre jambes tendues', gear:'Barre', muscles:'Ischios, fessiers, lombaires', desc:"Hanches en arrière, étirement ischios.", mode:'reps', base:{weight:12,reps:8,sets:3,rpe:7}},
    {name:'Squat (barre ou PDC)', gear:'Barre / PDC', muscles:'Quadriceps, fessiers', desc:'Genoux suivent orteils, dos neutre.', mode:'reps', base:{weight:8,reps:10,sets:3,rpe:7}},
    {name:'Goblet squat — haltère', gear:'Haltère', muscles:'Quadriceps, fessiers', desc:'Haltère contre poitrine, buste droit.', mode:'reps', base:{weight:8,reps:10,sets:3,rpe:7}},
    {name:'Pont fessier au sol', gear:'PDC', muscles:'Fessiers', desc:'Rétroversion, contraction en haut.', mode:'reps', base:{reps:15,sets:3,rpe:7}},
    {name:'Chaise au mur (isométrique)', gear:'Mur', muscles:'Quadriceps', desc:'Cuisses // au sol, dos plaqué.', mode:'time', base:{time:40,sets:3,rpe:7}},
    {name:'Fentes avant — haltères', gear:'Haltères', muscles:'Quadriceps, fessiers', desc:'Grand pas, contrôle redescente.', mode:'reps', base:{weight:6,reps:10,sets:3,rpe:7}}
  ],
  'Core/Abdos': [
    {name:'Planche sur genoux', gear:'Tapis', muscles:'Transverse, grand droit', desc:'Gainage neutre, respiration basse.', mode:'time', base:{time:20,sets:3}},
    {name:'Gainage planche', gear:'Tapis', muscles:'Tronc', desc:'Progresser par paliers de 5s.', mode:'time', base:{time:20,sets:3}},
    {name:'Crunch contrôlé', gear:'Tapis', muscles:'Grand droit', desc:'Regard plafond, montée courte.', mode:'reps', base:{reps:15,sets:3}},
    {name:'Hollow hold (banane)', gear:'Tapis', muscles:'Transverse', desc:'Bas du dos plaqué.', mode:'time', base:{time:12,sets:3}}
  ],
  'Étirements': [
    {name:'Étirement pectoraux au mur', gear:'Mur', muscles:'Pectoraux', desc:'Bras à 90°, pivoter doucement.', mode:'time', base:{time:30,sets:1}},
    {name:'Étirement ischios — assis', gear:'Tapis', muscles:'Ischios', desc:'Dos droit, flexion hanche.', mode:'time', base:{time:30,sets:1}},
    {name:'Étirement quadriceps — debout', gear:'—', muscles:'Quadriceps', desc:'Attraper cheville, genou sous hanche.', mode:'time', base:{time:30,sets:1}},
    {name:'Étirement fléchisseurs de hanches', gear:'Tapis', muscles:'Psoas', desc:'Fente genou au sol, rétroversion.', mode:'time', base:{time:30,sets:1}}
  ]
};

// ===== Utils / State =====
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>[...root.querySelectorAll(q)];
const today = ()=> new Date().toISOString().slice(0,10);
const KEY = 'journal_fullbody_v3';
const PRESET_KEY = 'journal_presets_v1';
const DONE_KEY = 'journal_done_by_date_v1';

function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||{items:[]} }catch{ return {items:[]} } }
function save(data){ localStorage.setItem(KEY, JSON.stringify(data)); }
const journal = load();

// --- Done (validé aujourd’hui)
function loadDoneSet(){
  try{ const all = JSON.parse(localStorage.getItem(DONE_KEY)||'{}'); return new Set(all[today()]||[]); }
  catch{ return new Set(); }
}
function saveDoneSet(set){
  const all = JSON.parse(localStorage.getItem(DONE_KEY)||'{}');
  all[today()] = [...set]; localStorage.setItem(DONE_KEY, JSON.stringify(all));
}
let doneToday = loadDoneSet();
let selectedId = null;

// --- Presets
function loadPresets(){
  const d = { active:'barre',
    barre:{mode:'reps', weight:10, reps:10, time:0, sets:3, rpe:7, feel:'Moyen'},
    halteres:{mode:'reps', weight:6, reps:12, time:0, sets:3, rpe:7, feel:'Moyen'},
    pdc:{mode:'time', weight:0, reps:0, time:30, sets:3, rpe:7, feel:'Moyen'}
  };
  try{ return Object.assign(d, JSON.parse(localStorage.getItem(PRESET_KEY)||'{}')); }catch{ return d; }
}
function savePresets(p){ localStorage.setItem(PRESET_KEY, JSON.stringify(p)); }
const presets = loadPresets();
let currentPreset = presets.active;

// ===== Catalogue + accordéon sans décalage =====
function applyStates(){
  $$('#catList .item').forEach(el=>{
    el.classList.remove('is-selected','is-done');
    const id = el.dataset.id;
    if(doneToday.has(id)) el.classList.add('is-done');
    if(selectedId === id) el.classList.add('is-selected');
  });
}

function buildCatalogue(){
  const host = $('#catList'); host.innerHTML='';
  const q = ($('#q').value||'').toLowerCase();

  CATS.forEach((c,i)=>{
    const cat = document.createElement('details');
    cat.className = 'cat';
    cat.open = i===0;
    cat.innerHTML = `<summary><span class="badge"><span class="dot ${c.color}"></span>${c.name}</span></summary>`;

    const items = document.createElement('div');
    items.className = 'items';

    (EXOS[c.name]||[]).forEach(ex=>{
      if(q && ![ex.name,ex.muscles,ex.gear].join(' ').toLowerCase().includes(q)) return;

      const row = document.createElement('div');
      row.className = 'item';
      row.dataset.id = `${c.name}::${ex.name}`;
      row.innerHTML = `
        <div class="itemHead">
          <div>
            <h4>${ex.name}</h4>
            <small>${ex.gear} • Muscles : ${ex.muscles}</small>
          </div>
          <div><button class="pick">Sélectionner</button></div>
        </div>
        <details class="inner">
          <summary>+ Détails</summary>
          <div style="padding:6px 0;color:#d7e6ff">${ex.desc}</div>
          <div style="font-size:.85rem;color:#cfe1ff">
            Mode par défaut : <b>${ex.mode==='reps'?'Répétitions':'Chrono'}</b>.
            Bases : ${ex.base?.weight?`Poids ${ex.base.weight}kg, `:''}${ex.base?.reps?`${ex.base.reps} réps, `:''}${ex.base?.time?`${ex.base.time}s, `:''}${(ex.base?.sets)||3} séries${ex.base?.rpe?`, RPE ${ex.base.rpe}`:''}.
          </div>
        </details>
      `;
      row.querySelector('.pick').onclick = ()=>selectExercise(c.name, ex);
      items.appendChild(row);
    });

    cat.appendChild(items);
    host.appendChild(cat);
  });

  // Accordéon piloté (anti-décalage)
  host.addEventListener('click', (e)=>{
    const sum = e.target.closest('summary'); if(!sum) return;
    const det = sum.parentElement; if(!(det instanceof HTMLDetailsElement)) return;
    const scroller = host; const keepY = scroller.scrollTop;
    const willOpen = !det.open;

    if(det.classList.contains('cat')){
      host.querySelectorAll(':scope > details.cat[open]').forEach(d=>{ if(d!==det) d.open=false; });
      det.open = willOpen; scroller.scrollTop = keepY; e.preventDefault();
    }
    if(det.classList.contains('inner')){
      const box = det.closest('.items');
      if(box) box.querySelectorAll('details.inner[open]').forEach(d=>{ if(d!==det) d.open=false; });
      det.open = willOpen; scroller.scrollTop = keepY; e.preventDefault();
    }
  });

  applyStates();
}
document.addEventListener('input', (e)=>{ if(e.target.id==='q') buildCatalogue(); });

// ===== Réglages persistants + presets =====
function applySettings(s){
  $('#fxMode').value=s.mode;
  $('#fxWeight').value=s.weight||0;
  $('#fxReps').value=s.reps||0;
  $('#fxTime').value=s.time||0;
  $('#fxSets').value=s.sets||3;
  $('#fxRpe').value=s.rpe||7;
  $('#fxFeel').value=s.feel||'Moyen';
  updateModeUI();
}
function readSettings(){
  return {
    mode:$('#fxMode').value,
    weight:+$('#fxWeight').value||0,
    reps:+$('#fxReps').value||0,
    time:+$('#fxTime').value||0,
    sets:+$('#fxSets').value||0,
    rpe:+$('#fxRpe').value||0,
    feel:$('#fxFeel').value
  };
}
function loadPreset(name){ currentPreset=name; applySettings(presets[name]); }
function saveCurrentIntoPreset(){ presets[currentPreset]=readSettings(); presets.active=currentPreset; savePresets(presets); }

document.addEventListener('click', (e)=>{
  const b=e.target.closest('[data-preset]'); if(!b) return;
  loadPreset(b.dataset.preset);
});
$('#savePreset').addEventListener('click', saveCurrentIntoPreset);

function updateModeUI(){
  const isTime = $('#fxMode').value==='time';
  $('#fxReps').disabled = isTime;
  $('#fxTime').disabled = !isTime;
}
$('#fxMode').addEventListener('change', updateModeUI);

// ===== Sélection + ajout =====
function selectExercise(cat, ex){
  $('#fxName').value = ex.name;
  $('#fxName').dataset.cat = cat;

  selectedId = `${cat}::${ex.name}`;
  applyStates();

  if(!$('#keepSettings').checked){
    const b = ex.base||{};
    const s = { mode:ex.mode, weight:b.weight||0, reps:b.reps||0, time:b.time||0, sets:b.sets||3, rpe:b.rpe||7, feel:'Moyen' };
    applySettings(s);
  }
}

$('#add').onclick = ()=>{
  const name=$('#fxName').value.trim(); if(!name){alert('Sélectionne un exercice à gauche.'); return;}
  const cat=$('#fxName').dataset.cat||'';
  const s=readSettings();

  if(s.mode==='reps' && s.reps===0){alert('Renseigne le nombre de répétitions.'); return;}
  if(s.mode==='time' && s.time===0){alert('Renseigne le temps en secondes.'); return;}

  const item={date:today(), cat, name, mode:s.mode, weight:s.weight, reps:s.reps, time:s.time, sets:s.sets, rpe:s.rpe, feel:s.feel,
              volume:(s.mode==='reps'?s.weight*s.reps*s.sets:0)};
  journal.items.push(item); save(journal); renderTable();

  // marquer “fait aujourd’hui”
  const id = `${cat}::${name}`;
  doneToday.add(id); saveDoneSet(doneToday); applyStates();

  $('#logTable').scrollIntoView({behavior:'smooth', block:'nearest'});
};

function renderTable(){
  const tbody=$('#logTable tbody'); tbody.innerHTML='';
  let vol=0; const fmt=n=>new Intl.NumberFormat('fr-FR').format(n);
  journal.items.forEach((it,i)=>{
    vol+=it.volume||0;
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${it.date}</td><td>${it.cat||''}</td><td>${it.name}</td><td>${it.mode}</td><td>${it.weight||0}</td><td>${it.reps||0}</td><td>${it.time||0}</td><td>${it.sets||0}</td><td>${it.rpe||0}</td><td>${it.feel||''}</td><td>${fmt(it.volume||0)}</td><td><button class='btn ghost' data-i='${i}'>Suppr.</button></td>`;
    tr.ondblclick = ()=>{
      $('#fxName').value=it.name; $('#fxName').dataset.cat=it.cat;
      applySettings({mode:it.mode, weight:it.weight, reps:it.reps, time:it.time, sets:it.sets, rpe:it.rpe, feel:it.feel});
      window.scrollTo({top:0,behavior:'smooth'});
    };
    tbody.appendChild(tr);
  });
  $('#volTot').textContent = fmt(vol);
  tbody.onclick=(e)=>{const b=e.target.closest('button'); if(!b) return; const idx=+b.dataset.i; journal.items.splice(idx,1); save(journal); renderTable();};
}

// Export / Import / Clear
$('#exp').onclick=()=>{
  const blob=new Blob([JSON.stringify(journal,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`journal-${today()}.json`; a.click(); URL.revokeObjectURL(url);
};
$('#impFile').addEventListener('change', (e)=>{
  const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); if(data && Array.isArray(data.items)){ journal.items=data.items; save(journal); renderTable(); } else alert('Fichier invalide.'); } catch{ alert('JSON invalide.'); } }; r.readAsText(f);
});
$('#clear').onclick=()=>{ if(confirm('Effacer tout le journal ?')){ journal.items=[]; save(journal); renderTable(); } };

// Init
buildCatalogue();
loadPreset(presets.active);
applySettings(presets[presets.active]);
renderTable();
