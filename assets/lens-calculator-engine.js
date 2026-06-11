/* =============================================================
 * Optivix — lens pricing engine (pure, dependency-free, no DOM).
 *
 * Ported from the v0 prototype prototype/lens-configurator/lib/lens.ts
 * (computeResult + helpers). Data is INJECTED, not loaded here, so the
 * same file runs in node tests and in the browser section later:
 *
 *   node:    const createLensEngine = require('./lens-calculator-engine.js')
 *            const engine = createLensEngine(data)         // data = lens-pricing-data.json
 *   browser: <script src="{{ 'lens-calculator-engine.js' | asset_url }}"></script>
 *            const engine = window.createLensEngine(data)
 *
 * computeResult(input) where
 *   input = { type, coating, light, index,
 *             od:{sph,cyl,ax}, os:{sph,cyl,ax}, add? }
 * Vocabulary matches the injected data (lens-pricing-data.json):
 *   type    'monofocal' | 'bifocal'
 *   coating 'hmc' | 'ultra_blue'
 *   light   'clear' | 'foto' | 'transitions' | 'sun'
 *   index   '1.5' | '1.56' | '1.6' | '1.67'   (string)
 *   add     diopters (bifocal only; applied to both eyes)
 *
 * Result:
 *   { rowId, priceRon, availability, nudge, routedFrom, tbd, tbdRefs, errors:[{field,messageRo}] }
 *
 * INTENTIONAL DIVERGENCE FROM THE PROTOTYPE: the prototype returns a row
 * id + price *alongside* an SPH/ADD out-of-range error (so its UI could
 * show a struck-through price). This engine treats ANY blocking
 * validation error as "no offer" — rowId/priceRon/availability are null
 * whenever errors is non-empty. An invalid Rx must never surface a price.
 * For in-range inputs the two are identical (parity test b).
 * ============================================================= */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.createLensEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var INDEX_ORDER = ['1.5', '1.56', '1.6', '1.67'];

  function createLensEngine(data) {
    if (!data || !Array.isArray(data.rows)) {
      throw new Error('createLensEngine: expected { rows: [...] } (lens-pricing-data.json)');
    }
    // Only priced rows are offerable. M23 (TBD-1, null price) is thereby
    // structurally unreachable — thinned-sun is never an offer.
    var SELECTABLE = data.rows.filter(function (r) { return r.price_ron != null; });

    // ---- catalogue introspection (combo-aware) ----
    function rowsForCombo(type, coating, light) {
      return SELECTABLE.filter(function (r) {
        return r.type === type && r.coating === coating && r.light === light;
      });
    }
    function availableIndices(type, coating, light) {
      var seen = {};
      var vals = [];
      rowsForCombo(type, coating, light).forEach(function (r) {
        if (!seen[r.index]) { seen[r.index] = true; vals.push(r.index); }
      });
      return vals.sort(function (a, b) {
        return INDEX_ORDER.indexOf(a) - INDEX_ORDER.indexOf(b);
      });
    }
    function nextThinnerIndex(type, coating, light, index) {
      var idx = availableIndices(type, coating, light);
      var pos = idx.indexOf(index);
      if (pos === -1 || pos === idx.length - 1) return null;
      return idx[pos + 1];
    }

    // ---- stronger-eye reduction (R6; per-eye rule provisional, TBD-4) ----
    function strongerEye(od, os) {
      return {
        absSph: Math.max(Math.abs(od.sph), Math.abs(os.sph)),
        absCyl: Math.max(Math.abs(od.cyl), Math.abs(os.cyl)),
        minSph: Math.min(od.sph, os.sph),
        maxSph: Math.max(od.sph, os.sph)
      };
    }

    // tier match: a 'base+high' row serves either tier.
    function tierMatches(rowTier, neededTier) {
      return rowTier === neededTier || rowTier === 'base+high';
    }

    // ---- Romanian diopter formatting (for error messages) ----
    function formatDiopter(n) {
      var sign = n > 0 ? '+' : n < 0 ? '−' : '';
      var abs = Math.abs(n).toFixed(2).replace('.', ',');
      return sign + abs;
    }

    function emptyResult(errors) {
      return {
        rowId: null, priceRon: null, availability: null,
        nudge: null, routedFrom: null, tbd: false, tbdRefs: [],
        errors: errors || []
      };
    }
    function comboError() {
      return {
        field: 'combo',
        messageRo: 'Această combinație nu este disponibilă. Alege alt indice sau alt tratament.'
      };
    }

    function finalize(row, nudge, routedFrom) {
      return {
        rowId: row.id,
        priceRon: row.price_ron,
        availability: row.availability,
        nudge: nudge,
        routedFrom: routedFrom,
        tbd: !!row.tbd,
        tbdRefs: (row.tbd_refs || []).slice(),
        errors: []
      };
    }

    // ---- range validation ----
    function checkSphRange(od, os, range, errors) {
      var min = range.min, max = range.max;
      if (od.sph > max || os.sph > max) {
        var worstHi = Math.max(od.sph, os.sph);
        errors.push({
          field: 'sph',
          messageRo: 'Sfera ' + formatDiopter(worstHi) + ' depășește limita acestei lentile (' +
            formatDiopter(max) + '). Alege un indice mai subțire sau ajustează.'
        });
      }
      if (od.sph < min || os.sph < min) {
        var worstLo = Math.min(od.sph, os.sph);
        errors.push({
          field: 'sph',
          messageRo: 'Sfera ' + formatDiopter(worstLo) + ' depășește limita acestei lentile (' +
            formatDiopter(min) + '). Alege un indice mai subțire sau ajustează.'
        });
      }
    }
    function checkAddRange(add, range, errors) {
      if (!range) return;
      var min = range.min, max = range.max;
      if (add > max) {
        errors.push({
          field: 'add',
          messageRo: 'Adiția ' + formatDiopter(add) + ' depășește limita acestei lentile (' +
            formatDiopter(max) + '). Ajustează adiția.'
        });
      }
      if (add > 0 && add < min) {
        errors.push({
          field: 'add',
          messageRo: 'Adiția trebuie să fie cel puțin ' + formatDiopter(min) +
            ' pentru această lentilă. Ajustează adiția.'
        });
      }
    }

    // R3 — gentle thinning suggestion (never blocks).
    function computeNudge(input, strong) {
      var indices = availableIndices(input.type, input.coating, input.light);
      var isLowest = indices.length > 0 && input.index === indices[0];
      var hasThinner = nextThinnerIndex(input.type, input.coating, input.light, input.index) !== null;
      if (isLowest && hasThinner && strong.absSph > 3.0) return 'recommend_thinning';
      return null;
    }

    // ---- structural / numeric input guards (never throw) ----
    function isNum(v) { return typeof v === 'number' && isFinite(v); }
    function validateEye(label, eye, errors) {
      if (!eye || !isNum(eye.sph) || !isNum(eye.cyl)) {
        errors.push({
          field: label,
          messageRo: 'Valori lipsă sau invalide pentru ' +
            (label === 'od' ? 'ochiul drept' : 'ochiul stâng') + '.'
        });
        return;
      }
      // Axis 0–180 (only meaningful with cylinder, but flag malformed input regardless).
      if (eye.ax != null) {
        if (!isNum(eye.ax) || eye.ax < 0 || eye.ax > 180) {
          errors.push({ field: 'ax', messageRo: 'Axul trebuie să fie între 0 și 180 de grade.' });
        }
      }
    }

    function computeMono(input, od, os, strong) {
      var neededTier = strong.absCyl <= 2.0 ? 'base' : 'high';
      var candidates = SELECTABLE.filter(function (r) {
        return r.type === 'monofocal' && r.coating === input.coating &&
          r.light === input.light && r.index === input.index &&
          r.cyl && tierMatches(r.cyl.tier, neededTier);
      });
      var row = candidates[0] || null;
      if (!row) return emptyResult([comboError()]);

      var errors = [];
      checkSphRange(od, os, row.sph, errors);
      if (errors.length) return emptyResult(errors);

      return finalize(row, computeNudge(input, strong), null);
    }

    function computeBi(input, od, os, add, strong) {
      var row = SELECTABLE.filter(function (r) {
        return r.type === 'bifocal' && r.coating === input.coating &&
          r.light === input.light && r.index === input.index;
      })[0] || null;
      if (!row) return emptyResult([comboError()]);

      var routedFrom = null;
      // R4 — zero-cyl bifocal + any cylinder → same coating + light, index 1.6.
      if (row.cyl && row.cyl.tier === 'zero_only' && strong.absCyl > 0) {
        var routed = SELECTABLE.filter(function (r) {
          return r.type === 'bifocal' && r.coating === input.coating &&
            r.light === input.light && r.index === '1.6';
        })[0];
        if (routed) { routedFrom = row.id; row = routed; }
      }

      var errors = [];
      checkSphRange(od, os, row.sph, errors);
      checkAddRange(add, row.add, errors);
      if (errors.length) return emptyResult(errors);

      return finalize(row, computeNudge(input, strong), routedFrom);
    }

    function computeResult(input) {
      // never throw — malformed input becomes a structured error result.
      if (!input || typeof input !== 'object') {
        return emptyResult([{ field: 'input', messageRo: 'Date incomplete.' }]);
      }
      var guard = [];
      validateEye('od', input.od, guard);
      validateEye('os', input.os, guard);
      if (guard.length) return emptyResult(guard);

      var od = { sph: input.od.sph, cyl: input.od.cyl, ax: input.od.ax == null ? null : input.od.ax };
      var os = { sph: input.os.sph, cyl: input.os.cyl, ax: input.os.ax == null ? null : input.os.ax };
      var add = isNum(input.add) ? input.add : 0;
      var strong = strongerEye(od, os);

      // R1 — cylinder above ±6 is out of scope.
      if (strong.absCyl > 6.0) {
        return emptyResult([{
          field: 'cyl',
          messageRo: 'Pentru cilindru peste ±6 contactează-ne — te ajutăm telefonic.'
        }]);
      }

      if (input.type === 'monofocal') return computeMono(input, od, os, strong);
      if (input.type === 'bifocal') return computeBi(input, od, os, add, strong);
      return emptyResult([{ field: 'type', messageRo: 'Tip de lentilă necunoscut.' }]);
    }

    return {
      computeResult: computeResult,
      availableIndices: availableIndices,
      nextThinnerIndex: nextThinnerIndex,
      strongerEye: strongerEye,
      formatDiopter: formatDiopter
    };
  }

  return createLensEngine;
});
