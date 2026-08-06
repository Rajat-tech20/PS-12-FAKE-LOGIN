# CampusAuthGuard - Hackathon Demo & Pitch Script

## 🎤 Pitch Script (2 Minutes)

### 1. Problem Introduction (30s)
> "During exam and scholarship cycles, students frequently fall victim to credential phishing. Attackers deploy pixel-identical clones of college ERP, webmail, and scholarship portals hosted on lookalike domains like `college-erp-login.netlify.app`. Because the page looks visually identical to the real portal, students enter their password without noticing the URL until it's too late."

### 2. Solution Overview (30s)
> "Meet **CampusAuthGuard** — a real-time browser extension that acts as a visual and DOM structural fingerprint detector. Before a student can type their password, CampusAuthGuard extracts the page's form layout, DOM hierarchy, brand text, and CSS color tokens, compares them against the official college reference fingerprint, and checks the domain trust state."

### 3. Live Demonstration (45s)
> 1. *"First, let's open the authentic **ABC College ERP Login Page**. Notice our extension badge lights up GREEN (`SAFE`)."*
> 2. *"Now, let's open an **Exact Cloned Phishing Page** hosted on `abc-college-login.netlify.app`. Instantly, CampusAuthGuard detects a **95% Structural Clone Match** on an unverified domain. A red glassmorphic warning banner pops up, blurring and locking the password field before the student can type their credentials!"*
> 3. *"Clicking 'Show Score Breakdown' reveals the exact multi-feature score: Form Similarity (100%), DOM Structure (100%), Brand Match (80%), Visual Style (100%). Clicking 'Go to Official Portal' safely redirects the student to `erp.college.edu`."*

### 4. Impact & SDG Alignment (15s)
> "CampusAuthGuard supports **SDG 4 (Quality Education)** and **SDG 16 (Strong Institutions)** by safeguarding student identity and institutional security with sub-2ms, zero-server privacy protection."

---

## 🛠️ Step-by-Step Instructions to Run the Demo for Judges
1. Open `tests/pages/index.html` in Chrome or any browser.
2. Click **▶ Run Automated Accuracy Benchmark** to show live 100% accuracy evaluation table.
3. Click **Exact Fake Clone** to launch the cloned login page demo and watch the warning overlay trigger in real time.
4. Load `extension/` into Chrome (`chrome://extensions` -> Load unpacked) for full Chrome extension demo.
