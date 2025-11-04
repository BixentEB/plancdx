// app.js — Coach v3.2
const CAL_STORAGE = 'coach_v3_calendar';
const CYCLE_STORAGE = 'coach_v3_cycle_start';

// ===== Calendar Pro =====
const calEl = document.getElementById('calendar');
const calTitle = document.getElementById('cal-title');
let calState = { y: new Date().getFullYear(), m: new Date().getMonth() };
const planJour = {1:'full',2:'cardio',3:'full',4:'cardio',5:'full',6:'cardio',0:'off'}; // Dim=0

function weekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() || 7);
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}

function loadCal() {
  try { return JSON.parse(localStorage.getItem(CAL_STORAGE) || '{}'); }
  catch(e){ return {}; }
}
function saveCal(v) { localStorage.setItem(CAL_STORAGE, JSON.stringify(v)); }

function renderCalendar() {
  if(!calEl) return;
  const { y, m } = calState;
  const first = new Date(y, m, 1);
  const last = new Date(y, m+1, 0);
  const todayStr = new Date().toLocaleDateString('sv-SE'); // local yyyy-mm-dd

  calTitle.textContent = first.toLocaleDateString('fr-FR',{ month:'long', year:'numeric' });
  calEl.innerHTML = '';

  const heads = ['#','L','M','M','J','V','S','D'];
  for (const h of heads) {
    const hd = document.createElement('div');
    hd.className = 'weeknum';
    hd.textContent = h;
    calEl.appendChild(hd);
  }

  const pad = ((first.getDay() - 1 + 7) % 7);
  let curRowDayCount = 0;
  const valids = loadCal();

  const wn0 = weekNumber(new Date(y,m,1));
  const wnCell0 = document.createElement('div');
  wnCell0.className = 'weeknum';
  wnCell0.textContent = wn0;
  calEl.appendChild(wnCell0);
  curRowDayCount++;

  for (let i=0;i<pad;i++){ const e=document.createElement('div'); calEl.appendChild(e); curRowDayCount++; }

  for (let d=1; d<=last.getDate(); d++) {
    if (curRowDayCount===0) {
      const wn = weekNumber(new Date(y,m,d));
      const wnc = document.createElement('div');
      wnc.className = 'weeknum'; wnc.textContent = wn;
      calEl.appendChild(wnc);
      curRowDayCount++;
    }

    const date = new Date(y, m, d);
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toLocaleDateString('sv-SE');
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.textContent = d;
    if (key===todayStr) cell.classList.add('today');

    const dow = date.getDay();
    const type = planJour[dow] || 'off';
    const dot = document.createElement('span');
    dot.className = 'badge-mini ' + type;
    cell.classList.add('border-'+type);
    if (valids[key]) dot.className = 'badge-mini ok';
    cell.appendChild(dot);

    cell.title = `${key} • Prévu: ${type}${valids[key]?' • Validé':''}`;
    cell.addEventListener('click', ()=>{
      const cur = loadCal();
      if (cur[key]) delete cur[key]; else cur[key] = true;
      saveCal(cur);
      renderCalendar();
    });

    calEl.appendChild(cell);
    curRowDayCount++;
    if (curRowDayCount===8) curRowDayCount=0;
  }
}

document.getElementById('cal-prev').addEventListener('click', ()=>{
  calState.m--; if(calState.m<0){ calState.m=11; calState.y--; } renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', ()=>{
  calState.m++; if(calState.m>11){ calState.m=0; calState.y++; } renderCalendar();
});
renderCalendar();

// ===== Collapse day sections
document.querySelectorAll('.day').forEach(day=>{
  const btn = day.querySelector('.chev');
  const body = day.querySelector('.body');
  btn.addEventListener('click', ()=>{
    const open = btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.textContent = open ? '▸' : '▾';
    body.classList.toggle('hidden', open);
  });
});

// ===== Notes toggle
document.querySelectorAll('.note-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const note = btn.closest('.exo').querySelector('.note');
    note.classList.toggle('hidden');
  });
});

