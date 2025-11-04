/* Router ultra-simple pour charger les sous-pages dans #subview */
(function(){
  const SUB=document.getElementById('subview');
  const routes={
    '#/plan'   : {file:'pages/plan.html'},
    '#/plan-b' : {file:'pages/planB.html'},
    '#/encyclo': {file:'pages/encyclo.html', js:'pages/encyclo.js'},
    '#/programs':{file:'pages/programs.html', js:'pages/programs.js'},
    '#/lexique': {file:'pages/lexique.html'},
    '#/reglages':{file:'pages/reglages.html'}
  };
  async function load(h){
    const r=routes[h]||routes['#/plan'];
    const html=await fetch(r.file,{cache:'no-store'}).then(r=>r.text()).catch(()=>'<div class="card">Erreur de chargement</div>');
    SUB.innerHTML=html;
    if(r.js){ const s=document.createElement('script'); s.src=r.js+'?v='+Date.now(); s.defer=true; SUB.appendChild(s); }
    document.querySelectorAll('.nav-tabs .tab').forEach(a=>a.classList.toggle('active', a.getAttribute('href')===h));
  }
  window.addEventListener('hashchange',()=>load(location.hash));
  load(location.hash||'#/plan');

  // exposer de petites helpers (copie A/B)
  window.V5={
    get state(){try{return JSON.parse(localStorage.getItem('coach_v5_state')||'{}')}catch(e){return{}}},
    set state(v){localStorage.setItem('coach_v5_state',JSON.stringify(v))},
    copyAtoB(){const s=this.state; if(s.programA){s.programB=JSON.parse(JSON.stringify(s.programA)); this.state=s; alert('Programme A copié vers B ✅');}},
    copyBtoA(){const s=this.state; if(s.programB){s.programA=JSON.parse(JSON.stringify(s.programB)); this.state=s; alert('Programme B copié vers A ✅');}}
  };
})();
