# Bibliothèque Daggerheart + cartes dans le token

Fichiers à copier à la racine du dépôt (à côté de manifest.json) :
bibliotheque.html, bibliotheque.js, bibliotheque.css,
cartes.json, ascendances.json, communautes.json, equipement.json

## Ouvrir la bibliothèque depuis ton extension

```js
OBR.popover.open({ id: "bibliotheque", url: "/eDrow/bibliotheque.html", width: 440, height: 680 });
```

(adapte le chemin si ton site n'est pas dans /eDrow/)

## Où sont stockées les cartes d'un token

Dans les métadonnées du token, clé `com.romainsnr.edrow/cartes` : une liste d'identifiants
(`arcane-1-1`, `asc-clank`, `com-liee-a-la-mer`, `armure-2-120`…).
Change la constante ID en haut de bibliotheque.js si ton extension utilise un autre identifiant.
Pour lire les cartes d'un token depuis ton panneau de fiche, lis `item.metadata["com.romainsnr.edrow/cartes"]`
et retrouve chaque carte par son id dans les fichiers JSON.

Les identifiants des armes et armures dépendent de l'ordre dans equipement.json :
ne réordonne pas ce fichier une fois des cartes ajoutées aux tokens.
