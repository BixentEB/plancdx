// ===== Helpers =====
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>[...root.querySelectorAll(q)];
const clamp = (n,min,max)=> Math.min(max, Math.max(min, n));

// ===== External DB (fallback if JSON absent) =====
const EXO_FALLBACK = [
  { id:'bench', name:'Développé couché — barre', cat:'upper', equip:'barre', space:'standard', station:'barre+banc+disques', sets:3, reps:'8-12', rest:75, timePerRep:3, tips:'Omoplates serrées.', alt:['pushup','db_press'] },
  { id:'row', name:'Rowing barre penché', cat:'upper', equip:'barre', space:'standard', station:'barre+disques (debout)', sets:3, reps:'10-12', rest:75, timePerRep:3, tips:'Buste ~45°.', alt:['db_row'] },
  { id:'squat', name:'Squat (barre ou poids du corps)', cat:'lower', equip:'barre', space:'standard', station:'barre+disques (debout)', sets:3, reps:'10-15', rest:75, timePerRep:3, tips:'Pieds ancrés.', alt:['goblet'] },
  { id:'plank', name:'Gainage planche', cat:'core', equip:'poids_corps', space:'faible', station:'poids du corps (tapis)', sets:3, reps:'30-45s', rest:45, timePerRep:1, tips:'Bassin neutre.', alt:['plank_knee'] },
];
let EXO_DB = EXO_FALLBACK;

