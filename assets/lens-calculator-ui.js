/* =============================================================
 * Optivix — lens calculator UI (<lens-calculator> custom element).
 *
 * GUIDED, TOP-DOWN FLOW. A DUMB RENDERER over the pricing engine —
 * all pricing/validation/resolution comes from window.createLensEngine
 * (lens-calculator-engine.js). This file only: enumerates the next
 * question from the pricing DATA given the upstream answers, paints the
 * chosen step, and on the prescription step calls computeResult(input)
 * and paints the returned result/errors. It contains NO pricing, tier,
 * routing or range logic — every such rule lives in the engine.
 *
 * Flow: Tip → Utilizare → Tratament → Indice → (Tip fotocromatic) → Rețeta.
 * One question at a time; answered steps collapse to tappable chips above.
 * Options are enumerated from lens-pricing-data.json given ONLY the upstream
 * choices (downstream = wildcard); branches with zero priced rows are OMITTED,
 * never greyed — this is the fix for the old directional-availability bug
 * (a preset downstream index could grey out a valid upstream type).
 *
 * Usage → engine `light` (UI-only translation; engine input shape UNCHANGED):
 *   Clar→'clear' · Soare→'sun' · Fotocromatic→ foto/transitions per the data
 *   at the chosen path+index (sub-choice only when BOTH exist, e.g. mono 1.67).
 *   Engine input stays {type, coating, light, index, od:{sph,cyl,ax}, os:{…}, add?}.
 *
 * The parametric SVG preview (geometryFrom + paint) is preserved from the
 * earlier step and relocated into the result panel.
 * ============================================================= */
