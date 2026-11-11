import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { KEY, openViewer, isDemiplane } from "./config.js";

const app = document.getElementById("app");
let selectedId = null, items = [], current = null;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nameOf = (i) => i.metadata[KEY]?.name || i.metadata[KEY]?.info?.name || i.text?.plainText || i.name || "Sans nom";

function render() {
  if (!current) return renderList();
  const s = current.metadata[KEY];
  if (!s?.url) return renderLink();
  app.innerHTML = `
    <h1>${esc(nameOf(current))}</h1>
    <button class="primary" id="open">Lire la fiche</button>
    <div class="row"><button id="change" class="grow">Changer le lien</button><button id="unlink" class="danger">Délier</button></div>`;
  app.querySelector("#open").onclick = () => openViewer(OBR, s.url, nameOf(current));
  app.querySelector("#change").onclick = renderLink;
  app.querySelector("#unlink").onclick = () => OBR.scene.items.updateItems([current.id], (l) => { delete l[0].metadata[KEY]; });
}

function renderLink() {
  const s = current.metadata[KEY] || {};
  app.innerHTML = `
    <h1>Fiche de « ${esc(current.name || "ce token")} »</h1>
    <div><h2>Lien de la fiche Demiplane</h2><input id="url" value="${esc(s.url)}" placeholder="https://app.demiplane.com/nexus/daggerheart/character-sheet/…"></div>
    <div><h2>Nom affiché</h2><input id="name" value="${esc(nameOf(current))}"></div>
    <p class="error" id="err"></p>
    <button class="primary" id="save">Enregistrer</button>`;
  app.querySelector("#save").onclick = async () => {
    const url = app.querySelector("#url").value.trim();
    if (!isDemiplane(url)) { app.querySelector("#err").textContent = "Colle un lien https://… de demiplane.com."; return; }
    const name = app.querySelector("#name").value.trim();
    await OBR.scene.items.updateItems([current.id], (l) => { l[0].metadata[KEY] = { url, name }; });
    openViewer(OBR, url, name || nameOf(current));
  };
}

function renderList() {
  app.innerHTML = `
    <h1>Fiches Daggerheart</h1>
    <p class="muted">Clic droit sur un token, puis « Fiche Daggerheart ».</p>
    <div class="list">${items.map((i) => `<button data-id="${i.id}">${esc(nameOf(i))}</button>`).join("") || `<p class="muted">Aucune fiche liée pour l'instant.</p>`}</div>`;
  app.querySelectorAll("[data-id]").forEach((b) => b.onclick = async () => {
    const s = items.find((i) => i.id === b.dataset.id)?.metadata[KEY];
    if (s?.url) openViewer(OBR, s.url, b.textContent);
  });
}

async function reload() {
  const all = await OBR.scene.items.getItems((i) => i.type === "IMAGE");
  items = all.filter((i) => i.metadata[KEY]);
  current = selectedId ? all.find((i) => i.id === selectedId) || null : null;
  render();
}

OBR.onReady(async () => {
  OBR.scene.onReadyChange((r) => { if (r) reload(); });
  if (await OBR.scene.isReady()) {
    selectedId = ((await OBR.player.getSelection()) || [])[0] || null;
    await reload();
  } else app.innerHTML = `<p class="muted">Ouvre une scène pour utiliser les fiches.</p>`;
  OBR.player.onChange((p) => { selectedId = (p.selection || [])[0] || null; reload(); });
  OBR.scene.items.onChange(() => reload());
});
