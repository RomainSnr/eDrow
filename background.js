import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

const ID = "com.daggerheart-sheet";

OBR.onReady(() => {
  // Clic droit sur un token -> « Fiche Daggerheart »
  OBR.contextMenu.create({
    id: `${ID}/menu`,
    icons: [
      {
        icon: new URL("icon.svg", import.meta.url).href,
        label: "Fiche Daggerheart",
        filter: { min: 1, max: 1, every: [{ key: "type", value: "IMAGE" }] },
      },
    ],
    async onClick(context) {
      await OBR.player.select(context.items.map((i) => i.id));
      await OBR.action.open(); // ouvre le panneau en haut à gauche
    },
  });
});
