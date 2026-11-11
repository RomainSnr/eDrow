import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { KEY, SHEET_API, SHEET_PAGE } from "./config.js";

const app = document.getElementById("app");
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const TRAITS = [["agility","Agilité"],["strength","Force"],["finesse","Finesse"],["instinct","Instinct"],["presence","Présence"],["knowledge","Savoir"]];

let selectedId = null;
let items = [];     // tokens ayant une fiche
let current = null; // item sélectionné
let status = "";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* ---------- Données ---------- */
async function saveSheet(id, patch) {
  await OBR.scene.items.updateItems([id], (list) => {
    const m = list[0].metadata[KEY] || {};
    list[0].metadata[KEY] = { ...m, ...patch };
  });
}
async function unlink(id) {
  await OBR.scene.items.updateItems([id], (list) => { delete list[0].metadata[KEY]; });
}

/* ---------- Lecture API Demiplane (meilleur effort) ---------- */
function deepFind(obj, names, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return undefined;
  const wanted = names.map((n) => n.toLowerCase());
  for (const [k, v] of Object.entries(obj)) {
    if (wanted.includes(k.toLowerCase()) && v !== null && typeof v !== "object") return v;
  }
  for (const v of Object.values(obj)) {
    const r = deepFind(v, names, depth + 1);
    if (r !== undefined) return r;
  }
}
// À ajuster une fois la vraie structure JSON connue (voir « JSON brut » dans le panneau)
function mapSheet(json) {
  const f = (...n) => deepFind(json, n);
  const out = {
    name: f("name", "characterName"),
    evasion: f("evasion"),
    armor: f("armor", "armorScore"),
    hpMax: f("hpMax", "maxHp", "hitPointsMax"),
    hpCur: f("hpCurrent", "currentHp", "hp"),
    stressMax: f("stressMax", "maxStress"),
    stressCur: f("stressCurrent", "currentStress", "stress"),
    hope: f("hope", "currentHope"),
  };
  out.traits = {};
  for (const [k] of TRAITS) { const v = f(k); if (v !== undefined) out.traits[k] = v; }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}
async function refreshFromDemiplane(item) {
  const sheet = item.metadata[KEY];
  if (!SHEET_API) throw new Error("SHEET_API est vide dans config.js.");
  const res = await fetch(SHEET_API.replace("{id}", sheet.id));
  if (!res.ok) throw new Error(`Réponse ${res.status} de l'API.`);
  const json = await res.json();
  await saveSheet(item.id, { ...mapSheet(json), raw: JSON.stringify(json).slice(0, 20000), syncedAt: Date.now() });
}

/* ---------- Rendu ---------- */
function render() {
  if (!current) return renderList();
  const sheet = current.metadata[KEY];
  return sheet ? renderSheet(current, sheet) : renderLink(current);
}

function renderList() {
  app.innerHTML = `
    <h1>Fiches Daggerheart</h1>
    <p class="muted">Sélectionne un token, ou fais un clic droit dessus puis « Fiche Daggerheart ».</p>
    <div class="list">${items.map((i) => `<button data-id="${i.id}">${esc(i.metadata[KEY].name || i.text?.plainText || i.name || "Sans nom")}</button>`).join("") || `<p class="muted">Aucune fiche liée pour l'instant.</p>`}</div>`;
  app.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => OBR.player.select([b.dataset.id]));
}

function renderLink(item) {
  app.innerHTML = `
    <h1>Lier une fiche à « ${esc(item.name || "ce token")} »</h1>
    <div><h2>Lien de la fiche Demiplane</h2><input id="url" placeholder="https://app.demiplane.com/nexus/daggerheart/character-sheet/…"></div>
    <div><h2>Nom affiché</h2><input id="name" value="${esc(item.text?.plainText || item.name || "")}"></div>
    <p class="error" id="err"></p>
    <button class="primary" id="link">Lier la fiche</button>`;
  app.querySelector("#link").onclick = async () => {
    const url = app.querySelector("#url").value.trim();
    const id = (url.match(UUID) || [])[0];
    if (!id) { app.querySelector("#err").textContent = "Aucun identifiant de fiche trouvé dans ce lien."; return; }
    await saveSheet(item.id, { id, url, name: app.querySelector("#name").value.trim() });
    try { await refreshFromDemiplane(current); } catch (e) { status = `Fiche liée. Synchronisation impossible : ${e.message}`; }
  };
}

function renderSheet(item, s) {
  const field = (key, label, cls = "", max) => `
    <div class="stat ${cls}"><label>${label}</label>
      <div class="pair"><input type="number" data-k="${key}" value="${num(s[key])}">${max ? `<span>/</span><input type="number" data-k="${max}" value="${num(s[max])}">` : ""}</div></div>`;
  const page = SHEET_PAGE.replace("{id}", s.id);
  app.innerHTML = `
    <div class="row"><h1 class="grow">${esc(s.name || item.name || "Sans nom")}</h1>
      <button id="open" title="Ouvrir sur Demiplane">Demiplane</button></div>
    <div class="stats">
      ${field("hpCur", "Points de vie", "hp", "hpMax")}
      ${field("stressCur", "Stress", "stress", "stressMax")}
      ${field("hope", "Espoir", "hope")}
      ${field("evasion", "Évasion")}
      ${field("armor", "Armure")}
    </div>
    <div><h2>Traits</h2><div class="traits">${TRAITS.map(([k, l]) => `<div class="trait"><b>${num(s.traits?.[k])}</b><span>${l}</span></div>`).join("")}</div></div>
    <div class="row"><button class="primary grow" id="sync">Actualiser depuis Demiplane</button><button class="danger" id="unlink">Délier</button></div>
    <p class="${status.startsWith("Fiche liée") || status.includes("impossible") ? "error" : "muted"}">${esc(status) || (s.syncedAt ? "Dernière synchro : " + new Date(s.syncedAt).toLocaleString("fr-FR") : "Jamais synchronisée.")}</p>
    ${s.raw ? `<details><summary class="muted">JSON brut</summary><pre>${esc(s.raw)}</pre></details>` : ""}`;

  app.querySelector("#open").onclick = () => window.open(page, "_blank", "noopener");
  app.querySelector("#unlink").onclick = () => unlink(item.id);
  app.querySelector("#sync").onclick = async () => {
    status = "Synchronisation…"; render();
    try { await refreshFromDemiplane(item); status = ""; }
    catch (e) { status = `Synchronisation impossible : ${e.message}`; render(); }
  };
  app.querySelectorAll("input[data-k]").forEach((inp) => {
    inp.onchange = () => saveSheet(item.id, { [inp.dataset.k]: num(inp.value) });
  });
}

/* ---------- Synchronisation avec la scène ---------- */
async function reload() {
  const all = await OBR.scene.items.getItems((i) => i.type === "IMAGE");
  items = all.filter((i) => i.metadata[KEY]);
  current = selectedId ? all.find((i) => i.id === selectedId) || null : null;
  render();
}

OBR.onReady(async () => {
  OBR.scene.onReadyChange(async (ready) => { if (ready) reload(); });
  if (await OBR.scene.isReady()) {
    selectedId = ((await OBR.player.getSelection()) || [])[0] || null;
    await reload();
  } else app.innerHTML = `<p class="muted">Ouvre une scène pour utiliser les fiches.</p>`;

  OBR.player.onChange((p) => { selectedId = (p.selection || [])[0] || null; status = ""; reload(); });
  OBR.scene.items.onChange(() => reload());
});
