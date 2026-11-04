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
- Peer-reviewed review of PGMER-2023 (compares it with PGMER-2000): <https://pmc.ncbi.nlm.nih.gov/articles/PMC10947754/>
- NMC clarification on conference presentations (Aug 2025): <https://medicaldialogues.in/health-news/nmc/research-paper-poster-publication-in-any-national-state-ima-conference-can-be-considered-for-university-exams-nmc-154242>
- Secondary summary: <https://eportfolios.in/resources/regulatory/pgmer-2023>

> NMC has not prescribed one official e-logbook app or portal. Commercial "NMC eLogbook" products are private
> vendors, not NMC. A May 2025 draft PGMER amendment (HOD rotation, super-specialty feeder courses) does not
> change the logbook rules.

## Exact wording (PGMER-2023, Gazette of India, 29 Dec 2023, clause 5.2)
Gazette copy: <https://medicaldialogues.in/pdf_upload/pgmer-2023-229326.pdf>

> **5.2 (vi)** Post-graduate students of broad and super Speciality degree courses shall maintain a dynamic e-log book
> which needs to be updated on a weekly basis about the work being carried out by them and the training programme
> undergone during the period of training. Provided that M.S. /M.Ch students shall mandatorily enter details of
> surgical procedures assisted or done independently.
>
> **5.2 (vii)** It shall be the duty of the Post-graduate guide imparting the training to assess and authenticate
> monthly the record (e-Log) books.
>
> **5.2 (x)** A post-graduate student of a degree course in broad specialty/super specialty will do at least one of the
> following to make him/her eligible to appear in his/her final examination: a. Poster presentation at a
> National/Zonal/State conference of his/her speciality; b. Podium presentation at a National/Zonal/State conference of
> his/her speciality; c. Have one research paper published/accepted for publication in journal of his/her speciality as
> first author.

The regulation does not prescribe how the guide authenticates the e-log book (no digital signature, portal or app is
specified).

## Requirements and where they live in the app

| Requirement | App section | Default target |
|---|---|---|
| **Dynamic e-logbook**, updated **weekly** by the student, **assessed and authenticated monthly by the PG guide** | All sections + **Verify**; dashboard alerts for no entry in 7 days and unverified entries over 1 month old; monthly authentication table | Weekly / monthly |
| Logbook certified by guide/HOD for exam eligibility | Print Logbook → certificate page | — |
| Thesis compulsory (MD/MS), submitted to the university 6 months before the exam; carries 20 marks | Thesis | Protocol by 6 months, submission by 30 months |
| Research for exam eligibility: **at least ONE** of poster or podium presentation at a national/zonal/state conference of the specialty, or a first-author paper published/accepted in a specialty journal (PGMER-2000 required all three) | Presentations, Publications → Dashboard | 1 (any) |
| NMC letter of 5 Aug 2025: this goes by specialty, not organisation, so national/state IMA conferences count | Presentations | — |
| Mandatory courses: online Research Methodology course, Ethics (incl. GCP/GLP), BCLS, ACLS | Courses checklist | Required |
| District Residency Programme: 3 months (3rd–5th semester); satisfactory completion certificate needed; college reports to NMC within 1 week | Postings & DRP | 90 days |
| Minimum 80% attendance (cumulative over the course) | Leave → Dashboard | 80% |
| Leave: 20 paid casual + 5 paid academic per year, weekly off, maternity/paternity per government rules; excess extends tenure | Leave → Dashboard | 20 / 5 |
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
