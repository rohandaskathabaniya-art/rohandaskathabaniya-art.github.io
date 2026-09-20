/* =====================================================
   Free tools - loaded only on tools.html
   Everything runs in your browser. Nothing is uploaded.
   ===================================================== */
(function () {
  'use strict';

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function h(tag, attrs) {
    const el = document.createElement(tag);
    const a = attrs || {};
    Object.keys(a).forEach(function (k) {
      const v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (let i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        el.append(c.nodeType ? c : document.createTextNode(String(c)));
      });
    }
    return el;
  }

  function fmt(n, d) {
    if (typeof n !== 'number' || !isFinite(n)) return '-';
    return n.toLocaleString(undefined, { maximumFractionDigits: d === undefined ? 2 : d });
  }
  function num(el) { const v = parseFloat(el.value); return isNaN(v) ? NaN : v; }
  function result(box, big, rows, note) {
    const kids = [];
    if (big) kids.push(h('strong', { class: 'big', text: big }));
    if (note) kids.push(h('span', { text: note }));
    if (rows && rows.length) {
      const dl = h('dl');
      rows.forEach(function (r) { dl.append(h('dt', { text: r[0] }), h('dd', { text: r[1] })); });
      kids.push(dl);
    }
    box.hidden = false;
    box.replaceChildren.apply(box, kids);
  }
  function fail(box, msg) {
    box.hidden = false;
    box.replaceChildren(h('span', { role: 'alert', text: msg }));
  }
  let uid = 0;
  function field(label, input, cls) {
    const id = 'f' + (++uid);
    input.id = id;
    return h('div', { class: cls || '' }, h('label', { for: id, text: label }), input);
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    const tabs = $$('[data-tool]');
    const panels = $$('[data-panel]');
    function show(name) {
      if (!panels.some(function (p) { return p.dataset.panel === name; })) name = 'gpa';
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.tool === name)); });
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { history.replaceState(null, '', '#' + t.dataset.tool); show(t.dataset.tool); });
    });
    window.addEventListener('hashchange', function () { show(location.hash.slice(1)); });
    show(location.hash.slice(1) || 'gpa');
  }

  /* ---------- GPA ---------- */
  const GRADES = [['A', 4], ['A-', 3.7], ['B+', 3.3], ['B', 3], ['B-', 2.7], ['C+', 2.3], ['C', 2], ['C-', 1.7], ['D+', 1.3], ['D', 1], ['F', 0]];
  function initGpa() {
    const rows = $('#gpa-rows');
    function addRow(i) {
      const name = h('input', { type: 'text', placeholder: 'Subject ' + i, autocomplete: 'off' });
      const grade = h('select', { 'data-role': 'grade' });
      GRADES.forEach(function (g) { grade.append(h('option', { value: g[1], text: g[0] + ' (' + g[1].toFixed(1) + ')' })); });
      const credit = h('input', { type: 'number', min: '0', step: '0.5', value: '3', inputmode: 'decimal', 'data-role': 'credit' });
      const del = h('button', { type: 'button', class: 'btn btn-small btn-danger', 'aria-label': 'Remove subject ' + i, text: 'Remove' });
      const row = h('div', { class: 'tool-row wide-first' }, field('Subject', name, 'wide'), field('Grade', grade), field('Credit hours', credit), del);
      del.addEventListener('click', function () { row.remove(); });
      rows.append(row);
    }
    for (let i = 1; i <= 5; i++) addRow(i);
    $('#gpa-add').addEventListener('click', function () { addRow(rows.children.length + 1); });
    $('#gpa-calc').addEventListener('click', function () {
      let pts = 0, cr = 0;
      $$('.tool-row', rows).forEach(function (r) {
        const c = num($('[data-role=credit]', r));
        const g = parseFloat($('[data-role=grade]', r).value);
        if (c > 0) { pts += c * g; cr += c; }
      });
      const out = $('#gpa-out');
      if (!cr) return fail(out, 'Add at least one subject with credit hours above 0.');
      result(out, 'GPA ' + (pts / cr).toFixed(2), [['Total credit hours', fmt(cr)], ['Total grade points', fmt(pts)]], 'Out of 4.00 on the scale shown above.');
    });
  }

  /* ---------- CGPA ---------- */
  function initCgpa() {
    const rows = $('#cgpa-rows');
    function addRow(i) {
      const label = h('input', { type: 'text', placeholder: 'Semester ' + i, autocomplete: 'off' });
      const sg = h('input', { type: 'number', min: '0', max: '4', step: '0.01', inputmode: 'decimal', placeholder: 'e.g. 3.40', 'data-role': 'sgpa' });
      const cr = h('input', { type: 'number', min: '0', step: '0.5', inputmode: 'decimal', placeholder: 'e.g. 20', 'data-role': 'credits' });
      const del = h('button', { type: 'button', class: 'btn btn-small btn-danger', 'aria-label': 'Remove semester ' + i, text: 'Remove' });
      const row = h('div', { class: 'tool-row' }, field('Semester', label, 'wide'), field('Semester GPA (0 to 4)', sg), field('Credit hours', cr), del);
      del.addEventListener('click', function () { row.remove(); });
      rows.append(row);
    }
    for (let i = 1; i <= 4; i++) addRow(i);
    $('#cgpa-add').addEventListener('click', function () { addRow(rows.children.length + 1); });
    $('#cgpa-calc').addEventListener('click', function () {
      let pts = 0, cr = 0, sum = 0, n = 0;
      $$('.tool-row', rows).forEach(function (r) {
        const g = num($('[data-role=sgpa]', r));
        const c = num($('[data-role=credits]', r));
        if (!isNaN(g) && g >= 0 && g <= 4 && c > 0) { pts += g * c; cr += c; sum += g; n++; }
      });
      const out = $('#cgpa-out');
      if (!cr) return fail(out, 'Enter at least one semester with a GPA between 0 and 4 and credit hours above 0.');
      result(out, 'CGPA ' + (pts / cr).toFixed(2), [['Semesters counted', String(n)], ['Total credit hours', fmt(cr)], ['Simple average of GPAs', (sum / n).toFixed(2)]], 'Weighted by credit hours.');
    });
  }

  /* ---------- Percentage ---------- */
  function initPercentage() {
    const mode = $('#pct-mode'), a = $('#pct-a'), b = $('#pct-b'), la = $('#pct-la'), lb = $('#pct-lb'), out = $('#pct-out');
    const labels = {
      of: ['Percentage (%)', 'Number'],
      is: ['Part', 'Whole'],
      change: ['Old value', 'New value']
    };
    function sync() { la.textContent = labels[mode.value][0]; lb.textContent = labels[mode.value][1]; out.hidden = true; }
    mode.addEventListener('change', sync); sync();
    $('#pct-calc').addEventListener('click', function () {
      const x = num(a), y = num(b);
      if (isNaN(x) || isNaN(y)) return fail(out, 'Enter both numbers.');
      if (mode.value === 'of') return result(out, fmt(x / 100 * y, 4), null, x + '% of ' + y);
      if (y === 0 && mode.value === 'is') return fail(out, 'The whole cannot be 0.');
      if (mode.value === 'is') return result(out, fmt(x / y * 100, 4) + '%', null, x + ' is this percent of ' + y);
      if (x === 0) return fail(out, 'The old value cannot be 0.');
      const c = (y - x) / Math.abs(x) * 100;
      result(out, (c > 0 ? '+' : '') + fmt(c, 4) + '%', null, c >= 0 ? 'Increase' : 'Decrease');
    });
  }

  /* ---------- Age ---------- */
  function parseDate(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function initAge() {
    const dob = $('#age-dob'), asof = $('#age-asof'), out = $('#age-out');
    const now = new Date();
    asof.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    $('#age-calc').addEventListener('click', function () {
      if (!dob.value || !asof.value) return fail(out, 'Choose your date of birth.');
      const a = parseDate(dob.value), b = parseDate(asof.value);
      if (a > b) return fail(out, 'The date of birth must be before the "age on" date.');
      let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
      if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      const days = Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
      let next = new Date(b.getFullYear(), a.getMonth(), a.getDate());
      if (next < b) next = new Date(b.getFullYear() + 1, a.getMonth(), a.getDate());
      const untilNext = Math.round((Date.UTC(next.getFullYear(), next.getMonth(), next.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5);
      result(out, y + ' years, ' + m + ' months, ' + d + ' days', [
        ['Total days lived', fmt(days, 0)], ['Total weeks', fmt(Math.floor(days / 7), 0)],
        ['Next birthday in', untilNext === 0 ? 'Today' : fmt(untilNext, 0) + ' days']
      ]);
    });
  }

  /* ---------- Word and character counter ---------- */
  function initCounter() {
    const t = $('#wc-text'), out = $('#wc-out');
    function update() {
      const s = t.value, trimmed = s.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const chars = Array.from(s).length;
      const noSpace = Array.from(s.replace(/\s/g, '')).length;
      const sentences = (s.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).filter(function (x) { return x.trim(); }).length;
      const paras = s.split(/\n\s*\n/).filter(function (x) { return x.trim(); }).length;
      const mins = words ? Math.max(1, Math.ceil(words / 200)) : 0;
      const items = [['Words', words], ['Characters', chars], ['Characters (no spaces)', noSpace], ['Sentences', sentences], ['Paragraphs', paras], ['Reading time', mins + ' min']];
      out.replaceChildren.apply(out, items.map(function (i) { return h('div', null, h('b', { text: typeof i[1] === 'number' ? fmt(i[1], 0) : i[1] }), h('span', { class: 'muted small', text: i[0] })); }));
    }
    t.addEventListener('input', update); update();
    $('#wc-clear').addEventListener('click', function () { t.value = ''; update(); t.focus(); });
  }

  /* ---------- Unit converter ---------- */
  const UNITS = {
    'Length': { 'metre': 1, 'kilometre': 1000, 'centimetre': 0.01, 'millimetre': 0.001, 'mile': 1609.344, 'yard': 0.9144, 'foot': 0.3048, 'inch': 0.0254 },
    'Weight': { 'kilogram': 1, 'gram': 0.001, 'milligram': 1e-6, 'pound': 0.45359237, 'ounce': 0.028349523125 },
    'Area': { 'square metre': 1, 'square kilometre': 1e6, 'hectare': 1e4, 'square foot': 0.09290304, 'acre': 4046.8564224, 'ropani': 508.737, 'aana': 31.796 },
    'Volume': { 'litre': 1, 'millilitre': 0.001, 'cubic metre': 1000, 'US gallon': 3.785411784, 'US cup': 0.2365882365 },
    'Data': { 'byte': 1, 'kilobyte (1024 B)': 1024, 'megabyte': Math.pow(1024, 2), 'gigabyte': Math.pow(1024, 3), 'terabyte': Math.pow(1024, 4) },
    'Temperature': { 'Celsius': 1, 'Fahrenheit': 1, 'Kelvin': 1 }
  };
  function convertTemp(v, from, to) {
    let c = from === 'Celsius' ? v : from === 'Fahrenheit' ? (v - 32) * 5 / 9 : v - 273.15;
    return to === 'Celsius' ? c : to === 'Fahrenheit' ? c * 9 / 5 + 32 : c + 273.15;
  }
  function initUnits() {
    const cat = $('#u-cat'), from = $('#u-from'), to = $('#u-to'), val = $('#u-val'), out = $('#u-out');
    Object.keys(UNITS).forEach(function (c) { cat.append(h('option', { value: c, text: c })); });
    function fill() {
      const names = Object.keys(UNITS[cat.value]);
      [from, to].forEach(function (s) { s.replaceChildren.apply(s, names.map(function (n) { return h('option', { value: n, text: n }); })); });
      to.selectedIndex = Math.min(1, names.length - 1);
      calc();
    }
    function calc() {
      const v = num(val);
      if (isNaN(v)) { out.hidden = true; return; }
      let r;
      if (cat.value === 'Temperature') r = convertTemp(v, from.value, to.value);
      else r = v * UNITS[cat.value][from.value] / UNITS[cat.value][to.value];
      result(out, fmt(Number(r.toPrecision(10)), 8) + ' ' + to.value, null, fmt(v, 8) + ' ' + from.value + ' equals');
    }
    cat.addEventListener('change', fill);
    [from, to, val].forEach(function (e) { e.addEventListener('input', calc); });
    $('#u-swap').addEventListener('click', function () { const t = from.value; from.value = to.value; to.value = t; calc(); });
    fill();
  }

  /* ---------- Salary ---------- */
  function initSalary() {
    const out = $('#sal-out');
    $('#sal-calc').addEventListener('click', function () {
      const cur = $('#sal-cur').value.trim() || 'NPR';
      const gross = num($('#sal-gross')), tax = num($('#sal-tax')) || 0, other = num($('#sal-other')) || 0;
      const months = num($('#sal-months')) || 12, hours = num($('#sal-hours')) || 40;
      if (isNaN(gross) || gross < 0) return fail(out, 'Enter your gross monthly salary.');
      if (tax < 0 || tax > 100 || other < 0 || other > 100 || tax + other > 100) return fail(out, 'Tax and other deductions must be between 0% and 100% in total.');
      const annual = gross * months;
      const taxAmt = annual * tax / 100, otherAmt = annual * other / 100;
      const netAnnual = annual - taxAmt - otherAmt;
      const hoursYear = hours * 52;
      result(out, cur + ' ' + fmt(netAnnual / months) + ' per month take-home', [
        ['Gross per year', cur + ' ' + fmt(annual)],
        ['Income tax', cur + ' ' + fmt(taxAmt)],
        ['Other deductions', cur + ' ' + fmt(otherAmt)],
        ['Net per year', cur + ' ' + fmt(netAnnual)],
        ['Gross per hour', cur + ' ' + fmt(annual / hoursYear)],
        ['Net per hour', cur + ' ' + fmt(netAnnual / hoursYear)]
      ], 'A flat-percentage estimate only.');
    });
  }

  /* ---------- Job application tracker ---------- */
  const KEY = 'rdk_job_tracker_v1';
  const JOB_STATUS = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
  function initTracker() {
    let jobs = [], canSave = true;
    try { jobs = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(jobs)) jobs = []; }
    catch (e) { canSave = false; jobs = []; }
    if (!canSave) $('#job-warning').hidden = false;
    const list = $('#job-list'), summary = $('#job-summary');

    function save() {
      if (!canSave) return;
      try { localStorage.setItem(KEY, JSON.stringify(jobs)); } catch (e) { $('#job-warning').hidden = false; canSave = false; }
    }
    function draw() {
      summary.textContent = jobs.length
        ? jobs.length + ' saved. ' + JOB_STATUS.map(function (s) { return jobs.filter(function (j) { return j.status === s; }).length + ' ' + s.toLowerCase(); }).join(', ') + '.'
        : '';
      if (!jobs.length) { list.replaceChildren(h('p', { class: 'empty', text: 'No applications yet. Add your first one above.' })); return; }
      list.replaceChildren.apply(list, jobs.map(function (j) {
        const sel = h('select', { 'aria-label': 'Status for ' + j.role + ' at ' + j.company });
        JOB_STATUS.forEach(function (s) { sel.append(h('option', { value: s, text: s })); });
        sel.value = j.status;
        sel.addEventListener('change', function () { j.status = sel.value; save(); draw(); });
        const del = h('button', { type: 'button', class: 'btn btn-small btn-danger', text: 'Delete', 'aria-label': 'Delete ' + j.role + ' at ' + j.company });
        del.addEventListener('click', function () {
          if (confirm('Delete this application?')) { jobs = jobs.filter(function (x) { return x.id !== j.id; }); save(); draw(); }
        });
        return h('article', { class: 'job' },
          h('header', null, h('strong', { text: j.role + ' at ' + j.company }), h('span', { class: 'muted small', text: j.date || '' })),
          j.notes ? h('p', { class: 'small', text: j.notes }) : null,
          h('div', { class: 'form-row two' }, sel, del));
      }));
    }

    $('#job-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const f = e.target;
      jobs.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        company: f.elements.company.value.trim(), role: f.elements.role.value.trim(),
        date: f.elements.date.value, status: f.elements.status.value, notes: f.elements.notes.value.trim()
      });
      save(); draw(); f.reset(); f.elements.company.focus();
    });

    $('#job-csv').addEventListener('click', function () {
      if (!jobs.length) return;
      const esc = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
      const csv = ['Company,Role,Date,Status,Notes'].concat(jobs.map(function (j) { return [j.company, j.role, j.date, j.status, j.notes].map(esc).join(','); })).join('\n');
      const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'job-applications.csv' });
      document.body.append(a); a.click(); a.remove();
    });
    $('#job-clear').addEventListener('click', function () {
      if (jobs.length && confirm('Delete ALL saved applications from this browser?')) { jobs = []; save(); draw(); }
    });
    draw();
  }

  initTabs(); initGpa(); initCgpa(); initPercentage(); initAge(); initCounter(); initUnits(); initSalary(); initTracker();
})();
