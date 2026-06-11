/* Verbatim transcription of prototype/lens-configurator/lib/lens.ts
 * (TypeScript types stripped; logic + hardcoded data UNCHANGED) so the
 * port in assets/lens-calculator-engine.js can be diffed against the
 * original prototype at runtime. DO NOT "improve" the logic here — its
 * only job is to reproduce the prototype exactly.
 *
 * Prototype input shape (ConfigState):
 *   { type:'mono'|'bi', coating, light, index, od:{sph,cyl,add,ax?}, os:{...} }
 * Availability values are the prototype's ('comanda57', not 'comanda_5_7').
 */
'use strict';

var MONO = [
  { id: 'M01', coating: 'hmc', light: 'clear', index: '1.56', sph: [-6, 6], cylTier: 'base', price: 100, avail: 'stoc' },
  { id: 'M02', coating: 'hmc', light: 'clear', index: '1.56', sph: [-6, 6], cylTier: 'high', price: 150, avail: 'comanda' },
  { id: 'M03', coating: 'hmc', light: 'clear', index: '1.6', sph: [-10, 6], cylTier: 'base', price: 180, avail: 'comanda57' },
  { id: 'M04', coating: 'hmc', light: 'clear', index: '1.6', sph: [-10, 6], cylTier: 'high', price: 220, avail: 'comanda57' },
  { id: 'M05', coating: 'hmc', light: 'clear', index: '1.67', sph: [-10, 10], cylTier: 'base', price: 380, avail: 'comanda57' },
  { id: 'M06', coating: 'hmc', light: 'clear', index: '1.67', sph: [-6, 6], cylTier: 'high', price: 450, avail: 'comanda57' },
  { id: 'M07', coating: 'ultra_blue', light: 'clear', index: '1.56', sph: [-10, 6], cylTier: 'base', price: 350, avail: 'stoc' },
  { id: 'M08', coating: 'ultra_blue', light: 'clear', index: '1.56', sph: [-10, 6], cylTier: 'high', price: 450, avail: 'comanda' },
  { id: 'M09', coating: 'ultra_blue', light: 'clear', index: '1.6', sph: [-12, 6], cylTier: 'base', price: 400, avail: 'comanda57' },
  { id: 'M10', coating: 'ultra_blue', light: 'clear', index: '1.6', sph: [-12, 6], cylTier: 'high', price: 650, avail: 'comanda57' },
  { id: 'M11', coating: 'ultra_blue', light: 'clear', index: '1.67', sph: [-17, 12], cylTier: 'any', price: 800, avail: 'comanda57' },
  { id: 'M12', coating: 'hmc', light: 'foto', index: '1.56', sph: [-8, 6], cylTier: 'base', price: 350, avail: 'stoc' },
  { id: 'M13', coating: 'hmc', light: 'foto', index: '1.56', sph: [-6, 6], cylTier: 'high', price: 480, avail: 'comanda' },
  { id: 'M14', coating: 'ultra_blue', light: 'foto', index: '1.56', sph: [-9, 8], cylTier: 'any', price: 650, avail: 'comanda' },
  { id: 'M15', coating: 'hmc', light: 'foto', index: '1.67', sph: [-10, 10], cylTier: 'any', price: 850, avail: 'comanda57' },
  { id: 'M16', coating: 'ultra_blue', light: 'foto', index: '1.67', sph: [-10, 10], cylTier: 'any', price: 900, avail: 'comanda57' },
  { id: 'M17', coating: 'hmc', light: 'transitions', index: '1.6', sph: [-12, 8], cylTier: 'any', price: 800, avail: 'comanda57' },
  { id: 'M18', coating: 'ultra_blue', light: 'transitions', index: '1.6', sph: [-12, 8], cylTier: 'any', price: 950, avail: 'comanda57' },
  { id: 'M19', coating: 'hmc', light: 'transitions', index: '1.67', sph: [-12, 8], cylTier: 'any', price: 1200, avail: 'comanda57' },
  { id: 'M20', coating: 'ultra_blue', light: 'transitions', index: '1.67', sph: [-12, 8], cylTier: 'any', price: 1400, avail: 'comanda57' },
  { id: 'M21', coating: 'hmc', light: 'sun', index: '1.5', sph: [-6, 4], cylTier: 'base', price: 350, avail: 'stoc' },
  { id: 'M22', coating: 'hmc', light: 'sun', index: '1.5', sph: [-6, 4], cylTier: 'high', price: 500, avail: 'comanda' }
];

