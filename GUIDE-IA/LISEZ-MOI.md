# Guide pour une IA (ou un développeur) : faire évoluer Esteti-Ma

Esteti-Ma met en relation des clientes et des professionnelles de la beauté (réservation à domicile, bureau ou salon, paiement Wave, messagerie, avis, administration). Propriétaire : Ariel (GitHub `ARIEL-MD`). Langue de travail : **français**, réponses courtes (il travaille surtout sur téléphone Android).

## 1. Ce qui est en place
| Élément | Où | Identifiant |
|---|---|---|
| Code | GitHub, dépôt **public** `ARIEL-MD/ED`, branche `main` | |
| API + site web | Render, service `esteti-ma-api`, offre gratuite, Francfort | `srv-dc20np7f3r2c73e0at40`, espace `tea-da4n8tc9v7es738n3vrg` |
| Base de données | Neon (PostgreSQL), projet `esteti-ma` | `nameless-glitter-93689077`, base `neondb` |
| Site | https://esteti-ma-api.onrender.com (l'API sert aussi l'appli web) | |
| Connexion admin (web) | https://esteti-ma-api.onrender.com/admin/login | |
| APK Android | GitHub → Releases (`apk-N`), construit par GitHub Actions | |

**Aucun secret n'est dans le dépôt** (il est public). `DATABASE_URL`, `JWT_SECRET`, mot de passe admin : voir les variables d'environnement du service Render, la console Neon, ou demander au propriétaire. Ne jamais les écrire dans un fichier du dépôt.