// ===== Dense/Chips toggle
document.getElementById('toggleLayout').addEventListener('click', ()=>{
  const old = document.body.dataset.layout || 'dense';
  const next = (old==='dense' ? 'chips' : 'dense');
  document.body.dataset.layout = next;
  renderExoChips(next);
});
function renderExoChips(layout = (document.body.dataset.layout||'dense')){
  document.querySelectorAll('.exo').forEach(exo=>{
    let chip = exo.querySelector('.chips');
    if (layout==='chips'){
      if (!chip){
        chip = document.createElement('div');
        chip.className = 'chips';
        exo.appendChild(chip);
      }
      const sets = exo.querySelector('[data-k="sets"]')?.value ?? '';
      const reps = exo.querySelector('[data-k="reps"]')?.value ?? '';
      const tempo = exo.querySelector('[data-k="tempo"]')?.value ?? '';
      const rpe = exo.querySelector('[data-k="rpe"]')?.value ?? '';
      chip.textContent = `${sets}×${reps} • ${tempo} • RPE ${rpe}`;
      const p = exo.querySelector('.params'); if(p) p.style.display = 'none';
    } else {
      if (chip) chip.remove();
      const p = exo.querySelector('.params'); if(p) p.style.display = '';
    }
  });
}
renderExoChips();

// ===== Difficulty panel
const presetBtns = document.querySelectorAll('#difficulty [data-preset]');
const rpeCustom = document.getElementById('rpeCustom');
const rpeVal = document.getElementById('rpeVal');
const add05 = document.getElementById('add05');
let rpeOffset = 0;

presetBtns.forEach(b=>b.addEventListener('click', ()=>{
  presetBtns.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  rpeOffset = Number(b.dataset.preset);
  rpeCustom.value = rpeOffset;
  rpeVal.textContent = String(rpeOffset);
}));
rpeCustom.addEventListener('input', ()=>{
  rpeOffset = Number(rpeCustom.value);
  rpeVal.textContent = String(rpeOffset);
  presetBtns.forEach(x=>x.classList.remove('active'));
});

let diffMode = 'muscu';
const modeBtns = document.querySelectorAll('.mode-btn');
modeBtns.forEach(b=>b.addEventListener('click', ()=>{
  modeBtns.forEach(x=>x.classList.remove('active')); b.classList.add('active');
  diffMode = b.dataset.mode;
}));
const daySelect = document.getElementById('daySelect');
function targetDayIdx(){
  const v = Number(daySelect.value);
  if (!isNaN(v) && v>=0) return v;
  const open = document.querySelector('.day .chev[aria-expanded="true"]');
  if (open) return Number(open.closest('.day').dataset.day);
  return new Date().getDay();
}

// Cycle start & rotation 4 semaines
const cycleStartInput = document.getElementById('cycleStart');
const cycleInfo = document.getElementById('cycleInfo');
function loadCycleStart(){
  const v = localStorage.getItem(CYCLE_STORAGE);
  if (v) cycleStartInput.value = v;
}
function saveCycleStart(){
  if (cycleStartInput.value) localStorage.setItem(CYCLE_STORAGE, cycleStartInput.value);
}
function updateCycleInfo(){
  if (!cycleStartInput.value){ cycleInfo.textContent = 'Définis une date de début de cycle'; return; }
  const s = new Date(cycleStartInput.value + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now - s)/(1000*60*60*24));
  const week = Math.max(1, Math.floor(diffDays/7)+1);
  const block = ((Math.floor((week-1)/4))%2===0) ? 'A' : 'B';
  const tempo = block==='A' ? '2-1-2' : '3-1-1';
  const repRange = block==='A' ? '10–15' : '8–12 (+charge)';
  cycleInfo.textContent = `Semaine ${week} • Tempo ${tempo} • ${repRange}`;
}
loadCycleStart(); updateCycleInfo();
cycleStartInput.addEventListener('change', ()=>{ saveCycleStart(); updateCycleInfo(); });

