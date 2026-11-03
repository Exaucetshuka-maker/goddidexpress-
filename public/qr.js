/* Mini générateur de QR code (version 3, correction M, jusqu'à 42 octets). Aucun service externe. */
(function () {
  var EXP = [], LOG = []; (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rs(data, n) {
    var g = [1]; for (var i = 0; i < n; i++) { var ng = []; for (var j = 0; j <= g.length; j++) ng[j] = (g[j] || 0) ^ mul(g[j - 1] || 0, EXP[i]); g = ng; }
    var r = []; for (i = 0; i < n; i++) r[i] = 0;
    data.forEach(function (d) { var f = d ^ r[0]; r.shift(); r.push(0); for (var k = 0; k < n; k++) r[k] ^= mul(g[k + 1], f); });
    return r;
  }
  function make(text) {
    var b = []; var u = unescape(encodeURIComponent(text)); for (var i = 0; i < u.length; i++) b.push(u.charCodeAt(i));
    if (b.length > 42) return null;
    var bits = []; function put(v, n) { for (var k = n - 1; k >= 0; k--) bits.push((v >>> k) & 1); }
    put(4, 4); put(b.length, 8); b.forEach(function (x) { put(x, 8); });
    var cap = 44 * 8; for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var cw = []; for (i = 0; i < bits.length; i += 8) { var v = 0; for (var k = 0; k < 8; k++) v = v * 2 + bits[i + k]; cw.push(v); }
    for (var p = 0; cw.length < 44; p++) cw.push(p % 2 ? 0x11 : 0xEC);
    cw = cw.concat(rs(cw, 26));
    var S = 29, fn = [], base = []; for (i = 0; i < S; i++) { fn[i] = []; base[i] = []; for (var j = 0; j < S; j++) { fn[i][j] = false; base[i][j] = false; } }
    function sf(x, y, d) { base[y][x] = d; fn[y][x] = true; }
    for (i = 0; i < S; i++) { sf(6, i, i % 2 === 0); sf(i, 6, i % 2 === 0); }
    [[3, 3], [S - 4, 3], [3, S - 4]].forEach(function (c) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var x = c[0] + dx, y = c[1] + dy; if (x < 0 || y < 0 || x >= S || y >= S) continue; var d = Math.max(Math.abs(dx), Math.abs(dy)); sf(x, y, d !== 2 && d !== 4); } });
    for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) sf(22 + dx, 22 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    function fmt(m, M) {
      var data = (0 << 3) | m, rem = data; for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var f = ((data << 10) | rem) ^ 0x5412, g = function (k) { return ((f >>> k) & 1) === 1; };
      function s(x, y, d) { M[y][x] = d; }
      for (var k = 0; k <= 5; k++) s(8, k, g(k)); s(8, 7, g(6)); s(8, 8, g(7)); s(7, 8, g(8)); for (k = 9; k < 15; k++) s(14 - k, 8, g(k));
      for (k = 0; k < 8; k++) s(S - 1 - k, 8, g(k)); for (k = 8; k < 15; k++) s(8, S - 15 + k, g(k)); s(8, S - 8, true);
    }
    var tmp = base.map(function (r) { return r.slice(); }); fmt(0, tmp); for (i = 0; i < S; i++) for (j = 0; j < S; j++) if (tmp[i][j] !== base[i][j] || (i === S - 8 && j === 8)) fn[i][j] = true;
    for (i = 0; i < 9; i++) { fn[i][8] = true; fn[8][i] = true; } for (i = 0; i < 8; i++) { fn[8][S - 1 - i] = true; fn[S - 1 - i][8] = true; } fn[S - 8][8] = true;
    var data = base.map(function (r) { return r.slice(); }), n = 0;
    for (var right = S - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (var vert = 0; vert < S; vert++) for (var jj = 0; jj < 2; jj++) { var x = right - jj, up = ((right + 1) & 2) === 0, y = up ? S - 1 - vert : vert; if (!fn[y][x] && n < cw.length * 8) { data[y][x] = ((cw[n >>> 3] >>> (7 - (n & 7))) & 1) === 1; n++; } } }
    var MK = [function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x, y) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; }, function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; }, function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    function pen(M) { var sc = 0; for (var a = 0; a < S; a++) { var rr = 1, cc = 1; for (var c = 1; c < S; c++) { rr = M[a][c] === M[a][c - 1] ? rr + 1 : 1; if (rr === 5) sc += 3; else if (rr > 5) sc++; cc = M[c][a] === M[c - 1][a] ? cc + 1 : 1; if (cc === 5) sc += 3; else if (cc > 5) sc++; } } for (a = 0; a < S - 1; a++) for (c = 0; c < S - 1; c++) { var v = M[a][c]; if (v === M[a][c + 1] && v === M[a + 1][c] && v === M[a + 1][c + 1]) sc += 3; } return sc; }
    var best = null, bs = 1e9;
    for (var m = 0; m < 8; m++) { var M = data.map(function (r) { return r.slice(); }); for (y = 0; y < S; y++) for (x = 0; x < S; x++) if (!fn[y][x] && MK[m](x, y)) M[y][x] = !M[y][x]; fmt(m, M); var sc = pen(M); if (sc < bs) { bs = sc; best = M; } }
    return best;
  }
  window.GDEQR = { make: make };
})();
