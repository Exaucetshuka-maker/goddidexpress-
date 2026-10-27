# GOD DID EXPRESS

Site publié sur Cloudflare (Workers + stockage KV). Le dossier `public/` contient le site, `worker.js` le petit serveur.

- `/` : le site pour les clients
- `/admin` : espace admin caché, protégé par un mot de passe que le propriétaire choisit à la première visite (jamais écrit dans le code)
- Produits, prix, photos, achats groupés, contact, slogans : tout se change depuis `/admin`, sans toucher au code.
