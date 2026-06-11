/* Lens pricing engine — parity + behavior tests. Plain node, no framework.
 *   node tests/lens-engine.test.js
 *
 * (a) JSON parity      — every priced row reachable; rowId + price match JSON
 * (b) Prototype parity — engine vs verbatim prototype transcription, identical
 *                        outputs incl. nudge/routing (in-range inputs)
 * (c) Boundary         — |CYL| == 2.00 lands base; 2.01 lands high
 * (d) M23 unreachable  — thinned-sun is never an offer
 * (e) M18              — returns price 950 AND tbd:true surfaced
 * (f) Per-eye rule     — mixed tiers priced by stronger eye (// TBD-4)
 * (g) Invalid Rx       — structured error, never a throw, never a price
 */
'use strict';

var path = require('path');
var createLensEngine = require(path.join(__dirname, '..', 'assets', 'lens-calculator-engine.js'));
var data = require(path.join(__dirname, '..', 'assets', 'lens-pricing-data.json'));
var proto = require(path.join(__dirname, 'fixtures', 'prototype-lens.js'));

var eng = createLensEngine(data);

// ---- micro assert harness ----
var pass = 0, fail = 0, failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (detail ? '  [' + detail + ']' : '')); }
}

// ---- input builders ----
function mono(coating, light, index, sphOD, cylOD, sphOS, cylOS, ax) {
  return {
    type: 'monofocal', coating: coating, light: light, index: index,
    od: { sph: sphOD, cyl: cylOD, ax: ax }, os: { sph: sphOS, cyl: cylOS, ax: ax }
  };
}
function bi(coating, light, index, sph, cyl, add) {
  return {
    type: 'bifocal', coating: coating, light: light, index: index,
    od: { sph: sph, cyl: cyl }, os: { sph: sph, cyl: cyl }, add: add
  };
}
function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }
function rowById(id) { return data.rows.filter(function (r) { return r.id === id; })[0]; }

// Build one valid Rx that must resolve to exactly `row`.
function validInputForRow(row) {
  var sph = clamp(row.sph.min, row.sph.max, -1);
  if (row.type === 'monofocal') {
    var high = row.cyl.tier === 'high';
    return mono(row.coating, row.light, row.index, sph, high ? 3 : 0, sph, high ? 3 : 0, high ? 90 : undefined);
  }
  var add = row.add ? clamp(row.add.min, row.add.max, 2.0) : 2.0;
  return bi(row.coating, row.light, row.index, sph, 0, add); // cyl 0 → reach row by index (no R4 routing)
}

// engine input -> prototype ConfigState
function toProto(input) {
  var add = (typeof input.add === 'number') ? input.add : 0;
  function eye(e) { return { sph: e.sph, cyl: e.cyl, add: add, ax: (e.ax == null ? undefined : e.ax) }; }
  return {
    type: input.type === 'monofocal' ? 'mono' : 'bi',
    coating: input.coating, light: input.light, index: input.index,
    od: eye(input.od), os: eye(input.os)
  };
}
function normAvail(a) { return a === 'comanda57' ? 'comanda_5_7' : a; }
function sameDecision(e, p) {
  return e.rowId === p.rowId &&
    e.priceRon === p.priceRon &&
    e.availability === normAvail(p.availability) &&
    e.nudge === p.nudge &&
    (e.routedFrom || null) === (p.routedFrom || null);
}
function noThrow(fn) { try { return { ok: true, val: fn() }; } catch (e) { return { ok: false, err: e }; } }

var selectable = data.rows.filter(function (r) { return r.price_ron != null; });

// =================== (a) JSON parity ===================
check('a/30 priced rows', selectable.length === 30, 'got ' + selectable.length);
selectable.forEach(function (row) {
  var res = eng.computeResult(validInputForRow(row));
  check('a/' + row.id + ' rowId', res.rowId === row.id, 'got ' + res.rowId);
  check('a/' + row.id + ' price', res.priceRon === row.price_ron, 'got ' + res.priceRon);
  check('a/' + row.id + ' availability', res.availability === row.availability, 'got ' + res.availability);
  check('a/' + row.id + ' clean', res.errors.length === 0, JSON.stringify(res.errors));
});

