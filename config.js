// Clé de métadonnées stockée sur chaque token
export const KEY = "com.daggerheart-sheet/sheet";

// URL de l'API qui renvoie le JSON de la fiche. {id} = UUID de la fiche Demiplane.
// Demiplane n'a pas d'API publique documentée : ouvre une fiche dans ton navigateur,
// onglet Réseau (F12), repère l'appel qui renvoie le JSON de la fiche et colle son URL ici.
// Si le navigateur bloque l'appel (CORS), passe par le proxy fourni (worker.js).
// Exemple : "https://mon-proxy.workers.dev/?id={id}"
export const SHEET_API = "";

// Page publique d'une fiche (pour le bouton « Ouvrir sur Demiplane »)
export const SHEET_PAGE = "https://app.demiplane.com/nexus/daggerheart/character-sheet/{id}";