async function loadDB(){
  try{
    const res = await fetch('exercises.json', {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(Array.isArray(data) && data.length) EXO_DB = data;
  }catch(e){
    console.warn('exercises.json non disponible, fallback utilisé', e);
    EXO_DB = EXO_FALLBACK;
  }
}
const byId = id => EXO_DB.find(x=>x.id===id);

// ===== Ordering strategies (appliquées par bloc) =====
function orderPlan(list, strategy){
  if(strategy==='balanced') return list;
  if(strategy==='min_switch'){
    const prio = [
      'barre+banc+disques',
      'haltères+banc',
      'barre+disques (debout)',
      'banc (levier)',
      'haltères (debout)',
      'poids du corps (tapis)'
    ];
    const idx = s => { const i = prio.indexOf(s||''); return i === -1 ? 999 : i; };
    return list.slice().sort((a,b)=>{
      const da = idx(a.station), db = idx(b.station);
      if(da!==db) return da-db;
      return (a.name||'').localeCompare(b.name||'');
    });
  }
  if(strategy==='pushpull'){
    const pushK = ['Développé','Écartés','Pompes','Hip Thrust','Extension'];
    const pullK = ['Rowing','Soulevé','Curl','Tirage','Inversé'];
    const score = (x)=> (pushK.some(k=>x.name.includes(k))?0 : (pullK.some(k=>x.name.includes(k))?1:2));
    return list.slice().sort((a,b)=>{
      const da=score(a), db=score(b);
      if(da!==db) return da-db;
      if(a.station!==b.station) return (a.station||'').localeCompare(b.station||'');
      return (a.name||'').localeCompare(b.name||'');
    });
  }
  return list;
}

// ===== Misc =====
function estimateDurationSec(plan, sets, reps, rest){
  let repN = parseInt(String(reps).split(/[-/s]/)[0],10);
  if(Number.isNaN(repN)) repN = 10;
  let total = 0;
  for(const ex of plan){
    const tRep = ex.timePerRep || 3;
    const perSet = (repN * tRep) + 30 + rest; // +30s de setup
    total += (sets || ex.sets || 3) * perSet;
  }
  return Math.round(total);
}
const fmtTime = sec => `${Math.floor(sec/60)}m ${String(sec%60).padStart(2,'0')}s`;

// ===== Persistence (localStorage) =====
const KEY = 'coach_session_v1';
const loadAll = ()=>{ try{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }catch(e){ return []; } };
const saveAll = arr => localStorage.setItem(KEY, JSON.stringify(arr));
function saveEntry(id, name, vals){
  const all = loadAll();
  const row = { ts:new Date().toISOString(), id, name,
    sets:vals.sets, reps:vals.reps, rest:vals.rest, kg:vals.kg, rpe:vals.rpe,
    volume: vals.kg * vals.reps * vals.sets };
  all.push(row); saveAll(all);
}

// ===== UI: cards =====
function buildCard(ex, globalSets, globalReps, globalRest){
  const det = document.createElement('details');
  det.className='card';
  det.dataset.id = ex.id;
  const repInit = parseInt(String(ex.reps),10)||10;
  det.innerHTML = `
    <summary>
      <span class="badge">${globalSets} × ${globalReps}</span>
      <span class="name">${ex.name}</span>
      <span class="plus" aria-hidden="true">+</span>
    </summary>
    <div class="content">
      <div class="row">
        <div class="tips">${ex.tips||''}</div>
        <div class="alt" role="group" aria-label="Alternatives">
          ${(ex.alt||[]).map(aid=>{
            const a = typeof aid==='string' ? byId(aid) : aid;
            return a?`<button class="chip" data-replace="${a.id}">${a.name}</button>`:'';
          }).join('') || '<span class="tips">Aucune alternative listée</span>'}
        </div>
      </div>
      <form class="form" onsubmit="return false">
        <div class="rowx">
          <label>Séries<br><input name="sets" type="number" min="1" max="5" value="${globalSets}"></label>
          <label>Reps<br><input name="reps" type="number" min="1" max="30" value="${globalReps||repInit}"></label>
          <label>Repos (s)<br><input name="rest" type="number" min="15" max="240" value="${globalRest||ex.rest}"></label>
          <label>Charge (kg)<br><input name="kg" type="number" min="0" max="300" step="0.5" value="0"></label>
          <label>RPE (0–10)<br><input name="rpe" type="number" min="0" max="10" step="0.5" value="6"></label>
          <div style="align-self:end;display:flex;gap:8px;justify-content:flex-end">
            <button class="btn ghost act-calc">Calculer</button>
            <button class="btn act-add">Valider exo</button>
          </div>
        </div>
        <div class="tips js-est">Durée estimée pour cet exo : — • Volume : —</div>
      </form>
    </div>
  `;

  det.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-replace]');
    if(!btn) return;
    const alt = byId(btn.dataset.replace);
    if(!alt) return;
    det.querySelector('.name').textContent = alt.name;
    det.querySelector('.badge').textContent = `${globalSets} × ${globalReps}`;
    det.dataset.id = alt.id;
    det.querySelector('.tips').textContent = alt.tips || '';
    det.querySelector('.alt').innerHTML = (alt.alt||[]).map(aid=>{
      const a=byId(aid); return a?`<button class="chip" data-replace="${a.id}">${a.name}</button>`:''; }).join('') || '<span class="tips">Aucune alternative listée</span>';
    const form = det.querySelector('form');
    form.sets.value = globalSets;
    form.reps.value = globalReps;
    form.rest.value = globalRest || alt.rest;
    det.querySelector('.js-est').textContent = 'Durée estimée pour cet exo : — • Volume : —';
    e.preventDefault();
  });

  const form = det.querySelector('form');
  form.querySelector('.act-calc').addEventListener('click', ()=>{
    const v = getFormVals(form);
    const t = estimateDurationSec([ex], v.sets, v.reps, v.rest);
    const vol = v.kg * v.reps * v.sets;
    det.querySelector('.js-est').textContent = `Durée estimée pour cet exo : ${fmtTime(t)} • Volume : ${Math.round(vol)} kg·rep • RPE ${v.rpe}`;
  });
  form.querySelector('.act-add').addEventListener('click', ()=>{
    const v = getFormVals(form);
    saveEntry(det.dataset.id, det.querySelector('.name').textContent, v);
    updateSummary();
  });
  return det;
}
const getFormVals = (form)=>({
  sets: clamp(parseInt(form.sets.value,10),1,5),
  reps: clamp(parseInt(form.reps.value,10),1,60),
  rest: clamp(parseInt(form.rest.value,10),15,240),
  kg: Math.max(0, parseFloat(form.kg.value)||0),
  rpe: clamp(parseFloat(form.rpe.value)||0,0,10)
});