function applyMuscuToDay(dayIdx){
  const card = document.querySelector(`.day[data-day="${dayIdx}"]`);
  if (!card) return;
  const blockB = cycleInfo.textContent.includes('3-1-1');
  card.querySelectorAll('.exo').forEach(exo=>{
    const setsI = exo.querySelector('[data-k="sets"]');
    const repsI = exo.querySelector('[data-k="reps"]');
    const tempoI = exo.querySelector('[data-k="tempo"]');
    const rpeI = exo.querySelector('[data-k="rpe"]');
    const loadI = exo.querySelector('[data-k="load"]');
    if (tempoI) tempoI.value = blockB ? '3-1-1' : '2-1-2';
    if (repsI) repsI.value = Math.max(1, Number(repsI.value) + rpeOffset);
    if (setsI) setsI.value = Math.max(1, Number(setsI.value) + Math.floor(rpeOffset/2));
    if (rpeI)  rpeI.value = (Number(rpeI.value) + rpeOffset).toString().replace(/\.0$/,'');
    if (add05.checked && loadI && /\\d/.test(loadI.value)){
      loadI.value = loadI.value.replace(/(\\d+(?:[.,]\\d+)?)/g, (m)=>{
        const n = parseFloat(m.replace(',','.')); return String((n+0.5).toFixed(1)).replace('.',',');
      });
    }
  });
  renderExoChips();
}

// Cardio helpers
function updateCardio(exo){
  const total = Number(exo.querySelector('[data-k="total"]')?.value || 0);
  const wu = Number(exo.querySelector('[data-k="wu"]')?.value || 5);
  const cd = Number(exo.querySelector('[data-k="cd"]')?.value || 5);
  const bloc = exo.querySelector('[data-k="bloc"]');
  if (!bloc) return;
  if (!total){ bloc.value = '—'; return; }
  const remaining = Math.max(0, total - wu - cd);
  const cycles = Math.max(1, Math.floor(remaining / 5));
  bloc.value = `Marche 4’ + Run 1’ × ${cycles}`;
}
function wireCardio(container){
  container.querySelectorAll('.cardio').forEach(cardio=>{
    cardio.querySelectorAll('[data-k="total"],[data-k="wu"],[data-k="cd"]').forEach(inp=>{
      inp.addEventListener('input', ()=>updateCardio(cardio));
    });
    updateCardio(cardio);
  });
}
wireCardio(document);

function applyCardioToDay(dayIdx){
  const card = document.querySelector(`.day[data-day="${dayIdx}"]`);
  if (!card) return;
  card.querySelectorAll('.cardio').forEach(exo=>{
    const totalI = exo.querySelector('[data-k="total"]');
    if (totalI){
      const base = Number(totalI.value || 0);
      const delta = rpeOffset * 5;
      totalI.value = Math.max(10, base + delta);
      updateCardio(exo);
    }
  });
}

function addTiboToDay(dayIdx){
  const card = document.querySelector(`.day[data-day="${dayIdx}"]`);
  if (!card) return;
  if (card.querySelector('.exo.tibo')) return;
  const block = document.createElement('div');
  block.className = 'exo cardio tibo';
  block.innerHTML = `
    <div class="line1">
      <span class="name">TIBO Extrm</span>
      <span class="goal">Brûle graisse (HIIT guidé)</span>
    </div>
    <div class="line2 params cardio-controls">
      <label>Total <input class="num xs" data-k="total" type="number" value="30"></label>
      <label>WU <input class="num xs" data-k="wu" type="number" value="5"></label>
      <label>CD <input class="num xs" data-k="cd" type="number" value="5"></label>
      <label>Bloc <input class="num lg" data-k="bloc" type="text" value="Routine vidéo"></label>
    </div>`;
  card.querySelector('.body').appendChild(block);
  wireCardio(card);
}

// Apply buttons
document.getElementById('applyToday').addEventListener('click', ()=>{
  const v = Number(document.getElementById('daySelect').value);
  let d;
  if (!isNaN(v) && v>=0) d = v;
  else {
    const open = document.querySelector('.day .chev[aria-expanded="true"]');
    d = open ? Number(open.closest('.day').dataset.day) : new Date().getDay();
  }
  if (diffMode==='muscu') applyMuscuToDay(d);
  else if (diffMode==='cardio') applyCardioToDay(d);
  else addTiboToDay(d);
});
document.getElementById('resetToday').addEventListener('click', ()=>location.reload());
