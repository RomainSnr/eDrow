Claude





















Popover · JS
import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { KEY } from "./config.js";
 
const app = document.getElementById("app");
const fixedId = new URLSearchParams(location.search).get("item"); // mode « grande fenêtre »
const MODAL_ID = "com.daggerheart-sheet/modal";
 
const INFO = [["name","Nom"],["classe","Classe"],["sousclasse","Sous-classe"],["niveau","Niveau"],["ascendance","Ascendance"],["communaute","Communauté"]];
const SECTIONS = {
  cards:     { label: "Cartes de domaine", meta: [["domain","Domaine"],["level","Niveau"],["type","Type"]], empty: "Aucune carte." },
  abilities: { label: "Capacités",         meta: [["source","Source"]],                                   empty: "Aucune capacité." },
  equipment: { label: "Équipement",        meta: [["kind","Type"]],                                       empty: "Aucun équipement." },
};
const TABS = [["info","Aperçu"],["cards","Cartes"],["abilities","Capacités"],["equipment","Équipement"],["notes","Notes"]];
 
let selectedId = fixedId, items = [], current = null, tab = "info", editing = false;
 
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const newSheet = (name, url) => ({ url: url || "", info: { name: name || "" }, cards: [], abilities: [], equipment: [], notes: "" });
 
/* ---------- Données ---------- */
async function mutate(fn) {
  await OBR.scene.items.updateItems([current.id], (l) => {
    if (!l[0].metadata[KEY]) l[0].metadata[KEY] = newSheet();
    fn(l[0].metadata[KEY]);
  });
}
function setPath(obj, path, val) {
  const p = path.split(".");
  const last = p.pop();
  const target = p.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = val;
}
 
/* ---------- Rendu ---------- */
const sheetName = (i) => i.metadata[KEY]?.info?.name || i.text?.plainText || i.name || "Sans nom";
 
function render() {
  if (!current) return renderList();
  const s = current.metadata[KEY];
  if (!s) return renderCreate();
  renderSheet(s);
}
 
function renderList() {
  app.innerHTML = `
    <h1>Fiches Daggerheart</h1>
    <p class="muted">Sélectionne un token, ou clic droit dessus puis « Fiche Daggerheart ».</p>
    <div class="list">${items.map((i) => `<button data-id="${i.id}">${esc(sheetName(i))}</button>`).join("") || `<p class="muted">Aucune fiche pour l'instant.</p>`}</div>`;
  app.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => OBR.player.select([b.dataset.id]));
}
 
function renderCreate() {
  app.innerHTML = `
    <h1>Créer une fiche pour « ${esc(current.name || "ce token")} »</h1>
    <div><h2>Nom du personnage</h2><input id="name" value="${esc(current.text?.plainText || current.name || "")}"></div>
    <div><h2>Lien Demiplane (facultatif)</h2><input id="url" placeholder="https://app.demiplane.com/…"></div>
    <button class="primary" id="create">Créer la fiche</button>`;
  app.querySelector("#create").onclick = async () => {
    const sheet = newSheet(app.querySelector("#name").value.trim(), app.querySelector("#url").value.trim());
    await mutate((s) => Object.assign(s, sheet));
    editing = true; tab = "info"; await reload(true);
  };
}
 
function metaChips(sec, it) {
  return sec.meta.map(([k]) => it[k] ? `<span class="chip">${esc(it[k])}</span>` : "").join("");
}
 
function viewSection(key, s) {
  const sec = SECTIONS[key], list = s[key] || [];
  if (!list.length) return `<p class="muted">${sec.empty}</p>`;
  return list.map((it) => `
    <details class="card"><summary><b>${esc(it.name || "Sans titre")}</b>${metaChips(sec, it)}</summary>
    <p class="text">${esc(it.text)}</p></details>`).join("");
}
 
function editSection(key, s) {
  const sec = SECTIONS[key], list = s[key] || [];
  return list.map((it, i) => `
    <div class="card edit">
      <input data-p="${key}.${i}.name" placeholder="Nom" value="${esc(it.name)}">
      <div class="row">${sec.meta.map(([k, l]) => `<input class="grow" data-p="${key}.${i}.${k}" placeholder="${l}" value="${esc(it[k])}">`).join("")}</div>
      <textarea data-p="${key}.${i}.text" rows="5" placeholder="Texte de la carte ou de la capacité">${esc(it.text)}</textarea>
      <button class="danger" data-del="${key}.${i}">Retirer</button>
    </div>`).join("") + `<button data-add="${key}">Ajouter</button>`;
}
 
