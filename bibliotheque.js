import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

// À aligner sur l'identifiant de ton extension (manifest / autres métadonnées).
const ID = "com.romainsnr.edrow";
const KEY = `${ID}/cartes`;

const COUL = {Arcane:'#8b5cf6',Codex:'#3b82f6',Grâce:'#ec4899',Lame:'#ef4444',Minuit:'#475569',
  Os:'#a16207',Sagesse:'#16a34a',Splendeur:'#d97706',Vaillance:'#dc2626'};
const DOMAINES = Object.keys(COUL);
const CATS = [['domaine','Domaines'],['ascendance','Ascendances'],['communaute','Communautés'],
  ['principale','Armes principales'],['secondaire','Armes secondaires'],['armure','Armures'],['fauteuil','Fauteuils roulants']];
const LIBELLE = Object.fromEntries(CATS);
const $ = id => document.getElementById(id);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const etat = {vue:'biblio', cat:'domaine', domaines:new Set(), niveau:null, palier:null, type:null, q:'', tri:'domaine', token:null};
let cartes = [], parId = new Map();

// ---------- données ----------
const corps = (apt) => apt && apt !== '–' ? [{t:apt}] : [];
function adapter(d){
  const out = [];
  d.cartes.forEach(c => out.push({id:c.id, cat:'domaine', titre:c.nom, domaine:c.domaine, niveau:c.niveau, couleur:COUL[c.domaine],
    meta:`${c.type} · ${c.domaine} · niv. ${c.niveau} · rappel ${c.rappel}`, corps:c.texte.map(t => ({t}))}));
  [['ascendance', d.ascendances], ['communaute', d.communautes]].forEach(([cat, l]) => l.forEach(a => out.push({
    id:a.id, cat, titre:a.nom, meta:cat === 'ascendance' ? 'Ascendance' : 'Communauté',
    corps:[{d:a.description}, ...a.aptitudes.map(x => ({b:x.nom, t:x.texte}))]})));
  d.equipement.forEach(e => {
    const base = {id:e.id, cat:e.cat, titre:e.nom, palier:e.palier};
    if (e.cat === 'armure') out.push({...base, meta:`Palier ${e.palier} · seuils ${e.seuils} · armure ${e.valeur}`, corps:corps(e.aptitude)});
    else out.push({...base, type:/mag/.test(e.degats) ? 'mag' : 'phy',
      meta:`Palier ${e.palier} · ${e.trait} · ${e.portee} · ${e.degats} · ${e.encombrement}`, corps:corps(e.aptitude)});
  });
  return out;
}

// ---------- token ----------
async function lireSelection(){
  if (!OBR.isAvailable) return;
  const ids = await OBR.player.getSelection();
  if (!ids || !ids.length) { etat.token = null; return; }
  const [it] = await OBR.scene.items.getItems([ids[0]]);
  etat.token = it ? {id:it.id, nom:it.name || it.text?.plainText || 'Token', cartes:Array.isArray(it.metadata[KEY]) ? it.metadata[KEY] : []} : null;
}
async function basculer(id){
  const t = etat.token; if (!t) return;
  await OBR.scene.items.updateItems([t.id], items => {
    const l = Array.isArray(items[0].metadata[KEY]) ? [...items[0].metadata[KEY]] : [];
    const i = l.indexOf(id); i >= 0 ? l.splice(i, 1) : l.push(id);
    items[0].metadata[KEY] = l;
  });
  await lireSelection(); rendre();
}
async function vider(){
  if (!etat.token || !confirm('Retirer toutes les cartes de ce token ?')) return;
  await OBR.scene.items.updateItems([etat.token.id], items => { delete items[0].metadata[KEY]; });
  await lireSelection(); rendre();
}

// ---------- rendu ----------
function chip(txt, on, couleur, clic){
  const b = document.createElement('button');
  b.className = 'chip' + (on ? ' on' : ''); b.textContent = txt;
  if (couleur) b.style.setProperty('--c', couleur);
  b.onclick = clic; return b;
}
function rangee(...chips){ const d = document.createElement('div'); d.className = 'chips'; d.append(...chips); return d; }
const reset = () => { etat.domaines.clear(); etat.niveau = null; etat.palier = null; etat.type = null; };

