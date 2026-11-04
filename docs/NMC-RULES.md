# NMC rules implemented in this e-logbook

This is a summary of the requirements the app is built around. Verify against the current official texts, because
NMC issues amendments and advisories, and universities add their own rules.

## Sources
- **Post-Graduate Medical Education Regulations, 2023 (PGMER-2023)**, National Medical Commission (Gazette notification).
  NMC link: <https://www.nmc.org.in/MCIRest/open/getDocument?path=/Documents/Public/Portal/LatestNews/MER.pdf>
  (NMC website → Rules & Regulations).
- **NMC Guidelines for Competency-Based Postgraduate Training Programme** (subject-wise curricula for MD/MS/Diploma, 2022).
  These are the source of the student appraisal form and the levels of participation for skills.
- Sample university PG logbooks built on the NMC format, e.g. Odisha University of Health Sciences:
  <https://ouhs.ac.in/upload/224839%20PG%20LOG%20BOOK%20OUHS%20GEN%20MEDICINE.pdf>
- Secondary summary: <https://eportfolios.in/resources/regulatory/pgmer-2023>

## Requirements and where they live in the app

| Requirement | App section | Default target |
|---|---|---|
| Logbook (e-logbook) of clinical work, procedures, academic activities, checked periodically by faculty | Cases, Procedures, Academics + **Verify** | — |
| Logbook certified by guide/HOD for exam eligibility | Print Logbook → certificate page | — |
| Thesis compulsory (MD/MS); protocol with IEC approval early in the course; thesis submitted before the exam | Thesis | Protocol by 6 months, submission by 30 months |
| At least one poster presentation | Presentations | 1 |
| At least one oral paper (podium) presentation | Presentations | 1 |
| At least one research paper published/accepted | Publications | 1 |
| Basic Course in Biomedical Research (BCBR) | Courses checklist | Required |
| District Residency Programme: 3 months (3rd–5th semester) | Postings & DRP | 90 days |
| Minimum attendance (generally 80%) | Leave → Dashboard | 80% |
| Formative assessment incl. workplace-based assessment | Workplace-Based Assessments | Department-set |
| Periodic appraisal (NMC Student Appraisal Form, 1–9 scale) | Periodic Appraisal | 6 (one per semester) |
| Mentor–mentee programme | Mentor Meetings | — |
| Life-support and ethics training | Courses checklist | — |

### NMC Student Appraisal Form elements (each scored 1–9)
1. Journal-based / recent advances learning
2. Patient-based / laboratory or skill-based learning
3. Self-directed learning and teaching
4. Departmental and inter-departmental learning activity
5. External and outreach activities / CMEs
6. Thesis / research work
7. Log book maintenance

Scale: 1–3 less than satisfactory · 4–6 satisfactory · 7–9 more than satisfactory.

### Levels of participation in procedures
**O** observed · **A** assisted · **PS** performed under supervision · **PI** performed independently.

## Points to verify locally
- Exact procedure numbers. Most NMC curricula list the skills without fixed counts, so set your department's
  numbers under *Targets & Backup*.
- Thesis deadlines and the frequency of internal assessments. These vary by university.
- Whether your institution or university requires a specific logbook template or portal in addition to this one.
