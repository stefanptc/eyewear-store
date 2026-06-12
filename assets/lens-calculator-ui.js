/* =============================================================
 * Optivix — lens calculator UI (<lens-calculator> custom element).
 *
 * A DUMB RENDERER over the pricing engine. All pricing/validation
 * decisions come from window.createLensEngine (lens-calculator-engine.js).
 * This file only: reads the controls, calls computeResult(input), and
 * paints the returned result object. It contains NO pricing, tier,
 * routing or range logic — every such rule lives in the engine.
 *
 * Data: fetched once from data-pricing-url on connectedCallback (single
 * request, no waterfall, no retry). Until it resolves, compute is gated
 * and the result region shows a loading line. A fetch/engine failure
 * shows a quiet, visible "unavailable" alert and never a price.
 *
 * Step 4 scope: a decorative parametric SVG lens preview, plus per-option
 * availability — both driven from the SAME render path as the price (see
 * _recompute → _renderPreview / _updateAvailability). Availability is probed
 * via the engine's pure compute; the UI holds no pricing logic. No
 * add-to-cart yet.
 * ============================================================= */
(function () {
  'use strict';

  if (window.customElements && customElements.get('lens-calculator')) return;

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

  class LensCalculator extends HTMLElement {
    connectedCallback() {
      this.i18n = this._readI18n();
      this.form = this.querySelector('[data-lens-form]');
      this.resultEl = this.querySelector('[data-result]');
      this.errorsEl = this.querySelector('[data-errors]');
      this.addFieldset = this.querySelector('[data-add]');
      this.engine = null;
      this.ready = false;
      // Vocabulary is read from the pricing data once it loads (never hardcoded).
      this.vocab = { type: {}, coating: {}, light: {}, index: {} };

      this._showLoading();
      this._initPreview();
      this._bind();
      this._toggleAdd();
      // Paint a neutral default lens immediately (null result → flat lens),
      // so the figure isn't empty during the data fetch.
      this._renderPreview(this._buildInput(), null);
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
          self.vocab = self._buildVocab(data);
          self.ready = true;
          self._recompute();
        })
        .catch(function () { self._showUnavailable(); });
    }

    // ---- wiring ----
    _bind() {
      var self = this;
      this.form.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'type') self._toggleAdd();
        self._recompute();
      });

      this.querySelectorAll('[data-step]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self._nudge(btn.getAttribute('data-target'), parseFloat(btn.getAttribute('data-step')));
        });
      });

      this.querySelectorAll('input[data-field]').forEach(function (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            var cfg = FIELD[input.getAttribute('data-field')];
            self._nudge(input.id, e.key === 'ArrowUp' ? cfg.step : -cfg.step);
          }
        });
        input.addEventListener('change', function () {
          self._commit(input);
          self._recompute();
        });
      });
    }

    _nudge(id, delta) {
      var input = this.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
      if (!input) return;
      var cfg = FIELD[input.getAttribute('data-field')];
      var next = clampSnap(parseNum(input.value) + delta, cfg);
      input.value = fmtField(next, cfg);
      this._recompute();
    }

    _commit(input) {
      var cfg = FIELD[input.getAttribute('data-field')];
      input.value = fmtField(clampSnap(parseNum(input.value), cfg), cfg);
    }

    _toggleAdd() {
      var isBi = this._radio('type') === 'bifocal';
      if (!this.addFieldset) return;
      this.addFieldset.hidden = !isBi;
      this.addFieldset.querySelectorAll('input, button').forEach(function (el) {
        el.disabled = !isBi;
      });
    }

    // ---- input assembly (mirrors the engine's documented input shape) ----
    _radio(name) {
      var el = this.form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }
    _field(id) {
      var el = this.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
      return el ? parseNum(el.value) : NaN;
    }

    _buildInput() {
      var type = this._radio('type');
      var input = {
        type: type,
        coating: this._radio('coating'),
        light: this._radio('light'),
        index: this._radio('index'),
        od: { sph: this._field('od-sph'), cyl: this._field('od-cyl'), ax: this._field('od-axis') },
        os: { sph: this._field('os-sph'), cyl: this._field('os-cyl'), ax: this._field('os-axis') }
      };
      if (type === 'bifocal') input.add = this._field('add-add');
      return input;
    }

    _recompute() {
      if (!this.ready || !this.engine) return;
      var input = this._buildInput();
      var res = this.engine.computeResult(input);
      if (res.errors && res.errors.length) this._renderErrors(res.errors);
      else this._renderResult(res);
      // Single state source: the preview is painted from the same input/result.
      this._renderPreview(input, res);
      // …and every option button is probed against the same engine/state.
      this._updateAvailability(input, res);
    }

    // ---- option availability (probe the engine; no pricing logic here) ----
    // Per recompute this asks the engine ~12 times (one swap per option) over a
    // ~30-row table — cheap pure calls, so no memoization is warranted.
    _cloneInput(input) {
      var c = {
        type: input.type, coating: input.coating, light: input.light, index: input.index,
        od: { sph: input.od.sph, cyl: input.od.cyl, ax: input.od.ax },
        os: { sph: input.os.sph, cyl: input.os.cyl, ax: input.os.ax }
      };
      if (input.add != null) c.add = input.add;
      return c;
    }

    // A "valid offer" = the engine returns a row with no blocking errors.
    _probeValid(probe) {
      try {
        var r = this.engine.computeResult(probe);
        return !!r && (!r.errors || r.errors.length === 0) && r.rowId != null;
      } catch (e) {
        return true; // never disable on an unexpected engine throw
      }
    }

    _updateAvailability(input, res) {
      if (!this.form) return;
      var self = this;
      // The selected combo's validity is just the current result.
      var currentValid = !!res && (!res.errors || res.errors.length === 0) && res.rowId != null;
      this.form.querySelectorAll('[data-control]').forEach(function (group) {
        var name = group.getAttribute('data-control');
        var opts = group.querySelectorAll('input[name="' + name + '"]');
        var verdicts = [];
        var anyValid = currentValid;
        opts.forEach(function (opt) {
          // Never disable (or probe) the currently selected option.
          if (opt.checked) { verdicts.push({ opt: opt, selected: true, valid: true }); return; }
          var probe = self._cloneInput(input);
          probe[name] = opt.value;
          var ok = self._probeValid(probe);
          if (ok) anyValid = true;
          verdicts.push({ opt: opt, selected: false, valid: ok });
        });
        // If nothing in the group is valid (incl. the selection), disable none
        // and let the engine error surface instead.
        verdicts.forEach(function (v) {
          self._setOptionDisabled(v.opt, anyValid && !v.selected && !v.valid);
        });
      });
    }

    _setOptionDisabled(opt, disable) {
      var label = opt.closest('.lens-seg__option');
      var hint = label ? label.querySelector('[data-lens-hint]') : null;
      opt.disabled = disable;
      if (disable) {
        opt.setAttribute('aria-disabled', 'true');
        if (hint) hint.removeAttribute('hidden');
      } else {
        opt.removeAttribute('aria-disabled');
        if (hint) hint.setAttribute('hidden', '');
      }
    }

    // ---- rendering ----
    _showLoading() {
      this.errorsEl.hidden = true;
      this.errorsEl.innerHTML = '';
      this.resultEl.innerHTML =
        '<p class="lens-calc__loading">' + escapeHtml(this.i18n.loading) + '</p>';
    }

    _showUnavailable() {
      this.ready = false;
      this.resultEl.innerHTML = '';
      this.errorsEl.hidden = false;
      this.errorsEl.innerHTML =
        '<p class="lens-calc__alert">' + escapeHtml(this.i18n.unavailable) + '</p>';
    }

    _renderErrors(errors) {
      // An invalid Rx must never surface a (stale) price — clear it.
      this.resultEl.innerHTML = '';
      var html = ['<p class="lens-calc__errors-intro">' + escapeHtml(this.i18n.errors_intro) + '</p>'];
      html.push('<ul class="lens-calc__error-list">');
      for (var i = 0; i < errors.length; i++) {
        html.push('<li>' + escapeHtml(errors[i].messageRo) + '</li>');
      }
      html.push('</ul>');
      this.errorsEl.innerHTML = html.join('');
      this.errorsEl.hidden = false;
    }

    _renderResult(res) {
      this.errorsEl.hidden = true;
      this.errorsEl.innerHTML = '';
      var t = this.i18n;
      var html = ['<p class="lens-calc__price">'];
      html.push('<span class="lens-calc__amount">' + escapeHtml(PRICE_FMT.format(res.priceRon) + ' lei') + '</span>');
      if (res.tbd) {
        html.push('<span class="lens-calc__provisional">' + escapeHtml(t.price_provisional) + '</span>');
      }
      html.push('</p>');
      html.push('<p class="lens-calc__tva">' + escapeHtml(t.tva_included) + '</p>');

      var avail = t.availability && t.availability[res.availability];
      if (avail) {
        html.push('<p class="lens-calc__slot lens-calc__avail">' + escapeHtml(avail) + '</p>');
      }
      var nudge = res.nudge && t.nudge && t.nudge[res.nudge];
      if (nudge) {
        html.push('<p class="lens-calc__slot lens-calc__nudge">' + escapeHtml(nudge) + '</p>');
      }
      if (res.routedFrom) {
        html.push('<p class="lens-calc__slot lens-calc__routing">' + escapeHtml(t.routing_note) + '</p>');
      }
      this.resultEl.innerHTML = html.join('');
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
      // The side cross-section is the parametric panel (data-lens-svg).
      this.svg = this.figure ? this.figure.querySelector('[data-lens-svg]') : null;
      this.shapeEls = this.svg ? this.svg.querySelectorAll('[data-lens-shape]') : null;
      this.segEl = this.svg ? this.svg.querySelector('[data-lens-seg]') : null;
      // Front-view bifocal D-region (static shape, toggled only) lives in the
      // other panel, so query it from the whole figure.
      this.frontSegEl = this.figure ? this.figure.querySelector('[data-lens-front-seg]') : null;
      this.previewBroken = false;
    }

    _renderPreview(input, res) {
      // Missing figure/SVG → skip silently; the calculator works without it.
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
        // Bifocal segment shows in both panels: a line in the cross-section…
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
        // …and the static D-region in the front view.
        if (this.frontSegEl) {
          if (geo.seg) this.frontSegEl.removeAttribute('hidden');
          else this.frontSegEl.setAttribute('hidden', '');
        }

        // Appearance: only vocabulary present in the pricing data drives tint/
        // sheen; anything unrecognised falls back to a neutral clear lens.
        var light = input && this.vocab.light[input.light] ? input.light : 'clear';
        var coating = input && this.vocab.coating[input.coating] ? input.coating : '';
        this.figure.setAttribute('data-light', light);
        this.figure.setAttribute('data-coating', coating);
        this.figure.removeAttribute('hidden');
      } catch (e) {
        // Log once, hide the figure, leave the calculator untouched.
        this.previewBroken = true;
        this.figure.setAttribute('hidden', '');
        if (window.console && console.warn) console.warn('[lens-preview] disabled:', e);
      }
    }
  }

  customElements.define('lens-calculator', LensCalculator);
})();
