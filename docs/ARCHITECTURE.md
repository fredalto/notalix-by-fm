# Architecture de Notalix

## Objectif

Garder chaque activite pedagogique autonome tout en isolant progressivement les elements communs. Cette architecture est volontairement progressive : elle evite une reecriture globale et conserve les comportements actuels.

## Carte des responsabilites

| Zone | Responsabilite | Exemples |
| --- | --- | --- |
| Modules pedagogiques | Regles, niveaux, exercices et interface propres a une activite | `lecture-notes/`, `intervalles/`, `tonalites/` |
| `shared/audio/` | Moteur audio et conventions communes | lecture d'un son, volume, chargement |
| `shared/components/` | Composants d'interface reutilisables | navigation, boutons, panneaux de resultat |
| `shared/styles/` | Theme et regles responsive communes | couleurs, espacements, tailles d'ecran |
| `shared/data/` | Donnees et configurations partagees | noms de notes, instruments, cles |
| `shared/utils/` | Fonctions techniques sans regle pedagogique | aleatoire, chemins, validation |
| `tools/` | Generation et controle des ressources | partitions MusicXML, validation des sons |
| `docs/` | Explications, audits et decisions | ce document |

## Modules pedagogiques

- **Lecture de notes et de cles** : `lecture-notes/`. Les fichiers par instrument et par niveau restent ici tant qu'ils ont des comportements specifiques.
- **Intervalles** : `intervalles/`. Les modes jeu, test et aventure appartiennent au meme domaine.
- **Gammes et tonalites** : `tonalites/`. Les images de gammes restent rattachees a ce module.
- **Accords et cadences** : `accords/` et `cadences/` restent distincts, car leurs regles pedagogiques different.
- **Dictees** : `dictee-melodique/` et `dictee-rythmique/` restent distinctes.
- **Lecture rythmique** : `lecture-rythmique/`.

## Affichage responsive

Le theme global actuel reste dans les fichiers de racine afin de conserver tous les chemins. Les nouvelles regles communes doivent etre placees dans `shared/styles/`, puis introduites module par module. Les corrections propres a une activite restent dans sa feuille de style locale.

## Audio

Les sons existants restent pour l'instant dans leurs modules. Plusieurs collections sont dupliquees, mais une centralisation immediate casserait de nombreux chemins relatifs et rendrait le retour en arriere difficile. La future extraction doit suivre cet ordre : inventaire des fichiers identiques, creation d'un chemin commun, adaptation d'un seul module, test, puis migration du suivant.

## Donnees et configuration

Une donnee va dans `shared/data/` uniquement si elle a le meme sens dans au moins deux modules. Les choix de niveau, les reponses acceptees et la progression restent dans leur module : ce sont des comportements pedagogiques, pas de simples configurations techniques.

## Methode de travail

1. Sauvegarder l'etat courant.
2. Choisir un seul module ou une seule responsabilite.
3. Faire un petit changement reversible.
4. Verifier l'accueil, le module concerne, le son et l'affichage mobile.
5. Noter le changement dans la documentation.

## Elements a ne pas deplacer sans verification

- Les points d'entree HTML de la racine.
- Les dossiers `sounds/`, `assets/` et `vendor/` utilises par des chemins relatifs.
- Les fichiers par instrument de `lecture-notes/`.
- Les scripts de `tools/`, dont certains generent les ressources attendues a des emplacements precis.

