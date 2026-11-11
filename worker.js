// Proxy optionnel (Cloudflare Worker) : ajoute les en-têtes CORS à l'appel Demiplane.
// Adapte UPSTREAM avec l'URL réelle trouvée dans l'onglet Réseau.
const UPSTREAM = "https://REMPLACE-MOI/{id}";
export default {
  async fetch(req) {
    const id = new URL(req.url).searchParams.get("id");
    if (!/^[0-9a-f-]{36}$/i.test(id || "")) return new Response("id invalide", { status: 400 });
    const r = await fetch(UPSTREAM.replace("{id}", id));
    return new Response(r.body, { status: r.status, headers: {
      "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  },
};
