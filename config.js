export const KEY = "com.daggerheart-sheet/sheet";
export const MODAL_ID = "com.daggerheart-sheet/viewer";

// Seules les pages Demiplane sont affichées dans la fenêtre
export const isDemiplane = (u) => { try { const x = new URL(u); return x.protocol === "https:" && /(^|\.)demiplane\.com$/.test(x.hostname); } catch { return false; } };

export function openViewer(OBR, url, name) {
  const page = new URL("viewer.html", import.meta.url);
  page.searchParams.set("u", url);
  page.searchParams.set("n", name || "Fiche");
  return OBR.modal.open({ id: MODAL_ID, url: page.href, width: 960, height: 760 });
}
