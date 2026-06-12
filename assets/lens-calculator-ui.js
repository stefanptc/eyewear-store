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
 * Step 3 scope: UI only. No SVG preview, no add-to-cart.
 * ============================================================= */
(function () {
  'use strict';

  if (window.customElements && customElements.get('lens-calculator')) return;

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

      this._showLoading();
      this._bind();
      this._toggleAdd();
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
      var res = this.engine.computeResult(this._buildInput());
      if (res.errors && res.errors.length) this._renderErrors(res.errors);
      else this._renderResult(res);
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
  }

  customElements.define('lens-calculator', LensCalculator);
})();
