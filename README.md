# La Boussole — site statique + actu auto-mise à jour

Site 100% statique (pas de build, pas de serveur Node à faire tourner) :
- `index.html` + `app.js` : le site, React chargé en CDN, JSX transformé au vol par Babel dans le navigateur.
- `data/actu.json` : les articles affichés sur la page d'accueil, lus par `app.js` via `fetch()`.
- `scripts/fetch_actu.py` : récupère des flux RSS de presse française et régénère `data/actu.json`.
- `.github/workflows/update-actu.yml` : exécute ce script toutes les 6h sur les serveurs de GitHub et commit le résultat.

Le principe : **le contenu se met à jour dans le dépôt Git lui-même**, pas besoin de rebuild ni de
webhook de déploiement — le navigateur va chercher `data/actu.json` à chaque visite, donc dès que le
fichier est mis à jour dans le repo, les visiteurs voient la nouvelle version.

## 1. Déploiement (5 minutes)

### Option A — GitHub Pages (le plus simple, gratuit)
```bash
cd la-boussole-auto
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin git@github.com:<ton-user>/la-boussole.git
git push -u origin main
```
Puis sur GitHub : **Settings → Pages → Source: Deploy from a branch → branch `main`, dossier `/ (root)`**.
Le site sera en ligne sur `https://<ton-user>.github.io/la-boussole/` en 1-2 minutes.

### Option B — Netlify / Vercel
Glisse le dossier tel quel (pas de build command à configurer, `index.html` est déjà à la racine).
Fonctionne aussi bien, avec un domaine plus propre et un déploiement instantané à chaque push.

## 2. Activer l'automatisation

Le workflow `.github/workflows/update-actu.yml` est déjà dans le repo. Dès que tu pousses sur GitHub :
- Il tourne automatiquement toutes les 6h (`cron: "0 */6 * * *"`)
- Tu peux aussi le lancer à la main : onglet **Actions → Mise à jour de l'actu politique → Run workflow**
- Il n'a besoin d'aucun secret : `permissions: contents: write` suffit pour qu'il commit sur le repo

Vérifie après le premier run que `data/actu.json` a bien été mis à jour (commit auto signé
`la-boussole-bot`).

### ⚠️ Piège classique de GitHub Actions
GitHub **désactive automatiquement les workflows programmés (`schedule`)** si le dépôt reste inactif
pendant 60 jours (aucun commit humain). Si tu vois que l'actu ne bouge plus après deux mois de silence,
va dans l'onglet Actions et réactive le workflow (bouton "Enable workflow"), ou fais un commit
quelconque de temps en temps.

## 3. Ajuster les sources RSS

Tout se passe dans `scripts/fetch_actu.py`, variable `FEEDS` en haut du fichier :
```python
FEEDS = [
    ("Le Monde – Politique", "https://www.lemonde.fr/politique/rss_full.xml", "Politique", "#C81E3A"),
    ...
]
```
Ajoute/retire des flux librement (n'importe quel flux RSS public convient : Mediapart, L'Obs,
Basta!, Alternatives économiques, un flux Twitter/X converti en RSS via un proxy, etc.). La variable
`KEYWORDS` filtre les articles pour ne garder que ceux vraiment liés à la politique.

Le champ `"avis"` (l'angle éditorial en italique rouge) n'est **jamais généré automatiquement** — il
reste `null` par défaut. C'est volontaire : le parti pris éditorial doit rester écrit à la main pour
ne pas déraper. Tu peux éditer `data/actu.json` directement pour ajouter un avis sur un article
donné ; le prochain run du script écrasera le fichier, donc si tu veux qu'un avis survive, il faut
soit le committer juste après un run, soit l'ajouter comme un champ dérivé dans le script lui-même
(ex: dictionnaire de mots-clés → phrase toute faite).

## 4. Tester en local

```bash
pip install -r scripts/requirements.txt
python scripts/fetch_actu.py     # régénère data/actu.json
python -m http.server 8000       # sert le site en local
# → http://localhost:8000
```

## 5. Aller plus loin

- **Partis et candidats** restent gérés à la main dans `app.js` (données peu volatiles, à faible
  fréquence de changement — une candidature qui se déclare, ça se met à jour en 30 secondes dans le
  fichier). Si tu veux les automatiser aussi, le principe est le même : un script qui scrape une page
  Wikipédia stable (ex. "Liste des candidats à l'élection présidentielle française de 2027") et
  regénère un `data/candidats.json`.
- **Fréquence du cron** : `0 */6 * * *` = toutes les 6h. Pour plus réactif, `0 * * * *` (toutes les
  heures) — GitHub tolère mal les crons plus fréquents que 5 min de toute façon, et plus tu es
  fréquent, plus tu consommes de minutes Actions (2000 min/mois gratuites sur un repo public/privé
  perso, largement suffisant ici).
- **Alerte si le script échoue silencieusement** : ajoute une étape qui poste sur un webhook Slack/
  Discord en cas d'échec (`if: failure()` dans le workflow).
