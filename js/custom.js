/*
 * Custom sections ("My sections") — shared by the PG and MBBS apps.
 * Students design their own logbook sections for anything the built-in ones do not cover.
 * Designs live in db.custom; entries live in db.c['x-<id>'] and use the app's normal list/form engine.
 */
window.CustomSections = function (A) {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 8);
  const defs = () => { const d = A.db(); return (d.custom = d.custom || []); };
  const keyOf = (def) => 'x-' + def.id;
  const isCustom = (key) => /^x-/.test(key);

  const TYPES = [
    ['text', 'Short text'], ['textarea', 'Long text'], ['date', 'Date'],
    ['number', 'Number'], ['select', 'Choice list'], ['yesno', 'Yes / No']
  ];
  const typeName = (t) => (TYPES.find((x) => x[0] === t) || [, t])[1];

  const TEMPLATES = [
    { name: 'Night duties', help: 'Night and emergency duties.', fields: [
      ['Ward / unit', 'select', 'Ward, ICU, Casualty, Labour room, Operation theatre', 1, 1], ['Patients seen', 'number', '', 0, 1],
      ['Emergencies handled', 'number', '', 0, 1], ['Notes', 'textarea', '', 0, 0]] },
    { name: 'Ultrasound / imaging log', help: 'Scans done or observed. Hospital IDs only, never patient names.', fields: [
      ['Study', 'select', 'Abdomen, Obstetric, Doppler, Chest, Musculoskeletal, Other', 1, 1], ['UHID / IP No.', 'text', '', 0, 1],
      ['Level', 'select', 'O – Observed, A – Assisted, PS – Performed under supervision, PI – Performed independently', 0, 1], ['Findings', 'textarea', '', 0, 0]] },
    { name: 'Blood transfusions', help: 'Transfusions you supervised or administered.', fields: [
      ['UHID / IP No.', 'text', '', 0, 1], ['Component', 'select', 'PRBC, FFP, Platelets, Cryoprecipitate, Whole blood', 1, 1],
      ['Indication', 'text', '', 0, 1], ['Transfusion reaction', 'yesno', '', 0, 1], ['Notes', 'textarea', '', 0, 0]] },
    { name: 'Teaching sessions taken', help: 'Classes you took for students, interns or staff.', fields: [
      ['Audience', 'select', 'MBBS Phase I, MBBS Phase II, MBBS Phase III, Interns, Nursing, Paramedical', 1, 1], ['Topic', 'text', '', 1, 1],
      ['Method', 'select', 'Lecture, Small group, Bedside, Skills lab, Demonstration', 0, 1], ['Duration (minutes)', 'number', '', 0, 0]] },
    { name: 'Camps & outreach', help: 'Health camps, screening and community outreach.', fields: [
      ['Place', 'text', '', 1, 1], ['Type', 'select', 'Health camp, Screening, School health, Immunisation, Awareness', 0, 1],
      ['People seen', 'number', '', 0, 1], ['My role', 'text', '', 0, 0]] },
    { name: 'Skills lab practice', help: 'Practice on simulators and manikins.', fields: [
      ['Skill', 'text', '', 1, 1], ['Simulator / model', 'text', '', 0, 1], ['Repetitions', 'number', '', 0, 1], ['Supervised', 'yesno', '', 0, 1]] },
    { name: 'Thesis data collection', help: 'Track recruitment for your thesis.', fields: [
      ['Cases recruited', 'number', '', 1, 1], ['Total so far', 'number', '', 0, 1], ['Problems / notes', 'textarea', '', 0, 0]] }
  ];

  // ---------- Turning designs into app sections ----------
  function toSchema(def) {
    const fields = [{ n: 'date', l: 'Date', t: 'date', req: 1 }];
    def.fields.filter((f) => !f.hidden).forEach((f) => {
      const base = { n: f.n, l: f.l, req: f.req ? 1 : 0 };
      if (f.t === 'select') fields.push({ ...base, t: 'select', o: (f.o || []).map((v) => ({ v, l: v })) });
      else if (f.t === 'yesno') fields.push({ ...base, t: 'select', o: [{ v: 'Yes', l: 'Yes' }, { v: 'No', l: 'No' }] });
      else fields.push({ ...base, t: f.t });
    });
    const cols = ['date', ...def.fields.filter((f) => !f.hidden && f.list && f.t !== 'textarea').slice(0, 4).map((f) => f.n)];
    if (cols.length === 1) { const first = def.fields.find((f) => !f.hidden && f.t !== 'textarea'); if (first) cols.push(first.n); }
    return { title: def.name, help: def.help || 'Your own section. Change its fields under My sections.', fields, cols, custom: true };
  }
  function sync() {
    Object.keys(A.S).forEach((k) => { if (isCustom(k)) delete A.S[k]; });
    defs().forEach((d) => { A.S[keyOf(d)] = toSchema(d); });
  }
  function label(key, r) {
    const d = defs().find((x) => keyOf(x) === key);
    if (!d) return '';
    const parts = d.fields.filter((f) => !f.hidden && f.list && f.t !== 'textarea').map((f) => r[f.n]).filter(Boolean);
    return `${d.name}${parts.length ? ': ' + parts.join(' · ') : ''}`;
  }
  const navItems = () => defs().map((d) => [keyOf(d), d.name]);

  // ---------- Manage page ----------
  function render() {
    const main = $('#main');
    const list = defs();
    main.innerHTML = `
      <div class="head-row"><h1>My sections</h1><div class="head-actions"><button class="btn primary" id="csNew">+ New section</button></div></div>
      <p class="help">Make your own logbook sections for anything the built-in ones don't cover. They work like the others: entries, verification, sign-off sheets, the printed logbook and backups.</p>
      ${list.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Section</th><th>Fields</th><th>Entries</th><th></th></tr></thead><tbody>
        ${list.map((d) => `<tr><td data-label="Section"><a href="#${keyOf(d)}"><b>${esc(d.name)}</b></a></td>
          <td data-label="Fields">${d.fields.filter((f) => !f.hidden).length + 1}</td>
          <td data-label="Entries" class="mono">${A.list(keyOf(d)).length}</td>
          <td class="row-actions"><button class="btn sm" data-edit="${d.id}">Edit</button><button class="btn sm" data-share="${d.id}">Share design</button><button class="btn sm danger" data-del="${d.id}" aria-label="Delete section">✕</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty card">You have no sections of your own yet. Start from a template below, or tap <b>+ New section</b>.</div>'}
      <h2 class="sec-h">Start from a template</h2>
      <div class="cs-templates">${TEMPLATES.map((t, i) => `<button class="btn cs-tpl" data-tpl="${i}"><b>${esc(t.name)}</b><small>${esc(t.fields.map((f) => f[0]).join(', '))}</small></button>`).join('')}</div>
      <h2 class="sec-h">Got a design from a classmate?</h2>
      <div class="card"><p class="help">Paste the design text they shared (it contains no one's entries).</p>
        <label class="field" for="csPaste"><span>Section design</span><textarea id="csPaste" rows="3" placeholder='{"elogbookSection":1, ...}'></textarea></label>
        <div class="actions left"><button class="btn" id="csImport">Add this section</button></div></div>`;
    $('#csNew').onclick = () => openEditor(null);
    main.querySelectorAll('[data-tpl]').forEach((b) => (b.onclick = () => {
      const t = TEMPLATES[+b.dataset.tpl];
      openEditor({ name: t.name, help: t.help, fields: t.fields.map(([l, ty, o, req, lst]) => ({ n: 'f' + uid(), l, t: ty, o: o ? o.split(',').map((s) => s.trim()) : [], req: !!req, list: !!lst })) }, true);
    }));
    main.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => openEditor(defs().find((d) => d.id === b.dataset.edit))));
    main.querySelectorAll('[data-share]').forEach((b) => (b.onclick = () => share(defs().find((d) => d.id === b.dataset.share))));
    main.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => {
      const d = defs().find((x) => x.id === b.dataset.del);
      const n = A.list(keyOf(d)).length;
      A.askConfirm(`Delete "${d.name}"?`, n ? `This deletes the section and its ${n} entr${n > 1 ? 'ies' : 'y'}. Export a backup first if you might need them.` : 'This section has no entries.', 'Delete section', () => {
        A.db().custom = defs().filter((x) => x.id !== d.id);
        delete A.db().c[keyOf(d)];
        sync(); A.save(); A.onChange(); A.toast('Section deleted'); render();
      }, n ? 'DELETE' : undefined);
    }));
    $('#csImport').onclick = () => importDesign($('#csPaste').value);
  }

  // ---------- Editor ----------
  function openEditor(def, fromTemplate) {
    const isNew = !def || fromTemplate;
    const work = JSON.parse(JSON.stringify(def || { name: '', help: '', fields: [{ n: 'f' + uid(), l: '', t: 'text', o: [], req: false, list: true }] }));
    function rowHTML(f, i) {
      return `<div class="cs-field" data-i="${i}">
        <div class="cs-row">
          <label class="field" for="cs_l_${i}"><span>Field name</span><input id="cs_l_${i}" data-k="l" value="${esc(f.l)}" placeholder="e.g. Ward"></label>
          <label class="field" for="cs_t_${i}"><span>Type</span><select id="cs_t_${i}" data-k="t">${TYPES.map(([v, l]) => `<option value="${v}" ${f.t === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        ${f.t === 'select' ? `<label class="field" for="cs_o_${i}"><span>Choices, separated by commas</span><input id="cs_o_${i}" data-k="o" value="${esc((f.o || []).join(', '))}" placeholder="e.g. Ward, ICU, Casualty"></label>` : ''}
        <div class="cs-opts">
          <label class="field check" for="cs_r_${i}"><input type="checkbox" id="cs_r_${i}" data-k="req" ${f.req ? 'checked' : ''}> <span>Required</span></label>
          <label class="field check" for="cs_s_${i}"><input type="checkbox" id="cs_s_${i}" data-k="list" ${f.list ? 'checked' : ''}> <span>Show in list</span></label>
          <span class="cs-move"><button type="button" class="btn sm" data-up="${i}" ${i ? '' : 'disabled'} aria-label="Move up">↑</button>
          <button type="button" class="btn sm danger" data-rm="${i}">Remove</button></span>
        </div></div>`;
    }
    function draw() {
      const shown = work.fields.map((f, i) => [f, i]).filter(([f]) => !f.hidden);
      const hidden = work.fields.map((f, i) => [f, i]).filter(([f]) => f.hidden);
      A.modal(`<h2>${isNew ? 'New section' : 'Edit section'}</h2>
        <form id="csForm" class="cs-form">
          <label class="field" for="cs_name"><span>Section name <b class="req">*</b></span><input id="cs_name" required value="${esc(work.name)}" placeholder="e.g. Night duties"></label>
          <label class="field" for="cs_help"><span>Short description (optional)</span><input id="cs_help" value="${esc(work.help || '')}"></label>
          <h3>Fields</h3>
          <p class="muted small">Every section has a <b>Date</b> field automatically.</p>
          <div id="csFields">${shown.map(([f, i]) => rowHTML(f, i)).join('')}</div>
          <button type="button" class="btn" id="csAdd">+ Add field</button>
          ${hidden.length ? `<div class="cs-hidden"><p class="muted small">Removed fields keep their old data and can be restored:</p>${hidden.map(([f, i]) => `<button type="button" class="btn sm" data-restore="${i}">Restore "${esc(f.l || 'field')}"</button>`).join(' ')}</div>` : ''}
          <div class="actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save section</button></div>
        </form>`);
      const form = $('#csForm');
      const capture = () => {
        work.name = $('#cs_name').value; work.help = $('#cs_help').value;
        form.querySelectorAll('.cs-field').forEach((row) => {
          const f = work.fields[+row.dataset.i];
          row.querySelectorAll('[data-k]').forEach((el) => {
            const k = el.dataset.k;
            if (k === 'req' || k === 'list') f[k] = el.checked;
            else if (k === 'o') f.o = el.value.split(',').map((s) => s.trim()).filter(Boolean);
            else f[k] = el.value;
          });
        });
      };
      form.querySelectorAll('[data-k="t"]').forEach((el) => (el.onchange = () => { capture(); draw(); }));
      $('#csAdd').onclick = () => { capture(); work.fields.push({ n: 'f' + uid(), l: '', t: 'text', o: [], req: false, list: true }); draw(); const ins = form.ownerDocument.querySelectorAll('.cs-field input[data-k="l"]'); if (ins.length) ins[ins.length - 1].focus(); };
      form.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { capture(); const i = +b.dataset.rm; const hasData = A.list(keyOf(work.id ? work : { id: '' })).some((r) => r[work.fields[i].n]); if (hasData) work.fields[i].hidden = true; else work.fields.splice(i, 1); draw(); }));
      form.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => { capture(); const i = +b.dataset.up; let j = i - 1; while (j >= 0 && work.fields[j].hidden) j--; if (j < 0) return; [work.fields[j], work.fields[i]] = [work.fields[i], work.fields[j]]; draw(); }));
      form.querySelectorAll('[data-restore]').forEach((b) => (b.onclick = () => { capture(); work.fields[+b.dataset.restore].hidden = false; draw(); }));
      form.addEventListener('submit', (e) => {
        e.preventDefault(); capture();
        work.name = work.name.trim();
        work.fields = work.fields.filter((f) => f.hidden || f.l.trim());
        if (!work.name) return A.toast('Give the section a name.');
        if (!work.fields.some((f) => !f.hidden)) return A.toast('Add at least one field besides the date.');
        const bad = work.fields.find((f) => !f.hidden && f.t === 'select' && !(f.o || []).length);
        if (bad) return A.toast(`Add the choices for "${bad.l}".`);
        work.fields.forEach((f) => (f.l = f.l.trim()));
        if (isNew) { work.id = uid(); defs().push(work); }
        else { const i = defs().findIndex((d) => d.id === work.id); defs()[i] = work; }
        sync(); A.save(); A.closeModal(); A.onChange(); A.toast(isNew ? `"${work.name}" added to your sections` : 'Section saved');
        if (isNew) location.hash = '#' + keyOf(work); else render();
      });
    }
    draw();
  }

  // ---------- Sharing designs ----------
  function designText(d) {
    return JSON.stringify({ elogbookSection: 1, name: d.name, help: d.help || '', fields: d.fields.filter((f) => !f.hidden).map((f) => ({ l: f.l, t: f.t, o: f.o || [], req: !!f.req, list: !!f.list })) });
  }
  function share(d) {
    const text = designText(d);
    A.modal(`<h2>Share "${esc(d.name)}"</h2>
      <p class="help">This shares only the design (the section name and fields), never your entries. A classmate pastes it under My sections.</p>
      <textarea id="csOut" rows="5" readonly>${esc(text)}</textarea>
      <div class="actions left">
        ${navigator.share ? '<button class="btn primary" id="csSend">Send (WhatsApp, email…)</button>' : ''}
        <button class="btn" id="csCopy">Copy</button>
        <button class="btn" data-close>Close</button>
      </div>`);
    if ($('#csSend')) $('#csSend').onclick = () => navigator.share({ title: `Logbook section: ${d.name}`, text }).catch(() => {});
    $('#csCopy').onclick = () => {
      const ta = $('#csOut');
      navigator.clipboard && navigator.clipboard.writeText(text).then(() => A.toast('Copied')).catch(() => { ta.select(); A.toast('Selected. Copy it from the box.'); });
      if (!navigator.clipboard) { ta.select(); A.toast('Selected. Copy it from the box.'); }
    };
  }
  function importDesign(raw) {
    let d;
    try {
      const m = String(raw).match(/\{[\s\S]*\}/);
      d = JSON.parse(m ? m[0] : raw);
      if (!d || d.elogbookSection !== 1 || !d.name || !Array.isArray(d.fields)) throw new Error();
    } catch (e) { return A.toast("That doesn't look like a section design. Paste the whole text you received."); }
    const okT = TYPES.map((x) => x[0]);
    const def = { id: uid(), name: String(d.name).slice(0, 60), help: String(d.help || '').slice(0, 200),
      fields: d.fields.filter((f) => f && f.l && okT.includes(f.t)).slice(0, 20).map((f) => ({ n: 'f' + uid(), l: String(f.l).slice(0, 60), t: f.t, o: (f.o || []).map(String).slice(0, 30), req: !!f.req, list: !!f.list })) };
    if (!def.fields.length) return A.toast('That design has no usable fields.');
    defs().push(def); sync(); A.save(); A.onChange(); A.toast(`"${def.name}" added`); render();
  }

  sync();
  return { sync, render, label, navItems, isCustom };
};
