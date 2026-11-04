/* MBBS (UG) e-Logbook — offline single-page app following NMC CBME 2024 and the NMC logbook guidelines. */
(function () {
  'use strict';
  const U = window.UGDATA;
  const STORE_KEY = 'ugElogbook.v1';
  const $ = (s, el = document) => el.querySelector(s);
  let FRAMED = false;
  try { FRAMED = window.self !== window.top; } catch (e) { FRAMED = true; }

  // ---------- Storage ----------
  const blankDB = () => ({ version: 1, profile: {}, targets: JSON.parse(JSON.stringify(U.DEFAULT_TARGETS)), c: {} });
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blankDB();
      const d = JSON.parse(raw);
      const b = blankDB();
      return Object.assign(b, d, { targets: Object.assign(b.targets, d.targets || {}), c: d.c || {} });
    } catch (e) { return blankDB(); }
  }
  let db = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { toast('Could not save. Device storage may be full, so export a backup.'); }
  }
  const list = (k) => (db.c[k] = db.c[k] || []);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- Helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return d ? `${d}-${m}-${y}` : s; };
  const daysBetween = (a, b) => (!a || !b ? 0 : Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1);
  const opt = (arr) => arr.map((x) => (typeof x === 'string' ? { v: x, l: x } : x));
  const pct = (a, b) => (b ? (a / b) * 100 : 0);
  const phaseById = (id) => U.PHASES.find((p) => p.id === id) || U.PHASES[0];
  const curPhase = () => db.profile.phase || 'P1';
  const subjName = (code) => U.SUBJECTS[code] || code || '';
  const SUBJECT_OPTS = Object.entries(U.SUBJECTS).map(([v, l]) => ({ v, l: `${l} (${v})` }));
  const PHASE_OPTS = U.PHASES.map((p) => ({ v: p.id, l: p.name }));
  const familyOpts = () => list('families').map((f) => ({ v: f.code, l: `${f.code} – ${f.head || ''}` }));

  // ---------- Schemas ----------
  const S = {
    comp: {
      title: 'Competency Log', icon: '✅', group: 'Learning',
      help: 'The NMC logbook table. Record each activity against its competency number (e.g. PY6.8). Faculty give a rating (B / M / E) and a decision (C = completed, R = repeat, Re = remedial). Certifiable competencies must be completed and logged before the university exam.',
      fields: [
        { n: 'phase', l: 'Phase', t: 'select', o: PHASE_OPTS, req: 1, def: curPhase },
        { n: 'subject', l: 'Subject', t: 'select', o: SUBJECT_OPTS, req: 1 },
        { n: 'subItem', l: 'Sub-item', t: 'select', o: opt(U.SUB_ITEMS) },
        { n: 'code', l: 'Competency #', t: 'text', req: 1, ph: 'e.g. PY6.8' },
        { n: 'activity', l: 'Name of activity', t: 'text', req: 1 },
        { n: 'date', l: 'Date completed', t: 'date', req: 1 },
        { n: 'attempt', l: 'Attempt', t: 'select', o: U.ATTEMPT, req: 1, def: () => 'F' },
        { n: 'rating', l: 'Rating', t: 'select', o: U.RATING },
        { n: 'score', l: 'or numerical score', t: 'text' },
        { n: 'decision', l: 'Decision of faculty', t: 'select', o: U.DECISION },
        { n: 'certifiable', l: 'Certifiable competency?', t: 'select', o: opt(['No', 'Yes']) },
        { n: 'feedback', l: 'Feedback received', t: 'select', o: opt(['No', 'Yes']) },
        { n: 'notes', l: 'Reflection / notes', t: 'textarea' }
      ],
      cols: ['date', 'subject', 'code', 'activity', 'attempt', 'rating', 'decision']
    },
    foundation: {
      title: 'Foundation Course', icon: '🧭', group: 'Phase I',
      help: 'Two-week Foundation Course at the start of Phase I. Minimum 75% attendance is mandatory and is certified by the Principal / Dean.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'module', l: 'Module / activity', t: 'combo', req: 1, src: () => U.FOUNDATION },
        { n: 'hours', l: 'Hours', t: 'number', min: 0 },
        { n: 'attended', l: 'Attended', t: 'select', o: opt(['Yes', 'No']), def: () => 'Yes' },
        { n: 'reflection', l: 'What I learned', t: 'textarea' }
      ],
      cols: ['date', 'module', 'hours', 'attended']
    },
    aetcom: {
      title: 'AETCOM', icon: '🤝', group: 'Learning',
      help: 'Attitude, Ethics & Communication modules run through every phase. 75% attendance in AETCOM is required to sit the university exams. Reflections are part of the record.',
      fields: [
        { n: 'phase', l: 'Phase', t: 'select', o: PHASE_OPTS, req: 1, def: curPhase },
        { n: 'module', l: 'Module no.', t: 'combo', req: 1, src: () => [].concat(...Object.values(U.AETCOM)) },
        { n: 'topic', l: 'Topic / session', t: 'text', req: 1 },
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'session', l: 'Session type', t: 'select', o: opt(['Large group', 'Small group discussion', 'Self-directed learning', 'Role play', 'Case study', 'Closure / reflection']) },
        { n: 'attended', l: 'Attended', t: 'select', o: opt(['Yes', 'No']), def: () => 'Yes' },
        { n: 'attempt', l: 'Attempt', t: 'select', o: U.ATTEMPT, def: () => 'F' },
        { n: 'rating', l: 'Rating', t: 'select', o: U.RATING },
        { n: 'decision', l: 'Decision', t: 'select', o: U.DECISION },
        { n: 'reflection', l: 'Reflection', t: 'textarea' }
      ],
      cols: ['date', 'phase', 'module', 'topic', 'session', 'decision']
    },
    ece: {
      title: 'Early Clinical Exposure', icon: '🏥', group: 'Phase I',
      help: 'Phase I: hospital visits, clinical correlation of basic sciences, basic clinical skills and humanities.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'subject', l: 'Subject', t: 'select', o: SUBJECT_OPTS.filter((o) => ['AN', 'PY', 'BI', 'CM'].includes(o.v)) },
        { n: 'type', l: 'Element', t: 'select', req: 1, o: opt(['Basic science correlation', 'Clinical skills', 'Hospital / ward visit', 'Humanities']) },
        { n: 'topic', l: 'Topic / case', t: 'text', req: 1 },
        { n: 'reflection', l: 'Reflection', t: 'textarea' }
      ],
      cols: ['date', 'subject', 'type', 'topic']
    },
    families: {
      title: 'Adopted Families', icon: '🏡', group: 'Family Adoption',
      help: 'Family Adoption Programme: adopt at least 3 families (5 preferred) in Phase I and follow them through the course.',
      fields: [
        { n: 'code', l: 'Family code', t: 'text', req: 1, ph: 'e.g. F1' },
        { n: 'head', l: 'Head of household', t: 'text', req: 1 },
        { n: 'members', l: 'No. of members', t: 'number', min: 1 },
        { n: 'address', l: 'House no. / area', t: 'text' },
        { n: 'adopted', l: 'Date adopted', t: 'date' },
        { n: 'diagnosis', l: 'Family diagnosis / risk factors', t: 'textarea' },
        { n: 'objectives', l: 'Objectives for the family', t: 'textarea' }
      ],
      cols: ['code', 'head', 'members', 'adopted', 'diagnosis']
    },
    visits: {
      title: 'Family Visits', icon: '🚶', group: 'Family Adoption',
      help: 'Record every scheduled FAP visit, including ones you missed. Minimum 80% attendance in family visits is required.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'phase', l: 'Phase', t: 'select', o: PHASE_OPTS, req: 1, def: curPhase },
        { n: 'family', l: 'Family', t: 'select', o: [], dyn: familyOpts },
        { n: 'attended', l: 'Attended', t: 'select', o: opt(['Yes', 'No']), req: 1, def: () => 'Yes' },
        { n: 'purpose', l: 'Purpose', t: 'select', o: opt(['Initial survey / family study', 'Screening camp', 'Follow-up', 'Immunisation / growth monitoring', 'Health education', 'Referral', 'VHND / HWC observation', 'Action project', 'Final visit / report']) },
        { n: 'findings', l: 'Findings / activities', t: 'textarea' },
        { n: 'supervisor', l: 'Supervisor', t: 'text' }
      ],
      cols: ['date', 'phase', 'family', 'purpose', 'attended']
    },
    postings: {
      title: 'Clinical Postings', icon: '🩺', group: 'Clinical',
      help: 'Clinical postings from Phase II onwards (learner–doctor method). 80% attendance in each posting, and an end-of-posting assessment.',
      fields: [
        { n: 'phase', l: 'Phase', t: 'select', o: PHASE_OPTS, req: 1, def: curPhase },
        { n: 'subject', l: 'Department', t: 'select', o: SUBJECT_OPTS, req: 1 },
        { n: 'unit', l: 'Unit', t: 'text' },
        { n: 'from', l: 'From', t: 'date', req: 1 },
        { n: 'to', l: 'To', t: 'date', req: 1 },
        { n: 'attPct', l: 'Attendance %', t: 'number', min: 0, max: 100 },
        { n: 'eopScore', l: 'End-of-posting assessment', t: 'text', ph: 'e.g. 38/50' }
      ],
      cols: ['phase', 'subject', 'from', 'to', 'attPct', 'eopScore']
    },
    cases: {
      title: 'Case Records', icon: '📋', group: 'Clinical',
      help: 'Written case records from clinical postings: history, examination, investigations, treatment and rationale, hospital course and discharge. Include outpatients you are assigned. Use hospital IDs only, never patient names.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'subject', l: 'Department', t: 'select', o: SUBJECT_OPTS, req: 1 },
        { n: 'setting', l: 'Setting', t: 'select', o: opt(['Inpatient', 'Outpatient', 'Emergency', 'Labour room', 'Operation theatre', 'Community']) },
        { n: 'pid', l: 'UHID / IP No.', t: 'text' },
        { n: 'diagnosis', l: 'Diagnosis / case', t: 'text', req: 1 },
        { n: 'presented', l: 'Presented to faculty', t: 'select', o: opt(['Yes', 'No']) },
        { n: 'summary', l: 'Case summary & learning', t: 'textarea' }
      ],
      cols: ['date', 'subject', 'setting', 'diagnosis', 'presented']
    },
    electives: {
      title: 'Electives', icon: '🎯', group: 'Clinical',
      help: 'Two 15-day blocks in Phase III Part II. Electives are mandatory: 75% attendance and a submitted elective logbook are needed for the final exam / NExT. Elective time cannot be used to make up missed postings.',
      fields: [
        { n: 'block', l: 'Block', t: 'select', o: opt(['Block 1', 'Block 2']), req: 1 },
        { n: 'name', l: 'Elective', t: 'text', req: 1 },
        { n: 'supervisor', l: 'Supervisor', t: 'text' },
        { n: 'from', l: 'From', t: 'date', req: 1 },
        { n: 'to', l: 'To', t: 'date', req: 1 },
        { n: 'attPct', l: 'Attendance %', t: 'number', min: 0, max: 100 },
        { n: 'log', l: 'Learning log / reflection', t: 'textarea' }
      ],
      cols: ['block', 'name', 'supervisor', 'from', 'to', 'attPct']
    },
    ia: {
      title: 'Internal Assessment', icon: '📝', group: 'Assessment',
      help: 'Enter the marks of each internal assessment exam. For eligibility you need at least 40% in theory and in practical separately, and 50% combined. Subjects taught in several phases use the cumulative total. At least 3 IA exams in Phase I and II subjects, 2 in Phase III subjects.',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'phase', l: 'Phase', t: 'select', o: PHASE_OPTS, req: 1, def: curPhase },
        { n: 'subject', l: 'Subject', t: 'select', o: SUBJECT_OPTS, req: 1 },
        { n: 'kind', l: 'Component', t: 'select', o: opt(['Theory', 'Practical / Clinical']), req: 1 },
        { n: 'exam', l: 'Exam', t: 'select', o: opt(['IA 1', 'IA 2', 'IA 3', 'Pre-university exam', 'End-of-posting assessment', 'Logbook marks', 'Other']) },
        { n: 'marks', l: 'Marks obtained', t: 'number', min: 0, req: 1 },
        { n: 'max', l: 'Maximum marks', t: 'number', min: 1, req: 1 }
      ],
      cols: ['date', 'phase', 'subject', 'kind', 'exam', 'result']
    },
    attendance: {
      title: 'Attendance', icon: '🗓️', group: 'Assessment',
      help: 'Copy the cumulative figures from your department each month. Minimum: theory 75%, practical / clinical 80% (per subject, per phase), AETCOM 75%, Foundation Course 75%, electives 75%, FAP visits 80%.',
      fields: [
        { n: 'asOf', l: 'As of date', t: 'date', req: 1 },
        { n: 'phase', l: 'Phase', t: 'select', o: PHASE_OPTS, req: 1, def: curPhase },
        { n: 'subject', l: 'Subject', t: 'select', o: [{ v: '', l: '— not subject-specific —' }].concat(SUBJECT_OPTS) },
        { n: 'component', l: 'Component', t: 'select', o: opt(Object.keys(U.ATT_RULES)), req: 1 },
        { n: 'held', l: 'Classes held', t: 'number', min: 0, req: 1 },
        { n: 'attended', l: 'Classes attended', t: 'number', min: 0, req: 1 }
      ],
      cols: ['asOf', 'phase', 'subject', 'component', 'attPctCalc']
    },
    activities: {
      title: 'Other Activities', icon: '🌱', group: 'Learning',
      help: 'Self-directed learning, seminars, projects, humanities, sports, extracurricular activities and mentor meetings (1 mentor to 3 mentees).',
      fields: [
        { n: 'date', l: 'Date', t: 'date', req: 1 },
        { n: 'type', l: 'Type', t: 'select', req: 1, o: opt(['Self-directed learning', 'Seminar / symposium', 'Project', 'Humanities', 'Sports', 'Extracurricular', 'Mentor meeting', 'Pandemic module', 'Simulation / skills lab', 'Other']) },
        { n: 'title', l: 'Title', t: 'text', req: 1 },
        { n: 'with', l: 'Faculty / mentor', t: 'text' },
        { n: 'notes', l: 'Notes / reflection', t: 'textarea' }
      ],
      cols: ['date', 'type', 'title', 'with']
    }
  };

  const PROFILE_FIELDS = [
    { n: 'name', l: 'Full name', t: 'text', req: 1 },
    { n: 'rollNo', l: 'College roll no.', t: 'text' },
    { n: 'univRegNo', l: 'University registration no.', t: 'text' },
    { n: 'college', l: 'Medical college', t: 'text' },
    { n: 'university', l: 'University', t: 'text' },
    { n: 'batch', l: 'Admission batch', t: 'text', ph: 'e.g. 2025–26' },
    { n: 'admission', l: 'Date of admission', t: 'date' },
    { n: 'phase', l: 'Current phase', t: 'select', o: PHASE_OPTS },
    { n: 'phaseStart', l: 'Date current phase began', t: 'date' },
    { n: 'mentor', l: 'Mentor', t: 'text' },
    { n: 'fapVillage', l: 'FAP village / community', t: 'text' },
    { n: 'fapFaculty', l: 'FAP faculty guide', t: 'text' },
    { n: 'fapPg', l: 'FAP PG / SR guide', t: 'text' },
    { n: 'fapCamp', l: 'FAP screening camp date(s)', t: 'text' },
    { n: 'phone', l: 'Mobile (optional)', t: 'text' },
    { n: 'email', l: 'Email (optional)', t: 'text' }
  ];

  // ---------- Faculty sign-off sheets (print and sign) ----------
  const LABEL = {
    comp: (r) => `${r.code} ${r.activity}${r.decision ? ' — ' + r.decision : ''}`,
    foundation: (r) => `${r.module}${r.attended === 'No' ? ' (absent)' : ''}`,
    aetcom: (r) => `AETCOM ${r.module}: ${r.topic}`,
    ece: (r) => `${r.type}: ${r.topic}`,
    families: (r) => `Family ${r.code} adopted: ${r.head}`,
    visits: (r) => `Family visit ${r.family || ''}: ${r.purpose || ''}${r.attended === 'No' ? ' (absent)' : ''}`,
    postings: (r) => `${subjName(r.subject)} posting ${fmtDate(r.from)} to ${fmtDate(r.to)}${r.attPct ? ' — ' + r.attPct + '%' : ''}`,
    cases: (r) => `${subjName(r.subject)}: ${r.diagnosis}`,
    electives: (r) => `${r.block}: ${r.name}`,
    ia: (r) => `${subjName(r.subject)} ${r.kind} ${r.exam || ''}: ${r.marks}/${r.max}`,
    attendance: (r) => `${r.subject ? subjName(r.subject) + ' ' : ''}${r.component}: ${r.attended}/${r.held}`,
    activities: (r) => `${r.type}: ${r.title}`
  };
  const CS = window.CustomSections({
    db: () => db, S, list, save, toast, askConfirm, modal, closeModal,
    onChange: () => renderNav()
  });
  const SO = window.SignOff({
    db: () => db, save, toast, askConfirm, modal, closeModal, FRAMED,
    onChange: () => renderNav(),
    get sections() { return Object.keys(S).map((key) => ({ key, title: S[key].title })); },
    list,
    entryDate: (key, r) => r.date || r.from || r.asOf || r.adopted || '',
    entryLabel: (key, r) => (LABEL[key] ? LABEL[key](r) : CS.isCustom(key) ? CS.label(key, r) : r.title || ''),
    subjects: () => Object.entries(U.SUBJECTS).map(([v, l]) => ({ v, l })),
    subjectOf: (key, r) => r.subject || '',
    subjectName: (c) => subjName(c),
    student: () => ({ name: db.profile.name, line: `MBBS · ${phaseById(curPhase()).name}${db.profile.batch ? ' · Batch ' + db.profile.batch : ''}`, college: db.profile.college }),
    startDate: () => db.profile.admission || '',
    reviewerRole: 'Faculty in charge',
    defaultReviewer: () => '',
    sheetTitle: 'MBBS e-logbook · Faculty sign-off sheet',
    sheetFoot: 'NMC logbook guidelines: the student is responsible for getting entries verified by the faculty in charge regularly; the HOD scrutinises the logbook.',
    ruleNote: 'NMC asks you to get your logbook entries verified by the faculty in charge regularly. Print a sheet for any dates (and, if you like, one subject), get it signed, and record it here.',
    ruleShort: 'Shows which months have a signed sheet. A reminder only; any dates and subjects can go on a sheet.'
  });

  // ---------- Cell rendering ----------
  function cellValue(key, r, col) {
    const f = S[key].fields.find((x) => x.n === col) || {};
    if (col === 'result') return `${r.marks}/${r.max} (${pct(+r.marks, +r.max).toFixed(0)}%)`;
    if (col === 'attPctCalc') return `${r.attended}/${r.held} (${pct(+r.attended, +r.held).toFixed(1)}%)`;
    if (col === 'subject') return r.subject ? subjName(r.subject) : '';
    if (col === 'phase') return phaseById(r.phase).name;
    if (col === 'attPct') return r.attPct ? r.attPct + '%' : '';
    if (f.t === 'date') return fmtDate(r[col]);
    return r[col];
  }
  const MONO = ['code', 'pid', 'module', 'family', 'attempt', 'rating', 'decision', 'result', 'attPctCalc', 'attPct', 'eopScore', 'members'];
  const isMono = (key, col) => MONO.includes(col) || (S[key].fields.find((f) => f.n === col) || {}).t === 'date';
  function colLabel(key, col) {
    if (col === 'result') return 'Marks';
    if (col === 'attPctCalc') return 'Attendance';
    const f = S[key].fields.find((x) => x.n === col);
    return f ? f.l : col;
  }
  const sortKey = (r) => r.date || r.from || r.asOf || r.adopted || '';

  // ---------- Navigation ----------
  const NAV_GROUPS = [
    ['Overview', [['dashboard', 'Dashboard'], ['signoff', 'Sign-off sheets'], ['profile', 'Profile']]],
    ['Learning', [['comp', 'Competency log'], ['aetcom', 'AETCOM'], ['activities', 'Other activities']]],
    ['Phase I', [['foundation', 'Foundation Course'], ['ece', 'Early clinical exposure']]],
    ['Family Adoption', [['families', 'Adopted families'], ['visits', 'Family visits']]],
    ['Clinical', [['postings', 'Clinical postings'], ['cases', 'Case records'], ['electives', 'Electives']]],
    ['Assessment', [['ia', 'Internal assessment'], ['attendance', 'Attendance']]],
    ['Logbook', [['print-logbook', 'Print logbook'], ['targets', 'Backup & targets'], ['rules', 'NMC rules']]]
  ];
  function renderNav() {
    const cur = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const groups = NAV_GROUPS.slice();
    groups.splice(groups.length - 1, 0, ['My sections', [...CS.navItems(), ['my-sections', '+ Add or manage']]]);
    $('#nav').innerHTML = groups.map(([g, items]) => `<div class="nav-h">${esc(g)}</div>` + items.map(([r, l]) => {
      const n = S[r] ? list(r).length : '';
      return `<a href="#${r}" class="${cur === r ? 'active' : ''}"${cur === r ? ' aria-current="page"' : ''}><span>${esc(l)}</span>${n !== '' ? `<span class="badge">${n}</span>` : ''}</a>`;
    }).join('')).join('') + (FRAMED ? '' : '<a href="../index.html" class="switch"><span>PG (MD/MS) logbook →</span></a>');
  }
  function route() {
    const h = location.hash.replace(/^#\/?/, '') || 'dashboard';
    document.body.classList.remove('nav-open');
    CS.sync();
    if (S[h]) renderCollection(h);
    else if (h === 'my-sections') CS.render();
    else if (h === 'profile') renderProfile();
    else if (h === 'print-logbook') renderReport();
    else if (h === 'signoff') { SO.reset(); SO.render(); }
    else if (h === 'targets') renderSettings();
    else if (h === 'rules') renderRules();
    else renderDashboard();
    renderNav();
    $('#main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  // ---------- Forms ----------
  function inputHTML(f, val) {
    const id = 'f_' + f.n;
    const req = f.req ? 'required' : '';
    const v = esc(val == null ? '' : val);
    const ph = f.ph ? `placeholder="${esc(f.ph)}"` : '';
    let c;
    const o = f.dyn ? f.dyn() : f.o;
    if (f.t === 'textarea') c = `<textarea id="${id}" name="${f.n}" rows="3" ${req}>${v}</textarea>`;
    else if (f.t === 'select') c = `<select id="${id}" name="${f.n}" ${req}><option value="">— select —</option>${o.map((x) => `<option value="${esc(x.v)}" ${String(val) === x.v ? 'selected' : ''}>${esc(x.l)}</option>`).join('')}</select>`;
    else if (f.t === 'combo') c = `<input id="${id}" name="${f.n}" list="${id}_dl" value="${v}" ${req} ${ph} autocomplete="off"><datalist id="${id}_dl">${f.src().map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
    else if (f.t === 'number') c = `<input id="${id}" name="${f.n}" type="number" inputmode="decimal" step="any" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${v}" ${req}>`;
    else c = `<input id="${id}" name="${f.n}" type="${f.t}" value="${v}" ${req} ${ph}>`;
    return `<label class="field ${f.t === 'textarea' ? 'wide' : ''}" for="${id}"><span>${esc(f.l)}${f.req ? ' <b class="req">*</b>' : ''}</span>${c}</label>`;
  }
  const readForm = (form, fields) => { const o = {}; fields.forEach((f) => { const el = form.elements[f.n]; if (el) o[f.n] = el.value.trim(); }); return o; };

  function renderProfile() {
    const p = db.profile;
    $('#main').innerHTML = `<h1>Student Profile</h1><p class="help">These details appear on the cover and certificate of your printed logbook.</p>
      <form id="sf" class="card form-grid">${PROFILE_FIELDS.map((f) => inputHTML(f, p[f.n])).join('')}
      <div class="actions wide"><button class="btn primary">Save</button></div></form>`;
    $('#sf').addEventListener('submit', (e) => { e.preventDefault(); db.profile = Object.assign({}, p, readForm(e.target, PROFILE_FIELDS)); save(); toast('Saved'); renderNav(); });
  }

  // ---------- Collections ----------
  const state = { filter: '', status: '', phase: '' };
  function renderCollection(key) {
    const sc = S[key];
    const hasPhase = sc.fields.some((f) => f.n === 'phase');
    const rows = list(key).slice().sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
    const q = state.filter.toLowerCase();
    const shown = rows.filter((r) => (!state.status || r.status === state.status) && (!hasPhase || !state.phase || r.phase === state.phase) &&
      (!q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)) || subjName(r.subject).toLowerCase().includes(q)));
    const pending = rows.filter((r) => r.status !== 'Verified').length;
    const extra = key === 'comp' ? compSummary() : key === 'visits' ? visitSummary() : key === 'aetcom' ? aetcomSummary() : '';
    $('#main').innerHTML = `
      <div class="head-row"><h1>${esc(sc.title)}</h1><div class="head-actions"><button class="btn primary" id="addBtn">+ Add entry</button></div></div>
      <p class="help">${esc(sc.help)}</p>
      ${key === 'visits' && !list('families').length ? '<p class="warn">Add your adopted families first under <a href="#families">Adopted Families</a>.</p>' : ''}
      ${extra}
      <div class="toolbar">
        <input id="q" type="search" placeholder="Search…" value="${esc(state.filter)}" aria-label="Search entries">
        ${hasPhase ? `<select id="ph" aria-label="Filter by phase"><option value="">All phases</option>${U.PHASES.map((p) => `<option value="${p.id}" ${state.phase === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>` : ''}
        <select id="st" aria-label="Filter by status"><option value="">All (${rows.length})</option>
          <option value="Pending" ${state.status === 'Pending' ? 'selected' : ''}>Pending (${pending})</option>
          <option value="Verified" ${state.status === 'Verified' ? 'selected' : ''}>Verified (${rows.length - pending})</option></select>
        <button class="btn" id="verifyAll" ${pending ? '' : 'disabled'}>Verify pending…</button>
        ${FRAMED ? '' : `<button class="btn" id="csv" ${rows.length ? '' : 'disabled'}>Export CSV</button>`}
      </div>
      ${shown.length ? `<div class="table-wrap"><table class="data"><thead><tr>${sc.cols.map((c) => `<th>${esc(colLabel(key, c))}</th>`).join('')}<th>Status</th><th></th></tr></thead>
        <tbody>${shown.map((r) => `<tr data-id="${r.id}">${sc.cols.map((c) => `<td data-label="${esc(colLabel(key, c))}"${isMono(key, c) ? ' class="mono"' : ''}>${esc(cellValue(key, r, c))}</td>`).join('')}
          <td data-label="Status">${statusPill(r)}</td>
          <td class="row-actions"><button class="btn sm" data-act="edit">Edit</button>${r.status === 'Verified' ? '' : '<button class="btn sm" data-act="verify">Verify</button>'}<button class="btn sm danger" data-act="del" aria-label="Delete">✕</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty card">No entries yet. Tap <b>+ Add entry</b> to start.</div>'}`;
    $('#addBtn').onclick = () => openEntry(key);
    $('#q').oninput = (e) => { state.filter = e.target.value; renderCollection(key); const el = $('#q'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    if ($('#ph')) $('#ph').onchange = (e) => { state.phase = e.target.value; renderCollection(key); };
    $('#st').onchange = (e) => { state.status = e.target.value; renderCollection(key); };
    if ($('#csv')) $('#csv').onclick = () => exportCSV(key);
    $('#verifyAll').onclick = () => openVerify(key, rows.filter((r) => r.status !== 'Verified').map((r) => r.id));
    $('#main').querySelectorAll('tr[data-id] button').forEach((b) => {
      b.onclick = () => {
        const id = b.closest('tr').dataset.id;
        if (b.dataset.act === 'edit') openEntry(key, id);
        else if (b.dataset.act === 'verify') openVerify(key, [id]);
        else askConfirm('Delete this entry?', 'This entry will be removed permanently.', 'Delete', () => { db.c[key] = list(key).filter((r) => r.id !== id); save(); renderCollection(key); renderNav(); toast('Entry deleted'); });
      };
    });
  }
  const statusPill = (r) => (r.status === 'Verified'
    ? `<span class="pill ok" title="${esc('Verified by ' + (r.verifiedBy || '') + ' on ' + fmtDate(r.verifiedOn))}">✓ Verified</span>`
    : '<span class="pill pend">Pending</span>');

  function openEntry(key, id) {
    const sc = S[key];
    const rec = id ? list(key).find((r) => r.id === id) : {};
    const defs = {};
    if (!id) sc.fields.forEach((f) => { if (f.def) defs[f.n] = f.def(); else if (f.t === 'date' && f.req) defs[f.n] = today(); });
    const wasVerified = rec.status === 'Verified';
    modal(`<h2>${id ? 'Edit' : 'New'} — ${esc(sc.title)}</h2>
      ${wasVerified ? '<p class="warn">This entry is verified. Saving changes will reset it to <b>Pending</b> for re-verification.</p>' : ''}
      <form id="ef" class="form-grid">${sc.fields.map((f) => inputHTML(f, rec[f.n] != null ? rec[f.n] : defs[f.n])).join('')}
      <div class="actions wide"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div></form>`);
    const codeEl = $('#ef [name=code]'), subjEl = $('#ef [name=subject]');
    if (codeEl && subjEl) codeEl.addEventListener('input', () => { const m = codeEl.value.trim().toUpperCase().match(/^([A-Z]{2})/); if (m && U.SUBJECTS[m[1]] && !subjEl.value) subjEl.value = m[1]; });
    $('#ef').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = readForm(e.target, sc.fields);
      if (d.from && d.to && d.to < d.from) return toast('The "To" date must be on or after the "From" date.');
      if (d.held !== undefined && +d.attended > +d.held) return toast('Classes attended cannot exceed classes held.');
      if (d.max !== undefined && +d.marks > +d.max) return toast('Marks obtained cannot exceed maximum marks.');
      if (d.code) d.code = d.code.toUpperCase().replace(/\s+/g, '');
      if (key === 'families' && list('families').some((f) => f.code === d.code && f.id !== id)) return toast('That family code is already used.');
      if (id) {
        const changed = sc.fields.some((f) => (rec[f.n] || '') !== (d[f.n] || ''));
        Object.assign(rec, d, { updated: new Date().toISOString() });
        if (changed && wasVerified) Object.assign(rec, { status: 'Pending', verifiedBy: '', verifiedOn: '', verifyRemark: '' });
      } else list(key).push(Object.assign({ id: uid(), created: new Date().toISOString(), status: 'Pending' }, d));
      save(); closeModal(); toast('Saved'); renderCollection(key); renderNav();
    });
  }

  function openVerify(key, ids) {
    if (!ids.length) return;
    modal(`<h2>Faculty verification</h2>
      <p class="help">For the faculty in charge. This is the "initial of faculty" column of the NMC logbook. ${ids.length} entr${ids.length > 1 ? 'ies' : 'y'} will be marked verified.</p>
      <form id="vf" class="form-grid">
        <label class="field" for="v_by"><span>Faculty name & designation <b class="req">*</b></span><input id="v_by" name="by" required value="${esc(db.lastVerifier || '')}"></label>
        <label class="field" for="v_on"><span>Date <b class="req">*</b></span><input id="v_on" name="on" type="date" required value="${today()}"></label>
        <label class="field wide" for="v_rm"><span>Remarks</span><input id="v_rm" name="remark"></label>
        <label class="field wide check" for="v_ok"><input id="v_ok" type="checkbox" name="ok" required> <span>I have reviewed ${ids.length > 1 ? 'these entries' : 'this entry'} with the student.</span></label>
        <div class="actions wide"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Mark verified</button></div>
      </form>`);
    $('#vf').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.elements;
      db.lastVerifier = f.by.value.trim();
      list(key).forEach((r) => { if (ids.includes(r.id)) Object.assign(r, { status: 'Verified', verifiedBy: f.by.value.trim(), verifiedOn: f.on.value, verifyRemark: f.remark.value.trim() }); });
      save(); closeModal(); toast('Verified'); renderCollection(key);
    });
  }

  // ---------- Calculations ----------
  function compStats(subject, phase) {
    const rows = list('comp').filter((r) => (!subject || r.subject === subject) && (!phase || r.phase === phase));
    const done = rows.filter((r) => r.decision === 'C');
    const codes = new Set(done.map((r) => r.code));
    const certCodes = new Set(done.filter((r) => r.certifiable === 'Yes').map((r) => r.code));
    return { entries: rows.length, completed: codes.size, cert: certCodes.size, open: rows.filter((r) => r.decision === 'R' || r.decision === 'Re').length };
  }
  function iaStats(subject) {
    const group = (s) => U.ALLIED[s] || s;
    const rows = list('ia').filter((r) => group(r.subject) === subject);
    const sum = (k) => rows.filter((r) => r.kind === k).reduce((a, r) => [a[0] + (+r.marks || 0), a[1] + (+r.max || 0)], [0, 0]);
    const th = sum('Theory'), pr = sum('Practical / Clinical');
    return { th: th[1] ? pct(th[0], th[1]) : null, pr: pr[1] ? pct(pr[0], pr[1]) : null, comb: th[1] + pr[1] ? pct(th[0] + pr[0], th[1] + pr[1]) : null, n: rows.length };
  }
  function latestAtt(phase, subject, component) {
    const rows = list('attendance').filter((r) => r.phase === phase && (r.subject || '') === (subject || '') && r.component === component).sort((a, b) => b.asOf.localeCompare(a.asOf));
    return rows[0] ? pct(+rows[0].attended, +rows[0].held) : null;
  }
  function fapVisitPct() {
    const v = list('visits');
    return v.length ? pct(v.filter((r) => r.attended === 'Yes').length, v.length) : null;
  }
  function foundationPct() {
    const f = list('foundation');
    return f.length ? pct(f.filter((r) => r.attended === 'Yes').length, f.length) : null;
  }
  function aetcomPct(phase) {
    const recorded = latestAtt(phase, '', 'AETCOM');
    if (recorded != null) return recorded;
    const a = list('aetcom').filter((r) => r.phase === phase);
    return a.length ? pct(a.filter((r) => r.attended === 'Yes').length, a.length) : null;
  }

  function compSummary() {
    const ph = curPhase();
    const subs = phaseById(ph).teach;
    return `<details class="card" open><summary><b>${esc(phaseById(ph).name)}: competencies by subject</b></summary>
      <div class="table-wrap"><table class="data compact"><thead><tr><th>Subject</th><th>Entries</th><th>Completed (C)</th><th>Certifiable done</th><th>Repeat / remedial</th></tr></thead>
      <tbody>${subs.map((s) => { const c = compStats(s, ph); const t = (db.targets.cert || {})[s] || 0;
        return `<tr><td>${esc(subjName(s))}</td><td>${c.entries}</td><td>${c.completed}</td><td>${t ? `<span class="${c.cert >= t ? 'okt' : 'badt'}">${c.cert} / ${t}</span>` : c.cert}</td><td>${c.open ? `<span class="badt">${c.open}</span>` : 0}</td></tr>`; }).join('')}
      </tbody></table></div></details>`;
  }
  function visitSummary() {
    const p = fapVisitPct();
    const fam = list('families').length;
    return `<div class="card"><div class="meters">${meter('Family visit attendance %', p == null ? 0 : +p.toFixed(1), 80)}${meter('Families adopted', fam, db.targets.fapFamiliesMin, `minimum ${db.targets.fapFamiliesMin}, preferably ${db.targets.fapFamiliesPreferred}`)}</div></div>`;
  }
  function aetcomSummary() {
    return `<details class="card" open><summary><b>Modules by phase</b> <small class="muted">(✓ = completed and decision C)</small></summary><div class="mods">${U.PHASES.map((p) =>
      `<div><b>${p.name}</b><div class="chips">${U.AETCOM[p.id].map((m) => { const done = list('aetcom').some((r) => r.module === m && r.decision === 'C'); const any = list('aetcom').some((r) => r.module === m);
        return `<span class="chip ${done ? 'ok' : any ? 'part' : ''}">${done ? '✓ ' : ''}${m}</span>`; }).join('')}</div></div>`).join('')}</div></details>`;
  }

  function meter(label, got, target, sub = '') {
    const w = target ? Math.min(100, (got / target) * 100) : got ? 100 : 0;
    const ok = target ? got >= target : null;
    return `<div class="meter"><div class="meter-top"><span>${esc(label)}</span><b class="${ok === true ? 'okt' : ok === false ? 'badt' : ''}">${got}${target ? ' / ' + target : ''}</b></div>
      <div class="track"><div class="fill ${ok ? 'ok' : ''}" style="width:${w}%"></div></div>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  }
  const fmtPct = (v) => (v == null ? '—' : v.toFixed(1) + '%');
  const chk = (v, min) => (v == null ? 'unk' : v >= min ? 'ok' : 'bad');

  // ---------- Dashboard ----------
  function renderDashboard() {
    const p = db.profile;
    const ph = curPhase();
    const P = phaseById(ph);
    const t = db.targets;
    const all = Object.keys(S).flatMap((k) => list(k));
    const pending = all.filter((r) => r.status !== 'Verified').length;
    const alerts = [];
    if (!p.name || !p.phase) alerts.push('Complete your <a href="#profile">profile</a>, including your current phase.');

    const elig = P.exam.map((s) => {
      const thA = latestAtt(ph, s, 'Theory');
      const prA = latestAtt(ph, s, 'Practical / Clinical');
      const ia = iaStats(s);
      const cs = compStats(s, ph);
      const certT = (t.cert || {})[s] || 0;
      const checks = [
        ['Theory attendance ≥ 75%', fmtPct(thA), chk(thA, 75)],
        ['Practical / clinical attendance ≥ 80%', fmtPct(prA), chk(prA, 80)],
        [`IA theory ≥ ${t.iaEach}%`, fmtPct(ia.th), chk(ia.th, t.iaEach)],
        [`IA practical ≥ ${t.iaEach}%`, fmtPct(ia.pr), chk(ia.pr, t.iaEach)],
        [`IA combined ≥ ${t.iaCombined}%`, fmtPct(ia.comb), chk(ia.comb, t.iaCombined)],
        ['Certifiable competencies', certT ? `${cs.cert} / ${certT}` : `${cs.cert} done`, certT ? (cs.cert >= certT ? 'ok' : 'bad') : 'unk']
      ];
      const status = checks.some((c) => c[2] === 'bad') ? 'bad' : checks.some((c) => c[2] === 'unk') ? 'unk' : 'ok';
      if (status === 'bad') alerts.push(`<b>${esc(subjName(s))}</b>: one or more eligibility criteria are below the minimum.`);
      return { s, checks, status };
    });
    const aet = aetcomPct(ph);
    if (aet != null && aet < 75) alerts.push(`AETCOM attendance is <b>${aet.toFixed(1)}%</b>, below 75%. It is required for every university exam.`);
    const fv = fapVisitPct();
    if (fv != null && fv < 80) alerts.push(`Family visit attendance is <b>${fv.toFixed(1)}%</b>, below 80%.`);
    if (list('families').length < t.fapFamiliesMin) alerts.push(`Only ${list('families').length} adopted families recorded. NMC requires at least ${t.fapFamiliesMin} (${t.fapFamiliesPreferred} preferred).`);
    const fc = foundationPct();
    if (ph === 'P1' && fc != null && fc < 75) alerts.push(`Foundation Course attendance is <b>${fc.toFixed(1)}%</b>, below the mandatory 75%.`);
    alerts.push(...SO.dueAlerts());
    if (!db.sample && (!db.lastBackup || (Date.now() - new Date(db.lastBackup)) / 86400000 > 14)) alerts.push('Export a backup: your logbook lives only on this device. <a href="#targets">Backup</a>');

    const elected = list('electives');
    const label = { ok: 'Meets', bad: 'Below minimum', unk: 'No data' };
    $('#main').innerHTML = `
      ${db.sample ? `<div class="card sample-note"><div><b>You are looking at sample data.</b> Rahul Verma is a made-up Phase II MBBS student. Explore freely; nothing here is real.</div><button class="btn" id="startFresh">Start my own logbook</button></div>` : ''}
      <div class="hero card">
        <div><h1>${p.name ? esc(p.name) : 'Your logbook'}</h1>
          <p>MBBS · ${esc(P.name)}${p.batch ? ' · Batch ' + esc(p.batch) : ''}${p.college ? ' · ' + esc(p.college) : ''}</p>
          <p class="muted">Exam subjects this phase: ${P.exam.map(subjName).map(esc).join(', ')}</p></div>
        <div class="hero-stats"><div><b>${all.length}</b><span>entries</span></div><div><b>${all.length - pending}</b><span>verified</span></div><div><b>${pending}</b><span>pending</span></div></div>
      </div>
      ${alerts.length ? `<div class="card alerts"><h3>Action needed</h3><ul>${alerts.map((a) => `<li>${a}</li>`).join('')}</ul></div>` : ''}
      <div class="quick">${['comp', 'aetcom', 'visits', 'cases'].map((k) => `<button class="btn quick-btn" data-add="${k}">${esc({ comp: 'Competency', aetcom: 'AETCOM session', visits: 'Family visit', cases: 'Case record' }[k])}</button>`).join('')}</div>
      <h2 class="sec-h">University exam eligibility: ${esc(P.name)}</h2>
      <div class="grid2">${elig.map((e) => `<div class="card elig ${e.status}"><div class="elig-head"><h3>${esc(subjName(e.s))}</h3><span class="pill ${e.status === 'ok' ? 'ok' : e.status === 'bad' ? 'bad' : 'pend'}">${e.status === 'ok' ? '✓ On track' : e.status === 'bad' ? 'At risk' : 'Incomplete data'}</span></div>
        <table class="data compact"><tbody>${e.checks.map(([l, v, st]) => `<tr><td>${esc(l)}</td><td class="num ${st === 'ok' ? 'okt' : st === 'bad' ? 'badt' : 'muted'}">${esc(v)}</td><td><span class="dot ${st}" title="${label[st]}"></span></td></tr>`).join('')}</tbody></table></div>`).join('')}</div>
      <h2 class="sec-h">Phase requirements</h2>
      <div class="grid2">
        <div class="card"><h3>AETCOM & Family Adoption</h3>
          ${meter('AETCOM attendance %', aet == null ? 0 : +aet.toFixed(1), 75)}
          ${meter('Families adopted', list('families').length, t.fapFamiliesMin, `minimum ${t.fapFamiliesMin}, preferably ${t.fapFamiliesPreferred}`)}
          ${meter('Family visit attendance %', fv == null ? 0 : +fv.toFixed(1), 80, `${list('visits').filter((v) => v.attended === 'Yes').length} of ${list('visits').length} visits attended`)}
          ${meter(`AETCOM modules completed (${P.name})`, U.AETCOM[ph].filter((m) => list('aetcom').some((r) => r.module === m && r.decision === 'C')).length, U.AETCOM[ph].length)}
        </div>
        <div class="card"><h3>${ph === 'P1' ? 'Phase I essentials' : ph === 'P3B' ? 'Electives' : 'Clinical training'}</h3>
          ${ph === 'P1' ? `${meter('Foundation Course attendance %', fc == null ? 0 : +fc.toFixed(1), 75)}${meter('Early clinical exposure sessions', list('ece').length, 0)}`
            : ph === 'P3B' ? `${['Block 1', 'Block 2'].map((b) => { const e = elected.find((x) => x.block === b); return meter(`${b}${e ? ': ' + e.name : ''} (attendance %)`, e ? +e.attPct || 0 : 0, 75, e ? '' : 'not recorded'); }).join('')}`
            : ''}
          ${ph !== 'P1' ? meter('Clinical postings recorded', list('postings').filter((r) => r.phase === ph).length, 0) + meter('Case records written', list('cases').length, 0) : ''}
          ${meter('Competency activities logged (this phase)', compStats('', ph).entries, 0)}
        </div>
        ${SO.dashboardCard()}
      </div>`;
    if ($('#startFresh')) $('#startFresh').onclick = () => askConfirm('Start your own logbook?', 'The sample entries will be removed so you can enter your own details.', 'Remove sample data', () => { db = blankDB(); save(); location.hash = '#profile'; route(); });
    $('#main').querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => { location.hash = '#' + b.dataset.add; setTimeout(() => openEntry(b.dataset.add), 0); }));
  }

  // ---------- Settings ----------
  function renderSettings() {
    const t = db.targets;
    const subs = Object.keys(U.SUBJECTS);
    $('#main').innerHTML = `<h1>Backup & targets</h1>
      <div class="card"><h3>Backup & restore</h3>
        ${FRAMED ? '<p class="warn">This preview page cannot save files. Export, import and CSV work in the installed app.</p>' : ''}
        <p class="help">Your logbook is saved on this phone automatically. To keep a safe copy, back it up to your own Google Drive, or send it to yourself on WhatsApp or email. Nobody else can see it.</p>
        <div class="actions left">
          <button class="btn primary" id="exp">Back up to Drive, WhatsApp or email</button>
          <button class="btn" id="expDl">Download backup file</button>
          <label class="btn" for="imp">Restore from a backup<input type="file" id="imp" accept="${window.ElogBackup.ACCEPT}" hidden></label>
          <button class="btn danger" id="wipe">Erase all data</button>
        </div>
        <p class="muted small">To restore on a new phone: install the app, tap <b>Restore from a backup</b> and pick the file. On Android you can open it straight from Google Drive.</p>
        <p class="muted">Last backup: ${db.lastBackup ? fmtDate(db.lastBackup.slice(0, 10)) : 'never'}</p></div>
      <form id="tf" class="card"><h3>Targets</h3><p class="help">Defaults follow NMC CBME 2024. Your college may set the number of certifiable competencies per subject.</p>
        <div class="form-grid">
          <label class="field" for="t_fm"><span>Minimum families (FAP)</span><input id="t_fm" type="number" min="0" name="fapFamiliesMin" value="${t.fapFamiliesMin}"></label>
          <label class="field" for="t_fp"><span>Preferred families (FAP)</span><input id="t_fp" type="number" min="0" name="fapFamiliesPreferred" value="${t.fapFamiliesPreferred}"></label>
          <label class="field" for="t_ie"><span>IA minimum in theory and practical, each (%)</span><input id="t_ie" type="number" min="0" max="100" name="iaEach" value="${t.iaEach}"></label>
          <label class="field" for="t_ic"><span>IA minimum combined (%)</span><input id="t_ic" type="number" min="0" max="100" name="iaCombined" value="${t.iaCombined}"></label>
        </div>
        <h3>Certifiable competencies required per subject</h3>
        <div class="form-grid">${subs.map((s) => `<label class="field" for="tc_${s}"><span>${esc(subjName(s))}</span><input id="tc_${s}" type="number" min="0" data-cert="${s}" value="${(t.cert || {})[s] || 0}"></label>`).join('')}</div>
        <div class="actions"><button class="btn primary">Save targets</button></div></form>
`;
    $('#tf').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.elements;
      ['fapFamiliesMin', 'fapFamiliesPreferred', 'iaEach', 'iaCombined'].forEach((k) => (t[k] = Math.max(0, Number(f[k].value) || 0)));
      t.cert = {};
      e.target.querySelectorAll('[data-cert]').forEach((el) => { const v = +el.value || 0; if (v) t.cert[el.dataset.cert] = v; });
      save(); toast('Targets saved');
    });
    const backup = (viaShare) => {
      const name = `mbbs_logbook_backup_${slug()}_${today()}`;
      const text = JSON.stringify(db);
      const done = (how) => {
        if (how === 'cancelled') return;
        db.lastBackup = new Date().toISOString(); save();
        toast(how === 'shared' ? 'Backup sent' : 'Backup file saved to Downloads');
        renderSettings();
      };
      if (viaShare) window.ElogBackup.save(name, text, 'MBBS logbook backup').then(done);
      else done(window.ElogBackup.download(new File([text], name + '.txt', { type: 'text/plain' })));
    };
    $('#exp').onclick = () => backup(true);
    $('#expDl').onclick = () => backup(false);
    $('#imp').onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || !d.c || !d.targets || d.targets.thesisProtocolMonths !== undefined) throw new Error('This is not an MBBS logbook backup.');
          askConfirm('Replace current data?', 'Everything on this device will be replaced by the backup.', 'Replace data', () => {
            db = Object.assign(blankDB(), d); save(); route(); toast('Backup restored');
          });
        } catch (err) { toast('Could not import: ' + err.message); }
      };
      r.readAsText(file);
    };
    $('#wipe').onclick = () => askConfirm('Erase all data?', 'This permanently erases every logbook entry on this device. Type ERASE to confirm.', 'Erase all data', () => { db = blankDB(); save(); route(); toast('All data erased'); }, 'ERASE');
  }
  const slug = () => (db.profile.name || 'mbbs').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportCSV(key) {
    const sc = S[key];
    const cols = [...sc.fields.map((f) => f.n), 'status', 'verifiedBy', 'verifiedOn'];
    const head = [...sc.fields.map((f) => f.l), 'Status', 'Verified by', 'Verified on'];
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [head.map(q).join(','), ...list(key).map((r) => cols.map((c) => q(c === 'subject' ? subjName(r[c]) : r[c])).join(','))];
    download(`${key}_${slug()}_${today()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv');
  }

  // ---------- Printable logbook (NMC format) ----------
  let reportPhase = null;
  function renderReport() {
    const ph = reportPhase || curPhase();
    const P = phaseById(ph);
    const p = db.profile;
    const nmcTable = (rows) => `<table class="rep"><thead><tr><th>Competency #</th><th>Name of activity</th><th>Date completed</th><th>Attempt (F / R / Re)</th><th>Rating (B / M / E) or score</th><th>Decision (C / R / Re)</th><th>Initial of faculty & date</th><th>Feedback received (initial of learner)</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.code || (r.module ? 'AETCOM ' + r.module : ''))}</td><td>${esc(r.activity || r.topic || '')}${r.subItem ? `<br><small>${esc(r.subItem)}</small>` : ''}</td><td>${fmtDate(r.date)}</td><td>${esc(r.attempt || '')}</td><td>${esc([r.rating, r.score].filter(Boolean).join(' / '))}</td><td>${esc(r.decision || '')}</td><td>${r.status === 'Verified' ? esc(r.verifiedBy) + '<br>' + fmtDate(r.verifiedOn) : ''}</td><td>${r.feedback === 'Yes' ? 'Yes' : ''}</td></tr>`).join('')}</tbody></table>`;
    const simple = (key, cols, rows) => rows.length ? `<table class="rep"><thead><tr><th>#</th>${cols.map((c) => `<th>${esc(colLabel(key, c))}</th>`).join('')}<th>Verified by / date</th><th class="sig">Faculty signature</th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td>${cols.map((c) => `<td>${esc(cellValue(key, r, c))}</td>`).join('')}<td>${r.status === 'Verified' ? esc(r.verifiedBy) + '<br>' + fmtDate(r.verifiedOn) : ''}</td><td></td></tr>`).join('')}</tbody></table>` : '<p class="muted">No entries.</p>';
    const byDate = (a, b) => sortKey(a).localeCompare(sortKey(b));
    const inPhase = (k) => list(k).filter((r) => !r.phase || r.phase === ph).sort(byDate);
    const sections = [];
    if (ph === 'P1') {
      sections.push(['Foundation Course', simple('foundation', ['date', 'module', 'hours', 'attended'], list('foundation').slice().sort(byDate))]);
      sections.push(['Early Clinical Exposure', simple('ece', ['date', 'subject', 'type', 'topic'], list('ece').slice().sort(byDate))]);
    }
    sections.push(['AETCOM', nmcTable(inPhase('aetcom'))]);
    P.teach.forEach((s) => { const rows = list('comp').filter((r) => r.phase === ph && r.subject === s).sort(byDate); if (rows.length) sections.push([`Subject: ${subjName(s)}`, nmcTable(rows)]); });
    sections.push(['Family Adoption Programme: families', simple('families', ['code', 'head', 'members', 'adopted', 'diagnosis'], list('families'))]);
    sections.push(['Family Adoption Programme: visits', simple('visits', ['date', 'family', 'purpose', 'attended', 'findings'], inPhase('visits'))]);
    if (ph !== 'P1') {
      sections.push(['Clinical postings', simple('postings', ['subject', 'unit', 'from', 'to', 'attPct', 'eopScore'], inPhase('postings'))]);
      sections.push(['Case records', simple('cases', ['date', 'subject', 'setting', 'diagnosis', 'presented'], list('cases').slice().sort(byDate))]);
    }
    if (ph === 'P3B') sections.push(['Electives', simple('electives', ['block', 'name', 'supervisor', 'from', 'to', 'attPct', 'log'], list('electives'))]);
    Object.keys(S).filter(CS.isCustom).forEach((k) => { const rows = list(k).slice().sort(byDate); if (rows.length) sections.push([S[k].title, simple(k, S[k].cols, rows)]); });
    sections.push(['Other activities (SDL, seminars, sports, extracurricular, mentoring)', simple('activities', ['date', 'type', 'title', 'with'], list('activities').slice().sort(byDate))]);
    sections.push(['Internal assessment', simple('ia', ['date', 'subject', 'kind', 'exam', 'result'], inPhase('ia'))]);

    const summaryRows = [...(ph === 'P1' ? [['Foundation Course', fmtPct(foundationPct())], ['Early Clinical Exposure', '']] : []), ['AETCOM Module', fmtPct(aetcomPct(ph))], ['Family Adoption Programme', fmtPct(fapVisitPct())],
      ...P.teach.map((s) => [subjName(s), [latestAtt(ph, s, 'Theory'), latestAtt(ph, s, 'Practical / Clinical')].map(fmtPct).join(' / ')])];
    $('#main').innerHTML = `
      <div class="no-print head-row"><h1>Print logbook</h1><div class="head-actions">
        <select id="rph" aria-label="Phase to print">${U.PHASES.map((x) => `<option value="${x.id}" ${x.id === ph ? 'selected' : ''}>${x.name}</option>`).join('')}</select>
        ${FRAMED ? '<span class="pill pend">Printing works in the installed app</span>' : '<button class="btn primary" id="printBtn">Print / Save as PDF</button>'}</div></div>
      <p class="help no-print">NMC asks for one logbook per phase, submitted before the university exam. It follows the NMC table format (columns 1–8), with the final summary and the logbook certificate.</p>
      <div class="report">
        <div class="rep-cover">
          <h1>MBBS LOGBOOK</h1><h2>${esc(P.name)}</h2>
          <p>${esc(p.college || '')}${p.university ? '<br>' + esc(p.university) : ''}</p>
          <table class="rep kv">${[['Name of the student', p.name], ['Date of admission to MBBS', fmtDate(p.admission)], ['Date of beginning of the current phase', fmtDate(p.phaseStart)], ['Reg. no. (college ID)', p.rollNo], ['Reg. no. (university ID)', p.univRegNo], ['Batch', p.batch], ['Mentor', p.mentor], ['FAP village / community', p.fapVillage], ['FAP faculty guide', p.fapFaculty]].filter((x) => x[1]).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
          <p class="small">Prepared as per NMC Guidelines for preparing Logbook (UG) and the CBME Curriculum 2024. Generated on ${fmtDate(today())}.</p>
        </div>
        ${sections.map(([h, body]) => `<section class="rep-sec"><h2>${esc(h)}</h2>${body}</section>`).join('')}
        ${SO.reportSection()}
        <section class="rep-sec"><h2>Final summary</h2>
          <table class="rep"><thead><tr><th>#</th><th>Description</th><th>Attendance % (theory / practical)</th><th>Status (complete / incomplete)</th><th class="sig">Signature of teacher</th></tr></thead>
          <tbody>${summaryRows.map(([d, a], i) => `<tr><td>${i + 1}</td><td>${esc(d)}</td><td>${esc(a)}</td><td></td><td></td></tr>`).join('')}</tbody></table>
        </section>
        <section class="rep-sec cert"><h2>Logbook certificate</h2>
          <p>This is to certify that the candidate Mr / Ms <b>${esc(p.name || '______________________')}</b>, Reg. No. <b>${esc(p.univRegNo || p.rollNo || '__________')}</b>, admitted in the year ${esc(p.batch || '________')} in ${esc(p.college || '____________________')}, has satisfactorily completed / has not completed all assignments and requirements mentioned in this logbook for <b>${esc(P.name)}</b> MBBS in the subject(s) of ${P.teach.map(subjName).map(esc).join(', ')}${ph === 'P1' ? ', Foundation Course' : ''}, AETCOM and the Family Adoption Programme during the period from __________ to __________. She / He is / is not eligible to appear for the summative (university) assessment as on the date given below.</p>
          <div class="sig-row"><div>Signature of faculty<br>Name and designation</div><div>Countersigned by Head of the Department</div><div>Principal / Dean of the college<br>Place: &nbsp;&nbsp; Date:</div></div>
        </section>
      </div>`;
    $('#rph').onchange = (e) => { reportPhase = e.target.value; renderReport(); };
    if ($('#printBtn')) $('#printBtn').onclick = () => window.print();
  }

  // ---------- Rules ----------
  function renderRules() {
    $('#main').innerHTML = `<h1>NMC rules this logbook follows</h1>
      <div class="card prose">
        <p class="help">From the NMC <b>Guidelines for preparing Logbook for the Undergraduate Medical Education Program</b> and the <b>Competency Based Medical Education (CBME) Curriculum 2024</b>, which applies from the 2024-25 batch. Your university's rules also apply.</p>
        <h3>The logbook</h3><ul>
          <li>A verified record of the competencies you acquire. The student maintains it and gets entries verified by the faculty in charge regularly; the HOD scrutinises it.</li>
          <li>Each entry records: competency number, activity, date, attempt (F / R / Re), rating (B / M / E or a score), faculty decision (C / R / Re), faculty initial, and whether you received feedback.</li>
          <li>Separate pages for Foundation Course, AETCOM, early clinical exposure, integration, humanities, each subject, sports and extracurricular activities. One logbook per phase, submitted before the exam.</li>
          <li>Logbooks may be printed or electronic; an e-logbook is described as desirable.</li>
          <li>Completing the certifiable competencies and the logbook for the phase is required to sit the university exam of that subject. The logbook carries <b>10–20% of internal assessment</b> marks.</li></ul>
        <h3>Phases (CBME 2024)</h3><ul>
          <li><b>Phase I</b> (12 months): Anatomy, Physiology, Biochemistry, introduction to Community Medicine, 2-week Foundation Course, early clinical exposure, AETCOM, FAP.</li>
          <li><b>Phase II</b> (12 months): Pathology, Microbiology, Pharmacology, Forensic Medicine, clinical postings, AETCOM, FAP.</li>
          <li><b>Phase III Part I</b> (12 months): Forensic Medicine, Community Medicine, ENT, Ophthalmology and clinical subjects.</li>
          <li><b>Phase III Part II</b> (18 months): Medicine & allied, Surgery & allied, OBG, Paediatrics; electives (two 15-day blocks).</li></ul>
        <h3>Eligibility for the university exam</h3><ul>
          <li>Attendance: <b>75% theory</b> and <b>80% practical / clinical</b> in each subject, in each phase it is taught; 80% in each clinical posting.</li>
          <li><b>75% in AETCOM</b> (needed for every university exam) and <b>80% in FAP family visits</b>.</li>
          <li>Foundation Course: 75% attendance, certified by the Principal / Dean.</li>
          <li>Electives: 75% attendance and a submitted elective logbook.</li>
          <li>Internal assessment: <b>40% in theory and in practical separately, 50% combined</b>. At least 3 IA exams in Phase I and II subjects, 2 in Phase III subjects. Subjects taught in several phases use the cumulative total.</li>
          <li>If you fall short, remedial measures are offered; attendance remediation is allowed only if attendance is above 60% in each component.</li></ul>
        <h3>Family Adoption Programme</h3><ul>
          <li>Adopt at least <b>3 families (5 preferred)</b> in Phase I and follow them through Phase III, ending with a family health report.</li></ul>
        <h3>Patient privacy</h3><ul><li>Use hospital IDs only, never patient names. Data stays on your device.</li></ul>
        <p class="muted">See <code>docs/NMC-MBBS-RULES.md</code> in the repository for sources.</p>
      </div>`;
  }

  // ---------- Modal, confirm, toast ----------
  function askConfirm(title, text, okLabel, onOk, word) {
    modal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><form id="cf" class="form-grid">
      ${word ? `<label class="field wide" for="cf_word"><span>Type ${esc(word)}</span><input id="cf_word" name="word" autocomplete="off" required></label>` : ''}
      <div class="actions wide"><button type="button" class="btn" data-close>Cancel</button><button class="btn danger-fill">${esc(okLabel)}</button></div></form>`);
    $('#cf').addEventListener('submit', (e) => { e.preventDefault(); if (word && e.target.elements.word.value.trim() !== word) return toast(`Type ${word} to confirm.`); closeModal(); onOk(); });
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
  function closeModal() { $('#modal').hidden = true; document.body.classList.remove('modal-open'); }
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

  // ---------- Boot ----------
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  $('#menuBtn').onclick = () => document.body.classList.toggle('nav-open');
  window.addEventListener('hashchange', route);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !FRAMED) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
  if (window.UG_SAMPLE && !db.profile.name && !Object.keys(db.c).some((k) => db.c[k].length)) { db = window.UG_SAMPLE(blankDB()); save(); }
  route();
})();
