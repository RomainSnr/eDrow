// Bibliothèque de cartes de domaine (texte du livre de règles, sans illustrations).
const COULEURS = {Arcane:'#8b5cf6',Codex:'#3b82f6',Grâce:'#ec4899',Lame:'#ef4444',Minuit:'#475569',
  Os:'#a16207',Sagesse:'#16a34a',Splendeur:'#d97706',Vaillance:'#dc2626'};
const DOMAINES = Object.keys(COULEURS);
const etat = {domaines:new Set(), niveau:null, q:'', tri:'domaine'};
let cartes = [];
const $ = id => document.getElementById(id);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function chip(txt, actif, couleur, clic){
  const b = document.createElement('button');
  b.className = 'chip' + (actif ? ' on' : '');
  b.textContent = txt;
  if (couleur) b.style.setProperty('--c', couleur);
  b.onclick = clic;
  return b;
}

function filtres(){
  const d = $('domaines'); d.replaceChildren(
    chip('Tous', !etat.domaines.size, null, () => { etat.domaines.clear(); rendre(); }),
    ...DOMAINES.map(n => chip(n, etat.domaines.has(n), COULEURS[n], () => {
      etat.domaines.has(n) ? etat.domaines.delete(n) : etat.domaines.add(n); rendre(); })));
  const n = $('niveaux'); n.replaceChildren(
    chip('Tous niveaux', etat.niveau === null, null, () => { etat.niveau = null; rendre(); }),
    ...Array.from({length:10}, (_, i) => i + 1).map(l =>
      chip('Niv. ' + l, etat.niveau === l, null, () => { etat.niveau = l; rendre(); })));
}

function carte(c){
  const el = document.createElement('details');
  el.className = 'carte'; el.style.setProperty('--c', COULEURS[c.domaine]);
  const s = document.createElement('summary');
  s.innerHTML = '<span class="nom"></span><span class="meta"></span>';
  s.querySelector('.nom').textContent = c.nom;
  s.querySelector('.meta').textContent = `${c.type} · niv. ${c.niveau} · rappel ${c.rappel}`;
  const corps = document.createElement('div'); corps.className = 'corps';
  c.texte.forEach(t => {
    const p = document.createElement('p');
    if (t.startsWith('• ')) p.className = 'puce';
    p.textContent = t; corps.append(p);
  });
  el.append(s, corps);
  return el;
}

function rendre(){
  filtres();
  const q = norm(etat.q.trim());
  let l = cartes.filter(c =>
    (!etat.domaines.size || etat.domaines.has(c.domaine)) &&
    (etat.niveau === null || c.niveau === etat.niveau) &&
    (!q || norm(c.nom + ' ' + c.texte.join(' ')).includes(q)));
  const o = DOMAINES;
  const cmp = {
    domaine:(a,b) => o.indexOf(a.domaine)-o.indexOf(b.domaine) || a.niveau-b.niveau || a.nom.localeCompare(b.nom,'fr'),
    niveau:(a,b) => a.niveau-b.niveau || o.indexOf(a.domaine)-o.indexOf(b.domaine) || a.nom.localeCompare(b.nom,'fr'),
    nom:(a,b) => a.nom.localeCompare(b.nom,'fr')}[etat.tri];
  l.sort(cmp);
  $('compte').textContent = `${l.length} carte${l.length > 1 ? 's' : ''}`;
  const main = $('liste'); main.replaceChildren();
  if (!l.length) { main.innerHTML = '<div class="vide">Aucune carte.</div>'; return; }
  let cle = null;
  l.forEach(c => {
    const k = etat.tri === 'domaine' ? c.domaine : etat.tri === 'niveau' ? 'Niveau ' + c.niveau : null;
    if (k && k !== cle) {
      cle = k; const h = document.createElement('h2'); h.textContent = k;
      if (etat.tri === 'domaine') h.style.setProperty('--c', COULEURS[c.domaine]);
      main.append(h);
    }
    main.append(carte(c));
  });
}

$('q').oninput = e => { etat.q = e.target.value; rendre(); };
$('tri').onchange = e => { etat.tri = e.target.value; rendre(); };
fetch('cartes.json').then(r => r.json()).then(d => { cartes = d; rendre(); })
  .catch(() => { $('liste').innerHTML = '<div class="vide">Impossible de charger cartes.json</div>'; });
