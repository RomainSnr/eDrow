import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { KEY, isHttp } from "./config.js";

const app = document.getElementById("app");
let selectedId = null, items = [], current = null, changing = false, error = "";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nameOf = (i) => i.metadata[KEY]?.name || i.text?.plainText || i.name || "Sans nom";
const openLink = (i, cls = "") => `<a class="btn ${cls}" href="${esc(i.metadata[KEY].url)}" target="_blank" rel="noopener noreferrer">${esc(nameOf(i))}</a>`;

function render() {
  const s = current?.metadata[KEY];
  let html = "";

  if (current && (!s?.url || changing)) {
    html += `
      <h1>Lien de « ${esc(current.name || "ce token")} »</h1>
      <div><h2>Adresse de la fiche</h2><input id="url" value="${esc(s?.url)}" placeholder="https://app.demiplane.com/…"></div>
      <div><h2>Nom affiché</h2><input id="name" value="${esc(nameOf(current))}"></div>
      <p class="error">${esc(error)}</p>
      <div class="row"><button class="primary grow" id="save">Enregistrer</button>${changing ? `<button id="cancel">Annuler</button>` : ""}</div>`;
  } else if (current) {
    html += `
      <h1>${esc(nameOf(current))}</h1>
      ${openLink(current, "primary big")}
      <div class="row"><button class="grow" id="change">Changer le lien</button><button class="danger" id="unlink">Délier</button></div>
      <p class="error">${esc(error)}</p>`;
  } else {
    html += `<h1>Fiches</h1><p class="muted">Clic droit sur un token, puis « Fiche Daggerheart » pour lui lier un lien.</p>`;
  }

  const others = items.filter((i) => i.id !== current?.id);
  if (others.length) html += `<div><h2>Toutes les fiches de la scène</h2><div class="list">${others.map((i) => openLink(i)).join("")}</div></div>`;
  app.innerHTML = html;

  const $ = (q) => app.querySelector(q);
  $("#save")?.addEventListener("click", async () => {
    const url = $("#url").value.trim(), name = $("#name").value.trim();
    if (!isHttp(url)) { error = "Colle une adresse qui commence par https://"; return render(); }
    try {
      await OBR.scene.items.updateItems([current.id], (l) => { l[0].metadata[KEY] = { url, name }; });
      error = ""; changing = false;
    } catch { error = "Impossible de modifier ce token (demande au MJ)."; render(); }
  });
  $("#cancel")?.addEventListener("click", () => { changing = false; error = ""; render(); });
  $("#change")?.addEventListener("click", () => { changing = true; render(); });
  $("#unlink")?.addEventListener("click", async () => {
    try { await OBR.scene.items.updateItems([current.id], (l) => { delete l[0].metadata[KEY]; }); }
    catch { error = "Impossible de modifier ce token (demande au MJ)."; render(); }
  });
}

async function reload() {
  const all = await OBR.scene.items.getItems((i) => i.type === "IMAGE");
  items = all.filter((i) => i.metadata[KEY]?.url);
  current = selectedId ? all.find((i) => i.id === selectedId) || null : null;
  if (document.activeElement?.tagName === "INPUT") return; // ne pas effacer ce qu'on tape
  render();
}

OBR.onReady(async () => {
  OBR.scene.onReadyChange((r) => { if (r) reload(); });
  if (await OBR.scene.isReady()) {
    selectedId = ((await OBR.player.getSelection()) || [])[0] || null;
    await reload();
  } else app.innerHTML = `<p class="muted">Ouvre une scène pour utiliser les fiches.</p>`;
  OBR.player.onChange((p) => { selectedId = (p.selection || [])[0] || null; changing = false; error = ""; reload(); });
  OBR.scene.items.onChange(() => reload());
});
