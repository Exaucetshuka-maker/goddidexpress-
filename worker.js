/* GOD DID EXPRESS : serveur léger (Cloudflare Worker).
   - sert le site (dossier public/) en y injectant les données publiées depuis /admin
   - API : connexion par mot de passe, enregistrement des données, photos
   Le mot de passe n'est jamais écrit dans le code : il est choisi par le propriétaire
   à la première visite de /admin, puis stocké haché (PBKDF2) dans le stockage KV. */

const ITER = 10000; // volontairement modéré : le plan gratuit limite le temps de calcul par requête
const TOKEN_JOURS = 30;
const enc = new TextEncoder();

const json = (o, status = 200, extra = {}) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const rnd = (n) => b64(crypto.getRandomValues(new Uint8Array(n)).buffer);

async function pbkdf2(pass, saltB64, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: iter }, key, 256);
  return b64(bits);
}

function egal(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

async function lireAuth(env) {
  const t = await env.GDE.get('auth');
  if (!t) return null;
  try { return JSON.parse(t); } catch (e) { return null; }
}

async function faireToken(env, auth) {
  const exp = Date.now() + TOKEN_JOURS * 864e5;
  return exp + '.' + (await hmac(auth.secret, 'gde:' + exp));
}

async function verifierToken(env, request) {
  const h = request.headers.get('authorization') || '';
  const m = /^Bearer (\d+)\.(.+)$/.exec(h);
  if (!m || Number(m[1]) < Date.now()) return false;
  const auth = await lireAuth(env);
  if (!auth) return false;
  return egal(await hmac(auth.secret, 'gde:' + m[1]), m[2]);
}

/* Freinage des essais : 8 échecs par adresse, puis 15 minutes d'attente */
async function freinage(env, request) {
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const k = 'fail:' + ip;
  const n = Number((await env.GDE.get(k)) || 0);
  return { k, n, bloque: n >= 8 };
}

const MAXTXT = 600;
function txt(v, max = MAXTXT) { return String(v == null ? '' : v).slice(0, max); }
function nombre(v, def = 0) { const n = Number(v); return isFinite(n) ? n : def; }

/* Nettoie les données reçues : seules ces rubriques publiques sont gardées */
function nettoyer(s) {
  s = s && typeof s === 'object' ? s : {};
  const o = {};
  o.rev = nombre(s.rev) + 1;
  o.maj = Date.now();
  o.prod = {};
  Object.keys(s.prod || {}).slice(0, 400).forEach((id) => {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return;
    const p = s.prod[id] || {};
    const r = {};
    if (Array.isArray(p.px)) r.px = [0, 1, 2].map((i) => (p.px[i] === null || p.px[i] === '' || p.px[i] === undefined ? null : nombre(p.px[i], null)));
    if (p.cache) r.cache = true;
    if (p.desc) r.desc = txt(p.desc, 600);
    if (p.photo && /^\/api\/img\/[A-Za-z0-9_-]{1,40}(\?v=\d+)?$/.test(p.photo)) r.photo = p.photo;
    o.prod[id] = r;
  });
  o.extra = (Array.isArray(s.extra) ? s.extra : []).slice(0, 300).map((e) => {
    const r = {
      id: /^[A-Za-z0-9_-]{1,40}$/.test(e.id) ? e.id : 'x' + Date.now(),
      t: txt(e.t, 120), s: txt(e.s, 240), c: txt(e.c, 40),
      px: [0, 1, 2].map((i) => (e.px && e.px[i] !== '' && e.px[i] != null ? nombre(e.px[i], null) : null)),
    };
    if (e.photo && /^\/api\/img\/[A-Za-z0-9_-]{1,40}(\?v=\d+)?$/.test(e.photo)) r.photo = e.photo;
    if (e.cache) r.cache = true;
    if (e.desc) r.desc = txt(e.desc, 600);
    return r;
  });
  o.slog = {};
  for (let m = 1; m <= 12; m++) if (s.slog && s.slog[m]) o.slog[m] = txt(s.slog[m], 160);
  o.soc = {
    tiktok: txt(s.soc && s.soc.tiktok, 200), instagram: txt(s.soc && s.soc.instagram, 200), facebook: txt(s.soc && s.soc.facebook, 200),
  };
  o.promo = (Array.isArray(s.promo) ? s.promo : []).slice(0, 40).map((p) => ({ code: txt(p.code, 30).toUpperCase(), pct: Math.max(0, Math.min(90, nombre(p.pct))), actif: p.actif !== false }));
  o.avis = (Array.isArray(s.avis) ? s.avis : []).slice(0, 30).map((a) => ({ txt: txt(a.txt, 400), nom: txt(a.nom, 80), photo: a.photo && /^\/api\/img\//.test(a.photo) ? a.photo : undefined }));
  o.vip = Array.isArray(s.vip) && s.vip.length === 3 ? s.vip.map((v) => nombre(v, 0)) : [3, 6, 10];
  o.lien = /^https:\/\//i.test(s.lien || '') ? txt(s.lien, 300) : '';
  o.mail = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,120}\.[^\s@<>"']{2,20}$/.test(String(s.mail || '').trim()) ? String(s.mail).trim() : '';
  o.wag = /^https:\/\//i.test(s.wag || '') ? txt(s.wag, 300) : '';
  o.wac = /^https:\/\//i.test(s.wac || '') ? txt(s.wac, 300) : '';
  const inf = s.info && typeof s.info === 'object' ? s.info : {};
  o.info = { avion: txt(inf.avion, 120), bateau: txt(inf.bateau, 120), zones: txt(inf.zones, 300), introuvable: txt(inf.introuvable, 300) };
  o.tel2 = txt(s.tel2, 40);
  o.adr2 = txt(s.adr2, 200);
  o.phr = (Array.isArray(s.phr) ? s.phr : []).slice(0, 20).map((x) => txt(x, 80)).filter(Boolean);
  o.grp = (Array.isArray(s.grp) ? s.grp : []).slice(0, 10).map((g, i) => ({
    id: txt(g.id || 'g' + (i + 1), 20),
    on: g.on !== false,
    nom: txt(g.nom, 120),
    pid: txt(g.pid, 40),
    durj: Math.max(0.04, Math.min(60, nombre(g.durj, 3))),
    fin: nombre(g.fin, 0),
    n: Math.max(0, Math.round(nombre(g.n))),
    max: Math.max(0, Math.round(nombre(g.max))),
    p: (Array.isArray(g.p) ? g.p : []).slice(0, 3).map((t) => [Math.max(1, Math.round(nombre(t && t[0], 1))), Math.max(0, nombre(t && t[1]))]),
  }));
  o.voy = (Array.isArray(s.voy) ? s.voy : []).slice(0, 24).map((v, i) => ({
    id: txt(v.id || 'v' + (i + 1), 20),
    on: v.on !== false,
    orig: txt(v.orig, 40),
    dep: /^\d{4}-\d{2}-\d{2}$/.test(String(v.dep || '')) ? String(v.dep) : '',
    arr: /^\d{4}-\d{2}-\d{2}$/.test(String(v.arr || '')) ? String(v.arr) : '',
    etat: ['auto', 'route', 'arrive'].indexOf(v.etat) >= 0 ? v.etat : 'auto',
    rempl: v.rempl === '' || v.rempl == null ? null : Math.max(0, Math.min(100, Math.round(nombre(v.rempl)))),
    note: txt(v.note, 160),
  }));
  return o;
}

async function lireListe(env, cle) {
  if (!env.GDE) return [];
  const t = await env.GDE.get(cle);
  try { return t ? JSON.parse(t) : []; } catch (e) { return []; }
}

async function lireEtat(env) {
  if (!env.GDE) return {};
  const t = await env.GDE.get('state');
  if (!t) return {};
  try { return JSON.parse(t); } catch (e) { return {}; }
}

function echapper(s) { return s.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }

async function servirPageAvecEtat(request, env) {
  const rep = await env.ASSETS.fetch(request);
  const ct = rep.headers.get('content-type') || '';
  if (!rep.ok || !ct.includes('text/html')) return rep;
  const etat = await lireEtat(env);
  let html = await rep.text();
  html = html.replace(/(<script type="application\/json" id="gde-state">)[\s\S]*?(<\/script>)/, (m, a, b) => a + echapper(JSON.stringify(etat)) + b);
  const h = new Headers(rep.headers);
  h.set('cache-control', 'no-store');
  h.delete('content-length');
  h.delete('etag');
  return new Response(html, { status: 200, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (!p.startsWith('/api/')) {
      if (p === '/' || p === '/index.html') return servirPageAvecEtat(request, env);
      const rep = await env.ASSETS.fetch(request);
      if (p === '/admin' || p === '/admin.html' || p === '/admin/') {
        const h = new Headers(rep.headers);
        h.set('x-robots-tag', 'noindex, nofollow');
        h.set('cache-control', 'no-store');
        return new Response(rep.body, { status: rep.status, headers: h });
      }
      return rep;
    }

    if (!env.GDE) return json({ erreur: 'Stockage non branché' }, 500);

    /* Données publiques */
    if (p === '/api/state' && request.method === 'GET') return json(await lireEtat(env));

    /* Photos publiques */
    const mi = /^\/api\/img\/([A-Za-z0-9_-]{1,40})$/.exec(p);
    if (mi && request.method === 'GET') {
      const d = await env.GDE.get('img:' + mi[1], 'arrayBuffer');
      if (!d) return new Response('Introuvable', { status: 404 });
      return new Response(d, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' } });
    }

    /* Statut : le mot de passe est-il déjà choisi ? */
    if (p === '/api/statut' && request.method === 'GET') {
      return json({ pret: !!(await lireAuth(env)) });
    }

    /* Choix du mot de passe (une seule fois) */
    if (p === '/api/setup' && request.method === 'POST') {
      if (await lireAuth(env)) return json({ erreur: 'Mot de passe déjà choisi' }, 409);
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const mdp = String(b.password || '');
      if (mdp.length < 8) return json({ erreur: 'Au moins 8 caractères' }, 400);
      const salt = rnd(16);
      const auth = { salt, iter: ITER, hash: await pbkdf2(mdp, salt, ITER), secret: rnd(32) };
      await env.GDE.put('auth', JSON.stringify(auth));
      return json({ token: await faireToken(env, auth) });
    }

    /* Connexion */
    if (p === '/api/login' && request.method === 'POST') {
      const f = await freinage(env, request);
      if (f.bloque) return json({ erreur: 'Trop d\'essais. Réessaie dans 15 minutes.' }, 429);
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const auth = await lireAuth(env);
      if (!auth) return json({ erreur: 'Aucun mot de passe choisi' }, 409);
      const h = await pbkdf2(String(b.password || ''), auth.salt, auth.iter);
      if (!egal(h, auth.hash)) {
        await env.GDE.put(f.k, String(f.n + 1), { expirationTtl: 900 });
        return json({ erreur: 'Mot de passe incorrect' }, 401);
      }
      return json({ token: await faireToken(env, auth) });
    }

    /* Consultation d'une carte de fidélité par son numéro (public, limité) */
    const mc = /^\/api\/carte\/([A-Za-z0-9-]{4,30})$/.exec(p);
    if (mc && request.method === 'GET') {
      const ip = request.headers.get('cf-connecting-ip') || 'x', k = 'look:' + ip;
      const n = Number((await env.GDE.get(k)) || 0);
      if (n >= 40) return json({ erreur: 'Trop d\'essais' }, 429);
      await env.GDE.put(k, String(n + 1), { expirationTtl: 600 });
      const cartes = await lireListe(env, 'cartes');
      const c = cartes.find((x) => x.code === mc[1].toUpperCase());
      if (!c) return json({ erreur: 'Carte introuvable' }, 404);
      return json({ nom: c.nom, achats: c.achats });
    }

    /* Tout ce qui suit demande d'être connecté */
    if (!(await verifierToken(env, request))) return json({ erreur: 'Connexion requise' }, 401);

    if (p === '/api/moi') return json({ ok: true });

    if (p === '/api/state' && request.method === 'PUT') {
      const len = Number(request.headers.get('content-length') || 0);
      if (len > 400000) return json({ erreur: 'Trop volumineux' }, 413);
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const ancien = await lireEtat(env);
      const propre = nettoyer({ ...b, rev: Math.max(nombre(b.rev), nombre(ancien.rev)) });
      await env.GDE.put('state', JSON.stringify(propre));
      return json(propre);
    }

    if (mi && request.method === 'PUT') {
      const d = await request.arrayBuffer();
      if (d.byteLength < 100 || d.byteLength > 2500000) return json({ erreur: 'Photo trop grande ou vide' }, 413);
      const u = new Uint8Array(d);
      if (!(u[0] === 0xff && u[1] === 0xd8)) return json({ erreur: 'Photo JPEG attendue' }, 415);
      await env.GDE.put('img:' + mi[1], d);
      return json({ ok: true });
    }

    if (p === '/api/cartes' && request.method === 'GET') return json({ cartes: await lireListe(env, 'cartes') });
    if (p === '/api/cartes' && request.method === 'PUT') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const vues = new Set();
      const propre = (Array.isArray(b.cartes) ? b.cartes : []).slice(0, 3000).map((c) => ({
        code: String(c.code || '').toUpperCase(), nom: txt(c.nom, 40), achats: Math.max(0, Math.min(999, Math.round(nombre(c.achats)))), maj: nombre(c.maj, Date.now()),
      })).filter((c) => /^[A-Z0-9-]{4,30}$/.test(c.code) && !vues.has(c.code) && vues.add(c.code));
      await env.GDE.put('cartes', JSON.stringify(propre));
      return json({ cartes: propre });
    }

    if (p === '/api/couts' && request.method === 'GET') {
      const t = await env.GDE.get('couts'); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch (e) {}
      return json({ reglages: j.reglages || {}, produits: j.produits || {} });
    }
    if (p === '/api/couts' && request.method === 'PUT') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const r = b.reglages || {}, num = (v) => (v === '' || v == null || !isFinite(Number(v)) ? '' : Math.max(0, Math.min(1e6, Number(v))));
      const reglages = { devise: r.devise === 'CNY' ? 'CNY' : 'USD', taux: num(r.taux), kgAvion: num(r.kgAvion), kgBateau: num(r.kgBateau), douane: num(r.douane), m1: num(r.m1), m5: num(r.m5), m10: num(r.m10), arrondi: ['0.01', '0.5', '1'].includes(String(r.arrondi)) ? String(r.arrondi) : '0.5' };
      const produits = {};
      Object.keys(b.produits || {}).slice(0, 1500).forEach((id) => {
        if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return;
        const c = b.produits[id] || {};
        produits[id] = { cout: num(c.cout), poids: num(c.poids), mode: c.mode === 'bateau' ? 'bateau' : 'avion' };
      });
      await env.GDE.put('couts', JSON.stringify({ reglages, produits }));
      return json({ reglages, produits });
    }

    if (p === '/api/password' && request.method === 'POST') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const auth = await lireAuth(env);
      const h = await pbkdf2(String(b.ancien || ''), auth.salt, auth.iter);
      if (!egal(h, auth.hash)) return json({ erreur: 'Ancien mot de passe incorrect' }, 401);
      const mdp = String(b.nouveau || '');
      if (mdp.length < 8) return json({ erreur: 'Au moins 8 caractères' }, 400);
      const salt = rnd(16);
      const na = { salt, iter: ITER, hash: await pbkdf2(mdp, salt, ITER), secret: rnd(32) };
      await env.GDE.put('auth', JSON.stringify(na));
      return json({ token: await faireToken(env, na) });
    }

    return json({ erreur: 'Introuvable' }, 404);
  },
};
