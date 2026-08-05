# Notalix — étapes du projet

## État actuel

- Le projet actif se trouve dans `01_PROJET_ACTIF/notalix`.
- L’architecture est organisée par modules pédagogiques.
- Le module `lecture-notes` utilise désormais VexFlow pour afficher les notes.
- Les 78 anciens fichiers PNG de notes ont été supprimés de ce module.
- Le parcours Instruments demande explicitement de choisir un niveau avant de commencer.
- L’écran d’exercice a été adapté au format Surface : note mise en avant, mise en page compacte et barre d’avancement stable.
- Une sauvegarde antérieure à la réorganisation est documentée dans `90_SAUVEGARDES`.

## Étape immédiate — enregistrer le point de contrôle

1. Laisser Google Drive terminer sa synchronisation.
2. Dans GitHub Desktop, vérifier que le dépôt ouvert est bien `01_PROJET_ACTIF/notalix`.
3. Examiner la liste des fichiers modifiés et supprimés.
4. Créer un commit nommé par exemple :
   `Migrer Lecture de notes vers VexFlow et améliorer l’interface Surface`
5. Publier ou pousser ce commit sur GitHub.
6. Ajouter si possible une étiquette de version : `vexflow-surface-2026-08-05`.

Cette publication constitue un point de retour sûr. Elle ne signifie pas encore que tous les parcours ont été testés.

## Étape 1 — recette complète de Lecture de notes

Tester sans modifier le code :

- les clés de sol, fa, ut 3 et ut 4 ;
- les niveaux disponibles de chaque clé ;
- les parcours Instruments, au moins un instrument par famille ;
- les quatre niveaux d’un instrument transpositeur ;
- les défis et le mélange des clés ;
- les sons corrects et incorrects ;
- les raccourcis clavier ;
- le score, la progression et le redémarrage ;
- l’aide de doigté ou de position ;
- l’envoi du score ;
- l’affichage sur Surface et sur téléphone.

Noter chaque anomalie dans un seul document avant de commencer les corrections.

## Étape 2 — stabilisation du rendu VexFlow

- Vérifier les notes très graves et très aiguës ainsi que leurs lignes supplémentaires.
- Contrôler les quatre clés avec la nouvelle taille de portée.
- Définir des tailles communes pour les notes de référence et les notes de quiz.
- Vérifier que l’aide, le retour de réponse et la progression ne déplacent aucun élément.
- Supprimer les dossiers `lecture-notes/Images` uniquement après confirmation qu’ils sont toujours vides et inutilisés.

## Étape 3 — nettoyage interne de Lecture de notes

Procéder par petits changements réversibles :

1. Renommer les anciennes propriétés techniques comme `image` ou `img` en `note` lorsque leur valeur est désormais un descripteur VexFlow.
2. Centraliser la conversion entre hauteur, nom français, clé et son.
3. Centraliser les comportements réellement identiques : progression, réponses, score et temporisation.
4. Conserver dans chaque niveau ses règles pédagogiques propres.
5. Tester après chaque extraction commune.

Ne pas réécrire tous les niveaux en une seule opération.

## Étape 4 — contrôles automatiques

Créer progressivement des outils capables de vérifier :

- les liens locaux manquants ;
- les descripteurs VexFlow invalides ;
- les sons absents ;
- les pages qui oublient de charger VexFlow ;
- les erreurs JavaScript de démarrage ;
- les déplacements de mise en page sur les formats Surface et mobile.

Commencer par un contrôle en lecture seule, puis ajouter quelques tests représentatifs.

## Étape 5 — généralisation aux autres modules

Une fois `lecture-notes` stable :

1. Auditer un seul autre module.
2. Identifier ce qui est réellement commun.
3. Déplacer un seul type de ressource ou de composant vers `shared`.
4. Tester le module concerné et l’accueil.
5. Créer un commit séparé.

Ordre conseillé :

1. `intervalles` ;
2. `tonalites` ;
3. `accords` et `cadences` ;
4. dictées ;
5. lecture rythmique.

## Règles de sécurité

- Travailler uniquement dans `01_PROJET_ACTIF/notalix`.
- Ne pas modifier les sauvegardes ni les anciennes versions.
- Faire un commit avant chaque nouvelle phase importante.
- Ne déplacer aucun son ou fichier tiers sans contrôler tous ses chemins.
- Préférer une petite modification testable à une refonte générale.
- Conserver une version GitHub connue comme fonctionnelle.

## Définition d’une version publiable

Une version peut être considérée comme stable lorsque :

- la recette de Lecture de notes est terminée ;
- aucune erreur bloquante n’est connue ;
- les quatre clés et plusieurs instruments ont été vérifiés ;
- l’affichage Surface et mobile est acceptable ;
- les sons et les scores fonctionnent ;
- le dépôt Git est propre après le commit ;
- une étiquette de version permet de revenir précisément à cet état.