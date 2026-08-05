# Notalix

Notalix est un ensemble de modules pedagogiques musicaux utilisables directement dans un navigateur.

## Demarrage

Ouvrir `index.html` pour acceder a l'accueil, puis choisir un module.

## Organisation actuelle

- `accords/` : reconnaissance et travail des accords.
- `cadences/` : travail des cadences harmoniques.
- `dictee-melodique/` : dictee melodique.
- `dictee-rythmique/` : dictee rythmique.
- `intervalles/` : reconnaissance et entrainement des intervalles.
- `lecture-notes/` : lecture de notes et lecture des cles selon les instruments.
- `lecture-rythmique/` : lecture rythmique.
- `tonalites/` : tonalites, armures et gammes.
- `shared/` : futurs elements communs, ranges par responsabilite.
- `tools/` : outils de preparation et de validation des ressources.
- `docs/` : documentation du projet et comptes rendus d'audit.

Les fichiers HTML situes a la racine sont des points d'entree et des redirections. Ils restent en place pour ne pas casser les liens existants.

## Regle de modification

Un changement fonctionnel doit d'abord rester dans son module. Un element ne rejoint `shared/` que lorsqu'il est reellement commun a plusieurs modules et que chaque module a ete verifie apres le changement.

Lire [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) avant toute modification importante.

