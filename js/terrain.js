/* =====================================================================
   Data terrain
   A bivariate normal surface drawn as a 3D point cloud on a 2D canvas,
   with confidence-ellipse contours and drifting wireframe polyhedra.
   No WebGL or libraries: points are projected with a simple camera.
   ===================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  /* Colour stops: deep iris at the base, mint at the peak */
  var STOPS = [
    [ 92,  96, 210],
    [125, 140, 255],
    [125, 211, 252],
    [ 94, 234, 212],
    [220, 255, 248]
  ];
  function lerpColour(t) {
    t = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
    var i = Math.min(STOPS.length - 2, Math.floor(t));
    var f = t - i, a = STOPS[i], b = STOPS[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  /* Icosahedron geometry for the floating wireframes */
  function icosahedron() {
    var p = (1 + Math.sqrt(5)) / 2;
    var v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
    var len = Math.sqrt(1 + p * p);
    v = v.map(function (q) { return [q[0] / len, q[1] / len, q[2] / len]; });
    var e = [];
    for (var i = 0; i < v.length; i++) {
      for (var j = i + 1; j < v.length; j++) {
        var dx = v[i][0] - v[j][0], dy = v[i][1] - v[j][1], dz = v[i][2] - v[j][2];
        if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - 2 / len) < 1e-3) e.push([i, j]);
      }
    }
    return { v: v, e: e };
  }
  var ICO = icosahedron();

  function Terrain(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = !!options.reduced;
    this.t = 0;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.scroll = 0;
    this.running = false;
    this.visible = true;
    this.intro = this.reduced ? 1 : 0;
    this.layout = { peakX: 0.5, peakY: 0.62, scale: 1 };
    this.dust = [];
    this._frame = this._frame.bind(this);
    this.resize();
  }

  Terrain.prototype.resize = function () {
    var c = this.canvas;
    var w = c.clientWidth || 1, h = c.clientHeight || 1;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.w = w; this.h = h; this.dpr = dpr;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var wide = w >= 1024;
    this.cols = w < 560 ? 52 : w < 1024 ? 72 : 104;
    this.rows = Math.round(this.cols * 0.56);
    this.layout = wide
      ? { peakX: 0.72, peakY: 0.80, scale: Math.min(w, 1500) / 1500 * 1.12 }
      : { peakX: 0.5, peakY: w < 560 ? 0.44 : 0.47, scale: Math.min(w, 900) / 900 * (w < 560 ? 1.15 : 1) };
    this.focal = Math.max(w, h) * (wide ? 0.92 : 1.25);

    /* Ambient dust particles */
    var n = wide ? 70 : 34;
    this.dust = [];
    for (var i = 0; i < n; i++) {
      this.dust.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, s: Math.random() * 0.25 + 0.05, p: Math.random() * TAU });
    }
    if (!this.running) this.render();
  };

  Terrain.prototype.setPointer = function (nx, ny) { this.pointer.tx = nx; this.pointer.ty = ny; };
  Terrain.prototype.setScroll = function (v) { this.scroll = v; };
  Terrain.prototype.setIntro = function (v) { this.intro = v; };

  Terrain.prototype.start = function () {
    if (this.running || this.reduced) { this.render(); return; }
    this.running = true;
    this._last = performance.now();
    requestAnimationFrame(this._frame);
  };
  Terrain.prototype.stop = function () { this.running = false; };

  Terrain.prototype._frame = function (now) {
    if (!this.running) return;
    var dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    if (this.visible) {
      this.t += dt;
      var p = this.pointer;
      p.x += (p.tx - p.x) * Math.min(1, dt * 3);
      p.y += (p.ty - p.y) * Math.min(1, dt * 3);
      this.render();
    }
    requestAnimationFrame(this._frame);
  };

  /* Surface height: a bivariate normal peak that leans toward the pointer, plus slow ripples */
  Terrain.prototype.height = function (x, z) {
    var t = this.t, p = this.pointer;
    var mx = p.x * 0.28, mz = -p.y * 0.18;
    var dx = x - mx, dz = z - mz;
    var g = Math.exp(-(dx * dx / 0.30 + dz * dz / 0.22));
    var ripple = 0.045 * Math.sin(x * 3.1 + t * 0.9) * Math.cos(z * 2.6 - t * 0.7)
               + 0.025 * Math.sin((x + z) * 4.2 - t * 1.3);
    return (0.62 * g + ripple * (0.35 + g)) * this.intro;
  };

  Terrain.prototype.project = function (x, y, z, out) {
    var p = this.pointer;
    var yaw = p.x * 0.16 + Math.sin(this.t * 0.12) * 0.05;
    var pitch = 0.52 + p.y * 0.05 + this.scroll * 0.25;
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var xr = x * cy - z * sy;
    var zr = x * sy + z * cy;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var yc = y * cp + zr * sp;
    var zc = 3.1 + zr * cp - y * sp;
    var s = this.focal / zc;
    var L = this.layout;
    out.x = this.w * L.peakX + xr * s * L.scale;
    out.y = this.h * L.peakY - yc * s * L.scale;
    out.z = zc;
    return out;
  };

  Terrain.prototype.render = function () {
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);

    var cols = this.cols, rows = this.rows;
    var pt = { x: 0, y: 0, z: 0 };
    var BUCKETS = 7, DEPTHS = 3;
    var buckets = [];
    for (var b = 0; b < BUCKETS * DEPTHS; b++) buckets.push([]);

    var spanX = 1.75, zNear = -1.0, zFar = 1.45;
    for (var j = 0; j < rows; j++) {
      var v = j / (rows - 1);
      var z = zFar + (zNear - zFar) * v;
      for (var i = 0; i < cols; i++) {
        var u = i / (cols - 1);
        var x = -spanX + 2 * spanX * u;
        var y = this.height(x, z);
        this.project(x, y, z, pt);
        if (pt.x < -10 || pt.x > w + 10 || pt.y < -10 || pt.y > h + 10) continue;
        /* Fade out toward the grid edges so the surface has no hard border */
        var edge = Math.min(u, 1 - u, v * 1.4, 1 - v) * 4;
        if (edge <= 0) continue;
        edge = Math.min(1, edge);
        var hb = Math.min(BUCKETS - 1, Math.floor((y / 0.62) * BUCKETS * 0.999 + 0.0001));
        var db = Math.min(DEPTHS - 1, Math.max(0, Math.floor((pt.z - 2.2) / 0.75)));
        buckets[Math.max(0, hb) * DEPTHS + db].push(pt.x, pt.y, (2.4 / pt.z) * 1.9 * edge);
      }
    }

    /* Draw buckets: far and low first */
    for (var d = DEPTHS - 1; d >= 0; d--) {
      for (var hb2 = 0; hb2 < BUCKETS; hb2++) {
        var arr = buckets[hb2 * DEPTHS + d];
        if (!arr.length) continue;
        var c = lerpColour(hb2 / (BUCKETS - 1));
        var alpha = (0.42 + 0.55 * (hb2 / (BUCKETS - 1))) * (1 - d * 0.2);
        ctx.fillStyle = 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        for (var k = 0; k < arr.length; k += 3) {
          var r = arr[k + 2];
          ctx.rect(arr[k] - r / 2, arr[k + 1] - r / 2, r, r);
        }
        ctx.fill();
      }
    }

    this.renderContours(pt);
    this.renderWireframes();
    this.renderDust();

    /* Soft fade at the top and bottom edges (cheaper than a CSS mask) */
    if (!this._fade || this._fadeH !== h) {
      this._fade = ctx.createLinearGradient(0, 0, 0, h);
      this._fade.addColorStop(0, 'rgba(0,0,0,0)');
      this._fade.addColorStop(0.12, 'rgba(0,0,0,1)');
      this._fade.addColorStop(0.86, 'rgba(0,0,0,1)');
      this._fade.addColorStop(1, 'rgba(0,0,0,0)');
      this._fadeH = h;
    }
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = this._fade;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  };

  /* Confidence ellipses on the base plane (1σ, 2σ, 3σ) */
  Terrain.prototype.renderContours = function (pt) {
    var ctx = this.ctx, p = this.pointer;
    var cx = p.x * 0.28, cz = -p.y * 0.18;
    var sx = Math.sqrt(0.30 / 2), sz = Math.sqrt(0.22 / 2);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (var k = 1; k <= 3; k++) {
      ctx.strokeStyle = 'rgba(165,166,255,' + (0.26 - k * 0.055) * this.intro + ')';
      ctx.beginPath();
      for (var a = 0; a <= 72; a++) {
        var th = (a / 72) * TAU;
        this.project(cx + Math.cos(th) * sx * k, 0, cz + Math.sin(th) * sz * k, pt);
        if (a === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  /* Floating wireframe icosahedra, anchored to open screen space (desktop only) */
  Terrain.prototype.renderWireframes = function () {
    if (this.w < 1024) return;
    var ctx = this.ctx, t = this.t, w = this.w, h = this.h, p = this.pointer;
    var shapes = [
      { ax: 0.505, ay: 0.175, r: Math.min(64, w * 0.042), sp: 0.22, ph: 0 },
      { ax: 0.955, ay: 0.885, r: Math.min(40, w * 0.027), sp: -0.3, ph: 2 }
    ];
    var pts = [];
    for (var n = 0; n < shapes.length; n++) {
      var S = shapes[n];
      var ay = t * S.sp + S.ph, ax = t * S.sp * 0.6 + 0.4;
      var cay = Math.cos(ay), say = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);
      var cx = w * S.ax + p.x * 14, cy = h * S.ay + p.y * 10 + Math.sin(t * 0.8 + S.ph) * 6;
      pts.length = 0;
      for (var i = 0; i < ICO.v.length; i++) {
        var q = ICO.v[i];
        var x1 = q[0] * cay - q[2] * say, z1 = q[0] * say + q[2] * cay;
        var y1 = q[1] * cax - z1 * sax, z2 = q[1] * sax + z1 * cax;
        var k = 3 / (3 + z2);
        pts.push(cx + x1 * S.r * k, cy + y1 * S.r * k);
      }
      ctx.strokeStyle = 'rgba(125,211,252,' + 0.38 * this.intro + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var e = 0; e < ICO.e.length; e++) {
        var a = ICO.e[e][0] * 2, b = ICO.e[e][1] * 2;
        ctx.moveTo(pts[a], pts[a + 1]);
        ctx.lineTo(pts[b], pts[b + 1]);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(94,234,212,' + 0.75 * this.intro + ')';
      ctx.beginPath();
      for (var v2 = 0; v2 < pts.length; v2 += 2) ctx.rect(pts[v2] - 1.3, pts[v2 + 1] - 1.3, 2.6, 2.6);
      ctx.fill();
    }
  };

  Terrain.prototype.renderDust = function () {
    var ctx = this.ctx, t = this.t, w = this.w, h = this.h;
    ctx.fillStyle = 'rgba(200,230,255,' + 0.5 * this.intro + ')';
    ctx.beginPath();
    for (var i = 0; i < this.dust.length; i++) {
      var d = this.dust[i];
      var y = ((d.y - t * d.s * 0.04) % 1 + 1) % 1;
      var x = d.x + Math.sin(t * 0.3 + d.p) * 0.01;
      var a = Math.sin(t * 0.8 + d.p) * 0.5 + 0.5;
      var r = d.r * (0.6 + a * 0.6);
      ctx.rect(x * w - r / 2, y * h - r / 2, r, r);
    }
    ctx.fill();
  };

  window.Terrain = Terrain;
})();
