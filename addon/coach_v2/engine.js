/* ========= Training Load Engine — v2 ========= */
(function(){
  const KEY = 'journal_fullbody_v3'; // même que journal
  const $ = (q,root=document)=>root.querySelector(q);
  const $$ = (q,root=document)=>[...root.querySelectorAll(q)];

  function loadJournal(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || {items:[]} }
    catch{ return {items:[]} }
  }
  function saveJournal(data){ localStorage.setItem(KEY, JSON.stringify(data)); }

  // Vérif base EXOS
  if(typeof EXOS === 'undefined'){
    console.error('[Engine] EXOS manquant : charge d’exercices introuvable.');
    return;
  }

  // --- Helpers volume
  function estVolume(ex){
    const b = ex.base || {};
    if(ex.mode==='reps'){
      const w = b.weight || 0, r = b.reps || 10, s = b.sets || 3;
      return w * r * s;
    }else{
      const t = b.time || 30, s = b.sets || 3;
      return t * s; // équivalence simplifiée pour la charge globale
    }
  }
  function volFromStruct(s){
    return (s.mode==='reps') ? (s.weight*s.reps*s.sets) : (s.time*s.sets);
  }

  function poolFor(cat){
    if(cat==='Full'){
      return [
        ...((EXOS['Échauffement']||[]).slice(0,2)),
        ...(EXOS['Haut du corps']||[]),
        ...(EXOS['Bas du corps']||[]),
        ...(EXOS['Core/Abdos']||[])
      ];
    }
    if(cat==='Cardio doux'){
      return (EXOS['Échauffement']||[]).filter(e=>e.mode==='time');
    }
    return EXOS[cat]||[];
  }

  function guessCatOf(name){
    for(const k of Object.keys(EXOS)){ if((EXOS[k]||[]).some(e=>e.name===name)) return k; }
    return 'Full';
  }

  function structFromEx(ex, rpe){
    const b = ex.base||{};
    return {
      name: ex.name,
      cat: guessCatOf(ex.name),
      mode: ex.mode,
      weight: +b.weight||0,
      reps: +b.reps||0,
      time: +b.time||0,
      sets: +b.sets||3,
      rpe: +b.rpe||rpe
    };
  }

  // --- Génération
  function generatePlan(targetLoad, cat, globalRpe, tol=0.05){
    const src = poolFor(cat).map(e=>({ex:e, vol:estVolume(e)}))
                            .filter(x=>x.vol>0)
                            .sort((a,b)=>b.vol-a.vol);

    const plan = [];
    let totalVol = 0;

    let i=0;
    while(i<src.length && (totalVol*globalRpe/10) < targetLoad*(1-tol)){
      const {ex} = src[i++];
      const s = structFromEx(ex, globalRpe);
      plan.push(s);
      totalVol += volFromStruct(s);
    }

    // Ajuste la/les séries pour affiner
    totalVol = plan.reduce((s,x)=>s+volFromStruct(x),0);
    let load = totalVol * (globalRpe/10);
    const want = targetLoad;

    if(plan.length){
      const last = plan[plan.length-1];
      const factor = want / (load || 1);
      last.sets = Math.min(8, Math.max(1, Math.round(last.sets * factor)));
      totalVol = plan.reduce((s,x)=>s+volFromStruct(x),0);
      load = totalVol * (globalRpe/10);

      if(Math.abs(load - want) > want*tol && plan.length>1){
        const second = plan[plan.length-2];
        const factor2 = want / (load || 1);
        second.sets = Math.min(8, Math.max(1, Math.round(second.sets * factor2)));
        totalVol = plan.reduce((s,x)=>s+volFromStruct(x),0);
        load = totalVol * (globalRpe/10);
      }
    }
    return {plan, totalVol, load};
  }

  // --- Rendu
  function renderPlan(res, rpe){
    const tb = $('#tleTable tbody');
    tb.innerHTML = ''; // reset
    const fmt = n=>new Intl.NumberFormat('fr-FR').format(Math.round(n));

    res.plan.forEach(p=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${p.name}</td><td>${p.cat}</td><td>${p.mode}</td>
        <td>${p.weight||0}</td><td>${p.reps||0}</td><td>${p.time||0}</td>
        <td>${p.sets||0}</td><td>${p.rpe||rpe}</td>
        <td>${fmt(volFromStruct(p))}</td>`;
      tb.appendChild(tr);
    });

    $('#tleVol').textContent  = fmt(res.totalVol);
    $('#tleLoad').textContent = fmt(res.load);
    $('#tleKcal').textContent = fmt(res.load/5.5);

    // Bar/mètre (recrée le curseur à chaque fois)
    const bar = $('#tleBar');
    bar.innerHTML = ''; // reset curseur
    const score = res.load;
    const max = Math.max(6500, score);
    const pos = Math.min(100, Math.max(0, (score/max)*100));
    const cursor = document.createElement('div');
    cursor.style.cssText = `position:absolute;left:${pos}%;top:-6px;width:2px;height:24px;background:#fff;border-radius:2px;transform:translateX(-1px)`;
    bar.appendChild(cursor);

    $('#tleSave').disabled = res.plan.length===0;
  }

  // --- Sauvegarde dans le journal
  function saveToJournal(res){
    const j = loadJournal();
    const todayStr = new Date().toISOString().slice(0,10);
    res.plan.forEach(p=>{
      j.items.push({
        date: todayStr,
        cat: p.cat,
        name: p.name,
        mode: p.mode,
        weight: p.weight||0,
        reps: p.reps||0,
        time: p.time||0,
        sets: p.sets||0,
        rpe: p.rpe||7,
        feel: 'Moyen',
        volume: volFromStruct(p)
      });
    });
    saveJournal(j);
    alert('Séance enregistrée dans le journal ✅');
  }

  // --- Hook UI
  let lastPlan = null;

  function doGenerate(){
    const target = +($('#tleScore').value||3000);
    const cat    = ($('#tleCat').value||'Full');
    const tol    = +( $('#tleTol').value||'0.05' );
    const rpe    = +($('#tleRpe').value||7);

    const res = generatePlan(target, cat, rpe, tol);
    lastPlan = res;
    renderPlan(res, rpe);
  }

  // Clic = regénère à chaque fois
  $('#tleGen').addEventListener('click', doGenerate);

  // Et aussi en direct sur changements (optionnel mais pratique)
  ['tleScore','tleCat','tleTol','tleRpe'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', ()=>{ /* léger debounce visuel */
      if(el._t) clearTimeout(el._t);
      el._t = setTimeout(()=>doGenerate(), 120);
    });
    el.addEventListener('change', doGenerate);
  });

  $('#tleSave').addEventListener('click', ()=>{ if(lastPlan) saveToJournal(lastPlan); });

  // Première génération par défaut (pour voir quelque chose)
  doGenerate();
})();
