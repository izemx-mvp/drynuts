# drynuts

# PROMPT POUR LOVABLE

Copie-colle tout ce qui suit dans Lovable.

---

## Contexte métier

Je veux une application web (front-end uniquement, aucun back-end, aucune base de données réelle — tout doit fonctionner avec des données mockées en state React / localStorage) pour gérer une entreprise de transformation de fruits secs. L'entreprise transforme des fruits secs bruts (amandes, noix, pistaches, cacahuètes, etc. — liste configurable) en produits torréfiés et emballés, qu'elle revend à 6 types de clients.

Le workflow métier à respecter dans les données, l'UI et la logique (même simulée) :

1. **Réception matière première** : stock de fruits secs bruts, séparé par type de produit.
2. **Réception matériau d'emballage** : stock de bobines/rouleaux d'emballage, séparé du stock de matière première.
3. **Production dans les ateliers** : plusieurs ateliers, chacun avec une machine qui torréfie ET emballe en même temps.
   - Un atelier ne travaille que sur UNE tâche à la fois (doit la terminer avant la suivante).
   - Un atelier ne traite qu'UN SEUL type de produit à la fois (pas de mélange amandes/noix simultané).
   - Chaque tâche de production a un statut (en attente, en cours, terminée) et une progression.
4. **Choix de l'emballage à la production** :
   - Taille : 100g, 250g, 500g, 1kg, etc. (configurable)
   - Type : **Standard** (marque propre, vendable à tout client) ou **Personnalisé** (logo d'un client précis comme BIM ou Marjane, vendable UNIQUEMENT à ce client)
5. **Stock produits finis** :
   - Produits en emballage standard → stock commun, vendable à tous
   - Produits en emballage personnalisé → automatiquement réservés au client concerné, séparés visuellement du stock commun, non vendables à un autre client
6. **Vente / distribution** à 6 types de clients : Gros grossiste, Petit grossiste, Demi-gros, Détaillant, Point de vente, Autres (grandes surfaces : BIM, Marjane, Duty Free). La logique de vente doit empêcher (visuellement / via message d'erreur) de vendre un produit personnalisé à un autre client que celui prévu.

---

## Pages / modules à créer

1. **Page de connexion (Login)**
   - Design soigné, logo de l'entreprise (à générer, thème fruits secs/torréfaction — tons chauds, terracotta, doré, marron, crème)
   - Champs email/mot de passe **déjà pré-remplis** avec des identifiants de démo (ex: admin@drynuts.ma / demo1234) pour que je puisse me connecter en un clic
   - Bouton "Se connecter" fonctionnel qui redirige vers le Dashboard
   - Lien "mot de passe oublié" (non fonctionnel, juste visuel)

2. **Dashboard**
   - KPIs en haut : stock matière première total, stock emballage, ateliers actifs, produits finis disponibles, commandes du jour, chiffre d'affaires du mois
   - Graphiques (barres/lignes) : production par atelier, ventes par type de client, évolution du stock
   - Liste des dernières activités / alertes de stock bas

3. **Stock Matière Première**
   - Tableau avec colonnes : type de fruit sec, quantité en stock, unité, fournisseur, date de réception, seuil d'alerte, statut
   - Filtres : par type de produit, par fournisseur, par statut (OK/stock bas)
   - Recherche par nom
   - CRUD complet : Ajouter un lot, Modifier, Supprimer, Voir détail (modal/drawer)
   - Bouton "Nouvelle réception" ouvre un formulaire complet fonctionnel

4. **Stock Emballage**
   - Tableau : type de bobine/rouleau, quantité, fournisseur, date réception
   - Mêmes fonctionnalités CRUD, filtres, recherche que ci-dessus

5. **Gestion des Ateliers / Production**
   - Vue en cartes ou tableau : liste des ateliers avec statut (libre / en cours / en pause / maintenance)
   - Pour chaque atelier en activité : produit en cours de transformation, taille/type d'emballage choisi, barre de progression, temps estimé restant
   - Bouton "Lancer une nouvelle tâche de production" → formulaire : choisir atelier disponible, type de fruit sec, quantité, taille d'emballage, type d'emballage (standard/personnalisé + sélection du client si personnalisé)
   - Empêcher (message d'erreur simulé) de lancer une tâche sur un atelier déjà occupé
   - File d'attente des tâches en attente par atelier

6. **Stock Produits Finis**
   - Deux sections clairement séparées visuellement :
     - **Stock commun (emballage standard)** : vendable à tous
     - **Stock réservé (emballage personnalisé)** : groupé par client (BIM, Marjane, etc.), avec badge "réservé"
   - Filtres par type de produit, taille, type d'emballage, client (si personnalisé)
   - Recherche
   - CRUD (ajustement manuel de stock, suppression, détail)

7. **Clients**
   - Liste des clients avec leur type (Gros grossiste, Petit grossiste, Demi-gros, Détaillant, Point de vente, Autres)
   - Fiche client : historique de commandes, produits personnalisés associés, coordonnées
   - CRUD complet : ajouter/modifier/supprimer un client
   - Filtre par type de client, recherche par nom

8. **Ventes / Commandes**
   - Tableau des commandes : client, type de client, produits, quantité, prix, date, statut (en attente/validée/livrée/annulée)
   - Formulaire "Nouvelle commande" fonctionnel :
     - Sélection du client → filtre automatiquement les produits disponibles (si le client n'a pas de stock personnalisé réservé, seul le stock standard est proposé ; si le client a du stock personnalisé, celui-ci apparaît en plus, réservé à lui)
     - Calcul automatique du total
   - Filtres par statut, type de client, date
   - Recherche
   - Actions : valider, modifier, annuler, voir facture (mock)

9. **Fournisseurs**
   - Liste avec CRUD, filtres, recherche
   - Historique des livraisons par fournisseur

10. **Paramètres**
    - Gestion de la liste configurable des types de fruits secs
    - Gestion des tailles d'emballage disponibles
    - Gestion des types de clients
    - Profil utilisateur, thème clair/sombre

---

## Exigences de design

- Design moderne, professionnel, type SaaS B2B (inspiration Linear / Notion / Odoo mais plus chaleureux)
- Palette de couleurs inspirée des fruits secs et de la torréfaction : tons terracotta, marron caramel, doré/miel, crème/beige, avec un accent vert olive ou orange brûlé pour les call-to-action
- Sidebar de navigation fixe à gauche avec icônes claires pour chaque module listé ci-dessus
- Topbar avec recherche globale, notifications, profil utilisateur
- Cartes (cards) avec ombres douces, coins arrondis, bonne hiérarchie typographique
- Tableaux avec tri par colonne, pagination, hover states clairs
- Formulaires en modals ou drawers latéraux, avec validation visuelle (champs requis, messages d'erreur)
- Boutons avec états clairs (hover, disabled, loading) et icônes cohérentes (Lucide icons)
- Badges colorés pour les statuts (ex: vert = disponible, orange = stock bas, rouge = rupture, bleu = réservé/personnalisé)
- Responsive (utilisable sur tablette au minimum)
- Micro-animations subtiles sur les transitions de page et l'ouverture des modals

---

## Données mockées

Génère des données de démonstration réalistes et cohérentes avec le contexte marocain (noms d'entreprises, fournisseurs, clients type BIM/Marjane/Duty Free) :

- Au moins 6-8 types de fruits secs (amandes, noix, pistaches, cacahuètes, noix de cajou, raisins secs, figues séchées, dattes)
- Au moins 4-5 ateliers avec des statuts variés
- Au moins 15-20 lots en stock matière première et emballage
- Au moins 10 clients répartis sur les 6 catégories, dont BIM et Marjane avec du stock personnalisé réservé
- Au moins 20-30 produits finis (mélange standard et personnalisé)
- Au moins 15-20 commandes avec différents statuts
- Quelques fournisseurs

---

## Exigences fonctionnelles importantes

- **Tout doit être réellement interactif** : chaque bouton "Ajouter/Modifier/Supprimer" doit ouvrir un vrai formulaire et modifier réellement les données affichées (via state, pas juste visuel)
- **Tous les filtres et la recherche doivent réellement filtrer** les listes/tableaux en temps réel
- **La logique métier des emballages personnalisés doit être respectée** partout : un produit personnalisé ne doit jamais apparaître comme vendable à un autre client que le sien
- **Les ateliers occupés doivent bloquer visuellement** le lancement d'une nouvelle tâche tant qu'ils n'ont pas terminé
- Pas de back-end, pas d'API réelle : tout en state local / context / localStorage pour persister pendant la session
- Connexion fonctionnelle avec les identifiants pré-remplis (pas besoin d'auth réelle, juste une simulation qui redirige vers le dashboard)

---

Construis l'application complète en une fois avec toutes ces pages, en priorisant d'abord le Login, le Dashboard, la Production/Ateliers et le Stock Produits Finis, car c'est le cœur du métier.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25705888-8636-4d8e-9e9b-f3dadc9abad7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
