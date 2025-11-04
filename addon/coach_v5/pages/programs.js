/* ==========================================================
   Templates (programmes sans jours) — création, import, application
========================================================== */
(function(){
  if(!window.V5) return;

  const K = 'coach_v5_templates';

  const $ = s => document.querySelector(s);
  const list = $('#tp-list');
  const selTpl = $('#ap-tpl');

  function load(){ try{ return JSON.parse(localStorage.getItem(K)||'[]'); }catch{ return []; } }
  function save(arr){ localStorage.setItem(K, JSON.stringify(arr)); }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }

  function render(){
    const db = load();
    list.innerHTML = '';
    selTpl.innerHTML = '';

    db.forEach(t=>{
      selTpl.append(new Option(t.name, t.id));

      const card = document.createElement('div');
      card.className='cardExo';
      card.innerHTML = `
        <div class="title">${t.name} <span class="meta">items: ${t.items.length}</span></div>
        <div class="meta">${(t.tags||[]).join(' • ')||'—'}</div>
        <div class="buttons">
          <button class="btn small" data-edit="${t.id}">Renommer</button>
          <button class="btn small danger" data-del="${t.id}">Supprimer</button>
        </div>
      `;
      card.querySelector('[data-edit]')?.addEventListener('click', ()=>{
        const nv = prompt('Nouveau nom :', t.name); if(!nv) return;
        const all = load(); const x=all.find(a=>a.id===t.id); if(!x) return;
        x.name = nv; save(all); render();
      });
      card.querySelector('[data-del]')?.addEventListener('click', ()=>{
        if(!confirm('Supprimer ce template ?')) return;
        const all = load().filter(a=>a.id!==t.id); save(all); render();
      });

      list.appendChild(card);
    });

    if(!db.length){
      const p=document.createElement('p'); p.className='hint'; p.textContent='Aucun template pour le moment.';
      list.appendChild(p);
    }
  }

  // -- Création vide
  $('#tp-create')?.addEventListener('click', ()=>{
    const name = ($('#tp-name')?.value||'').trim();
    if(!name){ alert('Nom requis'); return; }
    const db=load();
    const id=slug(name);
    if(db.some(x=>x.id===id)){ alert('Ce nom existe déjà.'); return; }
    db.push({ id, name, tags:[], items:[] });
    save(db); render();
    $('#tp-name').value='';
  });

  // -- Importer depuis A/B jour X
  $('#tp-import')?.addEventListener('click', ()=>{
    const src=$('#tp-import-src')?.value||'A';
    const day=Number($('#tp-import-day')?.value||1);
    const s=V5.getState();
    const prog = src==='A' ? s.programA : s.programB;
    const d = prog?.[day];
    if(!d || !(d.items||[]).length){ alert('Jour vide.'); return; }
    const name = prompt('Nom du nouveau template :', `${src}-Jour-${day}`) || `${src}-Jour-${day}`;
    const db=load(); const id=slug(name);
    db.push({ id, name, tags:['import'], items: JSON.parse(JSON.stringify(d.items||[])) });
    save(db); render();
  });

  // == Application d’un template ==
  function getSelectedTemplate(){
    const id = $('#ap-tpl')?.value; if(!id) return null;
    const t = load().find(x=>x.id===id);
    return t || null;
  }

  function applyOptions(items, mode){
    if(mode==='pdc'){
      // forcer charges à PDC si muscu
      return items.map(it=>{
        if(it.type==='muscu'){
          const v={...it.vals, load:'PDC'}; return {...it, vals:v};
        }
        return it;
      });
    }
    if(mode==='loads'){
      // conserver tel quel
      return items;
    }
    if(mode==='logic'){
      // Ordre simple : push -> hinge/squat -> pull -> core -> finisher/cardio
      const score = (name,type)=>{
        const n = name.toLowerCase();
        if(type==='cardio'||type==='tibo') return 90;
        if(type==='core') return 80;
        if(n.includes('développé')||n.includes('pompe')||n.includes('militaire')) return 10; // push
        if(n.includes('squat')||n.includes('fente')||n.includes('hip')||n.includes('soulevé')) return 20; // jambes/hinge
        if(n.includes('rowing')||n.includes('tirage')||n.includes('row')) return 30; // pull
        return 50;
      };
      return [...items].sort((a,b)=> score(a.name,a.type)-score(b.name,b.type));
    }
    // libre : tel quel
    return items;
  }

  function setDay(progKey, day, items){
    const s=V5.getState();
    if(!s[progKey]) s[progKey]={};
    if(!s[progKey][day]) s[progKey][day]={type:'full', items:[]};
    s[progKey][day].items = items;
    // deviner type
    const hasCardio = items.some(x=>x.type==='cardio'||x.type==='tibo');
    const hasMuscu  = items.some(x=>x.type==='muscu'||x.type==='core');
    s[progKey][day].type = hasCardio&&!hasMuscu?'cardio':hasMuscu?'full':'off';
    V5.saveState(s);
  }

  $('#ap-apply')?.addEventListener('click', ()=>{
    const tpl = getSelectedTemplate(); if(!tpl){ alert('Choisis un template.'); return; }
    const progKey = ($('#ap-prog')?.value||'A')==='A'?'programA':'programB';
    const mode = document.querySelector('input[name="ap-opt"]:checked')?.value||'free';
    const items = applyOptions(JSON.parse(JSON.stringify(tpl.items||[])), mode);

    const how = $('#ap-mode')?.value||'single';
    if(how==='single'){
      const d=Number($('#ap-day1')?.value||1);
      setDay(progKey, d, items);
      alert(`Appliqué au ${progKey==='programA'?'Programme A':'Programme B'} — ${V5.dayLabel(d)} ✅`);
    }else{
      const sel = Array.from($('#ap-days')?.selectedOptions||[]).map(o=>Number(o.value));
      if(!sel.length){ alert('Choisis au moins un jour.'); return; }
      sel.forEach(d=> setDay(progKey, d, items));
      alert(`Appliqué sur ${sel.length} jour(s) du ${progKey==='programA'?'Programme A':'Programme B'} ✅`);
    }
  });

  render();
})();