// =================== (b) Prototype parity ===================
var parityInputs = selectable.map(validInputForRow);
// routing (R4): zero-cyl bifocal + cylinder -> 1.6 same coating/light
parityInputs.push(bi('hmc', 'clear', '1.5', -1, 2, 2.0)); // B01 -> B04
parityInputs.push(bi('hmc', 'foto', '1.5', -1, 2, 2.0));  // B02 -> B06
// nudge (R3)
parityInputs.push(mono('hmc', 'clear', '1.56', -4, 0, -4, 0)); // lowest + absSph>3 -> nudge
parityInputs.push(mono('hmc', 'clear', '1.6', -4, 0, -4, 0));  // not lowest -> no nudge
parityInputs.push(mono('hmc', 'sun', '1.5', -4, 0, -4, 0));    // lowest but no thinner -> no nudge
// per-eye mixed tier + boundary
parityInputs.push(mono('hmc', 'clear', '1.56', -1, 1, -1, 3));
parityInputs.push(mono('hmc', 'clear', '1.56', -1, 2.0, -1, 2.0));
parityInputs.push(mono('hmc', 'clear', '1.56', -1, 2.01, -1, 2.01));
parityInputs.forEach(function (inp, i) {
  var e = eng.computeResult(inp);
  var p = proto.computeResult(toProto(inp));
  check('b/case' + i, sameDecision(e, p),
    'eng=' + JSON.stringify({ id: e.rowId, pr: e.priceRon, av: e.availability, n: e.nudge, rf: e.routedFrom }) +
    ' proto=' + JSON.stringify({ id: p.rowId, pr: p.priceRon, av: normAvail(p.availability), n: p.nudge, rf: p.routedFrom || null }));
});
// explicit routing assertions (decision visible, not just parity)
var rB01 = eng.computeResult(bi('hmc', 'clear', '1.5', -1, 2, 2.0));
check('b/route B01->B04', rB01.rowId === 'B04' && rB01.routedFrom === 'B01' && rB01.priceRon === 650, JSON.stringify(rB01));
var rB02 = eng.computeResult(bi('hmc', 'foto', '1.5', -1, 2, 2.0));
check('b/route B02->B06 (preserve light)', rB02.rowId === 'B06' && rB02.routedFrom === 'B02', JSON.stringify(rB02));
var rNudge = eng.computeResult(mono('hmc', 'clear', '1.56', -4, 0, -4, 0));
check('b/nudge recommend_thinning', rNudge.nudge === 'recommend_thinning', JSON.stringify(rNudge));

// =================== (c) Boundary semantics ===================
function tierRow(cyl) { return eng.computeResult(mono('hmc', 'clear', '1.56', -1, cyl, -1, cyl)).rowId; }
check('c/1.99 -> base M01', tierRow(1.99) === 'M01');
check('c/2.00 -> base M01 (|CYL|<=2.00)', tierRow(2.00) === 'M01');
check('c/2.01 -> high M02', tierRow(2.01) === 'M02');
check('c/-2.00 -> base M01', tierRow(-2.00) === 'M01');
check('c/-2.01 -> high M02', tierRow(-2.01) === 'M02');

// =================== (d) M23 unreachable ===================
var reachedM23 = false;
['monofocal', 'bifocal'].forEach(function (t) {
  ['hmc', 'ultra_blue'].forEach(function (c) {
    ['clear', 'foto', 'transitions', 'sun'].forEach(function (l) {
      ['1.5', '1.56', '1.6', '1.67'].forEach(function (idx) {
        [0, 1, 3, 5].forEach(function (cyl) {
          var r = eng.computeResult({
            type: t, coating: c, light: l, index: idx,
            od: { sph: -1, cyl: cyl }, os: { sph: -1, cyl: cyl }, add: 2
          });
          if (r.rowId === 'M23') reachedM23 = true;
        });
      });
    });
  });
});
check('d/M23 never returned (full sweep)', reachedM23 === false);
// thinned-sun (sun + index != 1.5) is not offerable
['1.56', '1.6', '1.67'].forEach(function (idx) {
  ['hmc', 'ultra_blue'].forEach(function (c) {
    var r = eng.computeResult(mono(c, 'sun', idx, -1, 0, -1, 0));
    check('d/sun ' + c + ' ' + idx + ' not offerable', r.rowId === null && r.priceRon === null);
  });
});
check('d/M23 has null price in data', rowById('M23').price_ron === null);

// =================== (e) M18 tbd surfaced ===================
var r18 = eng.computeResult(mono('ultra_blue', 'transitions', '1.6', -1, 0, -1, 0));
check('e/M18 rowId', r18.rowId === 'M18', JSON.stringify(r18));
check('e/M18 price 950', r18.priceRon === 950);
check('e/M18 tbd true', r18.tbd === true);
check('e/M18 tbdRefs TBD-3', r18.tbdRefs.indexOf('TBD-3') !== -1, JSON.stringify(r18.tbdRefs));
check('e/non-tbd row tbd false', eng.computeResult(validInputForRow(rowById('M01'))).tbd === false);

