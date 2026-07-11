# Makaya Method — Mélissa Paultre (par SteFi Services)

Site de coaching & développement personnel.
Construit d'après le brief rempli par la cliente.

## Pages
- index.html — Accueil (devise, approche, cheminement, témoignages)
- a-propos.html — Parcours, méthode, public, valeurs
- services.html — Coaching individuel/groupe, ateliers, conférences, entreprise
- temoignages.html — Témoignages
- blog.html — Articles (placeholders)
- rendez-vous.html — 2 formulaires : questionnaire 1re séance + inscription séminaire
- contact.html — Formulaire de contact
- admin.html — Espace privé (gestion des demandes)
- mentions-legales.html

## Style (selon brief)
Ambiance douce & apaisante. Bleu nuit #1e2d43 · terracotta #c06549 ·
beige #e8dccb · blanc cassé #f7f2e9. Cormorant Garamond + Karla.
Devise : « Chaque comportement a une fonction. Comprendre, c'est déjà changer. »

## Formulaires (Supabase, slug 'makaya')
- contact      → type 'contact'
- seminaire    → type 'seminaire'
- questionnaire→ type 'questionnaire'
Tous enregistrés en base + ouverture WhatsApp (+509 48 95 6823).

## ⚠️ À FAIRE avant mise en ligne
1. Supabase — créer l'entreprise :
   insert into entreprises (slug, nom) values ('makaya', 'Makaya Method');
2. Créer le compte admin de Mélissa (Authentication) et le lier dans profils :
   insert into profils (user_id, entreprise_id)
   select u.id, e.id from auth.users u, entreprises e
   where u.email = 'lissa_paultre@yahoo.com' and e.slug = 'makaya';
3. Ajouter son LOGO (elle en a un) et ses PHOTOS pro (elle en a) —
   remplacer les placeholders du hero et des sections.

## Déploiement
GitHub + Vercel (Framework "Other").
