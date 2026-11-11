Claude

























Background · JS
import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { KEY, MODAL_ID, openViewer } from "./config.js";
 
const ID = "com.daggerheart-sheet";
 
OBR.onReady(() => {
  OBR.contextMenu.create({
    id: `${ID}/menu`,
    icons: [{
      icon: new URL("icon.svg", import.meta.url).href,
      label: "Fiche Daggerheart",
      filter: { min: 1, max: 1, every: [{ key: "type", value: "IMAGE" }] },
    }],
    async onClick(context) {
      const item = context.items[0];
      const sheet = item.metadata[KEY];
      if (sheet?.url) {
        openViewer(OBR, sheet.url, sheet.name || item.text?.plainText || item.name);
      } else {
        await OBR.player.select([item.id]);
        await OBR.action.open(); // le panneau demande le lien de la fiche
      }
    },
  });
});
 
Claude a terminé sa réponse.
