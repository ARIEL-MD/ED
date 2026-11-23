# Esteti-Ma – code source
- `backend/` : API Node/Express/TypeScript + PostgreSQL (comptes, rôles, créneaux sans conflit, réservations domicile/bureau/salon, messagerie, avis, admin, webhook paiement Wave).
- Photos : tous les comptes ont une photo de profil (`PUT /api/me/avatar`) ; seules les coiffeuses ont en plus une photo de couverture (`PUT /api/manage/cover`). Base existante : `backend/migration-photos-profil.sql`.
- Comptes : le type (client ou coiffeuse) est fixé à la création et ne change jamais ; le téléphone est unique, donc pour l’autre type il faut un nouveau compte. Les prestations (photo, description, prix) se publient depuis le profil de la coiffeuse.
- Messages : espace dédié (`GET /api/bookings/conversations`, une conversation par réservation, messages non lus, pastille sur la barre du bas). Base existante : `backend/migration-messages.sql`.
- `frontend/` : application React + TypeScript (Vite), mobile-first.

## Lancer le projet complet
```
createdb ed && psql ed -f backend/schema.sql
cd backend && cp .env.example .env && npm i
npx tsx src/scripts/createAdmin.ts +2250700000000 "Admin" "mot-de-passe-long"
npm run dev
cd ../frontend && npm i && npm run dev
```
## Connexion administrateur
Les administrateurs ont une connexion séparée : `/admin/login` (application) et `POST /api/admin-auth/login` (serveur, session de 2 h, limitée à 10 essais par 15 min). Un compte administrateur est refusé par la connexion normale `/api/auth/login`. Les comptes admin se créent uniquement avec le script `createAdmin.ts`, jamais depuis l’inscription.

- Certification : le professionnel envoie une demande (pièce d’identité ou pièce prouvant que c’est lui, selfie facultatif) depuis « Activité → certification ». Les photos sont stockées dans `backend/private/` (jamais servi au public), lisibles uniquement par un admin connecté, et supprimées dès la décision. L’admin certifie ou refuse (motif obligatoire) dans l’onglet « certifications » et peut retirer le badge dans « comptes ». Base existante : `backend/migration-certified.sql` puis `backend/migration-certification.sql`.

## À finaliser
Clés Wave et test réel ; Orange Money / MTN via un agrégateur ; stockage photos (S3/Cloudinary) ; SMS pour mot de passe oublié ; notifications push ; vocabulaire de quelques écrans React encore au féminin ; logo fourni par le client.
Identité : logo et couleurs (marine #0A1F6E, or) d’Esteti-Ma ; fichiers dans `frontend/public/` (logo.jpg, mark.jpg, icônes).
Polices libres (Cormorant Garamond, Manrope). Aucun code ni visuel tiers copié.

## Mise en ligne et APK
1. Base : Neon (schema.sql déjà appliqué). 2. API : Render → « New + » → Blueprint → ce dépôt (`render.yaml`) ; renseigner `DATABASE_URL` (adresse Neon) et `PUBLIC_URL` (adresse Render). 3. APK : GitHub → onglet Actions → « Construire l'APK » → Run workflow → coller l'adresse Render ; l'APK apparaît dans Releases (≈ 5 min).
Limite : sur l'offre gratuite de Render, les photos envoyées sont effacées à chaque redémarrage (stockage Cloudinary/S3 à brancher) et l'API s'endort après 15 min d'inactivité.
