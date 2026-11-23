import { Link, useNavigate } from "react-router-dom";

// ⚠️ À COMPLÉTER avant la mise en ligne (remplacez les valeurs entre crochets)
const SOCIETE = "[Nom de la société / de l’éditeur]";
const ADRESSE = "[Adresse, ville, Côte d’Ivoire]";
const EMAIL = "[adresse e-mail de contact]";
const MAJ = "[date de mise à jour]";

type Sec = [string, string[]];

const CONDITIONS: Sec[] = [
  ["1. Objet", [
    `Esteti-Ma est une application de mise en relation entre des clients et des professionnels de la beauté et des soins esthétiques (coiffure, manucure, pédicure, maquillage, onglerie et soins). Elle est éditée par ${SOCIETE}, ${ADRESSE}.`,
    "Esteti-Ma n’est pas le prestataire des services de beauté. Les professionnels sont des personnes indépendantes, seules responsables de leurs prestations, de leurs prix et de leur matériel. En utilisant l’application, vous acceptez les présentes conditions.",
  ]],
  ["2. Compte", [
    "Pour utiliser l’application, vous créez un compte avec votre nom, votre numéro de téléphone et un mot de passe de 8 caractères minimum. Vous devez être majeur(e) et fournir des informations exactes.",
    "Le type de compte (client ou professionnel) est choisi à l’inscription et ne change pas. Un numéro de téléphone correspond à un seul compte : pour utiliser l’autre type de compte, il faut un autre numéro.",
    "Vous êtes responsable de la confidentialité de votre mot de passe et de l’activité de votre compte. Prévenez-nous en cas de perte ou d’utilisation par un tiers.",
  ]],
  ["3. Professionnels", [
    "Le professionnel publie son profil (présentation, ville, quartier, zone d’intervention), ses prestations (nom, description, durée, prix, photos) et ses disponibilités. Il s’engage à fournir des informations exactes, à honorer les réservations acceptées et à n’utiliser que des photos dont il détient les droits.",
    "Le profil d’un professionnel n’apparaît dans l’application qu’après validation par l’équipe Esteti-Ma.",
    "Le badge « Certifié » indique que l’équipe a vérifié l’identité du professionnel à partir d’une pièce justificative. Il ne constitue ni un diplôme, ni une garantie de qualité, ni une assurance.",
  ]],
  ["4. Réservation", [
    "Le client choisit une prestation, un créneau et un lieu (à domicile, au bureau ou en salon, selon ce que le professionnel propose). Pour les lieux hors salon, il indique l’adresse et peut se voir facturer des frais de déplacement fixés par le professionnel.",
    "Une réservation est d’abord une demande. Elle est confirmée uniquement lorsque le professionnel l’accepte ; il peut aussi la refuser. Un créneau confirmé ne peut pas être réservé deux fois. Le client et le professionnel sont informés par notification.",
    "Le client peut annuler une demande en attente ou une réservation acceptée depuis l’onglet « Réservations ».",
  ]],
  ["5. Prix et paiement", [
    "Les prix sont exprimés en francs CFA (FCFA). Le prix affiché comprend le prix de la prestation et, le cas échéant, les frais de déplacement.",
    "Un acompte de 30 % du total est demandé à la réservation. Il se règle par Wave. Si le professionnel l’accepte, il peut aussi être réglé en espèces. Le solde est réglé directement au professionnel après la prestation.",
    "Esteti-Ma prélève une commission sur les paiements effectués par l’application. Elle est comprise dans le montant payé : le client ne paie rien en plus de l’acompte.",
    "Les paiements en ligne sont traités par Wave. Esteti-Ma ne voit ni ne conserve votre code secret ni vos identifiants Wave.",
    "Annulation et remboursement de l’acompte : [À COMPLÉTER — par exemple délai d’annulation gratuite, cas où l’acompte est remboursé ou conservé].",
  ]],
  ["6. Messagerie et avis", [
    "Chaque réservation ouvre une conversation entre le client et le professionnel concernés. Elle sert à organiser la prestation.",
    "Après une prestation, le client peut noter le professionnel et laisser un commentaire. Les avis doivent être honnêtes et fondés sur une expérience réelle.",
  ]],
  ["7. Comportement interdit", [
    "Il est interdit de : usurper l’identité d’une autre personne ; publier des contenus illégaux, injurieux, discriminatoires ou à caractère sexuel ; harceler ou menacer un autre utilisateur ; publier de faux avis ; tenter de contourner la sécurité de l’application ; détourner le paiement d’une réservation créée sur l’application pour éviter la commission.",
  ]],
  ["8. Sécurité lors d’une prestation", [
    "Lors d’une prestation à domicile ou au bureau, restez prudent(e) : privilégiez un lieu où d’autres personnes sont présentes, prévenez un proche et utilisez la messagerie de l’application pour vos échanges. En cas de danger, contactez les autorités.",
  ]],
  ["9. Réclamations", [
    "En cas de problème avec une réservation ou un autre utilisateur, utilisez « Faire une réclamation » dans l’onglet Profil. L’équipe Esteti-Ma examine chaque réclamation et peut prendre les mesures prévues à l’article 10.",
  ]],
  ["10. Suspension et suppression de compte", [
    "Esteti-Ma peut suspendre ou fermer un compte, ou retirer un profil ou un badge, en cas de non-respect des présentes conditions, d’information fausse ou de comportement dangereux.",
    `Vous pouvez demander la fermeture de votre compte à tout moment en écrivant à ${EMAIL}.`,
  ]],
  ["11. Contenus publiés", [
    "Vous restez propriétaire des photos et textes que vous publiez. Vous donnez à Esteti-Ma le droit de les afficher dans l’application pour faire fonctionner le service (profil, prestations, avis). Vous garantissez que vous avez le droit de les publier.",
  ]],
  ["12. Responsabilité", [
    "Esteti-Ma met tout en œuvre pour que l’application soit disponible et sûre, sans garantir un fonctionnement sans interruption. Esteti-Ma n’est pas responsable de la qualité des prestations, des dommages survenant pendant une prestation ni des litiges entre un client et un professionnel, sauf faute prouvée de sa part et dans les limites permises par la loi.",
  ]],
  ["13. Modification des conditions", [
    "Nous pouvons modifier ces conditions. En cas de changement important, nous vous en informons dans l’application. Continuer à l’utiliser après la modification vaut acceptation.",
  ]],
  ["14. Droit applicable", [
    "Les présentes conditions sont régies par le droit ivoirien. En cas de litige, nous cherchons d’abord une solution amiable ; à défaut, les tribunaux compétents de [ville, ex. Abidjan] seront saisis.",
  ]],
  ["15. Contact", [`${SOCIETE} · ${ADRESSE} · ${EMAIL}`]],
];

