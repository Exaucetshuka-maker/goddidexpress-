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
    set(ctx, 700, 34, FB, INK); var pied = o.pied || 'GOD DID EXPRESS · WhatsApp +243 983 129 294 · Super Lemba, Kinshasa';
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
  window.GDETicket = { draw: draw, blob: blob, usd: usd, W: W };
})();
