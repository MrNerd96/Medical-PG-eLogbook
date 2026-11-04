# Medical PG e-Logbook (India · NMC PGMER-2023)

A free, **offline-first e-logbook for MD / MS / Diploma postgraduate students in India**, structured around the
National Medical Commission's *Post-Graduate Medical Education Regulations, 2023* (PGMER-2023) and the NMC
competency-based PG curriculum guidelines.

It is a plain HTML/CSS/JavaScript web app: no server, no account, no build step. All data stays on the student's
device. It can be installed to a phone's home screen (PWA) and works without internet.

## What it records

| Section | Contents |
|---|---|
| **Profile** | Name, degree & specialty (all NMC MD/MS courses), registration nos., college, university, joining date, guide, HOD, mentor |
| **Clinical cases** | Date, setting (OPD/IPD/ICU/Emergency/OT/DRP…), UHID/IP no. (no patient names), diagnosis, role, competency code, learning points |
| **Procedures & skills** | Specialty-specific preset list + custom; level of participation **O / A / PS / PI** (observed, assisted, performed under supervision, performed independently); summary table and targets |
| **Academic activities** | Seminars, journal clubs, case presentations, grand rounds, CPC, M&M meetings, UG teaching, lectures |
| **Thesis** | Protocol, IEC approval, university approval, CTRI, data collection, submission and acceptance, with due dates calculated from the joining date |
| **Presentations / Publications / Conferences** | Tracks the PGMER-2023 research requirement for exam eligibility: at least one of a poster or podium presentation (state/zonal/national) or a first-author paper. Also records CMEs and workshops |
| **Workplace-based assessments** | Mini-CEX, DOPS, CbD, 360° MSF, OSCE, internal exams, with feedback and action plan |
| **Periodic appraisal** | The NMC *Student Appraisal Form* (7 elements, each scored 1–9) |
| **Postings & DRP** | Unit and rotational postings and the mandatory 3-month **District Residency Programme** |
| **Leave** | Leave record, with attendance % calculated against the 80% minimum |
| **Courses** | Mandatory: research methodology (BCBR), ethics (GCP/GLP), BCLS, ACLS. Recommended: induction, IPC/BMW, rational drug use |
| **Mentor meetings & reflections** | Mentor–mentee meetings and reflective writing |

### Faculty verification
PGMER-2023 says the e-logbook must be **updated weekly** and **authenticated monthly by the PG guide**. The
dashboard has a monthly authentication table, and alerts you when there has been no entry for 7 days or when an
entry has gone unverified for more than a month. Every entry is therefore **Pending** until a faculty member verifies it on the student's device
(name, date and remarks are recorded). Editing a verified entry resets it to Pending. The **Print Logbook** page
produces an A4 logbook with a signature column on every row, a cover page and an HOD certificate. You can also
save it as a PDF.

### Dashboard
The dashboard shows progress against the PGMER-2023 requirements (poster, oral paper, publication, DRP days,
attendance, appraisals), thesis milestones, course completion, and alerts for due dates and pending verifications.
All targets can be edited under **Targets & Backup**, including per-procedure minimum numbers set by your
department.

## MBBS (UG) e-logbook

The `mbbs/` folder has a second app for **MBBS students**, built on the NMC *Guidelines for preparing Logbook* and the
**CBME Curriculum 2024**:

- **Competency log** in the NMC 8-column format: competency #, activity, date, attempt F/R/Re, rating B/M/E or score,
  faculty decision C/R/Re, faculty initial, feedback received. Includes a certifiable-competency flag.
- **Foundation Course**, **Early Clinical Exposure**, **AETCOM** (modules by phase), **Family Adoption Programme**
  (families and visits), **clinical postings**, **case records**, **electives**, **internal assessment**, **attendance**,
  and SDL, seminars, sports and mentoring.
- **Dashboard** checks university-exam eligibility per subject: 75% theory and 80% practical attendance, IA of 40% each and
  50% combined, and certifiable competencies. It also checks AETCOM 75%, FAP 3 families and 80% visits, Foundation Course 75%
  and electives 75%.
- **Print Logbook**: one logbook per phase, with the final summary and the NMC logbook certificate.

Open `mbbs/index.html` (or `/mbbs/` on GitHub Pages). Rules and sources: `docs/NMC-MBBS-RULES.md`.

## Using it

1. Open `index.html` through any static web host (GitHub Pages works). Service workers need `http(s)`, so for
   local testing run `python3 -m http.server` in this folder and open <http://localhost:8000>.
2. On a phone, open the site and choose **Add to Home Screen** to install it.
3. **Back up regularly.** Data is stored only in the browser's local storage on that device. Use
   *Targets & Backup → Export backup (.json)* and keep the file on Drive or email. *Import backup* restores it on a
   new phone.

### Hosting on GitHub Pages
Repository **Settings → Pages → Deploy from a branch →** pick the branch, folder `/ (root)`.

## Design
Both apps are styled as a clinical record register: ruled tables, a red margin rule and a surgical-green accent, with
light and dark themes. Fonts are IBM Plex Sans and IBM Plex Mono (SIL Open Font License), bundled in `fonts/` so the apps
work offline.

## Privacy
Do not enter patient names or other identifiers. Use hospital UHID/IP numbers only, in line with the Digital
Personal Data Protection Act, 2023. No data leaves the device unless you export it.

## Files
```
index.html            App shell
css/styles.css        Styles (light/dark, mobile, print)
js/data.js            NMC reference data: specialties, procedure presets, courses, appraisal form, default targets
js/app.js             Application logic
sw.js                 Offline cache (service worker)
manifest.webmanifest  PWA manifest
docs/NMC-RULES.md     The regulations this logbook follows, with sources
```

## Disclaimer
This is an aid for students. It is not an official NMC product. Always follow the latest NMC notifications and
your university's regulations, which take precedence.
