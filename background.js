import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

OBR.onReady(() => {
  // Clic droit sur un token -> « Fiche Daggerheart » : ouvre le panneau avec le lien du token
  OBR.contextMenu.create({
    id: "com.daggerheart-sheet/menu",
    icons: [{
      icon: new URL("icon.svg", import.meta.url).href,
      label: "Fiche Daggerheart",
      filter: { min: 1, max: 1, every: [{ key: "type", value: "IMAGE" }] },
    }],
    async onClick(context) {
      await OBR.player.select(context.items.map((i) => i.id));
      await OBR.action.open();
    },
  });
});
