/* Medical PG e-Logbook — offline single-page app (vanilla JS, data kept on device). */
(function () {
  'use strict';
  const D = window.PGDATA;
  const STORE_KEY = 'pgElogbook.v1';
  const $ = (s, el = document) => el.querySelector(s);
  let FRAMED = false;
  try { FRAMED = window.self !== window.top; } catch (e) { FRAMED = true; }

  // ---------- Storage ----------
  function blankDB() {
    return {
      version: 1,
      profile: {},
      thesis: {},
      targets: JSON.parse(JSON.stringify(D.DEFAULT_TARGETS)),
      customProcedures: [],
      c: {} // collections
    };
  }
  let db = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blankDB();
      const d = JSON.parse(raw);
      const b = blankDB();
      return Object.assign(b, d, { targets: Object.assign(b.targets, d.targets || {}), c: d.c || {} });
    } catch (e) {
      console.error(e);
      return blankDB();
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(db));
    } catch (e) {
      toast('Could not save. Device storage may be full, so export a backup.');
    }
  }
  const list = (k) => (db.c[k] = db.c[k] || []);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- Helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  function fmtDate(s) {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return d && m && y ? `${d}-${m}-${y}` : s;
  }
  function addMonths(iso, n) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  }
  function daysBetween(a, b) {
    if (!a || !b) return 0;
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1;
  }
  const specialty = () => db.profile.specialty || '';
  function procedureOptions() {
    const base = D.PROCEDURES[specialty()] || D.GENERIC;
    return [...new Set([...base, ...(db.customProcedures || [])])];
  }

  // ---------- Schemas ----------
  const opt = (arr) => arr.map((x) => (typeof x === 'string' ? { v: x, l: x } : x));
  const S = {
    cases: {
      title: 'Clinical Cases', icon: '🩺', group: 'Clinical',
      help: 'Record every case you clerk, present or manage. Use only hospital IDs (UHID/IP no.) — never patient names (DPDP Act 2023).',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'setting', l: 'Setting', t: 'select', o: opt(['OPD', 'IPD / Ward', 'Emergency / Casualty', 'ICU / HDU', 'Operation Theatre', 'Labour Room', 'Laboratory', 'Field / Community', 'DRP – District Hospital']) },
        { n: 'pid', l: 'UHID / IP No.', t: 'text' },
        { n: 'age', l: 'Age', t: 'text' },
        { n: 'sex', l: 'Sex', t: 'select', o: opt(['M', 'F', 'Other']) },
        { n: 'diagnosis', l: 'Diagnosis', t: 'text', req: 1 },
        { n: 'role', l: 'My role', t: 'select', o: opt(['Clerked & presented', 'Managed (primary)', 'Assisted management', 'Observed']) },
        { n: 'competency', l: 'Competency / curriculum code', t: 'text', ph: 'optional, e.g. SO1.3' },
        { n: 'learning', l: 'Management / learning points', t: 'textarea' }
      ],
      cols: ['date', 'setting', 'pid', 'diagnosis', 'role']
    },
    procedures: {
      title: 'Procedures & Skills', icon: '💉', group: 'Clinical',
      help: 'Level of participation per NMC curriculum: O (observed) → A (assisted) → PS (performed under supervision) → PI (performed independently).',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'procedure', l: 'Procedure / skill', t: 'combo', req: 1, src: procedureOptions },
        { n: 'level', l: 'Level of participation', t: 'select', o: D.PARTICIPATION, req: 1 },
        { n: 'pid', l: 'UHID / IP No.', t: 'text' },
        { n: 'indication', l: 'Indication / diagnosis', t: 'text' },
        { n: 'outcome', l: 'Outcome / complications', t: 'text' },
        { n: 'supervisor', l: 'Supervising faculty', t: 'text' }
      ],
      cols: ['date', 'procedure', 'level', 'indication', 'supervisor']
    },
    academics: {
      title: 'Academic Activities', icon: '📚', group: 'Academic',
      help: 'Seminars, journal clubs, case presentations, clinical meetings and UG teaching — the departmental learning activities NMC expects to be logged.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'type', l: 'Activity', t: 'select', req: 1, o: opt(['Seminar', 'Journal Club', 'Case Presentation', 'Clinical / Grand Round', 'Inter-departmental Meeting', 'Clinico-Pathological Conference (CPC)', 'Mortality & Morbidity Meeting', 'UG Teaching (taken by me)', 'Departmental Lecture (attended)', 'Skills Lab Session', 'Other']) },
        { n: 'topic', l: 'Topic', t: 'text', req: 1 },
        { n: 'role', l: 'My role', t: 'select', o: opt(['Presenter', 'Teacher', 'Moderator', 'Attendee']) },
        { n: 'moderator', l: 'Moderator / faculty', t: 'text' },
        { n: 'notes', l: 'Notes / feedback received', t: 'textarea' }
      ],
      cols: ['date', 'type', 'topic', 'role', 'moderator']
    },
    presentations: {
      title: 'Paper & Poster Presentations', icon: '🎤', group: 'Research',
      help: 'PGMER-2023: to be eligible for the final exam you need at least ONE of — a poster or a podium (oral) presentation at a national / zonal / state conference of your specialty, or a first-author research paper (see Publications). NMC clarified in Aug 2025 that this goes by specialty, so national/state IMA conferences also count.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'type', l: 'Type', t: 'select', req: 1, o: opt(['Poster', 'Podium / oral paper', 'E-poster', 'Invited talk', 'Quiz / Competition']) },
        { n: 'title', l: 'Title', t: 'text', req: 1 },
        { n: 'event', l: 'Conference / event', t: 'text', req: 1 },
        { n: 'level', l: 'Level', t: 'select', o: opt(['Institutional', 'State', 'Zonal', 'National', 'International']) },
        { n: 'place', l: 'Venue', t: 'text' },
        { n: 'award', l: 'Award (if any)', t: 'text' }
      ],
      cols: ['date', 'type', 'title', 'event', 'level']
    },
    publications: {
      title: 'Publications', icon: '📄', group: 'Research',
      help: 'A research paper published / accepted in a journal of your specialty as FIRST author satisfies the PGMER-2023 research requirement (one of three options).',
      fields: [
        { n: 'title', l: 'Title', t: 'text', req: 1 },
        { n: 'journal', l: 'Journal', t: 'text', req: 1 },
        { n: 'authorship', l: 'Authorship', t: 'select', o: opt(['First author', 'Corresponding author', 'Co-author']) },
        { n: 'status', l: 'Status', t: 'select', req: 1, o: opt(['Submitted', 'Under review', 'Accepted', 'Published']) },
        { n: 'date', l: 'Date (accepted / published)', t: 'date' },
        { n: 'indexing', l: 'Indexing', t: 'select', o: opt(['PubMed / MEDLINE', 'Scopus', 'Web of Science', 'DOAJ', 'Embase', 'Index Copernicus', 'Other']) },
        { n: 'doi', l: 'DOI / link', t: 'text' }
      ],
      cols: ['date', 'title', 'journal', 'status', 'indexing']
    },
    conferences: {
      title: 'Conferences / CMEs / Workshops', icon: '🏛️', group: 'Research',
      help: 'External and outreach learning activities attended.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'name', l: 'Name of event', t: 'text', req: 1 },
        { n: 'type', l: 'Type', t: 'select', o: opt(['Conference', 'CME', 'Workshop', 'Hands-on course', 'Webinar']) },
        { n: 'organiser', l: 'Organiser / venue', t: 'text' },
        { n: 'credits', l: 'Credit hours', t: 'text' }
      ],
      cols: ['date', 'name', 'type', 'organiser', 'credits']
    },
    wpba: {
      title: 'Workplace-Based Assessments', icon: '📝', group: 'Assessment',
      help: 'Formative assessments: Mini-CEX, DOPS, Case-based Discussion, Multi-source feedback (360°), and internal exams.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'tool', l: 'Assessment tool', t: 'select', req: 1, o: opt(['Mini-CEX', 'DOPS', 'Case-based Discussion (CbD)', 'Multi-source Feedback (360°)', 'OSCE / OSPE', 'Internal Theory Exam', 'Internal Practical / Clinical Exam', 'Viva', 'Other']) },
        { n: 'topic', l: 'Case / skill / topic', t: 'text', req: 1 },
        { n: 'assessor', l: 'Assessor', t: 'text' },
        { n: 'score', l: 'Score / grade', t: 'text' },
        { n: 'feedback', l: 'Feedback', t: 'textarea' },
        { n: 'plan', l: 'Action plan', t: 'textarea' }
      ],
      cols: ['date', 'tool', 'topic', 'assessor', 'score']
    },
    appraisals: {
      title: 'Periodic Appraisal (NMC form)', icon: '⭐', group: 'Assessment',
      help: 'NMC Student Appraisal Form: each element scored 1–9 (1–3 less than satisfactory, 4–6 satisfactory, 7–9 more than satisfactory). Usually done every 3–6 months by the guide/HOD.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'period', l: 'Period', t: 'text', req: 1, ph: 'e.g. Semester 1 / Months 1–6' },
        ...D.APPRAISAL_ITEMS.map(([n, l]) => ({ n, l, t: 'number', min: 1, max: 9 })),
        { n: 'pubs', l: 'Publications', t: 'select', o: opt(['No', 'Yes']) },
        { n: 'remarks', l: 'Remarks / suggestions', t: 'textarea' },
        { n: 'assessor', l: 'Assessed by', t: 'text' }
      ],
      cols: ['date', 'period', 'avg', 'assessor']
    },
    postings: {
      title: 'Postings & DRP', icon: '🏥', group: 'Training',
      help: 'Parent department units, rotational/elective postings and the mandatory 3-month District Residency Programme (DRP). Certification of satisfactory DRP completion is needed for the exam; the college reports DRP details to NMC within 1 week of completion.',
      fields: [
        { n: 'from', l: 'From', t: 'date', req: 1 },
        { n: 'to', l: 'To', t: 'date', req: 1 },
        { n: 'type', l: 'Posting type', t: 'select', req: 1, o: opt(['Parent department', 'Rotational posting', 'District Residency Programme (DRP)', 'Elective', 'Other']) },
        { n: 'dept', l: 'Department / unit / hospital', t: 'text', req: 1 },
        { n: 'remarks', l: 'Work done / remarks', t: 'textarea' }
      ],
      cols: ['from', 'to', 'type', 'dept', 'days']
    },
    leave: {
      title: 'Leave Record', icon: '🗓️', group: 'Training',
      help: 'PGMER-2023: 20 paid casual leaves + 5 paid academic leaves per year, plus one weekly off; maternity/paternity leave as per government rules. Minimum 80% attendance over the course is needed for the exam; leave beyond entitlement extends your tenure.',
      fields: [
        { n: 'from', l: 'From', t: 'date', req: 1 },
        { n: 'to', l: 'To', t: 'date', req: 1 },
        { n: 'type', l: 'Type', t: 'select', o: opt(['Casual leave', 'Earned leave', 'Medical leave', 'Maternity leave', 'Paternity leave', 'Academic leave', 'Other']) },
        { n: 'remarks', l: 'Remarks', t: 'text' }
      ],
      cols: ['from', 'to', 'type', 'days', 'remarks']
    },
    courses: {
      title: 'Courses & Certifications', icon: '🎓', group: 'Training',
      help: 'PGMER-2023 makes research methodology, ethics (incl. GCP/GLP), BCLS and ACLS mandatory for exam eligibility.',
      fields: [
        { n: 'course', l: 'Course', t: 'combo', req: 1, src: () => D.MANDATORY_COURSES.map((c) => c.name) },
        { n: 'date', l: 'Date completed', t: 'date' },
        { n: 'provider', l: 'Provider', t: 'text' },
        { n: 'cert', l: 'Certificate no.', t: 'text' }
      ],
      cols: ['date', 'course', 'provider', 'cert']
    },
    mentor: {
      title: 'Mentor Meetings', icon: '🤝', group: 'Reflection',
      help: 'Mentor–mentee meetings and documented feedback.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'mentor', l: 'Mentor', t: 'text' },
        { n: 'discussion', l: 'Points discussed', t: 'textarea', req: 1 },
        { n: 'actions', l: 'Action points', t: 'textarea' }
      ],
      cols: ['date', 'mentor', 'discussion']
    },
    reflections: {
      title: 'Reflections', icon: '💭', group: 'Reflection',
      help: 'Reflective writing on critical incidents, ethics, communication and professionalism.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'title', l: 'Title', t: 'text', req: 1 },
        { n: 'what', l: 'What happened?', t: 'textarea' },
        { n: 'learning', l: 'What did I learn / what will I do differently?', t: 'textarea' }
      ],
      cols: ['date', 'title']
    }
  };

  const THESIS_FIELDS = [
    { n: 'title', l: 'Thesis title', t: 'textarea' },
    { n: 'guide', l: 'Guide', t: 'text' },
    { n: 'coguide', l: 'Co-guide(s)', t: 'text' },
    { n: 'design', l: 'Study design', t: 'text' },
    { n: 'protocolDate', l: 'Protocol submitted to institution', t: 'date' },
    { n: 'iecNo', l: 'Institutional Ethics Committee approval no.', t: 'text' },
    { n: 'iecDate', l: 'IEC approval date', t: 'date' },
    { n: 'univDate', l: 'Protocol approved by university', t: 'date' },
    { n: 'ctri', l: 'CTRI registration no. (if applicable)', t: 'text' },
    { n: 'dataStart', l: 'Data collection started', t: 'date' },
    { n: 'dataEnd', l: 'Data collection completed', t: 'date' },
    { n: 'submitted', l: 'Thesis submitted to university', t: 'date' },
    { n: 'accepted', l: 'Thesis accepted', t: 'date' },
    { n: 'notes', l: 'Progress notes', t: 'textarea' }
  ];

  const PROFILE_FIELDS = [
    { n: 'name', l: 'Full name', t: 'text', req: 1 },
    { n: 'degree', l: 'Degree', t: 'select', o: opt(['MD', 'MS', 'Diploma', 'DNB', 'DM', 'MCh']) },
    { n: 'specialty', l: 'Specialty', t: 'combo', src: () => [...D.SPECIALTIES.MD, ...D.SPECIALTIES.MS, ...D.SPECIALTIES.Diploma] },
    { n: 'regNo', l: 'Medical council registration no.', t: 'text' },
    { n: 'univRegNo', l: 'University registration / enrolment no.', t: 'text' },
    { n: 'college', l: 'Medical college / institution', t: 'text' },
    { n: 'university', l: 'University', t: 'text' },
    { n: 'joinDate', l: 'Date of joining the course', t: 'date' },
    { n: 'batch', l: 'Academic batch / session', t: 'text', ph: 'e.g. 2025–2028' },
    { n: 'guide', l: 'Guide', t: 'text' },
    { n: 'hod', l: 'Head of Department', t: 'text' },
    { n: 'mentor', l: 'Mentor', t: 'text' },
    { n: 'phone', l: 'Phone', t: 'text' },
    { n: 'email', l: 'Email', t: 'text' }
  ];

  // ---------- Derived values ----------
  function derived(key, r, col) {
    if (col === 'days') return daysBetween(r.from, r.to) || '';
    if (col === 'avg') return appraisalAvg(r);
    return r[col];
  }
  function appraisalAvg(r) {
    const v = D.APPRAISAL_ITEMS.map(([n]) => Number(r[n])).filter((x) => x > 0);
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '';
  }
  function cellValue(key, r, col) {
    const f = (S[key].fields.find((x) => x.n === col) || {});
    const v = derived(key, r, col);
    if (f.t === 'date') return fmtDate(v);
    if (col === 'avg') return v ? `${v} / 9` : '';
    if (col === 'days') return v ? `${v} d` : '';
    return v;
  }
  const MONO = ['pid', 'level', 'days', 'avg', 'score', 'credits', 'cert'];
  const isMono = (key, col) => MONO.includes(col) || (S[key].fields.find((f) => f.n === col) || {}).t === 'date';
  function colLabel(key, col) {
    if (col === 'days') return 'Days';
    if (col === 'avg') return 'Avg score';
    const f = S[key].fields.find((x) => x.n === col);
    return f ? f.l : col;
  }
  const sortKey = (r) => r.date || r.from || '';

  // ---------- Router ----------
  const NAV_GROUPS = [
    ['Overview', [['dashboard', 'Dashboard'], ['profile', 'Profile']]],
    ['Clinical', [['cases', 'Clinical cases'], ['procedures', 'Procedures & skills']]],
    ['Academic', [['academics', 'Academic activities'], ['conferences', 'Conferences & CMEs']]],
    ['Research', [['thesis', 'Thesis'], ['presentations', 'Presentations'], ['publications', 'Publications']]],
    ['Assessment', [['wpba', 'Workplace assessments'], ['appraisals', 'Periodic appraisal']]],
    ['Training', [['postings', 'Postings & DRP'], ['leave', 'Leave'], ['courses', 'Courses'], ['mentor', 'Mentor meetings'], ['reflections', 'Reflections']]],
    ['Logbook', [['report', 'Print logbook'], ['targets', 'Targets & backup'], ['rules', 'NMC rules']]]
  ];

  function renderNav() {
    const cur = location.hash.replace(/^#\/?(c\/)?/, '').replace(/^settings$/, 'targets') || 'dashboard';
    $('#nav').innerHTML = NAV_GROUPS.map(([g, items]) => `<div class="nav-h">${esc(g)}</div>` + items.map(([r, l]) => {
      const n = S[r] ? list(r).length : '';
      return `<a href="#${r}" class="${cur === r ? 'active' : ''}"${cur === r ? ' aria-current="page"' : ''}><span>${esc(l)}</span>${n !== '' ? `<span class="badge">${n}</span>` : ''}</a>`;
    }).join('')).join('') + (FRAMED ? '' : '<a href="mbbs/index.html" class="switch"><span>MBBS (UG) logbook →</span></a>');
  }

  function route() {
    const h = location.hash.replace(/^#\/?(c\/)?/, '').replace(/^settings$/, 'targets') || 'dashboard';
    const main = $('#main');
    document.body.classList.remove('nav-open');
    if (S[h]) renderCollection(h);
    else if (h === 'profile') renderSingle('profile', 'Student Profile', PROFILE_FIELDS, 'These details appear on the cover page of your printed logbook.');
    else if (h === 'thesis') renderSingle('thesis', 'Thesis / Dissertation', THESIS_FIELDS, thesisHelp());
    else if (h === 'report') renderReport();
    else if (h === 'targets') renderSettings();
    else if (h === 'rules') renderRules();
    else renderDashboard();
    renderNav();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  // ---------- Form building ----------
  function inputHTML(f, val, idp = 'f_') {
    const id = idp + f.n;
    const req = f.req ? 'required' : '';
    const v = esc(val == null ? '' : val);
    const ph = f.ph ? `placeholder="${esc(f.ph)}"` : '';
    let control;
    if (f.t === 'textarea') control = `<textarea id="${id}" name="${f.n}" rows="3" ${req} ${ph}>${v}</textarea>`;
    else if (f.t === 'select') control = `<select id="${id}" name="${f.n}" ${req}><option value="">— select —</option>${f.o.map((o) => `<option value="${esc(o.v)}" ${String(val) === o.v ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
    else if (f.t === 'combo') control = `<input id="${id}" name="${f.n}" list="${id}_dl" value="${v}" ${req} ${ph} autocomplete="off"><datalist id="${id}_dl">${f.src().map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`;
    else if (f.t === 'number') control = `<input id="${id}" name="${f.n}" type="number" inputmode="numeric" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${v}" ${req}>`;
    else control = `<input id="${id}" name="${f.n}" type="${f.t}" value="${v}" ${req} ${ph}>`;
    return `<label class="field ${f.t === 'textarea' ? 'wide' : ''}" for="${id}"><span>${esc(f.l)}${f.req ? ' <b class="req">*</b>' : ''}</span>${control}</label>`;
  }
  function readForm(form, fields) {
    const o = {};
    fields.forEach((f) => {
      const el = form.elements[f.n];
      if (el) o[f.n] = el.value.trim();
    });
    return o;
  }

  // ---------- Single-record pages (profile, thesis) ----------
  function renderSingle(key, title, fields, help) {
    const rec = db[key] || {};
    $('#main').innerHTML = `
      <h1>${esc(title)}</h1>
      <p class="help">${help}</p>
      <form id="sf" class="card form-grid">
        ${fields.map((f) => inputHTML(f, rec[f.n])).join('')}
        <div class="actions wide"><button class="btn primary" type="submit">Save</button></div>
      </form>`;
    $('#sf').addEventListener('submit', (e) => {
      e.preventDefault();
      db[key] = Object.assign({}, db[key], readForm(e.target, fields));
      save();
      toast('Saved');
      renderNav();
      if (key === 'thesis') renderSingle(key, title, fields, thesisHelp());
    });
  }
  function thesisHelp() {
    const j = db.profile.joinDate;
    const t = db.targets;
    let s = 'Thesis is mandatory for MD/MS (PGMER-2023). Submit the protocol early, obtain IEC approval before starting data collection, and submit the thesis to the university before the final exam deadline.';
    if (j) s += ` <br><b>Based on your joining date:</b> protocol due by <b>${fmtDate(addMonths(j, t.thesisProtocolMonths))}</b>, thesis submission due by <b>${fmtDate(addMonths(j, t.thesisSubmitMonths))}</b> (adjust in Targets if your university differs).`;
    else s += ' <br>Add your joining date in Profile to see due dates.';
    return s;
  }

  // ---------- Collections ----------
  const state = { filter: '', status: '' };
  function renderCollection(key) {
    const sc = S[key];
    const rows = list(key).slice().sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
    const q = state.filter.toLowerCase();
    const shown = rows.filter((r) => (!state.status || r.status === state.status) &&
      (!q || Object.values(r).some((v) => String(v).toLowerCase().includes(q))));
    const pending = rows.filter((r) => r.status !== 'Verified').length;
    const extra = key === 'courses' ? courseChecklist() : key === 'procedures' ? procedureSummary() : '';
    $('#main').innerHTML = `
      <div class="head-row">
        <h1>${esc(sc.title)}</h1>
        <div class="head-actions">
          <button class="btn primary" id="addBtn">+ Add entry</button>
        </div>
      </div>
      <p class="help">${esc(sc.help)}</p>
      ${extra}
      <div class="toolbar">
        <input id="q" type="search" placeholder="Search…" value="${esc(state.filter)}" aria-label="Search entries">
        <select id="st" aria-label="Filter by status">
          <option value="">All (${rows.length})</option>
          <option value="Pending" ${state.status === 'Pending' ? 'selected' : ''}>Pending (${pending})</option>
          <option value="Verified" ${state.status === 'Verified' ? 'selected' : ''}>Verified (${rows.length - pending})</option>
        </select>
        <button class="btn" id="verifyAll" ${pending ? '' : 'disabled'}>Verify pending…</button>
        <button class="btn" id="csv" ${rows.length ? '' : 'disabled'}>Export CSV</button>
      </div>
      ${shown.length ? `
      <div class="table-wrap"><table class="data">
        <thead><tr>${sc.cols.map((c) => `<th>${esc(colLabel(key, c))}</th>`).join('')}<th>Status</th><th></th></tr></thead>
        <tbody>${shown.map((r) => `
          <tr data-id="${r.id}">
            ${sc.cols.map((c) => `<td data-label="${esc(colLabel(key, c))}"${isMono(key, c) ? ' class="mono"' : ''}>${esc(cellValue(key, r, c))}</td>`).join('')}
            <td data-label="Status">${statusPill(r)}</td>
            <td class="row-actions">
              <button class="btn sm" data-act="edit">Edit</button>
              ${r.status === 'Verified' ? '' : '<button class="btn sm" data-act="verify">Verify</button>'}
              <button class="btn sm danger" data-act="del" aria-label="Delete">✕</button>
            </td>
          </tr>`).join('')}
        </tbody></table></div>` : `<div class="empty card">No entries yet. Tap <b>+ Add entry</b> to start.</div>`}`;

    $('#addBtn').onclick = () => openEntry(key);
    $('#q').oninput = (e) => { state.filter = e.target.value; renderCollection(key); const el = $('#q'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    $('#st').onchange = (e) => { state.status = e.target.value; renderCollection(key); };
    $('#csv').onclick = () => exportCSV(key);
    $('#verifyAll').onclick = () => openVerify(key, rows.filter((r) => r.status !== 'Verified').map((r) => r.id));
    $('#main').querySelectorAll('tr[data-id] button').forEach((b) => {
      b.onclick = () => {
        const id = b.closest('tr').dataset.id;
        if (b.dataset.act === 'edit') openEntry(key, id);
        else if (b.dataset.act === 'verify') openVerify(key, [id]);
        else if (b.dataset.act === 'del') askConfirm('Delete this entry?', 'This entry will be removed permanently.', 'Delete', () => {
          db.c[key] = list(key).filter((r) => r.id !== id);
          save();
          renderCollection(key);
          renderNav();
          toast('Entry deleted');
        });
      };
    });
  }
  function statusPill(r) {
    if (r.status === 'Verified') return `<span class="pill ok" title="${esc('Verified by ' + (r.verifiedBy || '') + ' on ' + fmtDate(r.verifiedOn))}">✓ Verified</span>`;
    return '<span class="pill pend">Pending</span>';
  }

  function openEntry(key, id) {
    const sc = S[key];
    const rec = id ? list(key).find((r) => r.id === id) : {};
    const defaults = {};
    sc.fields.forEach((f) => { if (f.t === 'date' && f.req && !id) defaults[f.n] = today(); });
    if (!id && key === 'mentor') defaults.mentor = db.profile.mentor || '';
    const editingVerified = rec.status === 'Verified';
    modal(`
      <h2>${id ? 'Edit' : 'New'} — ${esc(sc.title)}</h2>
      ${editingVerified ? '<p class="warn">This entry is verified. Saving changes will reset it to <b>Pending</b> for re-verification.</p>' : ''}
      <form id="ef" class="form-grid">
        ${sc.fields.map((f) => inputHTML(f, rec[f.n] != null ? rec[f.n] : defaults[f.n])).join('')}
        <div class="actions wide">
          <button type="button" class="btn" data-close>Cancel</button>
          <button type="submit" class="btn primary">Save</button>
        </div>
      </form>`);
    $('#ef').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = readForm(e.target, sc.fields);
      if (data.from && data.to && data.to < data.from) return toast('The "To" date must be on or after the "From" date.');
      if (key === 'procedures' && data.procedure && !procedureOptions().includes(data.procedure)) {
        db.customProcedures.push(data.procedure);
      }
      if (id) {
        const changed = sc.fields.some((f) => (rec[f.n] || '') !== (data[f.n] || ''));
        Object.assign(rec, data, { updated: new Date().toISOString() });
        if (changed && editingVerified) Object.assign(rec, { status: 'Pending', verifiedBy: '', verifiedOn: '', verifyRemark: '' });
      } else {
        list(key).push(Object.assign({ id: uid(), created: new Date().toISOString(), status: 'Pending' }, data));
      }
      save();
      closeModal();
      toast('Saved');
      renderCollection(key);
      renderNav();
    });
  }

  function openVerify(key, ids) {
    if (!ids.length) return;
    modal(`
      <h2>Faculty verification</h2>
      <p class="help">To be completed by the supervising faculty / guide / HOD. ${ids.length} entr${ids.length > 1 ? 'ies' : 'y'} will be marked verified. The printed logbook still carries a signature column for physical counter-signing.</p>
      <form id="vf" class="form-grid">
        <label class="field"><span>Faculty name & designation <b class="req">*</b></span><input name="by" required value="${esc(db.lastVerifier || '')}"></label>
        <label class="field"><span>Date <b class="req">*</b></span><input name="on" type="date" required value="${today()}"></label>
        <label class="field wide"><span>Remarks</span><input name="remark"></label>
        <label class="field wide check"><input type="checkbox" name="ok" required> <span>I have reviewed ${ids.length > 1 ? 'these entries' : 'this entry'} with the student.</span></label>
        <div class="actions wide"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Mark verified</button></div>
      </form>`);
    $('#vf').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.elements;
      db.lastVerifier = f.by.value.trim();
      list(key).forEach((r) => {
        if (ids.includes(r.id)) Object.assign(r, { status: 'Verified', verifiedBy: f.by.value.trim(), verifiedOn: f.on.value, verifyRemark: f.remark.value.trim() });
      });
      save();
      closeModal();
      toast('Verified');
      renderCollection(key);
    });
  }

  function courseChecklist() {
    const done = list('courses');
    return `<div class="card checklist"><h3>Checklist</h3><ul>${D.MANDATORY_COURSES.map((c) => {
      const r = done.find((x) => (x.course || '').toLowerCase() === c.name.toLowerCase());
      return `<li class="${r ? 'done' : ''}"><span class="tick">${r ? '✓' : '○'}</span><div><b>${esc(c.name)}</b>${r && r.date ? ` — ${fmtDate(r.date)}` : ''}<br><small>${esc(c.note)}</small></div></li>`;
    }).join('')}</ul></div>`;
  }

  function procedureCounts() {
    const m = {};
    list('procedures').forEach((r) => {
      const p = r.procedure || '—';
      m[p] = m[p] || { O: 0, A: 0, PS: 0, PI: 0, total: 0 };
      if (m[p][r.level] != null) m[p][r.level]++;
      m[p].total++;
    });
    return m;
  }
  function procedureSummary() {
    const m = procedureCounts();
    const tg = db.targets.procedures || {};
    const names = [...new Set([...Object.keys(m), ...Object.keys(tg).filter((k) => tg[k] > 0)])].sort();
    if (!names.length) return '';
    return `<details class="card" open><summary><b>Summary by level of participation</b></summary>
      <div class="table-wrap"><table class="data compact"><thead><tr><th>Procedure</th><th>O</th><th>A</th><th>PS</th><th>PI</th><th>Total</th><th>Target (PS+PI)</th></tr></thead>
      <tbody>${names.map((n) => { const c = m[n] || { O: 0, A: 0, PS: 0, PI: 0, total: 0 }; const t = tg[n] || 0; const got = c.PS + c.PI;
        return `<tr><td>${esc(n)}</td><td>${c.O}</td><td>${c.A}</td><td>${c.PS}</td><td>${c.PI}</td><td><b>${c.total}</b></td><td>${t ? `<span class="${got >= t ? 'okt' : 'badt'}">${got} / ${t}</span>` : '—'}</td></tr>`; }).join('')}
      </tbody></table></div></details>`;
  }

  // ---------- Dashboard ----------
  function attendance() {
    const j = db.profile.joinDate;
    if (!j) return null;
    const t = db.targets;
    const end = addMonths(j, t.courseMonths);
    const upto = today() < end ? today() : end;
    const total = daysBetween(j, upto);
    if (total <= 0) return null;
    const leaveDays = list('leave').filter((l) => l.type !== 'Academic leave').reduce((s, l) => {
      const a = l.from < j ? j : l.from;
      const b = l.to > upto ? upto : l.to;
      return s + Math.max(0, daysBetween(a, b));
    }, 0);
    return { total, leaveDays, pct: Math.max(0, ((total - leaveDays) / total) * 100) };
  }
  function bar(label, got, target, sub = '') {
    const pct = target ? Math.min(100, (got / target) * 100) : got ? 100 : 0;
    const ok = target ? got >= target : null;
    return `<div class="meter"><div class="meter-top"><span>${esc(label)}</span><b class="${ok === true ? 'okt' : ok === false ? 'badt' : ''}">${got}${target ? ' / ' + target : ''}</b></div>
      <div class="track"><div class="fill ${ok ? 'ok' : ''}" style="width:${pct}%"></div></div>${sub ? `<small>${sub}</small>` : ''}</div>`;
  }
  function monthlyStats(n) {
    const out = [];
    const all = Object.keys(S).flatMap((k) => list(k));
    const d = new Date();
    for (let i = 0; i < n; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      const rows = all.filter((r) => (r.created || '').slice(0, 7) === key);
      out.push({ key, label: m.toLocaleString('en-IN', { month: 'short', year: 'numeric' }), total: rows.length, ver: rows.filter((r) => r.status === 'Verified').length });
    }
    return out;
  }
  function monthlyTable() {
    return `<table class="data compact"><thead><tr><th>Month</th><th>Entries</th><th>Verified</th><th></th></tr></thead><tbody>${monthlyStats(6).map((m) =>
      `<tr><td>${m.label}</td><td>${m.total}</td><td>${m.ver}</td><td>${!m.total ? '<span class="pill pend">No entries</span>' : m.ver === m.total ? '<span class="pill ok">✓ Authenticated</span>' : '<span class="pill pend">Pending</span>'}</td></tr>`).join('')}</tbody></table>`;
  }
  function renderDashboard() {
    const p = db.profile;
    const t = db.targets;
    const cnt = (k, fn) => list(k).filter(fn || (() => true)).length;
    const confLevel = (r) => ['National', 'Zonal', 'State', 'International'].includes(r.level);
    const posters = cnt('presentations', (r) => /poster/i.test(r.type) && confLevel(r));
    const orals = cnt('presentations', (r) => /podium|oral/i.test(r.type) && confLevel(r));
    const pubs = cnt('publications', (r) => (r.status === 'Accepted' || r.status === 'Published') && r.authorship === 'First author');
    const research = posters + orals + pubs;
    const yr = p.joinDate ? Math.floor((daysBetween(p.joinDate, today()) - 1) / 365.25) : 0;
    const yStart = p.joinDate ? addMonths(p.joinDate, yr * 12) : '';
    const yEnd = p.joinDate ? addMonths(p.joinDate, (yr + 1) * 12) : '';
    const leaveIn = (type) => list('leave').filter((l) => l.type === type && l.to >= yStart && l.from < yEnd)
      .reduce((s, l) => s + Math.max(0, daysBetween(l.from < yStart ? yStart : l.from, l.to >= yEnd ? new Date(new Date(yEnd + 'T00:00:00') - 86400000 + 43200000).toISOString().slice(0, 10) : l.to)), 0);
    const all = Object.keys(S).flatMap((k) => list(k));
    const stale = all.filter((r) => r.status !== 'Verified' && r.created && (Date.now() - new Date(r.created)) / 86400000 > 31).length;
    const lastEntry = all.reduce((m, r) => (r.created && r.created > m ? r.created : m), '');
    const drp = list('postings').filter((r) => /DRP/.test(r.type)).reduce((s, r) => s + daysBetween(r.from, r.to), 0);
    const att = attendance();
    const allEntries = Object.keys(S).reduce((s, k) => s + list(k).length, 0);
    const pending = Object.keys(S).reduce((s, k) => s + list(k).filter((r) => r.status !== 'Verified').length, 0);
    const th = db.thesis;
    const thesisSteps = [['Protocol submitted', th.protocolDate], ['IEC approval', th.iecDate], ['University approval', th.univDate], ['Data collection started', th.dataStart], ['Data collection completed', th.dataEnd], ['Thesis submitted', th.submitted], ['Thesis accepted', th.accepted]];
    const missingCourses = D.MANDATORY_COURSES.filter((c) => c.req && !list('courses').some((r) => (r.course || '').toLowerCase() === c.name.toLowerCase()));
    const alerts = [];
    if (!p.name || !p.joinDate || !p.specialty) alerts.push('Complete your <a href="#profile">profile</a> (name, specialty, joining date).');
    if (p.joinDate) {
      const due = addMonths(p.joinDate, t.thesisProtocolMonths);
      if (!th.protocolDate && today() > addMonths(p.joinDate, t.thesisProtocolMonths - 1)) alerts.push(`Thesis protocol due by <b>${fmtDate(due)}</b>.`);
      const sub = addMonths(p.joinDate, t.thesisSubmitMonths);
      if (!th.submitted && today() > addMonths(p.joinDate, t.thesisSubmitMonths - 3)) alerts.push(`Thesis submission due by <b>${fmtDate(sub)}</b>.`);
    }
    if (missingCourses.length) alerts.push(`Mandatory course(s) not yet recorded: <b>${missingCourses.map((c) => esc(c.name)).join(', ')}</b>. <a href="#courses">Add</a>`);
    if (p.joinDate && (!lastEntry || (Date.now() - new Date(lastEntry)) / 86400000 > 7)) alerts.push('No logbook entry in the last 7 days — PGMER-2023 expects the e-logbook to be <b>updated weekly</b>.');
    if (stale) alerts.push(`<b>${stale}</b> entr${stale > 1 ? 'ies are' : 'y is'} more than a month old and still unverified — your guide must <b>authenticate the logbook monthly</b>.`);
    if (p.joinDate && leaveIn('Casual leave') > t.casualLeave) alerts.push(`Casual leave this year: <b>${leaveIn('Casual leave')}</b> days — exceeds the ${t.casualLeave}-day entitlement (excess extends tenure).`);
    if (p.joinDate && leaveIn('Academic leave') > t.academicLeave) alerts.push(`Academic leave this year: <b>${leaveIn('Academic leave')}</b> days — exceeds the ${t.academicLeave}-day entitlement.`);
    if (att && att.pct < t.attendancePct) alerts.push(`Attendance is <b>${att.pct.toFixed(1)}%</b> — below the ${t.attendancePct}% minimum.`);
    const lastBackup = db.lastBackup ? fmtDate(db.lastBackup.slice(0, 10)) : 'never';
    if (!db.lastBackup || (Date.now() - new Date(db.lastBackup)) / 86400000 > 14) alerts.push(`Last backup: <b>${lastBackup}</b>. <a href="#targets">Export a backup</a> — data lives only on this device.`);

    const sem = p.joinDate ? Math.min(6, Math.max(1, Math.floor(daysBetween(p.joinDate, today()) / 182.6) + 1)) : null;
    $('#main').innerHTML = `
      ${db.sample ? `<div class="card sample-note"><div><b>You are looking at sample data.</b> Dr Ananya Rao is a made-up MS General Surgery student. Explore freely; nothing here is real.</div><button class="btn" id="startFresh">Start my own logbook</button></div>` : ''}
      <div class="hero card">
        <div>
          <h1>${p.name ? esc(p.name) : 'Your logbook'}</h1>
          <p>${esc([p.degree, p.specialty].filter(Boolean).join(' – ') || 'Set up your profile to get started')}${p.college ? ' · ' + esc(p.college) : ''}</p>
          ${p.joinDate ? `<p class="muted">Joined ${fmtDate(p.joinDate)} · Semester ${sem} · Course ends ${fmtDate(addMonths(p.joinDate, t.courseMonths))}</p>` : ''}
        </div>
        <div class="hero-stats">
          <div><b>${allEntries}</b><span>entries</span></div>
          <div><b>${allEntries - pending}</b><span>verified</span></div>
          <div><b>${pending}</b><span>pending</span></div>
        </div>
      </div>
      ${alerts.length ? `<div class="card alerts"><h3>Action needed</h3><ul>${alerts.map((a) => `<li>${a}</li>`).join('')}</ul></div>` : ''}
      <div class="quick">
        ${['cases', 'procedures', 'academics', 'wpba'].map((k) => `<button class="btn quick-btn" data-add="${k}">${esc({ cases: 'Case', procedures: 'Procedure', academics: 'Academic activity', wpba: 'Assessment' }[k])}</button>`).join('')}
      </div>
      <div class="grid2">
        <div class="card"><h3>PGMER-2023 requirements</h3>
          ${bar('Research for exam eligibility (any one)', research, t.research, `${posters} poster · ${orals} podium (state/zonal/national) · ${pubs} first-author paper`)}
          ${t.posters ? bar('Poster presentations', posters, t.posters) : ''}
          ${t.orals ? bar('Podium presentations', orals, t.orals) : ''}
          ${t.publications ? bar('Publications (first author)', pubs, t.publications) : ''}
          ${bar('District Residency Programme (days)', drp, t.drpDays, '3 months, usually in the 3rd–5th semester')}
          ${att ? bar('Attendance %', Number(att.pct.toFixed(1)), t.attendancePct, `${att.leaveDays} leave days of ${att.total} days so far`) : '<p class="muted">Add joining date to track attendance.</p>'}
          ${bar('Periodic appraisals', cnt('appraisals'), t.appraisals)}
          ${p.joinDate ? `<p class="muted">Leave in year ${yr + 1}: casual ${leaveIn('Casual leave')}/${t.casualLeave} · academic ${leaveIn('Academic leave')}/${t.academicLeave}</p>` : ''}
        </div>
        <div class="card"><h3>Monthly guide authentication</h3>
          <p class="help">PGMER-2023: update weekly, guide authenticates monthly.</p>
          ${monthlyTable()}
        </div>
        <div class="card"><h3>Thesis milestones</h3>
          <ol class="steps">${thesisSteps.map(([l, d]) => `<li class="${d ? 'done' : ''}"><span>${d ? '✓' : ''}</span>${esc(l)}${d ? ` <small>${fmtDate(d)}</small>` : ''}</li>`).join('')}</ol>
          <a class="btn sm" href="#thesis">Update thesis</a>
        </div>
        <div class="card"><h3>Logbook activity</h3>
          ${bar('Clinical cases', cnt('cases'), 0)}
          ${bar('Procedures (performed: PS + PI)', cnt('procedures', (r) => r.level === 'PS' || r.level === 'PI'), 0, `${cnt('procedures')} total incl. observed/assisted`)}
          ${bar('Seminars presented', cnt('academics', (r) => r.type === 'Seminar' && r.role === 'Presenter'), t.seminars)}
          ${bar('Journal clubs presented', cnt('academics', (r) => r.type === 'Journal Club' && r.role === 'Presenter'), t.journalClubs)}
          ${bar('Case presentations', cnt('academics', (r) => r.type === 'Case Presentation' && r.role === 'Presenter'), t.casePresentations)}
          ${bar('UG teaching sessions', cnt('academics', (r) => r.type === 'UG Teaching (taken by me)'), 0)}
          ${bar('Workplace-based assessments', cnt('wpba'), t.wpba)}
        </div>
        <div class="card"><h3>Courses</h3>${courseChecklist().replace('<div class="card checklist"><h3>Checklist</h3>', '<div class="checklist">')}</div>
      </div>`;
    if ($('#startFresh')) $('#startFresh').onclick = () => askConfirm('Start your own logbook?', 'The sample entries will be removed so you can enter your own details.', 'Remove sample data', () => { db = blankDB(); save(); location.hash = '#profile'; route(); });
    $('#main').querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => { location.hash = '#' + b.dataset.add; setTimeout(() => openEntry(b.dataset.add), 0); }));
  }

  // ---------- Settings ----------
  function renderSettings() {
    const t = db.targets;
    const num = (n, l, h = '') => `<label class="field"><span>${esc(l)}</span><input type="number" min="0" name="${n}" value="${t[n]}">${h ? `<small>${esc(h)}</small>` : ''}</label>`;
    const procs = procedureOptions();
    $('#main').innerHTML = `
      <h1>Targets & backup</h1>
      <form id="tf" class="card">
        <h3>Course targets</h3>
        <p class="help">Defaults follow PGMER-2023. Your university or department may prescribe more — change them here.</p>
        <div class="form-grid">
          ${num('attendancePct', 'Minimum attendance %')}
          ${num('drpDays', 'DRP duration (days)')}
          ${num('research', 'Research outputs for exam (any of poster / podium / 1st-author paper)', 'PGMER-2023: 1')}
          ${num('posters', 'Extra target: posters', '0 = no separate target')}
          ${num('orals', 'Extra target: podium presentations', '0 = no separate target')}
          ${num('publications', 'Extra target: publications', '0 = no separate target')}
          ${num('casualLeave', 'Casual leave per year (days)')}
          ${num('academicLeave', 'Academic leave per year (days)')}
          ${num('appraisals', 'Periodic appraisals')}
          ${num('seminars', 'Seminars to present', '0 = no target')}
          ${num('journalClubs', 'Journal clubs to present', '0 = no target')}
          ${num('casePresentations', 'Case presentations', '0 = no target')}
          ${num('wpba', 'Workplace-based assessments', '0 = no target')}
          ${num('courseMonths', 'Course duration (months)', 'MD/MS 36, Diploma 24')}
          ${num('thesisProtocolMonths', 'Thesis protocol due (months after joining)')}
          ${num('thesisSubmitMonths', 'Thesis submission due (months after joining)')}
        </div>
        <h3>Procedure targets <small class="muted">(minimum performed: PS + PI)</small></h3>
        <p class="help">NMC curricula list the skills but most departments set their own numbers. Enter yours; leave 0 for no target.</p>
        <div class="form-grid proc-targets">
          ${procs.map((p, i) => `<label class="field"><span>${esc(p)}</span><input type="number" min="0" data-proc="${i}" value="${(t.procedures || {})[p] || 0}"></label>`).join('')}
        </div>
        <div class="actions"><button class="btn primary">Save targets</button></div>
      </form>
      <div class="card">
        <h3>Backup & restore</h3>
        ${FRAMED ? '<p class="warn">This preview page cannot save files. Export, import and CSV work in the installed app.</p>' : ''}
        <p class="help">Your logbook is stored only in this browser on this device. Export a backup regularly (and before changing phones), and keep it on Google Drive / email.</p>
        <div class="actions left">
          <button class="btn primary" id="exp">Export backup (.json)</button>
          <label class="btn">Import backup<input type="file" id="imp" accept="application/json,.json" hidden></label>
          <button class="btn" id="csvAll">Export all as CSV</button>
          <button class="btn danger" id="wipe">Erase all data</button>
        </div>
        <p class="muted">Last backup: ${db.lastBackup ? fmtDate(db.lastBackup.slice(0, 10)) : 'never'}</p>
      </div>`;
    $('#tf').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      Object.keys(D.DEFAULT_TARGETS).forEach((k) => { if (k !== 'procedures' && f.elements[k]) t[k] = Math.max(0, Number(f.elements[k].value) || 0); });
      t.procedures = {};
      f.querySelectorAll('[data-proc]').forEach((el) => { const v = Number(el.value) || 0; if (v > 0) t.procedures[procs[Number(el.dataset.proc)]] = v; });
      save();
      toast('Targets saved');
    });
    $('#exp').onclick = exportJSON;
    $('#imp').onchange = importJSON;
    $('#csvAll').onclick = () => Object.keys(S).forEach((k, i) => list(k).length && setTimeout(() => exportCSV(k), i * 300));
    $('#wipe').onclick = () => {
      askConfirm('Erase all data?', 'This permanently erases every logbook entry on this device. Type ERASE to confirm.', 'Erase all data', () => {
        db = blankDB();
        save();
        route();
        toast('All data erased');
      }, 'ERASE');
    };
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function fileSlug() { return (db.profile.name || 'pg').replace(/[^a-z0-9]+/gi, '_').toLowerCase(); }
  function exportJSON() {
    db.lastBackup = new Date().toISOString();
    save();
    download(`elogbook_${fileSlug()}_${today()}.json`, JSON.stringify(db, null, 2), 'application/json');
    toast('Backup downloaded');
  }
  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || typeof d !== 'object' || !d.c) throw new Error('Not an e-logbook backup');
        askConfirm('Replace current data?', 'Everything on this device will be replaced by the backup. Export a backup of the current data first if unsure.', 'Replace data', () => {
          try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (err) { /* storage blocked */ }
          db = load();
          if (!db.c || !Object.keys(db.c).length) db = Object.assign(blankDB(), d);
          route();
          toast('Backup restored');
        });
      } catch (err) {
        toast('Could not import: ' + err.message);
      }
    };
    r.readAsText(file);
  }
  function exportCSV(key) {
    const sc = S[key];
    const cols = [...sc.fields.map((f) => f.n), 'status', 'verifiedBy', 'verifiedOn', 'verifyRemark'];
    const head = [...sc.fields.map((f) => f.l), 'Status', 'Verified by', 'Verified on', 'Verifier remarks'];
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [head.map(q).join(','), ...list(key).slice().sort((a, b) => sortKey(a).localeCompare(sortKey(b))).map((r) => cols.map((c) => q(r[c])).join(','))];
    download(`${key}_${fileSlug()}_${today()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv');
  }

  // ---------- Printable report ----------
  function renderReport() {
    setTimeout(() => { const b = $('#printBtn'); if (b) b.onclick = () => window.print(); }, 0);
    const p = db.profile;
    const th = db.thesis;
    const prof = PROFILE_FIELDS.filter((f) => p[f.n]).map((f) => `<tr><th>${esc(f.l)}</th><td>${esc(f.t === 'date' ? fmtDate(p[f.n]) : p[f.n])}</td></tr>`).join('');
    const order = ['postings', 'cases', 'procedures', 'academics', 'presentations', 'publications', 'conferences', 'courses', 'wpba', 'appraisals', 'mentor', 'reflections', 'leave'];
    const section = (key) => {
      const rows = list(key).slice().sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      const sc = S[key];
      const cols = key === 'appraisals' ? ['date', 'period', ...D.APPRAISAL_ITEMS.map(([n]) => n), 'avg', 'assessor'] : sc.cols.concat(key === 'cases' ? ['learning'] : []);
      const lab = (c) => (key === 'appraisals' && /^a\d$/.test(c) ? c.replace('a', 'E') : colLabel(key, c));
      return `<section class="rep-sec"><h2>${esc(sc.title)} <small>(${rows.length})</small></h2>
        ${key === 'appraisals' ? `<p class="small">${D.APPRAISAL_ITEMS.map(([n, l], i) => `E${i + 1}: ${esc(l)}`).join(' · ')} — scale 1–9</p>` : ''}
        ${rows.length ? `<table class="rep"><thead><tr><th>#</th>${cols.map((c) => `<th>${esc(lab(c))}</th>`).join('')}<th>Verified by / date</th><th class="sig">Faculty signature</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td>${cols.map((c) => `<td>${esc(cellValue(key, r, c))}</td>`).join('')}<td>${r.status === 'Verified' ? esc(r.verifiedBy) + '<br>' + fmtDate(r.verifiedOn) : ''}</td><td></td></tr>`).join('')}</tbody></table>` : '<p class="muted">No entries.</p>'}
        ${key === 'procedures' && rows.length ? procedureSummary().replace('<details class="card" open>', '<div>').replace('</details>', '</div>') : ''}
      </section>`;
    };
    $('#main').innerHTML = `
      <div class="no-print head-row"><h1>Print logbook</h1><div class="head-actions">${FRAMED ? '<span class="pill pend">Printing works in the installed app</span>' : '<button class="btn primary" id="printBtn">Print / Save as PDF</button>'}</div></div>
      <p class="help no-print">Print this and get each page counter-signed by your guide/HOD during periodic reviews. Choose “Save as PDF” in the print dialog for a digital copy. Landscape works best.</p>
      <div class="report">
        <div class="rep-cover">
          <h1>POSTGRADUATE e-LOGBOOK</h1>
          <h2>${esc([p.degree, p.specialty].filter(Boolean).join(' – '))}</h2>
          <p>${esc(p.college || '')}${p.university ? '<br>' + esc(p.university) : ''}</p>
          <table class="rep kv">${prof}</table>
          <p class="small">Maintained as per NMC Post-Graduate Medical Education Regulations, 2023. Generated on ${fmtDate(today())}.</p>
        </div>
        <section class="rep-sec"><h2>Thesis / Dissertation</h2>
          <table class="rep kv">${THESIS_FIELDS.filter((f) => th[f.n]).map((f) => `<tr><th>${esc(f.l)}</th><td>${esc(f.t === 'date' ? fmtDate(th[f.n]) : th[f.n])}</td></tr>`).join('') || '<tr><td>Not entered.</td></tr>'}</table>
        </section>
        ${order.map(section).join('')}
        <section class="rep-sec cert">
          <h2>Certificate</h2>
          <p>This is to certify that Dr. <b>${esc(p.name || '______________________')}</b>, ${esc(p.degree || '___')} (${esc(p.specialty || '____________')}) student of ${esc(p.college || '____________________')}, has maintained this logbook during the course period (${p.joinDate ? fmtDate(p.joinDate) + ' to ' + fmtDate(addMonths(p.joinDate, db.targets.courseMonths)) : '__________'}). The entries are a true record of the work done, and the student has satisfactorily completed the postgraduate training requirements as per NMC PGMER-2023.</p>
          <div class="sig-row"><div>Signature of Student<br><br>Date:</div><div>Signature of Guide<br>${esc(p.guide || '')}<br>Date:</div><div>Signature of HOD (with seal)<br>${esc(p.hod || '')}<br>Date:</div></div>
        </section>
      </div>`;
  }

  // ---------- Rules page ----------
  function renderRules() {
    $('#main').innerHTML = `
      <h1>NMC rules this logbook follows</h1>
      <div class="card prose">
        <p class="help">Summary of requirements in the NMC <b>Post-Graduate Medical Education Regulations, 2023 (PGMER-2023)</b> and the NMC competency-based PG curriculum guidelines. Always check the latest NMC notifications and your university's regulations — they prevail.</p>
        <h3>Logbook</h3>
        <ul>
          <li>Every PG student must maintain a <b>dynamic e-logbook</b> recording clinical work, procedures, skills, academic activities, research and assessments.</li>
          <li>It must be <b>updated weekly</b> by the student and <b>assessed and authenticated monthly by the PG guide</b> (PGMER-2000 left the frequency undefined).</li>
          <li>A satisfactory, certified logbook (by guide and HOD) is required for eligibility to appear in the final university examination.</li>
        </ul>
        <h3>Thesis</h3>
        <ul>
          <li>Thesis is compulsory for MD/MS. Protocol is submitted early in the course (typically within the first 6 months) after Institutional Ethics Committee approval.</li>
          <li>Thesis must be submitted to the university <b>6 months before the final exam</b> and accepted to appear in it. It carries 20 marks, added to the practical/clinical exam.</li>
        </ul>
        <h3>Research output</h3>
        <ul>
          <li>To be eligible for the final exam, at least <b>ONE</b> of: a <b>poster</b> presentation, or a <b>podium</b> presentation, at a national / zonal / state conference of the specialty; or <b>one research paper published / accepted as first author</b> in a journal of the specialty. (PGMER-2000 required all three.)</li>
          <li>NMC letter of 5 Aug 2025: the requirement is specialty-based, so presentations at national/state IMA conferences also count.</li>
          <li>Mandatory courses: <b>online Research Methodology course</b>, <b>Ethics (incl. GCP/GLP)</b>, <b>BCLS</b> and <b>ACLS</b>.</li>
        </ul>
        <h3>District Residency Programme (DRP)</h3>
        <ul><li>Compulsory 3-month rotation in a district health system / district hospital, typically in the 3rd, 4th or 5th semester. Certification of satisfactory completion is needed for the exam; the college reports DRP details to NMC within 1 week. Log it under <a href="#postings">Postings & DRP</a>.</li></ul>
        <h3>Attendance & leave</h3>
        <ul><li>Minimum <b>80% attendance</b> (counted over the whole course) for exam eligibility. PG students are full-time residents.</li>
        <li>Leave: <b>20 paid casual leaves</b> and <b>5 paid academic leaves</b> per year, one weekly off, maternity/paternity leave as per government rules. Leave beyond this extends the course tenure.</li></ul>
        <h3>Assessment</h3>
        <ul>
          <li>Formative assessment throughout the course, including workplace-based assessment (Mini-CEX, DOPS, CbD, 360° feedback) and internal examinations.</li>
          <li>Periodic appraisal using the NMC Student Appraisal Form (elements scored 1–9).</li>
          <li>Level of participation in procedures: Observed → Assisted → Performed under supervision → Performed independently.</li>
        </ul>
        <h3>Patient privacy</h3>
        <ul><li>Do not record patient names or other identifiers beyond hospital UHID/IP numbers (Digital Personal Data Protection Act, 2023). Data in this app stays on your device.</li></ul>
        <p class="muted">See <code>docs/NMC-RULES.md</code> in the repository for sources.</p>
      </div>`;
  }

  // ---------- Modal & toast ----------
  function askConfirm(title, text, okLabel, onOk, typeWord) {
    modal(`<h2>${esc(title)}</h2><p>${esc(text)}</p>
      <form id="cf" class="form-grid">
        ${typeWord ? `<label class="field wide" for="cf_word"><span>Type ${esc(typeWord)}</span><input id="cf_word" name="word" autocomplete="off" required></label>` : ''}
        <div class="actions wide"><button type="button" class="btn" data-close>Cancel</button><button class="btn danger-fill">${esc(okLabel)}</button></div>
      </form>`);
    $('#cf').addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeWord && e.target.elements.word.value.trim() !== typeWord) return toast(`Type ${typeWord} to confirm.`);
      closeModal();
      onOk();
    });
  }
  function modal(html) {
    const m = $('#modal');
    $('#modal .modal-body').innerHTML = html;
    m.hidden = false;
    document.body.classList.add('modal-open');
    m.querySelectorAll('[data-close]').forEach((b) => (b.onclick = closeModal));
    const first = m.querySelector('input,select,textarea');
    if (first) first.focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.classList.remove('modal-open');
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ---------- Boot ----------
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  $('#menuBtn').onclick = () => document.body.classList.toggle('nav-open');
  window.addEventListener('hashchange', route);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (window.PG_SAMPLE && !db.profile.name && !Object.keys(db.c).some((k) => db.c[k].length)) { db = window.PG_SAMPLE(blankDB()); save(); }
  route();
})();