## 2. Structure
- `backend/` : API Node/Express/TypeScript + PostgreSQL. `src/index.ts` (point d'entrée), `src/routes/*` (routes), `schema.sql` (schéma complet, déjà appliqué sur Neon).
- `frontend/` : application React + TypeScript (Vite), mobile-first. `src/styles.css` (styles, avec adaptation tablette en bas de fichier), `src/pages/*`.
- `frontend/android/` : projet Android généré par **Capacitor** (appId `com.estetima.app`). Normalement, on n'y touche pas : seules les icônes (`res/mipmap-*`) ont été personnalisées.
- `.github/workflows/apk.yml` : construit l'APK.
- `render.yaml` : description Render (non utilisée : le service a été créé à la main).
- Le backend sert `frontend/dist` (voir `src/index.ts`, bloc « Site web »). `npm run build` du backend compile aussi le frontend.

## Affichage adaptatif
Aucun format d’appareil n’est imposé : l’appli occupe tout l’écran (voir `frontend/src/styles.css`, bloc « Adaptation fluide » en bas du fichier) et les listes de professionnelles utilisent la classe `.cards` (grille qui s'adapte à la place disponible). Pour toute nouvelle liste de cartes, l'entourer de `<div className="cards">`. Tester avec Playwright + `/usr/bin/google-chrome` à plusieurs largeurs (320 à 1920 px) et vérifier l'absence de défilement horizontal.

## 3. Comment appliquer un changement
1. Modifier le code, puis commit et **push sur `main`** (ex. `git push origin main`).
2. **Si le changement touche `frontend/**`** : GitHub Actions construit seul un nouvel APK (3 à 4 min) et le publie dans Releases (`https://github.com/ARIEL-MD/ED/releases`, tag `apk-N`, fichier `Esteti-Ma.apk`). Lien de téléchargement : `https://github.com/ARIEL-MD/ED/releases/download/apk-N/Esteti-Ma.apk`.
3. **Pour que le site et l'API se mettent à jour** : Render ne se redéploie PAS tout seul après un push (le lien automatique n'a pas fonctionné). Il faut lancer le déploiement : outil Render `trigger_deploy` avec `serviceId=srv-dc20np7f3r2c73e0at40`, ou bouton **Manual Deploy** dans le tableau de bord Render. Durée : 1 à 3 min. Ensuite vérifier avec `get_deploy` (statut `live`) et `list_logs`.
4. Les téléphones ne se mettent pas à jour seuls : chaque utilisateur doit installer le nouvel APK par-dessus l'ancien (aucune donnée perdue : les comptes sont sur le serveur).
5. Donner à l'utilisateur le **lien du nouvel APK** et ce qui a changé, en une ou deux phrases.

Changement de **base de données** : écrire une migration SQL idempotente (`migration-*.sql`, `IF NOT EXISTS`), l'exécuter sur Neon (outil Neon `run_sql`/`run_sql_transaction`, projet ci-dessus) ET mettre à jour `backend/schema.sql`.

## 4. Vérifier un build APK
L'API GitHub publique fonctionne sans jeton :
- Dernières exécutions : `https://api.github.com/repos/ARIEL-MD/ED/actions/runs`
- Étapes d'une exécution : `https://api.github.com/repos/ARIEL-MD/ED/actions/runs/<id>/jobs` (voir quelle étape est en échec)
- Fichiers publiés : `https://api.github.com/repos/ARIEL-MD/ED/releases`

## 5. Pièges connus (déjà rencontrés)
- Depuis l'environnement de l'IA, `onrender.com` n'est pas joignable (liste d'adresses autorisées) : on vérifie un déploiement via les outils Render, pas avec curl.
- L'outil Render `create_web_service` n'a pas de `rootDir` : les commandes commencent par `cd backend && ...`. Build : `cd backend && npm install --include=dev && npm run build`. Démarrage : `cd backend && node dist/index.js`. Variable `NODE_VERSION=22`.
- Dans le workflow, `./gradlew` s'exécute dans `frontend/android` (le chemin est relatif à ce dossier).
- L'APK pointe vers l'API grâce à `VITE_API_URL` (par défaut `https://esteti-ma-api.onrender.com` dans le workflow). Sur le site web, la variable est vide (même adresse).
- Les adresses de photos sont complètes : elles utilisent `PUBLIC_URL` (variable Render) ; l'appli Android est sur `https://localhost` : `CORS_ORIGIN` doit contenir `https://localhost,capacitor://localhost,http://localhost`.
- L'espace administrateur n'est lié nulle part dans l'interface : sur l'appli Android, toucher **5 fois rapidement le logo** sur l’écran de connexion ; sur le web, aller sur `/admin/login`.
- Un numéro de téléphone ne peut avoir qu'un seul compte (client, professionnelle ou admin) et son type ne change pas. Les numéros sont enregistrés tels que saisis (ex. `0799506172`), sans normalisation.
- Créer un administrateur : hacher le mot de passe avec `bcryptjs` (coût 12, au moins 10 caractères), puis `INSERT INTO users(role,name,phone,password_hash) VALUES('admin',...)` sur Neon. Ne jamais créer d'admin avec un mot de passe faible.
- Les professionnelles sont **visibles et utilisables dès l'inscription** (plus de validation par l'admin : `stylists.approved` vaut `true` par défaut). Seule la **certification** (badge) passe par une demande avec pièce d'identité, traitée par l'admin ; elle est facultative.

## 6. À faire / limites actuelles
- **Photos** : stockées sur le disque du serveur Render gratuit, donc **effacées à chaque redémarrage**. À brancher : Cloudinary ou S3 (voir `backend/src/images.ts`, `saveImage`).
- **Render gratuit** : le service s'endort après 15 min sans visite (premier chargement ~30 s). Offre payante (~7 $/mois) pour l'éviter.
- Paiements Wave (clés + test réel), Orange Money/MTN, SMS (mot de passe oublié), notifications push : non branchés.
- **Play Store** : l'APK actuel est une version de test (debug). Il faut une version **signée AAB** (clé de signature à garder en lieu sûr), le compte Google Play (25 $), une politique de confidentialité en ligne, des captures d'écran, et pour un compte personnel 12 testeurs pendant 14 jours.
- Quelques écrans gardent un vocabulaire au féminin (voir README).
- Coûts estimés : ~40 $ la première année pour démarrer ; 60 à 150 $/mois avec des milliers d'utilisateurs actifs (SMS et photos pèsent le plus).