// =================== (f) Per-eye rule (// TBD-4) ===================
// R6: priced by the stronger requirement. Stronger CYL selects the tier.
// TBD-4: supplier has not confirmed the per-eye rule; this encodes CURRENT behavior.
var f1 = eng.computeResult(mono('hmc', 'clear', '1.56', -1, 1.0, -1, 3.0)); // OS high
check('f/mixed tier -> high M02 (TBD-4)', f1.rowId === 'M02' && f1.priceRon === 150, JSON.stringify(f1));
var f2 = eng.computeResult(mono('hmc', 'clear', '1.56', -1, 3.0, -1, 1.0)); // OD high
check('f/mixed tier symmetric (TBD-4)', f2.rowId === 'M02');
// per-eye SPH: one eye beyond range blocks the whole pair
var f3 = eng.computeResult(mono('hmc', 'clear', '1.56', -1, 0, -8, 0)); // OS -8 < -6
check('f/per-eye sph out of range blocks', f3.priceRon === null && f3.errors.some(function (e) { return e.field === 'sph'; }), JSON.stringify(f3));

// =================== (g) Invalid Rx -> error, no throw, no price ===================
var g1 = noThrow(function () { return eng.computeResult(mono('hmc', 'clear', '1.56', -9, 0, -1, 0)); }); // sph < -6
check('g/sph-out no throw', g1.ok);
check('g/sph-out no price', g1.ok && g1.val.priceRon === null && g1.val.rowId === null, g1.ok ? JSON.stringify(g1.val) : '');
check('g/sph-out has error', g1.ok && g1.val.errors.some(function (e) { return e.field === 'sph'; }));
var g2 = noThrow(function () { return eng.computeResult(mono('hmc', 'clear', '1.56', -1, 7, -1, 7)); }); // |cyl|>6
check('g/cyl>6 no price', g2.ok && g2.val.priceRon === null);
check('g/cyl>6 error', g2.ok && g2.val.errors.some(function (e) { return e.field === 'cyl'; }));
var g3 = noThrow(function () { return eng.computeResult({ type: 'monofocal', coating: 'hmc', light: 'clear', index: '1.56', od: { sph: -1, cyl: 2, ax: 200 }, os: { sph: -1, cyl: 2, ax: 90 } }); });
check('g/axis>180 no price', g3.ok && g3.val.priceRon === null);
check('g/axis>180 error', g3.ok && g3.val.errors.some(function (e) { return e.field === 'ax'; }));
var g3b = noThrow(function () { return eng.computeResult({ type: 'monofocal', coating: 'hmc', light: 'clear', index: '1.56', od: { sph: -1, cyl: 2, ax: -5 }, os: { sph: -1, cyl: 2, ax: 90 } }); });
check('g/axis<0 error', g3b.ok && g3b.val.priceRon === null && g3b.val.errors.some(function (e) { return e.field === 'ax'; }));
var g4 = noThrow(function () { return eng.computeResult({ type: 'monofocal', coating: 'hmc', light: 'clear', index: '1.56', od: { sph: NaN, cyl: 0 }, os: { sph: -1, cyl: 0 } }); });
check('g/NaN sph no throw + no price', g4.ok && g4.val.priceRon === null && g4.val.errors.length > 0);
var g5 = noThrow(function () { return eng.computeResult(null); });
check('g/null input no throw + no price', g5.ok && g5.val.priceRon === null);
var g6 = noThrow(function () { return eng.computeResult({ type: 'monofocal', coating: 'hmc', light: 'clear', index: '1.56' }); }); // no eyes
check('g/missing eyes no throw + no price', g6.ok && g6.val.priceRon === null && g6.val.errors.length > 0);
var g7 = noThrow(function () { return eng.computeResult(mono('hmc', 'clear', '9.99', -1, 0, -1, 0)); }); // unknown index
check('g/unknown combo -> combo error', g7.ok && g7.val.rowId === null && g7.val.errors.some(function (e) { return e.field === 'combo'; }));

// =================== summary ===================
var total = pass + fail;
console.log('\n================ LENS ENGINE TEST SUMMARY ================');
console.log('  a JSON parity      b prototype parity   c boundary');
console.log('  d M23 unreachable  e M18 tbd            f per-eye (TBD-4)  g invalid Rx');
console.log('  ----------------------------------------------------------');
if (fail) {
  console.log('  FAILURES (' + fail + '):');
  failures.forEach(function (f) { console.log('    ✗ ' + f); });
}
console.log('  ' + (fail ? '❌' : '✅') + '  ' + pass + '/' + total + ' assertions passed' + (fail ? ', ' + fail + ' FAILED' : ''));
console.log('==========================================================\n');
process.exitCode = fail ? 1 : 0;
