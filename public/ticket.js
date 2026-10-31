/* GOD DID EXPRESS : tickets en image (commande, devis, facture, reçu), prêts à envoyer sur WhatsApp. */
(function () {
  var W = 1080, PAD = 56, PAPER = '#F4EFE9', INK = '#17130F', MUT = '#6F6A63', OR = '#EF7433', DARK = '#0E0D0C', LINE = '#CFC7BC';
  var FD = '"Big Shoulders Display","Arial Narrow",Impact,sans-serif';
  var FB = '"Bricolage Grotesque","Instrument Sans",system-ui,-apple-system,"Segoe UI",sans-serif';
  function wrap(ctx, text, maxW) {
    var words = String(text == null ? '' : text).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function fonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([document.fonts.load('800 80px "Big Shoulders Display"'), document.fonts.load('400 40px "Bricolage Grotesque"'), document.fonts.load('700 40px "Bricolage Grotesque"')]).catch(function () {});
  }
  function usd(n) { return (Math.round(n * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' $'; }
  function set(ctx, w, s, f, c) { ctx.font = w + ' ' + s + 'px ' + f; ctx.fillStyle = c; }
  /* o : { titre, ref, rows:[[label,valeur]], lignes:[{t,q,p}], totaux:[[label,valeur,fort]], stamp:['REÇU','GDE'], note, pied } */
  function build(ctx, o, draw) {
    var y = 0, i, stampB = 250 + 330;
    if (draw) { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, ctx.canvas.height); }
    // en-tête
    set(ctx, 800, 104, FD, INK); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    var titre = String(o.titre || '').toUpperCase(), tw = ctx.measureText(titre).width;
    set(ctx, 700, 46, FB, INK); var rw = ctx.measureText(o.ref || '').width + 56, avail = W - PAD * 2 - rw - 20;
    set(ctx, 800, 104, FD, INK);
    var size = 104; while (ctx.measureText(titre).width > avail && size > 40) { size -= 4; set(ctx, 800, size, FD, INK); }
    if (draw) { ctx.fillText(titre, PAD, PAD + 84); }
    if (o.ref && draw) { ctx.fillStyle = OR; rr(ctx, W - PAD - rw, PAD + 6, rw, 76, 10); ctx.fill(); set(ctx, 700, 46, FB, INK); ctx.textAlign = 'center'; ctx.fillText(o.ref, W - PAD - rw / 2, PAD + 60); ctx.textAlign = 'left'; }
    var dashY = 250;
    if (draw) {
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.setLineDash([26, 16]); ctx.beginPath(); ctx.moveTo(PAD * .4, dashY); ctx.lineTo(W - PAD * .4, dashY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, dashY, 32, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(W, dashY, 32, 0, 7); ctx.fill();
    }
    y = dashY + 74;
    // lignes d'information
    var vx = PAD + 262;
    (o.rows || []).forEach(function (r) {
      var narrow = y < stampB && o.stamp, vw = W - vx - PAD - (narrow ? 300 : 0);
      set(ctx, 500, 46, FB, INK); var ls = wrap(ctx, r[1], vw);
      if (draw) { set(ctx, 400, 40, FB, MUT); ctx.fillText(r[0], PAD, y); set(ctx, 500, 46, FB, INK); ls.forEach(function (l, k) { ctx.fillText(l, vx, y + k * 58); }); }
      y += ls.length * 58 + 24;
    });
    // tableau d'articles
    if (o.lignes && o.lignes.length) {
      y += 6;
      if (draw) { set(ctx, 400, 34, FB, MUT); ctx.fillText('Article', PAD, y); ctx.textAlign = 'right'; ctx.fillText('Qté', W - PAD - 420, y); ctx.fillText('Prix', W - PAD - 220, y); ctx.fillText('Total', W - PAD, y); ctx.textAlign = 'left'; ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(PAD, y + 18); ctx.lineTo(W - PAD, y + 18); ctx.stroke(); }
      y += 70;
      o.lignes.forEach(function (l) {
        set(ctx, 500, 44, FB, INK); var ls = wrap(ctx, l.t, W - PAD * 2 - 520);
        if (draw) { set(ctx, 500, 44, FB, INK); ls.forEach(function (t, k) { ctx.fillText(t, PAD, y + k * 54); }); ctx.textAlign = 'right'; ctx.fillText(String(l.q), W - PAD - 420, y); ctx.fillText(usd(l.p), W - PAD - 220, y); set(ctx, 700, 44, FB, INK); ctx.fillText(usd(l.q * l.p), W - PAD, y); ctx.textAlign = 'left'; }
        y += ls.length * 54 + 22;
      });
      if (draw) { ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(PAD, y - 8); ctx.lineTo(W - PAD, y - 8); ctx.stroke(); }
      y += 30;
    }
    // totaux
    (o.totaux || []).forEach(function (t) {
      if (t[2]) {
        if (draw) { ctx.fillStyle = OR; rr(ctx, PAD, y - 54, W - PAD * 2, 92, 10); ctx.fill(); set(ctx, 700, 40, FB, INK); ctx.fillText(t[0], PAD + 28, y + 6); set(ctx, 800, 62, FD, INK); ctx.textAlign = 'right'; ctx.fillText(t[1], W - PAD - 28, y + 12); ctx.textAlign = 'left'; }
        y += 120;
      } else {
        if (draw) { set(ctx, 400, 40, FB, MUT); ctx.fillText(t[0], PAD, y); set(ctx, 700, 44, FB, INK); ctx.textAlign = 'right'; ctx.fillText(t[1], W - PAD, y); ctx.textAlign = 'left'; }
        y += 66;
      }
    });
    y += 14;
    // code-barres
    var bh = 130;
    if (draw) {
      var s = hash((o.ref || '') + (o.titre || '')) || 7, x = PAD; ctx.fillStyle = INK;
      while (x < W - PAD) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; var bw = 3 + (s >>> 28) % 4 * 2, gp = 3 + (s >>> 24) % 4 * 2; if (x + bw > W - PAD) bw = W - PAD - x; ctx.fillRect(x, y, bw, bh); x += bw + gp; }
    }
    y += bh + 44;
    // note
    if (o.note) { set(ctx, 400, 38, FB, MUT); var ns = wrap(ctx, o.note, W - PAD * 2); if (draw) ns.forEach(function (l, k) { ctx.fillText(l, PAD, y + k * 52); }); y += ns.length * 52 + 16; }
    // pied
    set(ctx, 700, 34, FB, INK); var pied = o.pied || ('GOD DID EXPRESS · WhatsApp ' + (window.GDETicket && GDETicket.tel || '+243 983 129 294') + ' · Super Lemba, Kinshasa');
    var ps = wrap(ctx, pied, W - PAD * 2); if (draw) ps.forEach(function (l, k) { ctx.fillText(l, PAD, y + k * 46); }); y += ps.length * 46;
    // tampon
    if (draw && o.stamp) {
      var cx = W - PAD - 150, cy = dashY + 190;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-12 * Math.PI / 180); ctx.globalAlpha = .93; ctx.strokeStyle = OR; ctx.fillStyle = OR;
      ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 138, 0, 7); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 118, 0, 7); ctx.stroke();
      ctx.textAlign = 'center'; var st = o.stamp, fs = st.length > 1 ? 66 : 80; set(ctx, 800, fs, FD, OR); while (fs > 30 && Math.max.apply(null, st.map(function (t) { return ctx.measureText(t).width; })) > 190) { fs -= 4; set(ctx, 800, fs, FD, OR); }
      st.forEach(function (t, k) { ctx.fillText(t, 0, (k - (st.length - 1) / 2) * (fs * .98) + fs * .34); });
      ctx.restore();
    }
    return Math.ceil(y + PAD);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function draw(o) {
    return fonts().then(function () {
      var m = document.createElement('canvas'); m.width = W; m.height = 10;
      var H = Math.max(900, build(m.getContext('2d'), o, false));
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var ctx = c.getContext('2d'); build(ctx, o, true);
      // les encoches latérales sont en fait des trous : on les redessine au-dessus
      return c;
    });
  }
  function blob(c) { return new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/png'); }); }
  /* Photo « position du colis » : globe, produit, kilomètres parcourus et restants */
  var ETP = ['Demande reçue', 'Devis envoyé', 'Acompte reçu', 'Acheté chez le fournisseur', 'En transit', 'Arrivé à Kinshasa', 'Livré'];
  function kmf(n) { return Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' '); }
  function position(o) {
    return fonts().then(function () {
      var Wp = 1080, Hp = 1590, c = document.createElement('canvas'); c.width = Wp; c.height = Hp; var ctx = c.getContext('2d');
      var cran = Math.max(0, Math.min(7, Math.round(o.cran || 0))), mode = o.mode === 'bateau' ? 'bateau' : 'avion';
      var tot = (window.HOLO_KM && HOLO_KM[mode]) || 11000, pr = (window.HOLO_PR && HOLO_PR[cran]) || 0, fait = tot * pr, reste = tot - fait, livre = cran >= 6;
      ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, Wp, Hp);
      if (window.holoPhoto) { try { ctx.drawImage(holoPhoto({ w: 1080, h: 860, cran: cran, mode: mode }), 0, 0); } catch (e) {} }
      var g = ctx.createLinearGradient(0, 640, 0, 880); g.addColorStop(0, 'rgba(5,8,15,0)'); g.addColorStop(1, '#05080f'); ctx.fillStyle = g; ctx.fillRect(0, 640, Wp, 240);
      var P2 = 56; ctx.textBaseline = 'alphabetic';
      function tx(s, x, y, size, col, w, al, f, ls) { ctx.font = w + ' ' + size + 'px ' + (f || FB); ctx.fillStyle = col; ctx.textAlign = al || 'left'; try { ctx.letterSpacing = (ls || 0) + 'px'; } catch (e) {} ctx.fillText(s, x, y); try { ctx.letterSpacing = '0px'; } catch (e) {} }
      tx('GOD DID EXPRESS', P2, 84, 30, '#fff', 700, 'left', FB, 5);
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; rr(ctx, Wp - P2 - 330, 48, 330, 50, 6); ctx.stroke(); tx('POSITION DU COLIS', Wp - P2 - 165, 82, 22, 'rgba(255,255,255,.9)', 700, 'center', FB, 4);
      tx((o.ref ? 'COLIS ' + o.ref : 'COLIS') + (o.nom ? ' · ' + String(o.nom).toUpperCase() : ''), P2, 910, 28, '#FF7A1A', 700, 'left', FB, 4);
      var nom = String(o.produit || 'Ton colis').toUpperCase(), size = 100; ctx.font = '800 ' + size + 'px ' + FD;
      while (ctx.measureText(nom).width > Wp - P2 * 2 && size > 64) { size -= 4; ctx.font = '800 ' + size + 'px ' + FD; }
      var ls = wrap(ctx, nom, Wp - P2 * 2).slice(0, 2); ls.forEach(function (l, i) { tx(l, P2, 1000 + i * (size * .92), size, '#fff', 800, 'left', FD, 1); });
      var yy = 1000 + (ls.length - 1) * size * .92 + 52;
      tx('Chine  →  Kinshasa  ·  par ' + mode, P2, yy, 34, 'rgba(255,255,255,.72)', 500, 'left', FB, 0);
      yy += 96; var cols = [['PARCOURUS', kmf(Math.round(fait / 10) * 10), 'km'], ['RESTANTS', livre ? '0' : kmf(Math.round(reste / 10) * 10), 'km'], ['PROGRESSION', String(Math.round(pr * 100)), '%']], cw = (Wp - P2 * 2) / 3;
      cols.forEach(function (k, i) { var x = P2 + i * cw; tx(k[0], x, yy, 22, 'rgba(255,255,255,.55)', 700, 'left', FB, 4); tx(k[1], x, yy + 82, 86, i === 1 ? '#FF7A1A' : '#fff', 800, 'left', FD, 0); ctx.font = '800 86px ' + FD; var w = ctx.measureText(k[1]).width; tx(k[2], x + w + 10, yy + 82, 34, 'rgba(255,255,255,.7)', 600, 'left', FB, 0); });
      var by = yy + 138, bw = Wp - P2 * 2; ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(ctx, P2, by, bw, 14, 7); ctx.fill();
      var fg = ctx.createLinearGradient(P2, 0, P2 + bw, 0); fg.addColorStop(0, '#FF7A1A'); fg.addColorStop(1, livre ? '#3CDC82' : '#FFC15A'); ctx.fillStyle = fg; ctx.shadowColor = '#FF7A1A'; ctx.shadowBlur = 24; rr(ctx, P2, by, Math.max(14, bw * pr), 14, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(P2 + Math.max(7, bw * pr), by + 7, 15, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      tx('CHINE', P2, by + 58, 22, 'rgba(255,255,255,.6)', 700, 'left', FB, 4); tx('KINSHASA', Wp - P2, by + 58, 22, 'rgba(255,255,255,.6)', 700, 'right', FB, 4);
      var st = livre ? 'LIVRÉ' : (ETP[Math.min(6, cran)] || '').toUpperCase(), sy = by + 120; ctx.font = '800 44px ' + FD; var sw = ctx.measureText(st).width + 70;
      ctx.fillStyle = livre ? '#3CDC82' : '#FF7A1A'; rr(ctx, P2, sy - 50, sw, 76, 8); ctx.fill(); tx(st, P2 + 35, sy + 4, 44, '#0E0D0C', 800, 'left', FD, 2);
      tx('Étape ' + Math.min(7, cran + 1) + ' sur 7', P2 + sw + 28, sy + 2, 30, 'rgba(255,255,255,.7)', 500, 'left', FB, 0);
      if (o.arr && !livre) tx('Arrivée estimée à Kinshasa : ' + o.arr, P2, sy + 64, 30, '#fff', 600, 'left', FB, 0);
      tx('GOD DID EXPRESS · WhatsApp ' + (window.GDETicket && GDETicket.tel || '+243 983 129 294'), Wp / 2, Hp - 30, 24, 'rgba(255,255,255,.45)', 500, 'center', FB, 1);
      return c;
    });
  }
  /* Carte membre en image : prénom, numéro, code promo, avantages, prochain voyage */
  function carte(o) {
    return fonts().then(function () {
      var Wc = 1080, Hc = 1420, c = document.createElement('canvas'); c.width = Wc; c.height = Hc; var ctx = c.getContext('2d');
      var g = ctx.createLinearGradient(0, 0, Wc, Hc); g.addColorStop(0, '#F6B07A'); g.addColorStop(.5, '#EE7E36'); g.addColorStop(1, '#D9601F'); ctx.fillStyle = g; ctx.fillRect(0, 0, Wc, Hc);
      var sh = ctx.createRadialGradient(Wc * .8, 120, 20, Wc * .8, 120, 700); sh.addColorStop(0, 'rgba(255,240,220,.55)'); sh.addColorStop(1, 'rgba(255,240,220,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, Wc, Hc);
      var P2 = 72, ink = '#140C06'; ctx.textBaseline = 'alphabetic';
      function tx(s, x, y, size, col, w, al, f, ls) { ctx.font = w + ' ' + size + 'px ' + (f || FB); ctx.fillStyle = col; ctx.textAlign = al || 'left'; try { ctx.letterSpacing = (ls || 0) + 'px'; } catch (e) {} ctx.fillText(s, x, y); try { ctx.letterSpacing = '0px'; } catch (e) {} }
      tx('GOD DID EXPRESS', P2, 120, 52, ink, 800, 'left', FD, 4); tx(o.niveau ? 'MEMBRE ' + String(o.niveau).toUpperCase() : 'MEMBRE', Wc - P2, 116, 28, 'rgba(20,12,6,.75)', 700, 'right', FB, 4);
      tx('PRÉNOM', P2, 250, 24, 'rgba(20,12,6,.65)', 700, 'left', FB, 4);
      var nom = String(o.nom || 'Client').toUpperCase(), size = 150; ctx.font = '800 ' + size + 'px ' + FD; while (ctx.measureText(nom).width > Wc - P2 * 2 && size > 60) { size -= 6; ctx.font = '800 ' + size + 'px ' + FD; }
      tx(nom, P2, 250 + size * .95, size, ink, 800, 'left', FD, 2);
      var y = 250 + size * .95 + 70;
      var cols = [['CARTE N°', o.numero || '—'], ['CODE PROMO', o.code || '—']];
      cols.forEach(function (k, i) { var x = P2 + i * ((Wc - P2 * 2) / 2); tx(k[0], x, y, 22, 'rgba(20,12,6,.65)', 700, 'left', FB, 4); tx(k[1], x, y + 58, 50, ink, 800, 'left', FD, 3); });
      y += 110; ctx.fillStyle = ink; rr(ctx, P2, y, Wc - P2 * 2, 150, 18); ctx.fill();
      tx('ACHATS', P2 + 36, y + 50, 22, 'rgba(255,255,255,.6)', 700, 'left', FB, 4); tx(String(o.achats || 0) + ' / 10', P2 + 36, y + 118, 70, '#fff', 800, 'left', FD, 0);
      tx('À 10 ACHATS : UN PRODUIT DE 20 $ OFFERT', Wc - P2 - 36, y + 90, 26, '#FFB070', 700, 'right', FB, 1);
      var bx = P2 + 36, bw = Wc - P2 * 2 - 72; ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, bx, y + 128, bw, 8, 4); ctx.fill(); ctx.fillStyle = '#FF7A1A'; rr(ctx, bx, y + 128, Math.max(8, bw * Math.min(1, (o.achats || 0) / 10)), 8, 4); ctx.fill();
      y += 215; tx('TES AVANTAGES', P2, y, 24, 'rgba(20,12,6,.7)', 800, 'left', FB, 5); y += 18;
      (o.avantages || []).slice(0, 6).forEach(function (a) {
        var ls = wrap(ctx, a, Wc - P2 * 2 - 56); ctx.font = '600 33px ' + FB; ls = wrap(ctx, a, Wc - P2 * 2 - 56).slice(0, 2);
        ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(P2 + 10, y + 36, 8, 0, 7); ctx.fill();
        ls.forEach(function (l, i) { tx(l, P2 + 40, y + 46 + i * 40, 33, ink, 600, 'left', FB, 0); }); y += 22 + ls.length * 40 + 12;
      });
      if (o.voyage) {
        var vy = Hc - 210; ctx.fillStyle = 'rgba(20,12,6,.9)'; rr(ctx, P2, vy, Wc - P2 * 2, 120, 18); ctx.fill();
        tx('PROCHAIN VOYAGE', P2 + 36, vy + 46, 22, '#FFB070', 700, 'left', FB, 4); tx(o.voyage, P2 + 36, vy + 92, 40, '#fff', 800, 'left', FD, 1);
      }
      tx('GOD DID EXPRESS · WhatsApp ' + (window.GDETicket && GDETicket.tel || '+243 983 129 294'), Wc / 2, Hc - 40, 24, 'rgba(20,12,6,.7)', 600, 'center', FB, 1);
      return c;
    });
  }
  window.GDETicket = { draw: draw, position: position, carte: carte, blob: blob, usd: usd, W: W, tel: '' };
})();