function controles(){
  const c = $('controles'); c.replaceChildren();
  if (etat.vue === 'token') return;
  c.append(rangee(...CATS.map(([k, l]) => chip(l, etat.cat === k, null, () => { etat.cat = k; reset(); rendre(); }))));
  if (etat.cat === 'domaine') {
    c.append(rangee(chip('Tous domaines', !etat.domaines.size, null, () => { etat.domaines.clear(); rendre(); }),
      ...DOMAINES.map(n => chip(n, etat.domaines.has(n), COUL[n], () => { etat.domaines.has(n) ? etat.domaines.delete(n) : etat.domaines.add(n); rendre(); }))));
    c.append(rangee(chip('Tous niveaux', etat.niveau === null, null, () => { etat.niveau = null; rendre(); }),
      ...Array.from({length:10}, (_, i) => i + 1).map(l => chip('Niv. ' + l, etat.niveau === l, null, () => { etat.niveau = l; rendre(); }))));
  } else if (['principale', 'secondaire', 'armure', 'fauteuil'].includes(etat.cat)) {
    const r = [chip('Tous paliers', etat.palier === null, null, () => { etat.palier = null; rendre(); }),
      ...[1, 2, 3, 4].map(p => chip('Palier ' + p, etat.palier === p, null, () => { etat.palier = p; rendre(); }))];
    if (etat.cat === 'principale' || etat.cat === 'secondaire')
      r.push(chip('Physique', etat.type === 'phy', null, () => { etat.type = etat.type === 'phy' ? null : 'phy'; rendre(); }),
             chip('Magique', etat.type === 'mag', null, () => { etat.type = etat.type === 'mag' ? null : 'mag'; rendre(); }));
    c.append(rangee(...r));
  }
  const q = document.createElement('input');
  q.type = 'search'; q.placeholder = 'Rechercher…'; q.value = etat.q; q.style.marginTop = '6px';
  q.oninput = e => { etat.q = e.target.value; liste(); };
  c.append(q);
  if (etat.cat === 'domaine') {
    const bar = document.createElement('div'); bar.className = 'barre';
    bar.innerHTML = '<label>Tri <select><option value="domaine">Domaine, puis niveau</option><option value="niveau">Niveau, puis domaine</option><option value="nom">Nom (A–Z)</option></select></label><span id="compte"></span>';
    const s = bar.querySelector('select'); s.value = etat.tri; s.onchange = e => { etat.tri = e.target.value; liste(); };
    c.append(bar);
  } else { const bar = document.createElement('div'); bar.className = 'barre'; bar.innerHTML = '<span id="compte"></span>'; c.append(bar); }
}

function carte(c){
  const el = document.createElement('details'); el.className = 'carte';
  if (c.couleur) el.style.setProperty('--c', c.couleur);
  const dedans = etat.token?.cartes.includes(c.id);
  const s = document.createElement('summary');
  s.innerHTML = '<span class="nom"></span><span class="meta"></span>';
  s.querySelector('.nom').textContent = (dedans && etat.vue === 'biblio' ? '✓ ' : '') + c.titre;
  s.querySelector('.meta').textContent = c.meta;
  const b = document.createElement('div'); b.className = 'corps';
  c.corps.forEach(x => {
    const p = document.createElement('p');
    if (x.d) { p.className = 'desc'; p.textContent = x.d; }
    else {
      if (x.t?.startsWith('• ')) p.className = 'puce';
      if (x.b) { const g = document.createElement('b'); g.textContent = x.b + '. '; p.append(g); }
      p.append(x.t);
    }
    b.append(p);
  });
  if (etat.token) {
    const a = document.createElement('div'); a.className = 'act';
    const btn = document.createElement('button');
    btn.className = 'btn' + (dedans ? ' danger' : ' plein');
    btn.textContent = dedans ? 'Retirer du token' : 'Ajouter au token';
    btn.onclick = () => basculer(c.id); a.append(btn); b.append(a);
  }
  el.append(s, b); return el;
}

function trier(l){
  const ordre = c => DOMAINES.indexOf(c.domaine);
  const nom = (a, b) => a.titre.localeCompare(b.titre, 'fr');
  if (etat.cat === 'domaine') {
    const f = {domaine:(a, b) => ordre(a) - ordre(b) || a.niveau - b.niveau || nom(a, b),
      niveau:(a, b) => a.niveau - b.niveau || ordre(a) - ordre(b) || nom(a, b), nom}[etat.tri];
    return l.sort(f);
  }
  return l.sort((a, b) => (a.palier || 0) - (b.palier || 0) || nom(a, b));
}
const groupe = c => etat.cat !== 'domaine' ? (c.palier ? 'Palier ' + c.palier : null)
  : etat.tri === 'domaine' ? c.domaine : etat.tri === 'niveau' ? 'Niveau ' + c.niveau : null;

