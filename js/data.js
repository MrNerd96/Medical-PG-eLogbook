/*
 * Reference data for the Medical PG e-Logbook.
 * Based on NMC Post-Graduate Medical Education Regulations (PGMER-2023) and the
 * NMC competency-based PG curriculum guidelines (2022). See docs/NMC-RULES.md.
 * Everything here is a sensible default — users can change targets in the app,
 * and departments/universities may prescribe additional requirements.
 */
window.PGDATA = (function () {
  const SPECIALTIES = {
    'MD': [
      'Aerospace Medicine', 'Anaesthesiology', 'Anatomy', 'Biochemistry', 'Community Medicine',
      'Dermatology, Venereology & Leprosy', 'Emergency Medicine', 'Family Medicine',
      'Forensic Medicine & Toxicology', 'General Medicine', 'Geriatrics', 'Hospital Administration',
      'Immuno-Haematology & Blood Transfusion', 'Laboratory Medicine', 'Marine Medicine', 'Microbiology',
      'Nuclear Medicine', 'Paediatrics', 'Palliative Medicine', 'Pathology', 'Pharmacology',
      'Physical Medicine & Rehabilitation', 'Physiology', 'Psychiatry', 'Radiation Oncology',
      'Radiodiagnosis', 'Respiratory Medicine', 'Sports Medicine', 'Tropical Medicine'
    ],
    'MS': [
      'General Surgery', 'Obstetrics & Gynaecology', 'Ophthalmology', 'Orthopaedics',
      'Otorhinolaryngology (ENT)', 'Traumatology & Surgery'
    ],
    'Diploma': [
      'Anaesthesiology (DA)', 'Obstetrics & Gynaecology (DGO)', 'Paediatrics (DCH)',
      'Ophthalmology (DO)', 'Otorhinolaryngology (DLO)', 'Orthopaedics (D.Ortho)',
      'Radiodiagnosis (DMRD)', 'Psychiatry (DPM)', 'Dermatology (DDVL)', 'Other Diploma'
    ]
  };

  // Common procedures/skills per specialty (drawn from NMC PG curricula). Users can add their own.
  const COMMON = ['Basic Life Support (CPR)', 'IV cannulation', 'Arterial blood gas sampling',
    'Nasogastric tube insertion', 'Urinary catheterisation', 'Informed consent counselling'];

  const PROCEDURES = {
    'General Medicine': [...COMMON, 'Lumbar puncture', 'Pleural tap (thoracocentesis)', 'Ascitic tap (paracentesis)',
      'Bone marrow aspiration', 'Bone marrow biopsy', 'Central venous catheterisation', 'Endotracheal intubation',
      'Mechanical ventilation set-up', 'ECG recording & interpretation', 'Defibrillation / cardioversion',
      'Temporary pacing (observed)', 'Joint aspiration', 'Liver biopsy (assisted)', 'Peripheral smear examination',
      'Fundoscopy', 'Bedside echocardiography (POCUS)'],
    'General Surgery': [...COMMON, 'Wound debridement', 'Suturing of lacerations', 'Incision & drainage of abscess',
      'Excision of lump / cyst', 'Inguinal hernia repair', 'Appendicectomy', 'Laparotomy',
      'Laparoscopic cholecystectomy', 'Diagnostic laparoscopy', 'Intercostal drain insertion', 'Tracheostomy',
      'Circumcision', 'Haemorrhoidectomy', 'Mastectomy', 'Thyroidectomy', 'Skin grafting', 'Amputation',
      'Venous cut-down', 'FAST scan'],
    'Obstetrics & Gynaecology': [...COMMON, 'Antenatal examination', 'Normal vaginal delivery', 'Episiotomy & repair',
      'Instrumental delivery (vacuum / forceps)', 'Lower segment caesarean section', 'Manual removal of placenta',
      'Management of PPH', 'Dilatation & curettage', 'Medical termination of pregnancy', 'IUCD insertion',
      'Tubal ligation', 'Pap smear / VIA / VILI', 'Colposcopy', 'Abdominal hysterectomy', 'Vaginal hysterectomy',
      'Laparoscopy (diagnostic / operative)', 'Obstetric ultrasound', 'CTG interpretation'],
    'Paediatrics': [...COMMON, 'Neonatal resuscitation (NRP)', 'Paediatric advanced life support', 'Lumbar puncture',
      'Umbilical vein catheterisation', 'Exchange transfusion', 'Phototherapy management', 'Intraosseous access',
      'Bag & mask ventilation', 'Endotracheal intubation', 'Surfactant administration', 'Bone marrow aspiration',
      'Developmental assessment', 'Anthropometry & growth charting', 'Immunisation administration',
      'Pleural / ascitic tap', 'CPAP application'],
    'Anaesthesiology': [...COMMON, 'Pre-anaesthetic check-up', 'Endotracheal intubation', 'Laryngeal mask airway insertion',
      'Difficult airway management', 'Rapid sequence induction', 'Spinal anaesthesia', 'Epidural anaesthesia / analgesia',
      'Peripheral nerve block (USG-guided)', 'Central venous catheterisation', 'Arterial line insertion',
      'General anaesthesia – adult', 'General anaesthesia – paediatric', 'Obstetric anaesthesia',
      'Mechanical ventilation in ICU', 'Fibreoptic intubation', 'Post-operative pain management'],
    'Orthopaedics': [...COMMON, 'Closed reduction & POP cast', 'Skeletal traction', 'Skin traction', 'Joint aspiration',
      'Intra-articular injection', 'Wound debridement (open fracture)', 'K-wire fixation', 'Plating (ORIF)',
      'Intramedullary nailing', 'External fixator application', 'Hemiarthroplasty', 'Total joint replacement (assisted)',
      'Arthroscopy (assisted)', 'Tendon repair', 'Amputation', 'Spine surgery (assisted)'],
    'Ophthalmology': [...COMMON, 'Visual acuity & refraction', 'Slit-lamp examination', 'Direct / indirect ophthalmoscopy',
      'Tonometry', 'Gonioscopy', 'Syringing of lacrimal passage', 'Foreign body removal', 'Chalazion I&C',
      'Pterygium excision', 'SICS (cataract surgery)', 'Phacoemulsification', 'Trabeculectomy', 'DCR',
      'Intravitreal injection (observed/assisted)', 'Retinoscopy', 'Perimetry interpretation'],
    'Otorhinolaryngology (ENT)': [...COMMON, 'Otoscopy & tuning fork tests', 'Pure tone audiometry interpretation',
      'Ear syringing / wax removal', 'Anterior nasal packing', 'Posterior nasal packing', 'Diagnostic nasal endoscopy',
      'Myringotomy / grommet', 'Tonsillectomy', 'Adenoidectomy', 'Septoplasty', 'FESS', 'Tympanoplasty',
      'Mastoidectomy', 'Tracheostomy', 'Direct laryngoscopy', 'Foreign body removal (ear / nose / throat)'],
    'Dermatology, Venereology & Leprosy': [...COMMON, 'KOH mount', 'Gram stain / Tzanck smear', 'Slit skin smear',
      'Skin biopsy (punch / incisional)', 'Patch test', 'Electrocautery', 'Radiofrequency ablation', 'Cryotherapy',
      'Chemical peel', 'Intralesional injection', 'Dermatoscopy', 'Nail biopsy', 'Acne surgery / comedone extraction',
      'Phototherapy (NB-UVB / PUVA)', 'Lasers (observed / assisted)'],
    'Respiratory Medicine': [...COMMON, 'Spirometry / PFT interpretation', 'Pleural tap', 'Pleural biopsy',
      'Intercostal drain insertion', 'Fibreoptic bronchoscopy', 'BAL', 'Thoracoscopy (assisted)',
      'Non-invasive ventilation', 'Mechanical ventilation', 'Arterial blood gas interpretation',
      'Sputum AFB / CBNAAT collection', 'Polysomnography interpretation', 'Chest ultrasound'],
    'Psychiatry': ['Basic Life Support (CPR)', 'Psychiatric history & mental status examination',
      'Mini-Mental State Examination', 'Risk assessment (suicide / violence)', 'Modified ECT',
      'Psychometric test administration', 'Brief psychotherapy / counselling', 'CBT session',
      'Family therapy / psycho-education', 'Motivational interviewing', 'De-addiction management',
      'Capacity assessment (MHCA 2017)', 'Rapid tranquillisation'],
    'Emergency Medicine': [...COMMON, 'Triage', 'Advanced cardiac life support', 'Endotracheal intubation',
      'Rapid sequence intubation', 'Cricothyrotomy', 'Defibrillation / cardioversion', 'Transcutaneous pacing',
      'Central venous catheterisation', 'Intercostal drain insertion', 'Needle decompression', 'FAST / eFAST',
      'Splinting & fracture immobilisation', 'Wound suturing', 'Procedural sedation', 'Pericardiocentesis'],
    'Radiodiagnosis': ['Basic Life Support (CPR)', 'Chest X-ray reporting', 'Ultrasound abdomen', 'Obstetric ultrasound',
      'Doppler study', 'CT reporting', 'MRI reporting', 'Contrast reaction management', 'Barium studies',
      'IVU / MCU / RGU', 'HSG', 'USG-guided FNAC / biopsy', 'CT-guided biopsy', 'Mammography reporting',
      'Interventional procedures (assisted)'],
    'Pathology': ['Gross examination & grossing', 'Histopathology reporting', 'FNAC (performed)', 'Cytology reporting',
      'Frozen section', 'Peripheral smear reporting', 'Bone marrow aspiration & reporting', 'Blood grouping & cross-match',
      'Coagulation studies', 'Urine analysis', 'Autopsy (clinical, observed)', 'Special stains / IHC',
      'Quality control / Levey-Jennings'],
    'Microbiology': ['Specimen collection & transport', 'Gram stain', 'Ziehl-Neelsen stain', 'Culture & sensitivity',
      'Antimicrobial susceptibility testing', 'Blood culture processing', 'ELISA', 'Rapid diagnostic tests',
      'PCR / molecular tests', 'Mycology (KOH, culture)', 'Parasitology (stool exam, smear)',
      'Hospital infection control surveillance', 'Biomedical waste management audit', 'Sterilisation checks'],
    'Community Medicine': ['Family / household survey', 'Epidemic / outbreak investigation', 'Health education session',
      'Immunisation session', 'Nutritional assessment', 'Water sampling / chlorination check', 'School health check-up',
      'Field visit (PHC / CHC / SC)', 'National health programme review', 'Data analysis (statistics)',
      'Occupational health visit', 'Health camp', 'Vector survey'],
    'Pharmacology': ['Prescription audit', 'ADR reporting (PvPI)', 'Experimental pharmacology exercise',
      'Clinical pharmacology exercise', 'Drug information query', 'Therapeutic drug monitoring',
      'Critical appraisal of drug promotional literature', 'Computer-assisted learning module', 'Biostatistics exercise'],
    'Physiology': ['Haematology practical', 'Clinical examination demonstration', 'ECG recording', 'Spirometry / PFT',
      'Nerve conduction study', 'EEG recording', 'Autonomic function tests', 'Ergography', 'Amphibian / CAL experiment'],
    'Anatomy': ['Cadaveric dissection', 'Embalming', 'Museum specimen preparation', 'Histology slide preparation',
      'Osteology teaching', 'Karyotyping', 'Radiological anatomy', 'Surface marking'],
    'Biochemistry': ['Spectrophotometry', 'Electrophoresis', 'Chromatography', 'ELISA', 'Auto-analyser operation',
      'Internal quality control', 'ABG analysis', 'Urine analysis', 'Lipid profile', 'Molecular techniques (PCR)'],
    'Forensic Medicine & Toxicology': ['Medico-legal autopsy', 'Age estimation', 'Injury report', 'Sexual assault examination',
      'Drunkenness examination', 'Potency examination', 'Exhumation (observed)', 'Court evidence (observed)',
      'Toxicology sample preservation', 'Death certificate (MCCD)']
  };
  const GENERIC = [...COMMON, 'Lumbar puncture', 'Endotracheal intubation', 'Suturing', 'Central venous catheterisation'];

  const PARTICIPATION = [
    { v: 'O', l: 'O – Observed' },
    { v: 'A', l: 'A – Assisted' },
    { v: 'PS', l: 'PS – Performed under supervision' },
    { v: 'PI', l: 'PI – Performed independently' }
  ];

  // Training / courses mentioned by NMC (PGMER-2023 & curriculum guidelines).
  const MANDATORY_COURSES = [
    { id: 'bcbr', name: 'Basic Course in Biomedical Research (BCBR)', note: 'Mandatory for all PGs; required before submitting thesis / appearing in final exam.' },
    { id: 'bls', name: 'Basic Life Support (BLS)', note: 'Life-support skills training.' },
    { id: 'acls', name: 'Advanced Cardiac Life Support (ACLS)', note: 'Life-support skills (as per department).' },
    { id: 'ethics', name: 'Course in Medical Ethics / Good Clinical Practice', note: 'Ethics & research ethics training.' },
    { id: 'induction', name: 'Induction / Orientation Programme', note: 'At joining – rules, hospital systems, communication.' },
    { id: 'ipc', name: 'Infection Prevention & Control / Biomedical Waste', note: 'Hospital infection control training.' },
    { id: 'rdl', name: 'Rational Drug Use / Pharmacovigilance', note: 'Recommended in NMC curricula.' }
  ];

  // NMC "Student Appraisal Form" elements (PG curriculum guidelines), scored 1–9.
  const APPRAISAL_ITEMS = [
    ['a1', 'Journal-based / recent advances learning'],
    ['a2', 'Patient-based / laboratory or skill-based learning'],
    ['a3', 'Self-directed learning and teaching'],
    ['a4', 'Departmental and inter-departmental learning activity'],
    ['a5', 'External and outreach activities / CMEs'],
    ['a6', 'Thesis / research work'],
    ['a7', 'Log book maintenance']
  ];

  const DEFAULT_TARGETS = {
    attendancePct: 80,
    drpDays: 90,
    posters: 1,
    orals: 1,
    publications: 1,
    seminars: 0,
    journalClubs: 0,
    casePresentations: 0,
    wpba: 0,
    appraisals: 6,
    thesisProtocolMonths: 6,
    thesisSubmitMonths: 30,
    courseMonths: 36,
    procedures: {}
  };

  return { SPECIALTIES, PROCEDURES, GENERIC, PARTICIPATION, MANDATORY_COURSES, APPRAISAL_ITEMS, DEFAULT_TARGETS };
})();