var BI = [
  { id: 'B01', coating: 'hmc', light: 'clear', index: '1.5', sph: [-2, 3], cyl: 'zero', add: [1.0, 3.5], price: 350, avail: 'stoc' },
  { id: 'B02', coating: 'hmc', light: 'foto', index: '1.5', sph: [-2, 3], cyl: 'zero', add: [1.0, 3.5], price: 450, avail: 'stoc' },
  { id: 'B03', coating: 'ultra_blue', light: 'clear', index: '1.5', sph: [-9, 10], cyl: 'upto6', add: [0.75, 4.0], price: 600, avail: 'comanda' },
  { id: 'B04', coating: 'hmc', light: 'clear', index: '1.6', sph: [-9, 7], cyl: 'upto6', add: [1.0, 3.0], price: 650, avail: 'comanda57' },
  { id: 'B05', coating: 'ultra_blue', light: 'clear', index: '1.6', sph: [-9, 7], cyl: 'upto6', add: [1.0, 3.0], price: 750, avail: 'comanda57' },
  { id: 'B06', coating: 'hmc', light: 'foto', index: '1.6', sph: [-8, 6], cyl: 'upto6', add: [1.0, 3.0], price: 850, avail: 'comanda57' },
  { id: 'B07', coating: 'hmc', light: 'clear', index: '1.67', sph: [-15, 6], cyl: 'upto6', add: [1.0, 3.0], price: 1200, avail: 'comanda57' },
  { id: 'B08', coating: 'ultra_blue', light: 'clear', index: '1.67', sph: [-15, 6], cyl: 'upto6', add: [1.0, 3.0], price: 1300, avail: 'comanda57' }
];

function strongerEye(od, os) {
  return {
    absSph: Math.max(Math.abs(od.sph), Math.abs(os.sph)),
    absCyl: Math.max(Math.abs(od.cyl), Math.abs(os.cyl)),
    add: Math.max(od.add, os.add),
    minSph: Math.min(od.sph, os.sph),
    maxSph: Math.max(od.sph, os.sph)
  };
}

var INDEX_ORDER = ['1.5', '1.56', '1.6', '1.67'];

function sortIndices(values) {
  var uniq = values.filter(function (v, i) { return values.indexOf(v) === i; });
  return uniq.sort(function (a, b) { return INDEX_ORDER.indexOf(a) - INDEX_ORDER.indexOf(b); });
}

function rowsForCombo(state) {
  var data = state.type === 'mono' ? MONO : BI;
  return data.filter(function (r) { return r.coating === state.coating && r.light === state.light; });
}

function availableIndices(state) {
  return sortIndices(rowsForCombo(state).map(function (r) { return r.index; }));
}

function nextThinnerIndex(state) {
  var indices = availableIndices(state);
  var pos = indices.indexOf(state.index);
  if (pos === -1 || pos === indices.length - 1) return null;
  return indices[pos + 1];
}

function formatDiopter(n) {
  var sign = n > 0 ? '+' : n < 0 ? '−' : '';
  var abs = Math.abs(n).toFixed(2).replace('.', ',');
  return sign + abs;
}

function computeResult(state) {
  var errors = [];
  var strong = strongerEye(state.od, state.os);

  if (strong.absCyl > 6.0) {
    return {
      rowId: null, priceRon: null, availability: null, nudge: null, routedFrom: null,
      errors: [{ field: 'cyl', messageRo: 'Pentru cilindru peste ±6 contactează-ne — te ajutăm telefonic.' }]
    };
  }

  if (state.type === 'mono') return computeMono(state, strong, errors);
  return computeBi(state, strong, errors);
}