(function () {
  'use strict';

  if (window.customElements && customElements.get('lens-calculator')) return;

  var INDEX_ORDER = ['1.5', '1.56', '1.6', '1.67'];

  /* ---- lens geometry (pure; no DOM, never throws on numbers) ----------
   * Side cross-section of a single lens in a 120×200 viewBox. The lens is
   * drawn vertical (diameter on Y, thickness on X) and symmetric about the
   * centre axis. Two quadratic surfaces meet flat top/bottom edges; the
   * control point of each surface is derived so the curve passes exactly
   * through the centre thickness.
   *   maxPower = max over OD/OS of (|SPH| + |CYL|/2)
   *   bulge    ∝ maxPower / index, clamped
   *   SPH < 0  → concave (thin centre, thick edges)
   *   SPH > 0  → convex  (thick centre, thin edges)
   *   SPH = 0  → near-flat
   *   bifocal  → a D-segment line across the lower third
   */
  var GEO = {
    cx: 60, cy: 100, topY: 20, botY: 180, halfH: 80,
    t0: 16,           // base (flat) thickness in px — a thin lens, not a sliver
    k: 3.4,           // power → bulge scale
    bMin: 0, bMax: 39, // bulge clamp (max thickness t0+bMax=55 stays inside the 120 box)
    segY: 145         // D-segment y, lower third
  };

  function geoNum(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
  function geoClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function geoRound(n) { return Math.round(n * 10) / 10; }

  function thicknessAt(y, tc, te) {
    var r = (y - GEO.cy) / GEO.halfH;
    return tc + (te - tc) * r * r;
  }

  function lensPath(tc, te) {
    var cx = GEO.cx, top = GEO.topY, bot = GEO.botY, cy = GEO.cy;
    var leftEdge = cx - te / 2;          // x at top/bottom, left surface
    var rightEdge = cx + te / 2;
    var leftCtrl = cx - tc + te / 2;     // makes the curve pass cx - tc/2 at centre
    var rightCtrl = cx + tc - te / 2;
    return 'M ' + geoRound(leftEdge) + ' ' + top +
      ' Q ' + geoRound(leftCtrl) + ' ' + cy + ' ' + geoRound(leftEdge) + ' ' + bot +
      ' L ' + geoRound(rightEdge) + ' ' + bot +
      ' Q ' + geoRound(rightCtrl) + ' ' + cy + ' ' + geoRound(rightEdge) + ' ' + top +
      ' Z';
  }

  function geometryFrom(state) {
    var od = state && state.od ? state.od : {};
    var os = state && state.os ? state.os : {};
    var odSph = geoNum(od.sph), odCyl = geoNum(od.cyl);
    var osSph = geoNum(os.sph), osCyl = geoNum(os.cyl);
    var indexNum = parseFloat(state && state.index) || 1.5;

    var odPower = Math.abs(odSph) + Math.abs(odCyl) / 2;
    var osPower = Math.abs(osSph) + Math.abs(osCyl) / 2;
    var maxPower = Math.max(odPower, osPower);

    // Sign comes from the eye with the larger |SPH| — drives concave vs convex.
    var signSph = Math.abs(osSph) > Math.abs(odSph) ? osSph : odSph;
    var bulge = geoClamp(GEO.k * maxPower / indexNum, GEO.bMin, GEO.bMax);

    var tc, te;
    if (signSph < -0.001) { tc = GEO.t0; te = GEO.t0 + bulge; }        // concave
    else if (signSph > 0.001) { tc = GEO.t0 + bulge; te = GEO.t0; }    // convex
    else { tc = GEO.t0; te = GEO.t0; }                                 // flat

    var seg = null;
    if (state && state.type === 'bifocal') {
      var halfT = thicknessAt(GEO.segY, tc, te) / 2;
      var inset = 1.5;
      seg = {
        x1: geoRound(GEO.cx - halfT + inset), y1: GEO.segY,
        x2: geoRound(GEO.cx + halfT - inset), y2: GEO.segY
      };
    }
    return { bodyPath: lensPath(tc, te), seg: seg };
  }

  // Romanian price format: 1.234,00 (dot thousands, comma decimal).
  var PRICE_FMT = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Stepper clamp/step config per field. Ranges are intentionally wider
  // than any single lens row so the engine's per-row range errors stay
  // reachable; CYL caps at the engine's absolute ±6 scope (R1).
  var FIELD = {
    sph:  { min: -20, max: 20,  step: 0.25, dp: 2 },
    cyl:  { min: -6,  max: 6,   step: 0.25, dp: 2 },
    axis: { min: 0,   max: 180, step: 1,    dp: 0 },
    add:  { min: 0,   max: 4,   step: 0.25, dp: 2 }
  };
  // Default value shown when a fresh prescription step is revealed.
  var FIELD_DEFAULT = { sph: 0, cyl: 0, axis: 0, add: 2 };

  function parseNum(str) {
    return parseFloat(String(str).replace(',', '.'));
  }
  function clampSnap(v, cfg) {
    if (!isFinite(v)) v = 0;
    var snapped = Math.round(v / cfg.step) * cfg.step;
    snapped = Math.max(cfg.min, Math.min(cfg.max, snapped));
    // round away float dust from the snap division
    return Math.round(snapped * 100) / 100;
  }
  function fmtField(v, cfg) {
    return cfg.dp ? v.toFixed(cfg.dp) : String(Math.round(v));
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uniq(a) {
    var seen = {}, out = [];
    a.forEach(function (v) { if (!seen[v]) { seen[v] = true; out.push(v); } });
    return out;
  }
  // usage → the set of engine `light` values it covers
  function lightsFor(use) { return use === 'foto' ? ['foto', 'transitions'] : [use]; }

  class LensCalculator extends HTMLElement {
    connectedCallback() {
      this.i18n = this._readI18n();
      this.g = this.i18n.guided || {};
      this.chipsEl = this.querySelector('[data-lens-chips]');
      this.stepsEl = this.querySelector('[data-lens-steps]');
      this.resetEl = this.querySelector('[data-lens-reset]');
      this.resultPanel = this.querySelector('[data-result-panel]');
      this.resultEl = this.querySelector('[data-result]');
      this.errorsEl = this.querySelector('[data-errors]');

      this.engine = null;
      this.rows = [];
      this.selectable = [];
      this.ready = false;
      this.S = {};                       // {type, use, coat, idx, foto_kind}
      this.vocab = { type: {}, coating: {}, light: {}, index: {} };

      if (this.resetEl) {
        this.resetEl.textContent = this.g.reset || 'Reset';
        var self = this;
        this.resetEl.addEventListener('click', function () { self.S = {}; self.render(true); });
      }

      this._initPreview();
      this._showLoading();
      this._loadData();
    }

    _readI18n() {
      var el = this.querySelector('[data-lens-i18n]');
      if (!el) return {};
      try { return JSON.parse(el.textContent) || {}; } catch (e) { return {}; }
    }

    // ---- data (single fetch, fail quietly + visibly) ----
    _loadData() {
      var url = this.dataset.pricingUrl;
      var self = this;
      if (!url) { this._showUnavailable(); return; }
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          if (typeof window.createLensEngine !== 'function') {
            throw new Error('lens engine not loaded');
          }
          self.engine = window.createLensEngine(data);
          self.rows = (data && data.rows) ? data.rows : [];
          // Only priced rows are offerable (excludes the TBD null-price row).
          self.selectable = self.rows.filter(function (r) { return r.price_ron != null; });
          self.vocab = self._buildVocab(data);
          self.ready = true;
          self.render(false);
        })
        .catch(function () { self._showUnavailable(); });
    }

    // ===== catalogue enumeration over the priced rows (upstream-only filter) =====
    _pathRows(f) {
      return this.selectable.filter(function (r) {
        if (f.type && r.type !== f.type) return false;
        if (f.use && lightsFor(f.use).indexOf(r.light) === -1) return false;
        if (f.coat && r.coating !== f.coat) return false;
        if (f.idx && r.index !== f.idx) return false;
        return true;
      });
    }
    _typesFor() {
      var present = uniq(this.selectable.map(function (r) { return r.type; }));
      return ['monofocal', 'bifocal'].filter(function (t) { return present.indexOf(t) !== -1; });
    }
    _usagesFor(type) {
      var self = this;
      return ['clear', 'foto', 'sun'].filter(function (u) {
        return self._pathRows({ type: type, use: u }).length > 0;
      });
    }
    _coatsFor(f) { return uniq(this._pathRows(f).map(function (r) { return r.coating; })); }
    _idxsFor(f) {
      return uniq(this._pathRows(f).map(function (r) { return r.index; }))
        .sort(function (a, b) { return INDEX_ORDER.indexOf(a) - INDEX_ORDER.indexOf(b); });
    }
    // lights present (subset of foto/transitions) at a fully-chosen foto path+index
    _fotoKindsAt() {
      var rs = this._pathRows({ type: this.S.type, use: 'foto', coat: this.S.coat, idx: this.S.idx });
      return uniq(rs.map(function (r) { return r.light; }));
    }

    // resolved coating/light for the engine input (UI-only translation)
    _engineCoating() { return this.S.use === 'sun' ? 'hmc' : this.S.coat; }
    _engineLight() {
      if (this.S.use === 'clear') return 'clear';
      if (this.S.use === 'sun') return 'sun';
      var kinds = this._fotoKindsAt();
      if (kinds.length === 2) return this.S.foto_kind === 'transitions' ? 'transitions' : 'foto';
      return kinds[0] || 'foto';
    }

    _idxLabel(i) { return i === '1.56' ? (this.g.idx_standard_label || i) : i; }

    // ===== top-level render: chips + the single active step (or rx + result) =====
    render(focus) {
      if (!this.ready) return;
      this.chipsEl.innerHTML = '';
      this.stepsEl.innerHTML = '';
      var S = this.S;
      if (this.resetEl) this.resetEl.hidden = !S.type;

      this._renderChips();

      if (!S.type) { this._renderStep('type'); this._afterStep(focus); return; }
      if (!S.use) { this._renderStep('use'); this._afterStep(focus); return; }
      if (S.use !== 'sun' && !S.coat) { this._renderStep('coat'); this._afterStep(focus); return; }
      if (!S.idx) { this._renderStep('idx'); this._afterStep(focus); return; }
      if (S.use === 'foto' && this._fotoKindsAt().length === 2 && !S.foto_kind) {
        this._renderStep('foto_kind'); this._afterStep(focus); return;
      }
      // All choices made → prescription + live result.
      this._renderRx();
      this._recompute();
      if (focus) this._focusFirst();
    }

    _afterStep(focus) {
      // A step that isn't the prescription step has no price yet.
      this._clearResult();
      if (focus) this._focusFirst();
    }

    _focusFirst() {
      var el = this.stepsEl.querySelector('.lens-calc__opt, .lens-stepper__input');
      if (el && typeof el.focus === 'function') el.focus();
    }

    // ---- chips for answered upstream steps ----
    _renderChips() {
      var S = this.S, g = this.g, self = this;
      var defs = [];
      if (S.type) defs.push(['type', g.chip.type, this.i18n.type[S.type]]);
      if (S.use) defs.push(['use', g.chip.use, this.i18n.light[S.use]]);
      if (S.coat && S.use !== 'sun') defs.push(['coat', g.chip.coat, this.i18n.coating[S.coat]]);
      if (S.idx) defs.push(['idx', g.chip.idx, this._idxLabel(S.idx)]);
      if (S.foto_kind) defs.push(['foto_kind', g.chip.foto_kind, g.foto_kind_value[S.foto_kind]]);

      defs.forEach(function (d) {
        var field = d[0], lab = d[1], val = d[2];
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'lens-calc__chip';
        c.setAttribute('aria-label', lab + ': ' + val + ' — ' + (g.edit || 'edit'));
        c.innerHTML =
          '<span class="lens-calc__chip-lab">' + escapeHtml(lab) + '</span>' +
          '<span class="lens-calc__chip-val">' + escapeHtml(val) + '</span>' +
          '<span class="lens-calc__chip-edit">' + escapeHtml(g.edit || 'edit') + '</span>';
        c.addEventListener('click', function () { self._editTo(field); });
        self.chipsEl.appendChild(c);
      });
    }

    // ---- one guided step (option cards) ----
    _stepSection(kind) {
      var st = (this.g.step && this.g.step[kind]) || {};
      var sec = document.createElement('section');
      sec.className = 'lens-calc__step';
      sec.setAttribute('role', 'group');
      sec.setAttribute('aria-label', st.label || kind);
      var lab = document.createElement('div');
      lab.className = 'lens-calc__step-label';
      var html = '<span class="lens-calc__step-num">' + escapeHtml(st.num || '') + '</span>' +
        '<span>' + escapeHtml(st.label || '') + '</span>';
      if (st.hint) html += '<span class="lens-calc__step-hint">' + escapeHtml(st.hint) + '</span>';
      lab.innerHTML = html;
      sec.appendChild(lab);
      return sec;
    }

    _optionCard(title, caption, pressed) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lens-calc__opt';
      b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      b.innerHTML = '<span class="lens-calc__opt-t">' + escapeHtml(title) + '</span>' +
        (caption ? '<span class="lens-calc__opt-c">' + escapeHtml(caption) + '</span>' : '');
      return b;
    }

    _renderStep(kind) {
      var self = this, S = this.S, g = this.g, i18n = this.i18n;
      var sec = this._stepSection(kind);
      var opts = document.createElement('div');
      opts.className = 'lens-calc__opts' + (kind === 'idx' ? ' lens-calc__opts--tight' : '');

      var defs = [];
      if (kind === 'type') {
        this._typesFor().forEach(function (v) {
          defs.push({ v: v, t: i18n.type[v], c: g.type_caption[v], on: function () {
            S.type = v; S.use = S.coat = S.idx = S.foto_kind = null; self.render(true);
          } });
        });
      } else if (kind === 'use') {
        this._usagesFor(S.type).forEach(function (u) {
          defs.push({ v: u, t: i18n.light[u], c: g.use_caption[u], on: function () {
            S.use = u; S.coat = (u === 'sun' ? 'hmc' : null); S.idx = null; S.foto_kind = null; self.render(true);
          } });
        });
      } else if (kind === 'coat') {
        this._coatsFor({ type: S.type, use: S.use }).forEach(function (co) {
          defs.push({ v: co, t: i18n.coating[co], c: g.coat_caption[co], on: function () {
            S.coat = co; S.idx = null; S.foto_kind = null; self.render(true);
          } });
        });
      } else if (kind === 'idx') {
        this._idxsFor({ type: S.type, use: S.use, coat: this._engineCoating() }).forEach(function (i) {
          defs.push({ v: i, t: self._idxLabel(i), c: g.idx_caption[i], on: function () {
            S.idx = i; S.foto_kind = null; self.render(true);
          } });
        });
      } else if (kind === 'foto_kind') {
        ['foto', 'transitions'].forEach(function (v) {
          var fk = g.foto_kind[v] || {};
          defs.push({ v: v, t: fk.label, c: fk.caption, on: function () {
            S.foto_kind = v; self.render(true);
          } });
        });
      }

      defs.forEach(function (d) {
        var pressed = (kind === 'type' && S.type === d.v) || (kind === 'use' && S.use === d.v) ||
          (kind === 'coat' && S.coat === d.v) || (kind === 'idx' && S.idx === d.v) ||
          (kind === 'foto_kind' && S.foto_kind === d.v);
        var card = self._optionCard(d.t, d.c, pressed);
        card.addEventListener('click', d.on);
        opts.appendChild(card);
      });

      sec.appendChild(opts);
      this.stepsEl.appendChild(sec);
    }

    // ---- editing a chip: jump back, clear that step + everything downstream ----
    _editTo(field) {
      var chain = ['type', 'use', 'coat', 'idx', 'foto_kind'];
      var i = chain.indexOf(field);
      var self = this;
      chain.slice(i).forEach(function (k) { self.S[k] = null; });
      // Re-derive the implicit sun coating if Utilizare is being kept upstream.
      if (this.S.use === 'sun') this.S.coat = 'hmc';
      this.render(true);
    }

    // ---- prescription step (reuses existing stepper markup + field ids) ----
    _renderRx() {
      var self = this, S = this.S, i18n = this.i18n;
      var sec = this._stepSection('rx');
      var wrap = document.createElement('div');
      wrap.className = 'lens-rx';

      ['od', 'os'].forEach(function (eye) {
        var fs = document.createElement('fieldset');
        fs.className = 'lens-rx__eye';
        var legend = document.createElement('legend');
        legend.className = 'lens-rx__legend';
        legend.textContent = i18n.eye[eye];
        fs.appendChild(legend);
        var fields = document.createElement('div');
        fields.className = 'lens-rx__fields';
        [['sph', 'sph'], ['cyl', 'cyl'], ['axis', 'axis']].forEach(function (pair) {
          fields.appendChild(self._stepper(eye + '-' + pair[1], pair[0], i18n.field[pair[0]], eye.toUpperCase()));
        });
        fs.appendChild(fields);
        wrap.appendChild(fs);
      });

      if (S.type === 'bifocal') {
        var addFs = document.createElement('fieldset');
        addFs.className = 'lens-rx__add';
        var addLegend = document.createElement('legend');
        addLegend.className = 'lens-rx__legend';
        addLegend.textContent = this.g.add_legend || i18n.field.add;
        addFs.appendChild(addLegend);
        var addFields = document.createElement('div');
        addFields.className = 'lens-rx__fields';
        addFields.appendChild(this._stepper('add-add', 'add', i18n.field.add, ''));
        addFs.appendChild(addFields);
        wrap.appendChild(addFs);
      }

      sec.appendChild(wrap);
      this.stepsEl.appendChild(sec);
      this._bindRx();
    }

    _stepper(id, fieldKey, label, eyeShort) {
      var cfg = FIELD[fieldKey];
      var def = fmtField(clampSnap(FIELD_DEFAULT[fieldKey], cfg), cfg);
      var fshort = (this.i18n.field_short && this.i18n.field_short[fieldKey]) || label;
      var st = this.i18n.stepper || {};
      var dec = (st.decrease || '−') + ' ' + fshort + (eyeShort ? ' ' + eyeShort : '');
      var inc = (st.increase || '+') + ' ' + fshort + (eyeShort ? ' ' + eyeShort : '');
      var aria = (eyeShort ? eyeShort + ' ' : '') + fshort;

      var d = document.createElement('div');
      d.className = 'lens-stepper';
      d.innerHTML =
        '<label class="lens-stepper__label" for="' + id + '">' + escapeHtml(label) + '</label>' +
        '<div class="lens-stepper__controls">' +
        '<button type="button" class="lens-stepper__btn" data-step="-' + cfg.step + '" data-target="' + id + '" aria-label="' + escapeHtml(dec) + '">−</button>' +
        '<input id="' + id + '" class="lens-stepper__input" type="text" inputmode="decimal" autocomplete="off" data-field="' + fieldKey + '" value="' + def + '" aria-label="' + escapeHtml(aria) + '">' +
        '<button type="button" class="lens-stepper__btn" data-step="' + cfg.step + '" data-target="' + id + '" aria-label="' + escapeHtml(inc) + '">+</button>' +
        '</div>';
      return d;
    }

    _bindRx() {
      var self = this;
      this.stepsEl.querySelectorAll('.lens-stepper__btn[data-target]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self._nudge(btn.getAttribute('data-target'), parseFloat(btn.getAttribute('data-step')));
        });
      });
      this.stepsEl.querySelectorAll('input[data-field]').forEach(function (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            var cfg = FIELD[input.getAttribute('data-field')];
            self._nudge(input.id, e.key === 'ArrowUp' ? cfg.step : -cfg.step);
          }
        });
        input.addEventListener('change', function () { self._commit(input); self._recompute(); });
      });
    }

    _nudge(id, delta) {
      var input = this.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
      if (!input) return;
      var cfg = FIELD[input.getAttribute('data-field')];
      input.value = fmtField(clampSnap(parseNum(input.value) + delta, cfg), cfg);
      this._recompute();
    }
    _commit(input) {
      var cfg = FIELD[input.getAttribute('data-field')];
      input.value = fmtField(clampSnap(parseNum(input.value), cfg), cfg);
    }

    // ---- engine input + compute (no pricing logic here) ----
    _field(id) {
      var el = this.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
      return el ? parseNum(el.value) : NaN;
    }
    _buildInput() {
      var input = {
        type: this.S.type,
        coating: this._engineCoating(),
        light: this._engineLight(),
        index: this.S.idx,
        od: { sph: this._field('od-sph'), cyl: this._field('od-cyl'), ax: this._field('od-axis') },
        os: { sph: this._field('os-sph'), cyl: this._field('os-cyl'), ax: this._field('os-axis') }
      };
      if (this.S.type === 'bifocal') input.add = this._field('add-add');
      return input;
    }

    _recompute() {
      if (!this.ready || !this.engine) return;
      var input = this._buildInput();
      var res = this.engine.computeResult(input);
      this.resultPanel.hidden = false;
      if (res.errors && res.errors.length) this._renderErrors(res.errors);
      else this._renderResult(res, input);
      this._renderPreview(input, res);
    }

    // ---- rendering: result ----
    _renderResult(res, input) {
      var t = this.i18n, g = this.g;
      var row = this._rowById(res.rowId);
      this.errorsEl.hidden = true;
      this.errorsEl.innerHTML = '';
      if (this.figure) this.figure.hidden = false;

      var html = ['<p class="lens-calc__price">'];
      html.push('<span class="lens-calc__amount">' + escapeHtml(PRICE_FMT.format(res.priceRon)) + '</span>');
      html.push('<span class="lens-calc__cur">lei</span>');
      if (res.tbd) {
        html.push('<span class="lens-calc__provisional">' + escapeHtml(t.price_provisional) + '</span>');
      }
      html.push('</p>');

      var avail = t.availability && t.availability[res.availability];
      if (avail) {
        html.push('<p class="lens-calc__avail"><span class="lens-calc__dot lens-calc__dot--' +
          escapeHtml(res.availability) + '"></span>' + escapeHtml(avail) + '</p>');
      }
      html.push('<p class="lens-calc__tva">' + escapeHtml((g.result && g.result.tva) || '') + '</p>');

      if (row) html.push('<p class="lens-calc__prod">' + escapeHtml(this._productLine(row)) + '</p>');

      if (res.routedFrom && g.note) {
        html.push(this._noteHtml(g.note.routing_title, g.note.routing_body, false));
      }
      if (res.nudge === 'recommend_thinning' && g.note) {
        html.push(this._noteHtml(g.note.thinning_title, (t.nudge && t.nudge.recommend_thinning) || '', false));
      }
      this.resultEl.innerHTML = html.join('');
    }

    _renderErrors(errors) {
      var g = this.g;
      this.resultEl.innerHTML = '';
      if (this.figure) this.figure.hidden = true;
      var html = ['<div class="lens-calc__note lens-calc__note--warn">'];
      html.push('<span class="lens-calc__note-h">' +
        escapeHtml((g.note && g.note.error_title) || this.i18n.errors_intro || '') + '</span>');
      html.push('<ul class="lens-calc__error-list">');
      for (var i = 0; i < errors.length; i++) {
        html.push('<li>' + escapeHtml(errors[i].messageRo) + '</li>');
      }
      html.push('</ul></div>');
      this.errorsEl.innerHTML = html.join('');
      this.errorsEl.hidden = false;
    }

    _noteHtml(title, body, warn) {
      return '<div class="lens-calc__note' + (warn ? ' lens-calc__note--warn' : '') + '">' +
        '<span class="lens-calc__note-h">' + escapeHtml(title) + '</span>' +
        escapeHtml(body) + '</div>';
    }

    _productLine(row) {
      var g = this.g, res = (g.result || {});
      var tmpl = res.product_tmpl || '{type} {light} {coat} {index}';
      var typeNoun = (res.type_noun && res.type_noun[row.type]) || row.type;
      var lightNoun = (res.light_noun && res.light_noun[row.light]) || row.light;
      var coat = (this.i18n.coating && this.i18n.coating[row.coating]) || row.coating;
      var line = tmpl
        .replace('{type}', typeNoun)
        .replace('{light}', lightNoun)
        .replace('{coat}', coat)
        .replace('{index}', row.index);
      return line + ' (' + row.id + ')';
    }

    _rowById(id) {
      for (var i = 0; i < this.rows.length; i++) if (this.rows[i].id === id) return this.rows[i];
      return null;
    }

    // ---- shared UI states ----
    _showLoading() {
      if (this.resultPanel) this.resultPanel.hidden = true;
      this.stepsEl.innerHTML =
        '<p class="lens-calc__loading">' + escapeHtml(this.i18n.loading) + '</p>';
    }
    _showUnavailable() {
      this.ready = false;
      this.chipsEl.innerHTML = '';
      if (this.resetEl) this.resetEl.hidden = true;
      if (this.resultPanel) this.resultPanel.hidden = true;
      this.stepsEl.innerHTML =
        '<p class="lens-calc__alert">' + escapeHtml(this.i18n.unavailable) + '</p>';
    }
    _clearResult() {
      if (this.resultPanel) this.resultPanel.hidden = true;
      this.resultEl.innerHTML = '';
      this.errorsEl.innerHTML = '';
      this.errorsEl.hidden = true;
    }

    // ---- preview (decorative SVG; never breaks the calculator) ----
    _buildVocab(data) {
      var v = { type: {}, coating: {}, light: {}, index: {} };
      (data && data.rows ? data.rows : []).forEach(function (r) {
        if (r.type) v.type[r.type] = true;
        if (r.coating) v.coating[r.coating] = true;
        if (r.light) v.light[r.light] = true;
        if (r.index) v.index[r.index] = true;
      });
      return v;
    }

    _initPreview() {
      this.figure = this.querySelector('[data-lens-preview]');
      this.svg = this.figure ? this.figure.querySelector('[data-lens-svg]') : null;
      this.shapeEls = this.svg ? this.svg.querySelectorAll('[data-lens-shape]') : null;
      this.segEl = this.svg ? this.svg.querySelector('[data-lens-seg]') : null;
      this.frontSegEl = this.figure ? this.figure.querySelector('[data-lens-front-seg]') : null;
      this.previewBroken = false;
    }

    _renderPreview(input, res) {
      if (!this.figure || !this.svg || !this.shapeEls || this.previewBroken) return;
      try {
        // Invalid Rx / null result → neutral default lens (flat), not an error state.
        var valid = res && (!res.errors || res.errors.length === 0);
        var state = valid ? input : {
          type: 'monofocal',
          index: input && input.index,
          od: { sph: 0, cyl: 0 },
          os: { sph: 0, cyl: 0 }
        };
        var geo = geometryFrom(state);

        for (var i = 0; i < this.shapeEls.length; i++) {
          this.shapeEls[i].setAttribute('d', geo.bodyPath);
        }
        if (this.segEl) {
          if (geo.seg) {
            this.segEl.setAttribute('x1', geo.seg.x1);
            this.segEl.setAttribute('y1', geo.seg.y1);
            this.segEl.setAttribute('x2', geo.seg.x2);
            this.segEl.setAttribute('y2', geo.seg.y2);
            this.segEl.removeAttribute('hidden');
          } else {
            this.segEl.setAttribute('hidden', '');
          }
        }
        if (this.frontSegEl) {
          if (geo.seg) this.frontSegEl.removeAttribute('hidden');
          else this.frontSegEl.setAttribute('hidden', '');
        }

        var light = input && this.vocab.light[input.light] ? input.light : 'clear';
        var coating = input && this.vocab.coating[input.coating] ? input.coating : '';
        this.figure.setAttribute('data-light', light);
        this.figure.setAttribute('data-coating', coating);
      } catch (e) {
        this.previewBroken = true;
        this.figure.setAttribute('hidden', '');
        if (window.console && console.warn) console.warn('[lens-preview] disabled:', e);
      }
    }
  }

  customElements.define('lens-calculator', LensCalculator);
})();
