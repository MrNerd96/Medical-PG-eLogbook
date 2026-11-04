/*
 * Sign-off sheets (print and sign) — shared by the PG and MBBS apps.
 * PGMER-2023 cl. 5.2(vii): the guide assesses and authenticates the e-log book monthly.
 * The student picks any date range, prints a sheet, gets it signed on paper and records it here.
 * Deliberately flexible: nothing is locked, entries stay editable, ranges may overlap.
 */
window.SignOff = function (A) {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = () => iso(new Date());
  const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return d ? `${d}-${m}-${y}` : s; };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = (m) => { const [y, mo] = m.split('-'); return `${MONTHS[+mo - 1]} ${y}`; };
  const monthStart = (m) => `${m}-01`;
  const monthEnd = (m) => { const [y, mo] = m.split('-').map(Number); return iso(new Date(y, mo, 0)); };
  const addMonths = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return iso(d).slice(0, 7); };
  const sheets = () => { const d = A.db(); return (d.signoffs = d.signoffs || []); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- Entries ----------
  const dateOf = (key, r) => A.entryDate(key, r) || (r.created || '').slice(0, 10);
  const subjectOf = (key, r) => (A.subjectOf ? A.subjectOf(key, r) : '');
  function itemsIn(from, to, f) {
    const out = [];
    const secs = f && f.secs && f.secs.length ? f.secs : null;
    const subj = f && f.subject;
    A.sections.forEach((s) => {
      if (secs && !secs.includes(s.key)) return;
      A.list(s.key).forEach((r) => {
        const d = dateOf(s.key, r);
        if (!d || d < from || d > to) return;
        if (subj && subjectOf(s.key, r) !== subj) return;
        out.push({ key: s.key, section: s.title, r });
      });
    });
    return out.sort((a, b) => dateOf(a.key, a.r).localeCompare(dateOf(b.key, b.r)));
  }
  function firstDate() {
    let f = A.startDate() || '';
    A.sections.forEach((s) => A.list(s.key).forEach((r) => { const d = dateOf(s.key, r); if (d && (!f || d < f)) f = d; }));
    return f;
  }
  const lastSignedTo = () => sheets().reduce((m, s) => (s.to > m ? s.to : m), '');
  const nextDay = (d) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + 1); return iso(x); };

  // ---------- Month coverage (for the gentle monthly nudge) ----------
  function months() {
    const f = firstDate();
    if (!f) return [];
    const out = [];
    let m = f.slice(0, 7);
    const end = today().slice(0, 7);
    for (let i = 0; i < 120 && m <= end; i++) { out.push(m); m = addMonths(m, 1); }
    return out.reverse();
  }
  function monthState(m) {
    const items = itemsIn(monthStart(m), monthEnd(m));
    if (!items.length) return { s: 'empty', items };
    const covers = (s, i) => { const d = dateOf(i.key, i.r); return d >= s.from && d <= s.to && (!s.secs || !s.secs.length || s.secs.includes(i.key)) && (!s.subject || subjectOf(i.key, i.r) === s.subject); };
    const covered = items.filter((i) => sheets().some((s) => covers(s, i))).length;
    if (covered === items.length) return { s: 'signed', items, covered };
    if (m >= today().slice(0, 7)) return { s: 'open', items, covered };
    return { s: covered ? 'part' : 'due', items, covered };
  }
  const PILL = {
    signed: '<span class="pill ok">✓ Signed</span>',
    part: '<span class="pill pend">Partly signed</span>',
    due: '<span class="pill bad">Not signed</span>',
    open: '<span class="pill">In progress</span>',
    empty: '<span class="muted small">No entries</span>'
  };

  // ---------- Photo ----------
  function shrinkImage(file, max = 1100, q = 0.6) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a readable image.')); };
      img.src = url;
    });
  }

  // ---------- Views ----------
  let view = null; // null | { mode: 'new', from, to } | { mode: 'sheet', from, to, id? } | { mode: 'view', id }
  function reset() { view = null; }
  function go(v) { view = v; render(); window.scrollTo(0, 0); }
  function render() {
    const main = $('#main');
    if (!view) return renderHome(main);
    if (view.mode === 'sheet') return renderSheet(main, view);
    if (view.mode === 'view') return renderRecord(main, view.id);
    return renderNew(main, view);
  }

  function presets() {
    const t = today(), cm = t.slice(0, 7), lm = addMonths(cm, -1);
    const last = lastSignedTo();
    const list = [];
    if (last && last < t) list.push(['Since last sign-off', nextDay(last), t]);
    list.push(['Last month', monthStart(lm), monthEnd(lm)], ['This month', monthStart(cm), t], ['Last 3 months', monthStart(addMonths(cm, -2)), t]);
    const f = firstDate(); if (f) list.push(['Everything so far', f, t]);
    return list;
  }

  function renderHome(main) {
    const list = sheets().slice().sort((a, b) => b.to.localeCompare(a.to));
    const ms = months().slice(0, 12);
    main.innerHTML = `
      <div class="head-row"><h1>Sign-off sheets</h1><div class="head-actions"><button class="btn primary" id="soNew">+ New sheet</button></div></div>
      <p class="help">${A.ruleNote}</p>
      <div class="card"><h3>How it works</h3>
        <ol class="how">
          <li>Choose any dates, <b>from</b> and <b>to</b>, and print the sheet (or save it as a PDF and print it at a shop).</li>
          <li>Your ${esc(A.reviewerRole.toLowerCase())} reads it and <b>signs on paper</b>.</li>
          <li>Tap <b>Mark as signed</b>. Adding a photo of the signed sheet is optional.</li>
        </ol>
        <p class="muted small">You can keep editing your entries at any time, and print a new sheet whenever you like.</p>
      </div>
      <h2 class="sec-h">Signed sheets</h2>
      ${list.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Period</th><th>Entries</th><th>Signed by</th><th>Date signed</th><th></th></tr></thead><tbody>
        ${list.map((s) => `<tr><td data-label="Period"><span class="mono">${fmtDate(s.from)} – ${fmtDate(s.to)}</span>${filterLabel(s) ? `<br><span class="muted small">${esc(filterLabel(s))}</span>` : ''}</td><td data-label="Entries" class="mono">${s.count}</td>
          <td data-label="Signed by">${esc(s.reviewer)}</td><td data-label="Date signed" class="mono">${fmtDate(s.date)}</td>
          <td class="row-actions"><button class="btn sm" data-view="${s.id}">View</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty card">No signed sheets yet. Tap <b>+ New sheet</b> to print your first one.</div>'}
      <h2 class="sec-h">Months</h2>
      <p class="help small">The NMC rule asks for a monthly check, so this shows which months are covered by a signed sheet. It is a reminder only.</p>
      ${ms.length ? `<div class="table-wrap"><table class="data compact"><thead><tr><th>Month</th><th>Entries</th><th>Status</th><th></th></tr></thead><tbody>
        ${ms.map((m) => { const st = monthState(m); return `<tr><td>${monthLabel(m)}</td><td class="num">${st.items.length}</td><td>${PILL[st.s]}</td>
          <td class="row-actions">${st.s === 'due' || st.s === 'part' ? `<button class="btn sm" data-month="${m}">Print</button>` : ''}</td></tr>`; }).join('')}
        </tbody></table></div>` : '<p class="muted">Add your joining date in Profile or log an entry to see months here.</p>'}`;
    $('#soNew').onclick = () => { const p = presets()[0]; go({ mode: 'new', from: p[1], to: p[2] }); };
    main.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => go({ mode: 'view', id: b.dataset.view })));
    main.querySelectorAll('[data-month]').forEach((b) => (b.onclick = () => go({ mode: 'new', from: monthStart(b.dataset.month), to: monthEnd(b.dataset.month) })));
  }

  function summaryRows(items) {
    return A.sections.map((s) => [s.title, items.filter((i) => i.key === s.key).length]).filter(([, n]) => n);
  }

  function filterLabel(f) {
    const parts = [];
    if (f && f.secs && f.secs.length && f.secs.length < A.sections.length) parts.push(f.secs.map((k) => (A.sections.find((x) => x.key === k) || {}).title).join(', '));
    if (f && f.subject) parts.push(A.subjectName(f.subject));
    return parts.join(' · ');
  }
  function renderNew(main, v) {
    v.secs = v.secs || [];
    const items = itemsIn(v.from, v.to, v);
    const counts = Object.fromEntries(A.sections.map((s) => [s.key, itemsIn(v.from, v.to, { subject: v.subject, secs: [s.key] }).length]));
    main.innerHTML = `
      <div class="head-row"><button class="btn sm" id="soBack">← Sign-off sheets</button></div>
      <h1>New sign-off sheet</h1>
      <div class="card">
        <h3>Choose the period</h3>
        <div class="chips so-presets">${presets().map(([l, f, t]) => `<button type="button" class="btn sm ${f === v.from && t === v.to ? 'primary' : ''}" data-f="${f}" data-t="${t}">${esc(l)}</button>`).join('')}</div>
        <div class="form-grid so-dates">
          <label class="field" for="so_from"><span>From</span><input id="so_from" type="date" value="${v.from}"></label>
          <label class="field" for="so_to"><span>To</span><input id="so_to" type="date" value="${v.to}"></label>
        </div>
        <details class="so-filter" ${v.secs.length || v.subject ? 'open' : ''}><summary>Choose what to include <span class="muted small">(optional)</span></summary>
          ${A.subjects ? `<label class="field so-subj" for="so_subj"><span>Subject</span><select id="so_subj"><option value="">All subjects</option>${A.subjects().map((x) => `<option value="${esc(x.v)}" ${v.subject === x.v ? 'selected' : ''}>${esc(x.l)}</option>`).join('')}</select></label>` : ''}
          <div class="so-secs">${A.sections.filter((s) => counts[s.key] || v.secs.includes(s.key)).map((s) => `<label class="field check" for="so_s_${s.key}"><input type="checkbox" id="so_s_${s.key}" data-sec="${s.key}" ${!v.secs.length || v.secs.includes(s.key) ? 'checked' : ''}> <span>${esc(s.title)} <span class="muted mono small">${counts[s.key]}</span></span></label>`).join('') || '<p class="muted small">No entries in these dates.</p>'}</div>
        </details>
        <p class="so-count"><b class="mono">${items.length}</b> entries from <span class="mono">${fmtDate(v.from)}</span> to <span class="mono">${fmtDate(v.to)}</span>${filterLabel(v) ? ` · ${esc(filterLabel(v))}` : ''}</p>
        <div class="actions left">
          <button class="btn primary" id="soPrint" ${items.length ? '' : 'disabled'}>Print sheet</button>
          <button class="btn" id="soMark" ${items.length ? '' : 'disabled'}>Mark as signed</button>
        </div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Summary</h3><table class="data compact"><tbody>${summaryRows(items).map(([l, n]) => `<tr><td>${esc(l)}</td><td class="num">${n}</td></tr>`).join('') || '<tr><td class="muted">No entries in these dates.</td></tr>'}</tbody></table></div>
        <div class="card"><h3>Entries</h3><ol class="mr-entries">${items.map((i) => `<li><span class="mono small">${fmtDate(dateOf(i.key, i.r))}</span> <span class="muted small">${esc(i.section)}</span><br>${esc(A.entryLabel(i.key, i.r))}</li>`).join('') || '<li class="muted">Nothing to show.</li>'}</ol></div>
      </div>`;
    const setRange = (f, t) => { if (f && t && t < f) { A.toast('The "To" date must be on or after the "From" date.'); return; } go({ mode: 'new', from: f, to: t, secs: v.secs, subject: v.subject }); };
    main.querySelectorAll('[data-sec]').forEach((c) => (c.onchange = () => {
      const all = [...main.querySelectorAll('[data-sec]')];
      const on = all.filter((x) => x.checked).map((x) => x.dataset.sec);
      if (!on.length) { c.checked = true; return A.toast('Keep at least one section.'); }
      go({ mode: 'new', from: v.from, to: v.to, subject: v.subject, secs: on.length === all.length ? [] : on });
    }));
    if ($('#so_subj')) $('#so_subj').onchange = (e) => go({ mode: 'new', from: v.from, to: v.to, secs: v.secs, subject: e.target.value });
    $('#soBack').onclick = () => go(null);
    main.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => setRange(b.dataset.f, b.dataset.t)));
    $('#so_from').onchange = (e) => setRange(e.target.value, $('#so_to').value);
    $('#so_to').onchange = (e) => setRange($('#so_from').value, e.target.value);
    $('#soPrint').onclick = () => go({ mode: 'sheet', from: v.from, to: v.to, secs: v.secs, subject: v.subject });
    $('#soMark').onclick = () => openSignedForm({ from: v.from, to: v.to, secs: v.secs, subject: v.subject });
  }

  function renderRecord(main, id) {
    const s = sheets().find((x) => x.id === id);
    if (!s) return go(null);
    const items = itemsIn(s.from, s.to, s);
    main.innerHTML = `
      <div class="head-row"><button class="btn sm" id="soBack">← Sign-off sheets</button></div>
      <h1 class="mono-h">${fmtDate(s.from)} – ${fmtDate(s.to)}</h1>
      ${filterLabel(s) ? `<p class="muted">Includes: ${esc(filterLabel(s))}</p>` : ''}
      <div class="card">
        <h3>Signed record</h3>
        <dl class="kv-list">
          <div><dt>Signed by</dt><dd>${esc(s.reviewer)}</dd></div>
          <div><dt>Date signed</dt><dd class="mono">${fmtDate(s.date)}</dd></div>
          ${s.rating ? `<div><dt>Assessment</dt><dd>${esc(s.rating)}</dd></div>` : ''}
          ${s.remarks ? `<div><dt>Remarks</dt><dd>${esc(s.remarks)}</dd></div>` : ''}
          <div><dt>Entries when signed</dt><dd class="mono">${s.count}</dd></div>
          <div><dt>Entries now</dt><dd class="mono">${items.length}</dd></div>
        </dl>
        ${s.photo ? `<img class="mr-photo" src="${s.photo}" alt="Photo of the signed sheet">` : '<p class="muted small">No photo added.</p>'}
        <div class="actions left">
          <button class="btn" id="soReprint">Print this sheet again</button>
          <button class="btn" id="soEdit">Edit record</button>
          <button class="btn danger" id="soDel">Delete record</button>
        </div>
      </div>`;
    $('#soBack').onclick = () => go(null);
    $('#soReprint').onclick = () => go({ mode: 'sheet', from: s.from, to: s.to, secs: s.secs, subject: s.subject, back: { mode: 'view', id } });
    $('#soEdit').onclick = () => openSignedForm(s);
    $('#soDel').onclick = () => A.askConfirm('Delete this signed record?', 'The record and its photo will be deleted. Your entries stay as they are.', 'Delete record', () => {
      const d = A.db(); d.signoffs = sheets().filter((x) => x.id !== id); A.save(); A.toast('Record deleted'); A.onChange(); go(null);
    });
  }

  function openSignedForm(prev) {
    let photo = prev.photo || '';
    A.modal(`<h2>Mark as signed</h2>
      <p class="help">Copy the details from the signed sheet.</p>
      <form id="soForm" class="form-grid">
        <label class="field" for="sf_from"><span>Period from <b class="req">*</b></span><input id="sf_from" name="from" type="date" required value="${prev.from}"></label>
        <label class="field" for="sf_to"><span>Period to <b class="req">*</b></span><input id="sf_to" name="to" type="date" required value="${prev.to}"></label>
        <label class="field" for="sf_by"><span>Signed by <b class="req">*</b></span><input id="sf_by" name="by" required value="${esc(prev.reviewer || A.defaultReviewer())}"></label>
        <label class="field" for="sf_on"><span>Date signed <b class="req">*</b></span><input id="sf_on" name="on" type="date" required value="${prev.date || today()}"></label>
        <label class="field" for="sf_rt"><span>Assessment ticked</span><select id="sf_rt" name="rating"><option value="">— not marked —</option>${['Satisfactory', 'Needs improvement'].map((x) => `<option ${prev.rating === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="field wide" for="sf_rm"><span>Remarks written on the sheet</span><textarea id="sf_rm" name="remarks" rows="2">${esc(prev.remarks || '')}</textarea></label>
        <label class="field wide" for="sf_ph"><span>Photo of the signed sheet (optional)</span><input id="sf_ph" type="file" accept="image/*"></label>
        <div class="wide" id="sfPrev">${photo ? `<img class="mr-photo sm" src="${photo}" alt="Current photo">` : ''}</div>
        <div class="actions wide"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div>
      </form>`);
    $('#sf_ph').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { photo = await shrinkImage(f); $('#sfPrev').innerHTML = `<img class="mr-photo sm" src="${photo}" alt="Selected photo">`; }
      catch (err) { A.toast(err.message); }
    };
    $('#soForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.elements;
      if (f.to.value < f.from.value) return A.toast('The "To" date must be on or after the "From" date.');
      const by = f.by.value.trim(), on = f.on.value;
      const filt = { secs: prev.secs || [], subject: prev.subject || '' };
      const items = itemsIn(f.from.value, f.to.value, filt);
      items.forEach((i) => { if (i.r.status !== 'Verified') Object.assign(i.r, { status: 'Verified', verifiedBy: by, verifiedOn: on, verifyRemark: 'Sign-off sheet' }); });
      const rec = { id: prev.id || uid(), from: f.from.value, to: f.to.value, reviewer: by, date: on, rating: f.rating.value, remarks: f.remarks.value.trim(), photo, count: items.length, secs: filt.secs, subject: filt.subject, savedAt: new Date().toISOString() };
      const d = A.db();
      d.signoffs = sheets().filter((x) => x.id !== rec.id).concat(rec);
      A.save(); A.closeModal(); A.toast('Saved as signed'); A.onChange();
      go({ mode: 'view', id: rec.id });
    });
  }

  function renderSheet(main, v) {
    const items = itemsIn(v.from, v.to, v);
    const stu = A.student();
    main.innerHTML = `
      <div class="no-print head-row"><button class="btn sm" id="soBack">← Back</button>
        <div class="head-actions">${A.FRAMED ? '<span class="pill pend">Printing works in the installed app</span>' : '<button class="btn primary" id="soDoPrint">Print / Save as PDF</button>'}</div></div>
      <p class="help no-print">Prints on portrait A4. Choose "Save as PDF" in the print window to print it at a shop.</p>
      <div class="report sheet">
        <div class="sheet-head">
          <div><div class="sheet-kicker">${esc(A.sheetTitle)}</div><h1>${fmtDate(v.from)} to ${fmtDate(v.to)}</h1></div>
          <div class="sheet-code"><span>Entries</span><b>${items.length}</b></div>
        </div>
        <table class="rep kv sheet-kv"><tbody>
          <tr><th>Student</th><td>${esc(stu.name || '')}</td><th>${esc(A.reviewerRole)}</th><td>${esc(A.defaultReviewer() || '')}</td></tr>
          <tr><th>Course</th><td>${esc(stu.line || '')}</td><th>Institution</th><td>${esc(stu.college || '')}</td></tr>
          ${filterLabel(v) ? `<tr><th>Includes</th><td colspan="3">${esc(filterLabel(v))}</td></tr>` : ''}
        </tbody></table>
        <h2>Summary</h2>
        <table class="rep"><tbody>${summaryRows(items).map(([l, n]) => `<tr><td>${esc(l)}</td><td style="width:70px;text-align:right">${n}</td></tr>`).join('') || '<tr><td>No entries in this period.</td></tr>'}</tbody></table>
        <h2>Entries</h2>
        <table class="rep"><thead><tr><th style="width:32px">#</th><th style="width:88px">Date</th><th style="width:150px">Section</th><th>Entry</th></tr></thead>
          <tbody>${items.map((i, n) => `<tr><td>${n + 1}</td><td>${fmtDate(dateOf(i.key, i.r))}</td><td>${esc(i.section)}</td><td>${esc(A.entryLabel(i.key, i.r))}</td></tr>`).join('')}</tbody></table>
        <h2>Assessment by ${esc(A.reviewerRole.toLowerCase())}</h2>
        <p class="sheet-boxes"><span>☐ Satisfactory</span><span>☐ Needs improvement</span></p>
        <p>Remarks:</p>
        <div class="sheet-lines"><div></div><div></div><div></div></div>
        <div class="sig-row"><div>Signature of student<br><br>Date:</div><div>Name & signature of ${esc(A.reviewerRole.toLowerCase())}<br><br>Date:</div></div>
        <p class="small sheet-foot">${esc(A.sheetFoot)}</p>
      </div>`;
    $('#soBack').onclick = () => go(v.back || { mode: 'new', from: v.from, to: v.to, secs: v.secs, subject: v.subject });
    if ($('#soDoPrint')) $('#soDoPrint').onclick = () => window.print();
  }

  // ---------- Hooks for the host app ----------
  function dueAlerts() {
    const due = months().filter((m) => ['due', 'part'].includes(monthState(m).s));
    if (!due.length) return [];
    return [`No signed sheet yet for <b>${due.slice(0, 3).map(monthLabel).join(', ')}${due.length > 3 ? ` and ${due.length - 3} more` : ''}</b>. <a href="#signoff">Print a sign-off sheet</a> for any dates you like.`];
  }
  function dashboardCard() {
    const ms = months().slice(0, 6);
    return `<div class="card"><h3>Guide sign-off</h3>
      <p class="help small">${A.ruleShort}</p>
      ${ms.length ? `<table class="data compact"><tbody>${ms.map((m) => { const st = monthState(m); return `<tr><td>${monthLabel(m)}</td><td class="num">${st.items.length}</td><td>${PILL[st.s]}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">Months appear once you add your joining date or first entry.</p>'}
      <a class="btn sm" href="#signoff">Print a sign-off sheet</a></div>`;
  }
  function reportSection() {
    const list = sheets().slice().sort((a, b) => a.from.localeCompare(b.from));
    return `<section class="rep-sec"><h2>Sign-off record</h2>
      <p class="small">${esc(A.sheetFoot)}</p>
      <table class="rep"><thead><tr><th>Period</th><th>Entries</th><th>Signed by</th><th>Date signed</th><th>Assessment</th><th>Remarks</th><th>Photo</th></tr></thead>
      <tbody>${list.map((s) => `<tr><td>${fmtDate(s.from)} – ${fmtDate(s.to)}${filterLabel(s) ? `<br><small>${esc(filterLabel(s))}</small>` : ''}</td><td>${s.count}</td><td>${esc(s.reviewer)}</td><td>${fmtDate(s.date)}</td><td>${esc(s.rating || '')}</td><td>${esc(s.remarks || '')}</td><td>${s.photo ? `<img src="${s.photo}" alt="" style="height:44px">` : ''}</td></tr>`).join('') || '<tr><td colspan="7">No signed sheets recorded.</td></tr>'}</tbody></table></section>`;
  }

  return { render, reset, dueAlerts, dashboardCard, reportSection };
};