const CONFIDENTIALITE: Sec[] = [
  ["1. Qui est responsable de vos données ?", [
    `${SOCIETE}, ${ADRESSE}, joignable à ${EMAIL}. Cette politique explique quelles données Esteti-Ma collecte, pourquoi, et quels sont vos droits.`,
  ]],
  ["2. Données que nous collectons", [
    "Compte : nom, numéro de téléphone, mot de passe (enregistré sous forme chiffrée, jamais en clair), type de compte, photo de profil si vous en ajoutez une.",
    "Professionnels : présentation, ville, quartier, position et rayon de la zone d’intervention, prestations (prix, durée, description, photos), disponibilités, photos de réalisations et photo de couverture.",
    "Certification (professionnels, facultative) : photo d’une pièce d’identité ou d’un document prouvant votre identité, et éventuellement un selfie.",
    "Réservations : prestation, date et heure, lieu (domicile, bureau ou salon), adresse indiquée pour les lieux hors salon, montants et statut.",
    "Paiements : montant, moyen de paiement (Wave ou espèces), référence de transaction et statut. Nous ne conservons ni vos identifiants Wave ni votre code secret.",
    "Échanges : messages avec l’autre partie d’une réservation, avis et notes, favoris, réclamations, notifications.",
    "Position de votre appareil : uniquement si vous utilisez la recherche « près de moi » et acceptez la demande d’autorisation de votre téléphone. Elle sert à trouver les professionnels proches et n’est pas enregistrée.",
    "Données techniques : un jeton de connexion est enregistré sur votre appareil pour vous garder connecté(e). Nous n’utilisons pas de cookies publicitaires ni d’outil de suivi publicitaire.",
  ]],
  ["3. Pourquoi nous les utilisons", [
    "Créer et sécuriser votre compte ; afficher les profils et prestations ; gérer les réservations, les créneaux et les paiements ; permettre la messagerie et les avis ; vérifier l’identité des professionnels (certification) ; traiter les réclamations ; prévenir la fraude et les abus ; envoyer les notifications liées à vos réservations.",
    "Nous nous appuyons sur l’exécution du service que vous demandez, sur votre consentement (position, certification) et sur notre intérêt légitime à sécuriser l’application.",
  ]],
  ["4. Qui voit vos données ?", [
    "Profil public d’un professionnel : nom, photo, ville, quartier, prestations, photos, avis et badge. Votre numéro de téléphone n’est pas affiché aux autres utilisateurs.",
    "Pour une réservation, le professionnel voit votre nom, la date, la prestation et, hors salon, l’adresse que vous avez saisie. Le client voit les informations du professionnel et son profil.",
    "Les pièces de certification sont lisibles uniquement par les administrateurs d’Esteti-Ma. Elles ne sont jamais visibles du public.",
    "Prestataires techniques : Wave pour le paiement en ligne, et nos hébergeurs pour faire fonctionner l’application et stocker les photos ([À COMPLÉTER : noms des hébergeurs]).",
    "Nous ne vendons pas vos données. Nous les communiquons à une autorité uniquement si la loi l’exige.",
  ]],
  ["5. Combien de temps les gardons-nous ?", [
    "Pièces de certification (photo de la pièce et selfie) : supprimées dès que l’administrateur a pris sa décision (acceptée ou refusée), ou dès que vous retirez votre demande.",
    "Données de compte et de réservation : tant que votre compte est actif, puis [À COMPLÉTER : durée] après sa fermeture, y compris pour respecter nos obligations comptables et légales sur les paiements.",
  ]],
  ["6. Sécurité", [
    "Nous protégeons vos données : mots de passe chiffrés, connexions sécurisées, accès réservé aux administrateurs pour les données sensibles, connexion administrateur séparée avec session courte. Aucun système n’est infaillible : choisissez un mot de passe long et unique.",
  ]],
  ["7. Vos droits", [
    "Conformément à la loi ivoirienne n° 2013-450 du 19 juin 2013 sur la protection des données à caractère personnel, vous pouvez accéder à vos données, les corriger, vous opposer à leur utilisation, demander leur suppression et retirer votre consentement.",
    `Pour exercer ces droits ou fermer votre compte, écrivez à ${EMAIL}. Vous pouvez aussi saisir l’ARTCI, l’autorité de protection des données en Côte d’Ivoire.`,
    "Vous pouvez à tout moment corriger votre nom et retirer votre photo depuis l’onglet Profil.",
  ]],
  ["8. Mineurs", [
    "L’application est réservée aux personnes majeures. Si vous pensez qu’un mineur a créé un compte, contactez-nous pour le faire supprimer.",
  ]],
  ["9. Modifications", [
    "Nous pouvons mettre à jour cette politique. La date de dernière mise à jour est indiquée en haut de la page, et nous vous informons en cas de changement important.",
  ]],
];

export function Legal({ kind }: { kind: "conditions" | "confidentialite" }) {
  const nav = useNavigate(); const c = kind === "conditions";
  const back = () => (window.history.state?.idx > 0 ? nav(-1) : nav("/login"));
  return (<main className="legal">
    <button type="button" className="linkbtn" onClick={back}>‹ Retour</button>
    <h1>{c ? "Conditions d’utilisation" : "Politique de confidentialité"}</h1>
    <p className="muted">Dernière mise à jour : {MAJ}</p>
    {(c ? CONDITIONS : CONFIDENTIALITE).map(([t, ps]) => <section key={t}><h2>{t}</h2>{ps.map((p, i) => <p key={i}>{p}</p>)}</section>)}
    <p className="muted"><Link to={c ? "/confidentialite" : "/conditions"}>{c ? "Politique de confidentialité" : "Conditions d’utilisation"}</Link></p>
  </main>);
}
export const Conditions = () => <Legal kind="conditions" />;
export const Confidentialite = () => <Legal kind="confidentialite" />;