// ===== Filters =====
function filterBase(cat){ return EXO_DB.filter(x=>x.cat===cat); }
function applyConstraints(list, equip, space, plateLite){
  let L = list.filter(x=> (space===x.space || space==='standard' || x.space==='faible'));
  if(equip!=='all'){
    L = L.filter(x=> x.equip===equip || ((x.alt||[]).map(byId).filter(Boolean)).some(a=>a.equip===equip));
  }
  if(plateLite){
    const penalty = s => s==='barre+banc+disques'?3 : (s&&s.includes('barre+disques')?2 : 0);
    L = L.slice().sort((a,b)=> penalty(a.station)-penalty(b.station));
  }
  return L;
}

// ===== Render per block =====
function renderBlock(cat, list, sets, reps, rest){
  const elList = $(`#list-${cat}`);
  const elMeta = $(`#meta-${cat}`);
  elList.innerHTML = '';
  list.forEach(ex => elList.appendChild(buildCard(ex, sets, reps, rest)));
  const sec = estimateDurationSec(list, sets, reps, rest);
  elMeta.textContent = list.length ? `${list.length} exos · ~${fmtTime(sec)}` : '—';
  return sec;
}

// ===== Quotas =====
const DEFAULT_QUOTAS = { warm:2, upper:3, lower:3, core:2, stretch:2 };
function computeQuotas(total, enabled, manual, autoSplit){
  const q = {...DEFAULT_QUOTAS, ...manual};
  for(const k of Object.keys(q)){ if(!enabled.has(k)) q[k]=0; }
  let sum = Object.values(q).reduce((a,b)=>a+b,0);
  if(!autoSplit || sum===0) return q;

  const scale = total / sum;
  let out = {};
  for(const k of Object.keys(q)) out[k] = Math.floor(q[k]*scale);
  let used = Object.values(out).reduce((a,b)=>a+b,0);
  const order = ['upper','lower','core','warm','stretch'];
  let i=0; while(used<total){
    const k = order[i++ % order.length];
    if(enabled.has(k)){ out[k]++; used++; }
  }
  return out;
}

// ===== Build plan (multi-bloc) =====
function pickN(lst, n){ return lst.slice(0, Math.max(0,n)); }

function setMiniState(cat, qVal, maxAvail){
  const plus = document.querySelector(`button[data-q="+${cat}"]`);
  const minus= document.querySelector(`button[data-q="-${cat}"]`);
  if(plus){ plus.disabled = qVal >= maxAvail; }
  if(minus){ minus.disabled = qVal <= 0; }
}