function computeMono(state, strong, errors) {
  var neededTier = strong.absCyl <= 2.0 ? 'base' : 'high';
  var candidates = MONO.filter(function (r) {
    return r.coating === state.coating && r.light === state.light && r.index === state.index &&
      (r.cylTier === neededTier || r.cylTier === 'any');
  });
  var row = candidates[0] || null;
  if (!row) {
    return {
      rowId: null, priceRon: null, availability: null, nudge: null, routedFrom: null,
      errors: [{ field: 'combo', messageRo: 'Această combinație nu este disponibilă. Alege alt indice sau alt tratament.' }]
    };
  }
  checkSphRange(state, row.sph, errors);
  var nudge = computeNudge(state, strong);
  return { rowId: row.id, priceRon: row.price, availability: row.avail, nudge: nudge, routedFrom: null, errors: errors };
}

function computeBi(state, strong, errors) {
  var row = BI.filter(function (r) {
    return r.coating === state.coating && r.light === state.light && r.index === state.index;
  })[0] || null;
  if (!row) {
    return {
      rowId: null, priceRon: null, availability: null, nudge: null, routedFrom: null,
      errors: [{ field: 'combo', messageRo: 'Această combinație nu este disponibilă. Alege alt indice sau alt tratament.' }]
    };
  }
  var routedFrom = null;
  if (row.cyl === 'zero' && strong.absCyl > 0) {
    var routed = BI.filter(function (r) {
      return r.coating === state.coating && r.light === state.light && r.index === '1.6';
    })[0];
    if (routed) { routedFrom = row.id; row = routed; }
  }
  checkSphRange(state, row.sph, errors);
  checkAddRange(state, row.add, errors);
  var nudge = computeNudge(state, strong);
  return { rowId: row.id, priceRon: row.price, availability: row.avail, nudge: nudge, routedFrom: routedFrom, errors: errors };
}

function checkSphRange(state, range, errors) {
  var min = range[0], max = range[1];
  var over = state.od.sph > max || state.os.sph > max;
  var under = state.od.sph < min || state.os.sph < min;
  if (over) {
    var worstHi = Math.max(state.od.sph, state.os.sph);
    errors.push({ field: 'sph', messageRo: 'Sfera ' + formatDiopter(worstHi) + ' depășește limita acestei lentile (' + formatDiopter(max) + '). Alege un indice mai subțire sau ajustează.' });
  }
  if (under) {
    var worstLo = Math.min(state.od.sph, state.os.sph);
    errors.push({ field: 'sph', messageRo: 'Sfera ' + formatDiopter(worstLo) + ' depășește limita acestei lentile (' + formatDiopter(min) + '). Alege un indice mai subțire sau ajustează.' });
  }
}

function checkAddRange(state, range, errors) {
  var min = range[0], max = range[1];
  var adds = [state.od.add, state.os.add];
  if (adds.some(function (a) { return a > max; })) {
    errors.push({ field: 'add', messageRo: 'Adiția ' + formatDiopter(Math.max.apply(null, adds)) + ' depășește limita acestei lentile (' + formatDiopter(max) + '). Ajustează adiția.' });
  }
  if (adds.some(function (a) { return a > 0 && a < min; })) {
    errors.push({ field: 'add', messageRo: 'Adiția trebuie să fie cel puțin ' + formatDiopter(min) + ' pentru această lentilă. Ajustează adiția.' });
  }
}

function computeNudge(state, strong) {
  var indices = availableIndices(state);
  var isLowest = indices.length > 0 && state.index === indices[0];
  var hasThinner = nextThinnerIndex(state) !== null;
  if (isLowest && hasThinner && strong.absSph > 3.0) return 'recommend_thinning';
  return null;
}

module.exports = { computeResult: computeResult, MONO: MONO, BI: BI };
