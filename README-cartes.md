# Bibliothèque de cartes de domaine

Fichiers à copier à la racine de ton dépôt (à côté de manifest.json) :
cartes.html, cartes.css, cartes.js, cartes.json

Test direct : https://TON-PSEUDO.github.io/eDrow/cartes.html

## Ouvrir la bibliothèque depuis ton panneau (OBR SDK déjà chargé)

```js
document.getElementById("btn-cartes").onclick = () =>
  OBR.popover.open({ id: "cartes", url: "/cartes.html", width: 420, height: 640 });
```

Le chemin `url` est relatif à l'adresse de ton extension. Si elle est dans un
sous-dossier (GitHub Pages : /eDrow/), écris "/eDrow/cartes.html".
