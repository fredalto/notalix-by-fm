# NOTALIX — Feuille de route technique

## Version actuelle

| Élément | État |
| --- | --- |
| Version publiée | **v0.5.2** |
| Date | 5 août 2026 |
| Jalon | Module Lecture de notes et migration VexFlow |
| Commit de référence | `00f22d8` |
| Projet actif | `01_PROJET_ACTIF/notalix` |
| Sauvegarde | Créée et contrôlée |
| Publication GitHub | Effectuée |

## Étapes terminées

### v0.5.0 — Point de départ structuré

- [x] Sauvegarde complète.
- [x] Installation du projet actif dans Google Drive.
- [x] Audit général.
- [x] Conservation du fonctionnement existant.

### v0.5.1 — Architecture modulaire

- [x] Organisation des dossiers et des modules.
- [x] Identification des éléments communs.
- [x] Documentation de l’architecture.
- [x] Création d’un point de retour GitHub.

### v0.5.2 — Module Lecture de notes

- [x] Migration du rendu des notes vers VexFlow.
- [x] Suppression des 78 anciennes images PNG.
- [x] Choix du niveau rendu obligatoire et visible.
- [x] Amélioration de l’utilisation de l’espace.
- [x] Adaptation de l’exercice à la Surface.
- [x] Stabilisation de la barre d’avancement.
- [x] Affichage de la version dans Notalix.

## Prochaine étape — v0.5.3

### Affichage musical commun

- [ ] Tester les clés de sol, fa, ut 3 et ut 4.
- [ ] Vérifier les notes très graves et très aiguës.
- [ ] Tester les parcours Instruments et les défis.
- [ ] Définir un composant VexFlow commun et réutilisable.
- [ ] Harmoniser la taille des portées et des notes.
- [ ] Préparer son utilisation dans plusieurs modules.
- [ ] Vérifier ordinateur, Surface, tablette et smartphone.

## Étapes suivantes du cycle 0.5

### v0.5.4 — Sons et lecture audio

- moteur sonore commun ;
- banque sonore officielle ;
- faible latence ;
- tempo et volume communs ;
- licences documentées.

### v0.5.5 — Stabilisation du socle

- tests des modules existants ;
- correction des régressions ;
- vérification sur plusieurs appareils et navigateurs ;
- sauvegarde stable avant le cycle 0.6.

## Cycle 0.6 — Interface commune

- `0.6.0` : identité visuelle générale ;
- `0.6.1` : page d’accueil Lire / Écouter / Écrire / Comprendre ;
- `0.6.2` : navigation commune ;
- `0.6.3` : adaptation aux écrans ;
- `0.6.4` : uniformisation des modules ;
- `0.6.5` : validation générale.

## Vision générale

- `0.x` : construire Notalix ;
- `1.x` : s’entraîner librement ;
- `2.x` : accompagner les élèves ;
- `3.x` : apprendre et découvrir la musique ;
- `4.x` : personnaliser les apprentissages ;
- `5.x` : ouvrir Notalix à d’autres établissements.

## Règles de travail

- Travailler uniquement dans `01_PROJET_ACTIF/notalix`.
- Ne jamais modifier les sauvegardes ou les anciennes versions.
- Une version est validée lorsqu’elle est testée, sauvegardée et identifiable dans Git.
- Créer un commit avant chaque nouvelle phase importante.
- Préférer une petite amélioration testable à une refonte générale.
- Toujours conserver sur GitHub une version fonctionnelle permettant un retour en arrière.