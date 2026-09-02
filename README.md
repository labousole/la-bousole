# La Boussole

**Actualité politique française, cap à gauche — vers la présidentielle 2027.**

## Le projet, en une phrase

La Boussole est un site d'actualité politique qui assume une ligne éditoriale de gauche, tout en s'engageant à couvrir l'ensemble du paysage politique français — partis, candidats, actualité — sans exclure personne pour des raisons idéologiques.

Ce n'est pas un média professionnel : c'est un projet personnel, pensé et développé comme un espace de veille et de vérification autour de l'élection présidentielle de 2027.

## Pourquoi ce site existe

Trois constats de départ :

1. **La plupart des médias prétendent à une neutralité qu'ils n'ont pas vraiment.** La Boussole fait le choix inverse : elle dit d'où elle parle, plutôt que de déguiser un point de vue en objectivité de façade.
2. **Assumer une ligne ne dispense pas d'un devoir d'exhaustivité.** Le site présente tous les partis et tous les candidats, y compris ceux que la rédaction combat politiquement — avec les mêmes faits, datés et vérifiables pour tout le monde.
3. **Le débat public manque de vérification posée.** D'où les *dossiers* : des formats longs qui confrontent les affirmations les plus répétées (immigration, salaires, hôpital public...) aux données officielles (Insee, DREES, OCDE), sans céder ni au déni ni à la caricature.

## Ce qu'on trouve sur le site

| Page | Ce que ça fait |
|---|---|
| **Accueil** | Fil d'actualité politique, mis à jour automatiquement plusieurs fois par jour via des flux RSS (Le Monde, franceinfo, Libération, L'Humanité, Mediapart, Politis, Le Figaro, Les Échos, Sénat...), avec un angle éditorial affiché en italique sur certains articles |
| **Partis** | Panorama de ~20 partis français, de l'extrême gauche à l'extrême droite, classés par bloc, avec une description factuelle et parfois un avis de la rédaction |
| **Candidats 2027** | Liste des candidats déclarés et pressentis à la présidentielle, mise à jour au fil de l'actualité |
| **Dossiers** | Formats longs de vérification factuelle sur des sujets clivants (immigration, pouvoir d'achat, hôpital public...), confrontant les discours de droite et de gauche aux données officielles |
| **Comparateur** | Outil pour comparer deux partis côte à côte sur 6 thèmes (retraites, fiscalité, climat, immigration, Europe, travail) |
| **Testez-vous** | Boussole électorale : 8 questions pour se situer sur un plan politique simplifié et voir quels partis s'en rapprochent — un exercice pédagogique, pas un prédicteur de vote |
| **Édito** | Le texte qui explique et assume la ligne éditoriale du site |

## Ce que ce n'est pas

- **Pas un média professionnel** : pas de rédaction, pas de vérification par des journalistes accrédités — c'est un projet personnel qui s'appuie sur des sources primaires (Insee, DREES, OCDE, presse) et les cite.
- **Pas neutre** : le site le dit lui-même, dans son édito et son bandeau. Les avis affichés en italique rouge sont clairement séparés des faits.
- **Pas exhaustif à 100 %** : les programmes 2027 ne sont pas tous publiés à ce stade de la campagne ; les synthèses du Comparateur et de la Boussole électorale sont des approximations pédagogiques, pas des citations officielles.
- **Pas affilié** à un parti, un candidat, ou un média existant.

## Sous le capot (pour aller plus loin)

Le site est un projet 100 % statique (pas de serveur), avec :
- une page React chargée en CDN (pas de build) ;
- un pipeline GitHub Actions qui va chercher l'actualité en RSS et republie automatiquement toutes les 6 heures ;
- des posts automatiques sur Bluesky et Mastodon à chaque article inédit.

## Contact

Ce projet n'a pas vocation à remplacer un média professionnel ni à se substituer à la lecture des programmes complets des candidats. Pour toute remarque, erreur signalée ou suggestion de dossier, [ouvrir une issue](../../issues) sur ce dépôt.
