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
function nettoyerDet(d) {
  if (!d || typeof d !== 'object') return null;
  const r = {};
  if (['neuf', 'occasion'].includes(d.e)) r.e = d.e;
  if (['carton', 'detail', 'les-deux'].includes(d.v)) r.v = d.v;
  if (['stock', 'commande'].includes(d.d)) r.d = d.d;
  const ct = txt(d.ct, 60); if (ct) r.ct = ct;
  return Object.keys(r).length ? r : null;
}

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
    if (p.gone) r.gone = true;
    if (p.desc) r.desc = txt(p.desc, 600);
    { const dd = nettoyerDet(p.det); if (dd) r.det = dd; }
    if (new RegExp('^\\d{4}-\\d{2}-\\d{2}$').test(String(p.arr || ''))) r.arr = String(p.arr);
    if (p.photo && /^\/api\/img\/[A-Za-z0-9_-]{1,40}(\?v=\d+)?$/.test(p.photo)) r.photo = p.photo;
    { const ph = phs(p.ph); if (ph.length) r.ph = ph; }
    o.prod[id] = r;
  });
  o.extra = (Array.isArray(s.extra) ? s.extra : []).slice(0, 300).map((e) => {
    const r = {
      id: /^[A-Za-z0-9_-]{1,40}$/.test(e.id) ? e.id : 'x' + Date.now(),
      t: txt(e.t, 120), s: txt(e.s, 240), c: txt(e.c, 40),
      px: [0, 1, 2].map((i) => (e.px && e.px[i] !== '' && e.px[i] != null ? nombre(e.px[i], null) : null)),
    };
    if (e.photo && /^\/api\/img\/[A-Za-z0-9_-]{1,40}(\?v=\d+)?$/.test(e.photo)) r.photo = e.photo;
    { const ph = phs(e.ph); if (ph.length) r.ph = ph; }
    if (e.cache) r.cache = true;
    if (e.desc) r.desc = txt(e.desc, 600);
    { const dd = nettoyerDet(e.det); if (dd) r.det = dd; }
    if (new RegExp('^\\d{4}-\\d{2}-\\d{2}$').test(String(e.arr || ''))) r.arr = String(e.arr);
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
  o.contacts = (Array.isArray(s.contacts) ? s.contacts : []).slice(0, 30).map((c) => ({
    type: ['tel', 'wa', 'mail', 'adresse'].includes(c && c.type) ? c.type : 'tel', label: txt(c && c.label, 40), v: txt(c && c.v, 200),
  })).filter((c) => c.v);
  o.avant = (Array.isArray(s.avant) ? s.avant : []).slice(0, 8).map((x) => txt(x, 140)).filter(Boolean);
  o.wanum = /^\d{8,15}$/.test(String(s.wanum || '').replace(/\D/g, '')) ? String(s.wanum).replace(/\D/g, '') : '';
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
    sens: v.sens === 'depuis' ? 'depuis' : 'vers',
    max: Math.max(0, Math.min(9999, Math.round(nombre(v.max)))),
    dep: /^\d{4}-\d{2}-\d{2}$/.test(String(v.dep || '')) ? String(v.dep) : '',
    arr: /^\d{4}-\d{2}-\d{2}$/.test(String(v.arr || '')) ? String(v.arr) : '',
    etat: ['auto', 'route', 'arrive'].indexOf(v.etat) >= 0 ? v.etat : 'auto',
    rempl: v.rempl === '' || v.rempl == null ? null : Math.max(0, Math.min(100, Math.round(nombre(v.rempl)))),
    note: txt(v.note, 160),
  }));
  o.pay = (Array.isArray(s.pay) ? s.pay : []).slice(0, 6).map((x) => ({ op: txt(x && x.op, 30), num: txt(x && x.num, 30), nom: txt(x && x.nom, 50) })).filter((x) => x.op && x.num);
  const dd = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
  o.camp = (Array.isArray(s.camp) ? s.camp : []).slice(0, 12).map((c, i) => ({
    id: txt(c.id || 'c' + (i + 1), 20), on: c.on !== false, nom: txt(c.nom, 60), slogan: txt(c.slogan, 120),
    theme: ['noel', 'ecole', 'fete', 'autre'].includes(c.theme) ? c.theme : 'autre',
    deb: dd(c.deb), fin: dd(c.fin), evt: dd(c.evt),
    pids: (Array.isArray(c.pids) ? c.pids : []).slice(0, 40).map((x) => txt(x, 40)).filter(Boolean),
    lots: (Array.isArray(c.lots) ? c.lots : []).slice(0, 8).map((l) => ({ nom: txt(l && l.nom, 60), desc: txt(l && l.desc, 140), prix: Math.max(0, Math.min(99999, nombre(l && l.prix))) })).filter((l) => l.nom),
  })).filter((c) => c.nom);
  o.tend = (Array.isArray(s.tend) ? s.tend : []).slice(0, 24).map((x) => ({ pid: txt(x && x.pid, 40), tag: ['Chine', 'Dubaï', 'Turquie', 'RDC', 'Nouveau'].includes(x && x.tag) ? x.tag : 'Nouveau' })).filter((x) => x.pid);
  const src = Array.isArray(s.listes) ? s.listes : s.iph && typeof s.iph === 'object' ? [Object.assign({ id: 'iphone', nom: 'iPhone' }, s.iph)] : [];
  o.listes = src.slice(0, 5).map((l, i) => ({
    id: /^[A-Za-z0-9_-]{1,20}$/.test(String(l && l.id)) ? l.id : 'l' + (i + 1),
    nom: txt(l && l.nom, 40) || 'Liste ' + (i + 1),
    on: !!(l && l.on === true),
    date: txt(l && l.date, 40),
    mention: txt(l && l.mention, 60),
    douane: !(l && l.douane === false),
    slogan: txt(l && l.slogan, 100),
    items: (Array.isArray(l && l.items) ? l.items : []).slice(0, 200).map((t) => ({ m: txt(t && t.m, 60), g: txt(t && t.g, 20), p: Math.max(0, Math.min(99999, Math.round(nombre(t && t.p) * 100) / 100)) })).filter((t) => t.m),
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


function phs(a) { return (Array.isArray(a) ? a : []).filter((x) => typeof x === 'string' && /^\/api\/img\/[A-Za-z0-9_-]{1,40}(\?v=\d+)?$/.test(x)).slice(0, 5); }
function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
async function metaPartage(url, etat, env, request) {
  const s = url.searchParams.get('s'), pid = url.searchParams.get('p'), org = url.origin;
  let titre = 'GOD DID EXPRESS', desc = 'Tu choisis. On trouve. On te livre. Chine, Dubaï, Istanbul vers Kinshasa.', img = org + '/logo-og.png';
  if (s === 'iphone' || s === 'prix') { titre = 'Prix du jour · GOD DID EXPRESS'; desc = 'Les prix du jour, commande en un clic sur WhatsApp.'; }
  else if (s === 'voyages') { titre = 'Nos voyages · GOD DID EXPRESS'; const v = (etat.voy || []).filter((x) => x.on !== false && x.orig && x.dep && x.dep >= new Date().toISOString().slice(0, 10))[0]; desc = v ? (v.sens === 'depuis' ? 'Kinshasa → ' + v.orig : v.orig + ' → Kinshasa') + ' · départ le ' + v.dep + '. Réserve ta place.' : 'Dates de départ, dernier jour pour commander, arrivées estimées.'; }
  else if (s === 'groupes') { titre = 'Achats groupés · GOD DID EXPRESS'; desc = 'Plus on est nombreux, moins c\'est cher.'; }
  else if (s === 'paniers') { const c = (etat.camp || []).filter((x) => x.on !== false)[0]; titre = (c ? c.nom : 'Paniers de saison') + ' · GOD DID EXPRESS'; desc = c && c.slogan ? c.slogan : 'Les paniers du moment, commande sur WhatsApp.'; }
  else if (pid && /^[A-Za-z0-9_-]{1,40}$/.test(pid)) {
    let p = (etat.extra || []).find((e) => e.id === pid) || null, ov = (etat.prod || {})[pid] || {};
    if (!p) { try { const r = await env.ASSETS.fetch(new Request(org + '/products.json')); const L = await r.json(); p = (Array.isArray(L) ? L : L.produits || []).find((e) => e.id === pid) || null; } catch (e) {} }
    if (p) { const px = (ov.px || p.px || [])[0]; titre = p.t + ' · GOD DID EXPRESS'; desc = (px > 0 ? px + ' $ · ' : '') + 'Commande sur WhatsApp, livré à Kinshasa.'; const ph = ov.photo || p.photo || ('img/' + pid + '.jpg'); img = org + (ph.startsWith('/') ? '' : '/') + ph; if (/^https?:/.test(ph)) img = ph; }
  } else return null;
  const tags = '<meta property="og:site_name" content="GOD DID EXPRESS"><meta property="og:type" content="website"><meta property="og:title" content="' + attr(titre) + '"><meta property="og:description" content="' + attr(desc) + '"><meta property="og:image" content="' + attr(img) + '"><meta property="og:url" content="' + attr(org + url.pathname + url.search) + '"><meta name="twitter:card" content="summary"><meta name="description" content="' + attr(desc) + '">';
  return { titre, tags };
}

async function servirPageAvecEtat(request, env) {
  const rep = await env.ASSETS.fetch(request);
  const ct = rep.headers.get('content-type') || '';
  if (!rep.ok || !ct.includes('text/html')) return rep;
  const etat = await lireEtat(env);
  let html = await rep.text();
  html = html.replace(/(<script type="application\/json" id="gde-state">)[\s\S]*?(<\/script>)/, (m, a, b) => a + echapper(JSON.stringify(etat)) + b);
  try { const m = await metaPartage(new URL(request.url), etat, env, request); if (m) html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + attr(m.titre) + '</title>' + m.tags); } catch (e) {}
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
      return json({ nom: c.nom, achats: c.achats, parr: c.parr || 0, util: c.util || 0 });
    }


    /* Prix du jour à mettre sur d'autres sites : flux JSON et page à intégrer (public, sans prix fournisseur) */
    if ((p === '/api/prix.json' || p === '/api/prix-embed') && request.method === 'GET') {
      const et = await lireEtat(env), want = url.searchParams.get('liste') || '';
      const L = (Array.isArray(et.listes) ? et.listes : []).filter((l) => l && l.on === true && (!want || l.id === want));
      if (p === '/api/prix.json') {
        return new Response(JSON.stringify({ source: 'GOD DID EXPRESS', site: 'https://goddidexpress.com', listes: L.map((l) => ({ id: l.id, nom: l.nom, date: l.date, mention: l.mention, douane_incluse: l.douane !== false, slogan: l.slogan, articles: (l.items || []).map((x) => ({ modele: x.m, variante: x.g, prix_usd: x.p })) })) }), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60' } });
      }
      const h = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const corps = L.map((l) => `<section><h2>${h(l.nom)} <small>${h(l.date)}${l.mention ? ' · ' + h(l.mention) : ''}${l.douane !== false ? ' · douane incluse' : ''}</small></h2>${(l.items || []).map((x) => `<div class="r"><span>${h(x.m)} ${h(x.g)}</span><b>${x.p > 0 ? h(x.p) + ' $' : 'Prix du jour'}</b></div>`).join('')}${l.slogan ? `<p class="s">${h(l.slogan)}</p>` : ''}</section>`).join('') || '<p>Aucune liste publiée pour le moment.</p>';
      const page = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prix du jour · GOD DID EXPRESS</title><style>body{margin:0;background:#0E0D0C;color:#fff;font:15px/1.4 system-ui,Arial,sans-serif;padding:14px}h2{font-size:18px;margin:12px 0 6px;color:#FF7A1A}h2 small{color:#bbb;font-weight:500;font-size:12px}.r{display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid #2a2724}.r b{color:#FF7A1A;white-space:nowrap}.s{color:#FF7A1A;font-weight:700;text-align:center}a.c{display:block;margin-top:14px;background:#FF7A1A;color:#0E0D0C;text-align:center;padding:12px;border-radius:8px;font-weight:800;text-decoration:none}</style></head><body>${corps}<a class="c" href="https://goddidexpress.com/#prix" target="_blank" rel="noopener">Commander sur GOD DID EXPRESS</a></body></html>`;
      return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60', 'content-security-policy': 'frame-ancestors *' } });
    }

    /* Inscriptions réelles : achats groupés et voyages (public, prénom seulement) */
    if (p === '/api/joins' && request.method === 'GET') {
      const L = await lireListe(env, 'joins'), out = { g: {}, v: {} };
      L.forEach((j) => { const b = out[j.k] || (out[j.k] = {}); const c = b[j.id] || (b[j.id] = { n: 0, last: [] }); c.n++; });
      L.slice().sort((a, b) => b.t - a.t).forEach((j) => { const c = out[j.k][j.id]; if (c.last.length < 3) c.last.push({ nom: j.nom, t: j.t }); });
      return json(out);
    }
    if (p.startsWith('/api/devis/') && request.method === 'GET') {
      const id = p.slice(11); if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return json({ avion: null, bateau: null });
      const t = await env.GDE.get('couts'); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch (e) {}
      const r = j.reglages || {}, c = (j.produits || {})[id], n = (v) => (v === '' || v == null || !isFinite(Number(v)) ? null : Number(v));
      const calc = (mode) => {
        if (!c) return null;
        const cout = n(c.cout), poids = n(c.poids), kg = n(mode === 'bateau' ? r.kgBateau : r.kgAvion), m1 = n(r.m1), dou = n(r.douane) || 0, taux = r.devise === 'CNY' ? n(r.taux) : 1;
        if (cout === null || poids === null || kg === null || m1 === null || taux === null) return null;
        const rendu = (cout * taux + poids * kg) * (1 + dou / 100), st = parseFloat(r.arrondi) || 0.5, arr = (x) => Math.round(Math.round(x / st) * st * 100) / 100;
        const pr = (m) => (n(m) === null ? null : arr(rendu * (1 + n(m) / 100)));
        return [arr(rendu * (1 + m1 / 100)), pr(r.m5), pr(r.m10)];
      };
      return json({ avion: calc('avion'), bateau: calc('bateau') });
    }
    if (p === '/api/avis' && request.method === 'POST') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const ref = String(b.ref || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''), tx = txt(b.txt, 400), nom = txt(b.nom, 40);
      if (tx.length < 8) return json({ erreur: 'Écris au moins une phrase.' }, 400);
      const cmds = await lireListe(env, 'cmds'), c = cmds.find((x) => x.ref === ref);
      if (!c) return json({ erreur: 'Référence inconnue.' }, 404);
      if (c.cran < 6) return json({ erreur: 'Tu pourras donner ton avis quand ton colis sera livré.' }, 409);
      const L = await lireListe(env, 'avisv'); if (L.some((x) => x.ref === ref)) return json({ erreur: 'Tu as déjà donné ton avis. Merci !' }, 409);
      L.push({ ref, nom: nom || c.nom, txt: tx, t: Date.now() }); await env.GDE.put('avisv', JSON.stringify(L.slice(-200)));
      return json({ ok: true });
    }
    if (p === '/api/demande' && request.method === 'POST') {
      const ip = request.headers.get('cf-connecting-ip') || 'x', rk = 'dm:' + ip, n0 = Number((await env.GDE.get(rk)) || 0);
      if (n0 >= 5) return json({ erreur: 'Tu as déjà envoyé plusieurs demandes. Réessaie dans une heure ou écris sur WhatsApp.' }, 429);
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const nom = txt(b.nom, 60), tel = txt(b.tel, 30).replace(/[^0-9+ ]/g, ''), tx = txt(b.txt, 600), lien = txt(b.lien, 300), qte = txt(b.qte, 20), bud = txt(b.bud, 20), mar = ['Chine', 'Dubaï', 'Turquie', 'Tous les marchés'].includes(b.mar) ? b.mar : '', pre = b.pre === true;
      if (lien && !/^https?:\/\/\S+$/i.test(lien)) return json({ erreur: 'Le lien doit commencer par http ou https.' }, 400);
      if (!nom || tel.replace(/\D/g, '').length < 8) return json({ erreur: 'Écris ton prénom et ton numéro WhatsApp.' }, 400);
      let photo = '', id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const m = typeof b.photo === 'string' ? b.photo.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/) : null;
      if (b.photo && !m) return json({ erreur: 'Photo non acceptée.' }, 400);
      if (!tx && !lien && !m) return json({ erreur: 'Envoie au moins une photo, un lien ou une description.' }, 400);
      if (m) { if (m[1].length > 600000) return json({ erreur: 'Photo trop grande.' }, 413); const bin = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)); await env.GDE.put('img:' + id, bin, { expirationTtl: 90 * 86400 }); photo = '/api/img/' + id; }
      await env.GDE.put(rk, String(n0 + 1), { expirationTtl: 3600 });
      const L = await lireListe(env, 'demandes'); L.push({ id, nom, tel, txt: tx, lien, photo, qte, bud, mar, pre, t: Date.now(), vu: false });
      await env.GDE.put('demandes', JSON.stringify(L.slice(-300))); return json({ ok: true });
    }
    if (p === '/api/clic' && request.method === 'POST') {
      let b; try { b = await request.json(); } catch (e) { return new Response(null, { status: 204 }); }
      const id = String(b && b.id || '').slice(0, 60); if (!id || /[<>"]/.test(id) || !env.GDE) return new Response(null, { status: 204 });
      const t = await env.GDE.get('clics'); let c = {}; try { c = t ? JSON.parse(t) : {}; } catch (e) {}
      if (!(id in c) && Object.keys(c).length >= 600) return new Response(null, { status: 204 });
      c[id] = (c[id] || 0) + 1; await env.GDE.put('clics', JSON.stringify(c)); return new Response(null, { status: 204 });
    }
    if (p === '/api/vue' && request.method === 'POST') {
      let b; try { b = await request.json(); } catch (e) { return new Response(null, { status: 204 }); }
      if (!env.GDE) return new Response(null, { status: 204 });
      const jour = new Date().toISOString().slice(0, 10), t = await env.GDE.get('vues'); let v = {}; try { v = t ? JSON.parse(t) : {}; } catch (e) {}
      const d = v[jour] || (v[jour] = { v: 0, u: 0 }); d.v++; if (b && b.n === true) d.u++;
      Object.keys(v).sort().slice(0, Math.max(0, Object.keys(v).length - 60)).forEach((k) => delete v[k]);
      await env.GDE.put('vues', JSON.stringify(v)); return new Response(null, { status: 204 });
    }
    if (p === '/api/join' && request.method === 'POST') {
      const ip = request.headers.get('cf-connecting-ip') || 'x', rk = 'jn:' + ip;
      const nrl = Number((await env.GDE.get(rk)) || 0);
      if (nrl >= 20) return json({ erreur: 'Trop d\'essais, réessaie dans quelques minutes' }, 429);
      await env.GDE.put(rk, String(nrl + 1), { expirationTtl: 600 });
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const k = b.k === 'v' ? 'v' : b.k === 'g' ? 'g' : '', id = String(b.id || '');
      const nom = String(b.nom || '').trim().replace(/\s+/g, ' ');
      if (!k || !/^[A-Za-z0-9_-]{1,20}$/.test(id)) return json({ erreur: 'Demande invalide' }, 400);
      if (!/^[\p{L}][\p{L} '’-]{1,29}$/u.test(nom)) return json({ erreur: 'Écris ton prénom (2 à 30 lettres)' }, 400);
      const etat = await lireEtat(env), L = await lireListe(env, 'joins'), now = Date.now(), jour = new Date().toISOString().slice(0, 10);
      const cible = k === 'g' ? (etat.grp || []).find((g) => g.id === id && g.on && g.nom && g.fin > now) : (etat.voy || []).find((v) => v.id === id && v.on !== false && v.orig && v.etat !== 'arrive' && v.etat !== 'route' && (!v.dep || v.dep > jour));
      if (!cible) return json({ erreur: 'Ce groupe ou ce voyage est fermé' }, 409);
      const deja = L.filter((j) => j.k === k && j.id === id);
      const total = (k === 'g' ? Number(cible.n) || 0 : 0) + deja.length;
      if (cible.max > 0 && total >= cible.max) return json({ erreur: 'Complet' }, 409);
      if (deja.some((j) => j.ip === ip)) return json({ erreur: 'Tu es déjà inscrit', n: total }, 409);
      L.push({ k, id, nom, t: now, ip });
      await env.GDE.put('joins', JSON.stringify(L.slice(-3000)));
      return json({ ok: true, n: total + 1 });
    }

    /* Position d'un colis par sa référence (public, limité) : seulement prénom, produit, étape */
    const mm = /^\/api\/cmd\/([A-Za-z0-9-]{4,30})$/.exec(p);
    if (mm && request.method === 'GET') {
      const ip = request.headers.get('cf-connecting-ip') || 'x', k = 'look:' + ip;
      const n = Number((await env.GDE.get(k)) || 0);
      if (n >= 40) return json({ erreur: 'Trop d\'essais' }, 429);
      await env.GDE.put(k, String(n + 1), { expirationTtl: 600 });
      const c = (await lireListe(env, 'cmds')).find((x) => x.ref === mm[1].toUpperCase());
      if (!c) return json({ erreur: 'Référence introuvable' }, 404);
      return json({ ref: c.ref, nom: c.nom, prod: c.prod, cran: c.cran, mode: c.mode, orig: c.orig || 'Chine', typ: c.typ || 'achat', ou: c.ou || '', arr: c.arr, maj: c.maj });
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
        parrain: String(c.parrain || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30), parr: Math.max(0, Math.min(999, Math.round(nombre(c.parr)))), util: Math.max(0, Math.min(99999, Math.round(nombre(c.util)))), bonus: c.bonus === true,
      })).filter((c) => /^[A-Z0-9-]{4,30}$/.test(c.code) && !vues.has(c.code) && vues.add(c.code));
      await env.GDE.put('cartes', JSON.stringify(propre));
      return json({ cartes: propre });
    }


    if (p === '/api/joins/all' && request.method === 'GET') return json({ joins: (await lireListe(env, 'joins')).map((j) => ({ k: j.k, id: j.id, nom: j.nom, t: j.t, m: !!j.m })) });
    if (p === '/api/joins/all' && request.method === 'POST') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      let L = await lireListe(env, 'joins');
      if (b.action === 'add') {
        const k = b.k === 'v' ? 'v' : 'g', id = String(b.id || ''), nom = String(b.nom || '').trim().slice(0, 30);
        if (!/^[A-Za-z0-9_-]{1,20}$/.test(id) || nom.length < 2) return json({ erreur: 'Prénom ou cible manquant' }, 400);
        L.push({ k, id, nom, t: Date.now(), m: true, ip: 'admin' });
      } else if (b.action === 'clear') {
        L = L.filter((j) => !(j.k === b.k && j.id === b.id));
      } else if (b.action === 'del') {
        L = L.filter((j) => !(j.k === b.k && j.id === b.id && j.t === b.t && j.nom === b.nom));
      } else return json({ erreur: 'Action inconnue' }, 400);
      await env.GDE.put('joins', JSON.stringify(L.slice(-3000)));
      return json({ joins: L.map((j) => ({ k: j.k, id: j.id, nom: j.nom, t: j.t, m: !!j.m })) });
    }
    if (p === '/api/vues' && request.method === 'GET') {
      const t = await env.GDE.get('vues'); let v = {}; try { v = t ? JSON.parse(t) : {}; } catch (e) {}
      return json({ vues: v });
    }
    if (p === '/api/clics' && request.method === 'GET') {
      const t = await env.GDE.get('clics'); let c = {}; try { c = t ? JSON.parse(t) : {}; } catch (e) {}
      return json({ clics: c });
    }

    if (p === '/api/avisv' && request.method === 'GET') return json({ avis: await lireListe(env, 'avisv') });
    if (p === '/api/avisv' && request.method === 'PUT') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const L = (Array.isArray(b.avis) ? b.avis : []).slice(0, 200).map((a) => ({ ref: String(a.ref || '').slice(0, 30), nom: txt(a.nom, 40), txt: txt(a.txt, 400), t: nombre(a.t) }));
      await env.GDE.put('avisv', JSON.stringify(L)); return json({ avis: L });
    }
    if (p === '/api/cmds' && request.method === 'GET') return json({ cmds: await lireListe(env, 'cmds') });
    if (p === '/api/cmds' && request.method === 'PUT') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const vues = new Set(), dt = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
      const propre = (Array.isArray(b.cmds) ? b.cmds : []).slice(0, 400).map((c) => ({
        ref: String(c.ref || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''), nom: txt(c.nom, 40), tel: txt(c.tel, 30), prod: txt(c.prod, 100),
        cran: Math.max(0, Math.min(7, Math.round(nombre(c.cran)))), mode: c.mode === 'bateau' ? 'bateau' : 'avion', orig: ['Chine', 'Dubaï', 'Istanbul'].includes(c.orig) ? c.orig : 'Chine', typ: c.typ === 'expedition' ? 'expedition' : 'achat', ou: txt(c.ou, 80), total: Math.max(0, Math.min(1e6, nombre(c.total))), paye: Math.max(0, Math.min(1e6, nombre(c.paye))), arr: dt(c.arr), maj: dt(c.maj) || new Date().toISOString().slice(0, 10),
      })).filter((c) => /^[A-Z0-9-]{4,30}$/.test(c.ref) && !vues.has(c.ref) && vues.add(c.ref));
      await env.GDE.put('cmds', JSON.stringify(propre));
      return json({ cmds: propre });
    }

    if (p === '/api/iph' && request.method === 'GET') {
      const t = await env.GDE.get('iph'); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch (e) {}
      if (!j.listes) j = { listes: j.items || j.brut ? { iphone: j } : {} };
      return json({ listes: j.listes });
    }
    if (p === '/api/iph' && request.method === 'PUT') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const num = (v) => (v === '' || v == null || !isFinite(Number(v)) ? 0 : Math.max(0, Math.min(99999, Number(v))));
      const out = { listes: {} };
      Object.keys(b.listes || {}).slice(0, 6).forEach((id) => {
        if (!/^[A-Za-z0-9_-]{1,20}$/.test(id)) return; const l = b.listes[id] || {};
        out.listes[id] = { brut: String(l.brut || '').slice(0, 8000), mode: l.mode === 'pct' ? 'pct' : 'usd', marge: l.marge === '' || l.marge == null ? '' : num(l.marge),
          items: (Array.isArray(l.items) ? l.items : []).slice(0, 200).map((t) => ({ m: String(t.m || '').slice(0, 60), g: String(t.g || '').slice(0, 20), c: num(t.c), p: num(t.p) })) };
      });
      await env.GDE.put('iph', JSON.stringify(out));
      return json(out);
    }
    if (p === '/api/demandes' && request.method === 'GET') return json({ demandes: await lireListe(env, 'demandes') });
    if (p === '/api/demandes' && request.method === 'PUT') {
      let b; try { b = await request.json(); } catch (e) { return json({ erreur: 'Requête invalide' }, 400); }
      const old = await lireListe(env, 'demandes'), L = (Array.isArray(b.demandes) ? b.demandes : []).slice(0, 300).map((d) => ({ id: String(d.id || '').slice(0, 30), nom: txt(d.nom, 60), tel: txt(d.tel, 30), txt: txt(d.txt, 600), lien: txt(d.lien, 300), qte: txt(d.qte, 20), bud: txt(d.bud, 20), mar: ['Chine', 'Dubaï', 'Turquie', 'Tous les marchés'].includes(d.mar) ? d.mar : '', pre: d.pre === true, photo: /^\/api\/img\/d[A-Za-z0-9_-]{1,38}$/.test(d.photo || '') ? d.photo : '', t: nombre(d.t), vu: d.vu === true }));
      const gardes = new Set(L.map((d) => d.id));
      for (const d of old) if (!gardes.has(d.id) && d.photo) await env.GDE.delete('img:' + d.photo.slice(9));
      await env.GDE.put('demandes', JSON.stringify(L)); return json({ demandes: L });
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
