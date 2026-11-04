/*
 * Reference data for the MBBS (UG) e-Logbook.
 * Sources: NMC "Guidelines for preparing Logbook for Undergraduate Medical Education Program" (2020)
 * and NMC Competency Based Medical Education (CBME) Curriculum 2024 (from the 2024-25 batch).
 * See ../docs/NMC-MBBS-RULES.md.
 */
window.UGDATA = (function () {
  // Subject codes as used in NMC competency numbers (e.g. PY6.8, AN2.1).
  const SUBJECTS = {
    AN: 'Anatomy', PY: 'Physiology', BI: 'Biochemistry', CM: 'Community Medicine',
    PA: 'Pathology', MI: 'Microbiology', PH: 'Pharmacology', FM: 'Forensic Medicine & Toxicology',
    IM: 'General Medicine', SU: 'General Surgery', OG: 'Obstetrics & Gynaecology', PE: 'Paediatrics',
    EN: 'Otorhinolaryngology (ENT)', OP: 'Ophthalmology', OR: 'Orthopaedics',
    DR: 'Dermatology, Venereology & Leprosy', PS: 'Psychiatry', AS: 'Anaesthesiology', RD: 'Radiodiagnosis'
  };

  // CBME 2024 phase structure (4½ years + internship).
  const PHASES = [
    { id: 'P1', name: 'Phase I', months: 12, teach: ['AN', 'PY', 'BI', 'CM'], exam: ['AN', 'PY', 'BI'] },
    { id: 'P2', name: 'Phase II', months: 12, teach: ['PA', 'MI', 'PH', 'FM', 'CM', 'IM', 'SU', 'OG'], exam: ['PA', 'MI', 'PH'] },
    { id: 'P3A', name: 'Phase III Part I', months: 12, teach: ['FM', 'CM', 'EN', 'OP', 'IM', 'SU', 'PE', 'OG', 'RD', 'AS'], exam: ['FM', 'CM', 'EN', 'OP'] },
    { id: 'P3B', name: 'Phase III Part II', months: 18, teach: ['IM', 'PS', 'DR', 'SU', 'OR', 'AS', 'RD', 'OG', 'PE'], exam: ['IM', 'SU', 'OG', 'PE'] }
  ];
  // Allied subjects whose internal assessment counts toward the parent subject (CBME 2024).
  const ALLIED = { PS: 'IM', DR: 'IM', OR: 'SU', AS: 'SU', RD: 'SU' };

  // Columns of the NMC logbook table.
  const ATTEMPT = [{ v: 'F', l: 'F – First / only attempt' }, { v: 'R', l: 'R – Repeat' }, { v: 'Re', l: 'Re – Remedial' }];
  const RATING = [{ v: 'B', l: 'B – Below expectations' }, { v: 'M', l: 'M – Meets expectations' }, { v: 'E', l: 'E – Exceeds expectations' }];
  const DECISION = [{ v: 'C', l: 'C – Completed' }, { v: 'R', l: 'R – Repeat' }, { v: 'Re', l: 'Re – Remedial' }];

  const SUB_ITEMS = ['Practical (student lab)', 'Practical (clinical lab)', 'Dissection', 'Histology', 'Museum session',
    'Skills lab / DOAP (simulation)', 'Clinical posting', 'Small group discussion', 'Seminar / symposium',
    'Self-directed learning', 'Early clinical exposure', 'Vertical / horizontal integration', 'Field / clinic visit', 'Tutorial'];

  // AETCOM module numbers per phase (CBME 2024 blueprint). Titles vary by institution, so students type the topic.
  const AETCOM = {
    P1: ['1.1', '1.2', '1.3', '1.4', '1.5'],
    P2: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'],
    P3A: ['3.1', '3.2', '3.3', '3.4', '3.5'],
    P3B: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9']
  };

  const FOUNDATION = ['Orientation programme', 'Skills module – first aid', 'Skills module – basic life support',
    'Skills module – universal precautions & vaccination', 'Skills module – biohazard / biomedical waste',
    'Field visit to health centre', 'Professional development & ethics', 'AYUSH & history of medicine',
    'Mental health & stress management', 'Time management / learning skills', 'IT & artificial intelligence',
    'Local language programme', 'English language programme', 'Computer skills', 'Sports (protected 4 h/week)',
    'Extracurricular / leisure'];

  // Attendance components and minimum % (CBME 2024).
  const ATT_RULES = {
    'Theory': 75,
    'Practical / Clinical': 80,
    'Clinical posting': 80,
    'AETCOM': 75,
    'Foundation Course': 75,
    'Electives': 75,
    'FAP family visits': 80
  };

  const DEFAULT_TARGETS = { fapFamiliesMin: 3, fapFamiliesPreferred: 5, iaEach: 40, iaCombined: 50, cert: {} };

  return { SUBJECTS, PHASES, ALLIED, ATTEMPT, RATING, DECISION, SUB_ITEMS, AETCOM, FOUNDATION, ATT_RULES, DEFAULT_TARGETS };
})();
