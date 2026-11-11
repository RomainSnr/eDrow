import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { MODAL_ID, isDemiplane } from "./config.js";

const q = new URLSearchParams(location.search);
const url = q.get("u") || "";
document.getElementById("title").textContent = q.get("n") || "Fiche";
if (isDemiplane(url)) document.getElementById("frame").src = url;
else document.getElementById("frame").srcdoc = "<p style='font-family:sans-serif;padding:16px'>Lien invalide : seuls les liens demiplane.com sont acceptés.</p>";
document.getElementById("tab").onclick = () => isDemiplane(url) && window.open(url, "_blank", "noopener");
OBR.onReady(() => { document.getElementById("close").onclick = () => OBR.modal.close(MODAL_ID); });