function infoView(s) {
  const rows = INFO.filter(([k]) => k !== "name" && s.info?.[k]);
  return rows.length ? `<dl class="info">${rows.map(([k, l]) => `<dt>${l}</dt><dd>${esc(s.info[k])}</dd>`).join("")}</dl>` : `<p class="muted">Aperçu vide. Clique sur Modifier pour le remplir.</p>`;
}
function infoEdit(s) {
  return INFO.map(([k, l]) => `<div><h2>${l}</h2><input data-p="info.${k}" value="${esc(s.info?.[k])}"></div>`).join("") +
    `<div><h2>Lien Demiplane</h2><input data-p="url" value="${esc(s.url)}" placeholder="https://app.demiplane.com/…"></div>`;
}
 
function notesPanel(s) {
  if (!editing) return s.notes ? `<p class="text">${esc(s.notes)}</p>` : `<p class="muted">Aucune note.</p>`;
  return `<textarea data-p="notes" rows="8">${esc(s.notes)}</textarea>
    <details class="data card"><summary class="muted">Exporter / importer toute la fiche</summary>
      <p class="muted">Copie ce texte pour sauvegarder la fiche, ou colles-y celui d'une autre fiche puis importe.</p>
      <textarea id="json" rows="6">${esc(JSON.stringify(s, null, 1))}</textarea>
      <div class="row"><button id="import">Importer</button><span class="error" id="jerr"></span></div></details>
    <button class="danger" id="remove">Supprimer la fiche de ce token</button>`;
}
 
function renderSheet(s) {
  const body = tab === "info" ? (editing ? infoEdit(s) : infoView(s))
    : tab === "notes" ? notesPanel(s)
    : editing ? editSection(tab, s) : viewSection(tab, s);
 
  app.innerHTML = `
    <div class="row"><h1 class="grow">${esc(s.info?.name || current.name || "Sans nom")}</h1>
      ${s.url ? `<button id="open">Demiplane</button>` : ""}
      ${fixedId ? "" : `<button id="big">Agrandir</button>`}
      <button id="edit" class="${editing ? "primary" : ""}">${editing ? "Terminer" : "Modifier"}</button></div>
    <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-tab="${k}">${l}</button>`).join("")}</div>
    <section>${body}</section>`;
 
  const $ = (q) => app.querySelector(q);
  app.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
  $("#edit").onclick = () => { editing = !editing; render(); };
  $("#open")?.addEventListener("click", () => window.open(s.url, "_blank", "noopener"));
  $("#big")?.addEventListener("click", () => OBR.modal.open({
    id: MODAL_ID, width: 760, height: 680,
    url: new URL(`popover.html?item=${current.id}`, import.meta.url).href,
  }));
 
  app.querySelectorAll("[data-p]").forEach((el) => el.onchange = async () => {
    await mutate((sh) => setPath(sh, el.dataset.p, el.value));
  });
  app.querySelectorAll("[data-add]").forEach((b) => b.onclick = async () => {
    await mutate((sh) => { (sh[b.dataset.add] ??= []).push({ name: "", text: "" }); });
    await reload(true);
  });
  app.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
    const [key, idx] = b.dataset.del.split(".");
    await mutate((sh) => sh[key].splice(Number(idx), 1));
    await reload(true);
  });
  $("#import")?.addEventListener("click", async () => {
    try {
      const data = JSON.parse($("#json").value);
      await mutate((sh) => { for (const k of Object.keys(sh)) delete sh[k]; Object.assign(sh, newSheet(), data); });
      await reload(true);
    } catch { $("#jerr").textContent = "JSON invalide."; }
  });
  $("#remove")?.addEventListener("click", async () => {
    if (!confirm("Supprimer cette fiche ?")) return;
    await OBR.scene.items.updateItems([current.id], (l) => { delete l[0].metadata[KEY]; });
    editing = false; await reload(true);
  });
}
 
/* ---------- Synchronisation avec la scène ---------- */
async function reload(force = false) {
  const all = await OBR.scene.items.getItems((i) => i.type === "IMAGE");
  items = all.filter((i) => i.metadata[KEY]);
  current = selectedId ? all.find((i) => i.id === selectedId) || null : null;
  if (force || !editing) render(); // en édition, on ne redessine pas pour ne pas perdre le curseur
}
 
OBR.onReady(async () => {
  OBR.scene.onReadyChange((ready) => { if (ready) reload(true); });
  if (await OBR.scene.isReady()) {
    if (!fixedId) selectedId = ((await OBR.player.getSelection()) || [])[0] || null;
    await reload(true);
  } else app.innerHTML = `<p class="muted">Ouvre une scène pour utiliser les fiches.</p>`;
 
  if (!fixedId) OBR.player.onChange((p) => { selectedId = (p.selection || [])[0] || null; editing = false; reload(true); });
  OBR.scene.items.onChange(() => reload());
});
 
Claude a terminé sa réponse.