function buildAll(){
  // paramètres généraux
  const sets = clamp(parseInt($('#sets').value,10),1,5);
  const reps = clamp(parseInt($('#reps').value,10),1,30);
  const rest = clamp(parseInt($('#rest').value,10),15,240);
  const space = $('#space').value;
  const equip = $('#equip').value;
  const order = $('#order').value;
  const plateLite = $('#plateLite').checked;
  const autoSplit = $('#autoSplit').checked;
  const mode = $('#mode').value;

  // blocs cochés
  const enabled = new Set([...$$('#zones input:checked')].map(i=>i.value));
  if(mode!=='full'){ enabled.clear(); enabled.add(mode); }

  // quotas "visuels" actuels (les spans)
  const manual = {
    warm: parseInt($('#q-warm').textContent,10),
    upper: parseInt($('#q-upper').textContent,10),
    lower: parseInt($('#q-lower').textContent,10),
    core: parseInt($('#q-core').textContent,10),
    stretch: parseInt($('#q-stretch').textContent,10),
  };

  // total demandé en haut (informatif si autoSplit désactivé)
  let nbTotal = clamp(parseInt($('#nbExo').value,10), 0, 999);

  // somme réelle des quotas activés
  const sumManual = Object.entries(manual)
    .filter(([k])=> enabled.has(k))
    .reduce((a,[,v])=>a+v,0);

  // si répartition auto désactivée : pas de rescale, on aligne juste l'affichage du total
  if(!autoSplit){
    nbTotal = sumManual;
    $('#nbExo').value = String(nbTotal);
  }

  // calcule quotas finaux
  const q = computeQuotas(nbTotal, enabled, manual, autoSplit);

  // --- pools filtrés par bloc pour connaître le max disponible & rendre
  let totalSec = 0;
  for(const cat of ['warm','upper','lower','core','stretch']){
    const secEl = $(`#sec-${cat}`);
    const spanEl = $(`#q-${cat}`);
    const enabledCat = enabled.has(cat) && q[cat]>0;

    // mettre à jour l'affichage du quota utilisé (même en autoSplit)
    spanEl.textContent = String(q[cat]);

    // visibilité
    secEl.style.display = enabled.has(cat) && q[cat]>0 ? '' : 'none';

    // calculer la liste dispo pour gérer le max des +/-
    let base = filterBase(cat);
    base = applyConstraints(base, equip, space, plateLite);
    base = orderPlan(base, order);
    const maxAvail = base.length;

    // état des boutons +/- selon disponibilités
    setMiniState(cat, q[cat], maxAvail);

    if(enabledCat){
      const chosen = pickN(base, q[cat]);
      totalSec += renderBlock(cat, chosen, sets, reps, rest);
    }else{
      // vide aussi la liste si masqué
      $(`#list-${cat}`).innerHTML = '';
      $(`#meta-${cat}`).textContent = '—';
    }
  }

  // Récap général
  $('#kDur').textContent = fmtTime(totalSec);
  const all = loadAll();
  const totalVol = all.reduce((a,b)=>a+b.volume,0);
  $('#kVol').textContent = all.length? `${Math.round(totalVol)} kg·rep` : '—';
  $('#kRpe').textContent = all.length? (all.reduce((a,b)=>a+b.rpe,0)/all.length).toFixed(1) : '—';
  $('#log').textContent = all.length ? all.slice(-12).map(r=>`• ${new Date(r.ts).toLocaleTimeString()} — ${r.name}: ${r.sets}×${r.reps} @ ${r.kg}kg (RPE ${r.rpe}) → ${Math.round(r.volume)} kg·rep`).join('\n') : 'Aucune saisie pour cette séance.';
}

// ===== Export / Reset =====
function exportCSV(){
  const all = loadAll();
  if(!all.length){ console.log('Rien à exporter'); return; }
  const head = ['timestamp','id','name','sets','reps','rest','kg','rpe','volume'];
  const rows = all.map(r=>[r.ts,r.id,`"${r.name.replace(/"/g,'""')}"`,r.sets,r.reps,r.rest,r.kg,r.rpe,r.volume].join(','));
  const csv = [head.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`seance-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`; a.click();
  URL.revokeObjectURL(url);
}
function resetAll(){ localStorage.removeItem(KEY); buildAll(); }

// ===== Wire =====
document.addEventListener('DOMContentLoaded', async ()=>{
  // boutons quotas +/-
  $$('.mini').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      // désactive la répartition auto dès qu’on personnalise un bloc
      $('#autoSplit').checked = false;

      const op = btn.dataset.q[0];         // '+' ou '-'
      const cat = btn.dataset.q.slice(1);  // 'warm' | 'upper' | ...
      const span = $('#q-'+cat);
      const v = parseInt(span.textContent,10);
      span.textContent = String(clamp(v + (op==='+'?1:-1), 0, 20));

      buildAll();
    });
  });

  // reroll par bloc
  $$('[data-reroll]').forEach(btn=>{
    btn.addEventListener('click', ()=> buildAll());
  });

  // contrôles généraux
  ['mode','nbExo','sets','reps','rest','space','equip','order','plateLite','autoSplit']
    .forEach(id=> $('#'+id).addEventListener('change', buildAll));
  $$('#zones input').forEach(i=> i.addEventListener('change', buildAll));

  // actions récap
  $('#btnSave').addEventListener('click', buildAll); // juste rafraîchir récap
  $('#btnCsv').addEventListener('click', exportCSV);
  $('#btnReset').addEventListener('click', resetAll);

  // générer
  $('#btnBuild').addEventListener('click', buildAll);

  await loadDB();
  buildAll();
});
