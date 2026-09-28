# SafeCity – ιστότοπος έργου (Azure Static Web Apps)

Στατική έκδοση του **www.safecity-project.gr**. Είναι μεταφορά από το Google Sites σε καθαρό HTML/CSS, με στόχο τη συμμόρφωση με **WCAG 2.1 επιπέδου AA**, ώστε να περνάει τους ελέγχους [WAVE](https://wave.webaim.org/) και [AChecker](https://achecks.org/achecker).

Το περιεχόμενο (κείμενα, εικόνες, σύνδεσμοι, βίντεο, φόρμα) είναι το ίδιο με το αρχικό site. Αλλαγές έγιναν μόνο για λόγους προσβασιμότητας. Αναλυτικά: [`docs/ACCESSIBILITY-REPORT.md`](docs/ACCESSIBILITY-REPORT.md).

## Δομή

```
.
├── .github/workflows/azure-static-web-apps.yml   # CI: έλεγχος προσβασιμότητας + deploy στο Azure
├── docs/ACCESSIBILITY-REPORT.md                  # τι διορθώθηκε σε σχέση με το Google Sites
├── tests/a11y-check.mjs                          # αυτόματος έλεγχος (axe-core + HTML_CodeSniffer)
├── package.json
└── src/                                          # ← αυτό ανεβαίνει στο Azure (app_location)
    ├── index.html                 Αρχική
    ├── consortium/index.html      Κοινοπραξία
    ├── media/index.html           Media
    ├── news/index.html            Νέα
    ├── contact/index.html         Επικοινωνία
    ├── accessibility/index.html   Δήλωση προσβασιμότητας (νέα σελίδα, link στο footer)
    ├── 404.html
    ├── staticwebapp.config.json   redirects από τα παλιά URL, headers ασφαλείας, σελίδα 404
    ├── robots.txt, sitemap.xml, favicon.png, apple-touch-icon.png
    └── assets/
        ├── css/style.css
        ├── js/main.js             μόνο το κουμπί «Μενού» στο κινητό
        ├── fonts/                 Roboto & Open Sans (τοπικά, χωρίς Google Fonts)
        └── img/                   όλες οι εικόνες του αρχικού site
```

Δεν χρειάζεται build. Τα αρχεία του `src/` σερβίρονται όπως είναι.

## Τοπική προβολή

Οι σύνδεσμοι είναι της μορφής `/news/`, οπότε το site θέλει web server. Αν ανοίξεις το αρχείο με διπλό κλικ, δεν θα δουλέψει σωστά. Διάλεξε έναν από τους τρόπους:

```bash
npx serve src                 # http://localhost:3000
# ή, για να δουλεύουν και τα redirects του Azure:
npm i -g @azure/static-web-apps-cli
swa start src                 # http://localhost:4280
```

Εναλλακτικά, στο VS Code: επέκταση **Live Server** → δεξί κλικ στο `src/index.html` → *Open with Live Server*.

## Έλεγχος προσβασιμότητας

**Αυτόματα (και στο CI):**

```bash
npm install
npm test          # axe-core (WCAG 2.0/2.1/2.2 A+AA) + HTML_CodeSniffer (WCAG2AA), desktop & κινητό
npm run test:html # W3C Nu HTML Checker (χρειάζεται Java)
```

Αν το Chrome δεν βρεθεί αυτόματα: `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm test`

**Με WAVE:**

- Πριν το deploy: εγκατέστησε την επέκταση [WAVE για Chrome/Firefox/Edge](https://wave.webaim.org/extension/) και άνοιξέ τη πάνω στο `http://localhost:...`.
- Μετά το deploy: βάλε το δημόσιο URL στο https://wave.webaim.org/.

Αναμενόμενο αποτέλεσμα: **0 Errors, 0 Contrast Errors**. Μπορεί να εμφανιστούν κάποια *Alerts*. Δεν είναι σφάλματα, είναι σημεία για έλεγχο από άνθρωπο, π.χ. «YouTube video» (έλεγξε αν το βίντεο έχει υπότιτλους).

**Με AChecker:** στο https://achecks.org/achecker διάλεξε *WCAG 2.1 (Level AA)*. Κάνε έλεγχο με URL (μετά το deploy) ή με *Upload* του κάθε `index.html` (πριν το deploy).

## Deploy στο Azure Static Web Apps

### 1. Repository

```bash
git init
git add .
git commit -m "SafeCity: στατικό, προσβάσιμο site"
git branch -M main
git remote add origin https://github.com/<org>/safecity-site.git
git push -u origin main
```

### 2. Δημιουργία Static Web App

Azure Portal → **Create a resource** → **Static Web App**:

| Πεδίο | Τιμή |
|---|---|
| Plan type | **Free** (αρκεί) ή Standard |
| Region | West Europe |
| Deployment source | **Other** (θα χρησιμοποιηθεί το workflow του repo) |

Μετά τη δημιουργία: **Overview → Manage deployment token** → αντιγραφή.

> Αν διαλέξεις «GitHub» αντί για «Other», το Azure θα προσθέσει δικό του workflow στο repo. Σε αυτή την περίπτωση κράτα **ένα** από τα δύο workflows. Στο δικό του βάλε `app_location: "src"` και `skip_app_build: true`.

### 3. Secret στο GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**

- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Value: το deployment token

Κάθε `push` στο `main` κάνει πρώτα τον έλεγχο προσβασιμότητας και μετά deploy. Αν ο έλεγχος αποτύχει, **δεν** γίνεται deploy. Τα Pull Requests παίρνουν δικό τους preview URL.

**Χωρίς GitHub** (π.χ. Azure DevOps ή χειροκίνητα):

```bash
npm i -g @azure/static-web-apps-cli
swa deploy ./src --deployment-token <TOKEN> --env production
```

### 4. Custom domain (safecity-project.gr)

1. Ένα 24ωρο πριν, κατέβασε το TTL των εγγραφών DNS (π.χ. 300s).
2. Static Web App → **Custom domains → Add → Custom domain on other DNS**.
3. Για το `www.safecity-project.gr`, βάλε **CNAME** `www` → `<όνομα>.azurestaticapps.net`.
4. Για το σκέτο `safecity-project.gr` (apex):
   - Βάλε την εγγραφή **TXT** που δίνει το Azure για επαλήθευση.
   - Μετά βάλε **ALIAS/ANAME** (ή CNAME flattening) προς το `<όνομα>.azurestaticapps.net`.
   - Αν ο πάροχος DNS δεν τα στηρίζει, μετέφερε τη ζώνη στο **Azure DNS** (εκεί γίνεται με alias record) ή κάνε redirect του apex στο `www` από τον πάροχο.
5. Το πιστοποιητικό HTTPS εκδίδεται αυτόματα και δωρεάν.
6. Όταν δουλέψει το νέο site, αφαίρεσε το custom domain από το Google Sites: *Ρυθμίσεις → Προσαρμοσμένα domains*.

Τα παλιά URL του Google Sites (`/αρχική`, `/νέα`, `/επικοινωνία`) ανακατευθύνονται με 301 στις νέες σελίδες, μέσω του `staticwebapp.config.json`. Τα `/consortium` και `/media` μένουν ίδια.

## Συντήρηση – κανόνες για να μένει προσβάσιμο

- **Κάθε νέα εικόνα** θέλει `alt` που περιγράφει τι δείχνει. Αν είναι μόνο διακοσμητική, βάλε `alt=""`. Βάλε επίσης `width`/`height`.
- **Μία `<h1>` ανά σελίδα**, στο banner. Οι ενότητες είναι `<h2>` και οι υποενότητες `<h3>`. Μην πηδάς επίπεδα.
- **Σύνδεσμοι σε νέα καρτέλα** θέλουν το `<span class="visually-hidden"> (ανοίγει σε νέα καρτέλα)</span>`.
- **Αγγλικές φράσεις** μέσα στο ελληνικό κείμενο θέλουν `<span lang="en">…</span>`.
- **Χρώματα:** χρησιμοποίησε τις μεταβλητές του `style.css`. Κάθε νέος συνδυασμός κειμένου/φόντου πρέπει να έχει αντίθεση ≥ 4.5:1 (έλεγχος στο https://webaim.org/resources/contrastchecker/).
- **Γράφε ελληνικά με ελληνικούς χαρακτήρες και λατινικά με λατινικούς.** Για παράδειγμα, όχι «Τransport» με ελληνικό Τ. Οι αναγνώστες οθόνης προφέρουν λάθος τις μικτές λέξεις.
- Τρέξε `npm test` πριν από κάθε commit.