function liste(){
  const main = $('liste'); main.replaceChildren();
  let l;
  if (etat.vue === 'token') {
    const ids = etat.token?.cartes || [];
    l = ids.map(i => parId.get(i)).filter(Boolean)
      .sort((a, b) => CATS.findIndex(x => x[0] === a.cat) - CATS.findIndex(x => x[0] === b.cat));
    if (!etat.token) { main.innerHTML = '<div class="vide">Sélectionne un token dans la scène.</div>'; return; }
    if (!l.length) { main.innerHTML = '<div class="vide">Aucune carte sur ce token. Ajoute-en depuis la bibliothèque.</div>'; return; }
    let cle = null;
    l.forEach(c => { if (c.cat !== cle) { cle = c.cat; const h = document.createElement('h2'); h.textContent = LIBELLE[c.cat]; main.append(h); } main.append(carte(c)); });
    const v = document.createElement('div'); v.className = 'act';
    const b = document.createElement('button'); b.className = 'btn danger'; b.textContent = 'Vider ce token'; b.onclick = vider; v.append(b); main.append(v);
    return;
  }
  const q = norm(etat.q.trim());
  l = cartes.filter(c => c.cat === etat.cat
    && (etat.cat !== 'domaine' || !etat.domaines.size || etat.domaines.has(c.domaine))
    && (etat.niveau === null || c.niveau === etat.niveau)
    && (etat.palier === null || c.palier === etat.palier)
    && (!etat.type || c.type === etat.type)
    && (!q || norm(c.titre + ' ' + c.meta + ' ' + c.corps.map(x => (x.b || '') + (x.t || '') + (x.d || '')).join(' ')).includes(q)));
  trier(l);
  const n = $('compte'); if (n) n.textContent = `${l.length} entrée${l.length > 1 ? 's' : ''}`;
  if (!l.length) { main.innerHTML = '<div class="vide">Aucun résultat.</div>'; return; }
  let cle = null;
  l.forEach(c => {
    const k = groupe(c);
    if (k && k !== cle) { cle = k; const h = document.createElement('h2'); h.textContent = k; if (c.couleur && etat.tri === 'domaine') h.style.setProperty('--c', c.couleur); main.append(h); }
    main.append(carte(c));
  });
}

function rendre(){
  const v = $('vues'); v.replaceChildren();
  [['biblio', 'Bibliothèque'], ['token', 'Mon token' + (etat.token?.cartes.length ? ` (${etat.token.cartes.length})` : '')]].forEach(([k, l]) => {
    const b = document.createElement('button'); b.textContent = l; b.className = etat.vue === k ? 'on' : '';
    b.onclick = () => { etat.vue = k; rendre(); }; v.append(b);
  });
  const t = $('entete-token');
  t.innerHTML = '';
  if (!OBR.isAvailable) t.textContent = 'Ouvre cette page dans Owlbear pour ajouter des cartes à un token.';
  else if (etat.token) { t.append('Token sélectionné : '); const b = document.createElement('b'); b.textContent = etat.token.nom; t.append(b); }
  else t.textContent = 'Aucun token sélectionné — sélectionne-en un pour lui ajouter des cartes.';
  controles(); liste();
}

async function demarrer(){
  try {
    const f = n => fetch(n).then(r => r.json());
    const [c, a, co, e] = await Promise.all([f('cartes.json'), f('ascendances.json'), f('communautes.json'), f('equipement.json')]);
    cartes = adapter({cartes:c, ascendances:a, communautes:co, equipement:e});
    parId = new Map(cartes.map(x => [x.id, x]));
  } catch { $('liste').innerHTML = '<div class="vide">Impossible de charger les fichiers JSON.</div>'; return; }
  const maj = async () => { await lireSelection(); rendre(); };
  if (OBR.isAvailable) {
    OBR.onReady(async () => {
      await maj();
      OBR.player.onChange(maj);
      OBR.scene.items.onChange(maj);
    });
  }
  rendre();
}
demarrer();
