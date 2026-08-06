# CampusAuthGuard - Real-Time Cloned College Login Detector 🛡️

> **PS 12: Detecting Fake/Cloned Login Pages Targeting a College's Own Students**  
> **SDG 4: Quality Education** · **SDG 16: Peace, Justice & Strong Institutions**

CampusAuthGuard is a Chrome browser extension and real-time security scanning tool that protects college students from credential-stealing phishing pages targeting webmail, ERP, and scholarship portals. It extracts DOM structure, form inputs, visible brand text, and CSS color tokens from active webpages, compares them against stored official college reference fingerprints, and warns the user with a locked red warning banner **before** they enter their password.

---

## 🌟 Key Features

- 🧬 **Multi-Feature Similarity Scoring Algorithm**:
  - **Form Similarity (35%)**: Input field counts, password signatures, submit button labels, placeholders.
  - **DOM Structure (25%)**: Tree depth, tag hierarchy sequence Jaccard similarity, input signatures.
  - **Text & Brand Match (25%)**: Page titles, headings, and official brand keyword frequency.
  - **Visual Style (15%)**: Dominant CSS color palette Euclidean distance and logo alt/src matching.
- 🌐 **Robust Domain & Spoofing Verification**:
  - Validates exact domains & legitimate subdomains against official allowlist.
  - Catches sneaky **subdomain spoofing attacks** (e.g. `college.edu.phishing-site.com`).
- 🚨 **Real-Time Warning Overlay**:
  - Injects a red glassmorphic security banner on cloned pages.
  - Blurs & locks password input fields to prevent accidental credential typing.
  - Provides 1-click safe redirection to official portal (`erp.college.edu`).
- 📊 **Interactive Extension Popup UI**:
  - Live security status badge (`SAFE`, `DANGER`, `WARN`, `OK`).
  - Score breakdown metric bars & portal fingerprint selector (ERP, Webmail, Scholarship).
- 🛠️ **Fingerprint Generator Tool**:
  - Interactive tool for college IT admins to generate normalized fingerprint JSONs for any portal.
- 🧪 **Comprehensive Evaluation Suite**:
  - Interactive demo launcher (`tests/pages/index.html`) with 100% detection accuracy benchmark.

---

## 📁 Repository Structure

```
ps-12 fake login/
├── extension/                       # Chrome Extension (Manifest V3)
│   ├── manifest.json                # Extension Manifest V3 configuration
│   ├── popup.html                   # Extension popup interface HTML
│   ├── popup.css                    # Extension popup styling
│   ├── popup.js                     # Extension popup controller
│   └── src/
│       ├── content/
│       │   └── extractFeatures.js   # Content script feature extractor
│       ├── background/
│       │   └── background.js        # Background service worker pipeline
│       ├── scanner/
│       │   ├── domainChecker.js     # Domain allowlist & spoof checker
│       │   ├── similarityEngine.js  # Weighted similarity algorithm
│       │   └── riskClassifier.js   # Risk classification rules
│       └── ui/
│           ├── warningOverlay.js    # Interactive red warning modal injector
│           └── warningOverlay.css   # Glassmorphic overlay styling
│
├── fingerprints/                    # Reference Fingerprints
│   ├── abc-college-erp.json         # Official ERP portal fingerprint
│   ├── abc-college-webmail.json     # Official Webmail login fingerprint
│   ├── abc-college-scholarship.json # Official Scholarship portal fingerprint
│   └── fingerprint.json             # Default fallback fingerprint
│
├── tools/
│   └── fingerprint-generator/       # Admin Generator Tool
│       ├── generator.html           # Interactive fingerprint generator UI
│       ├── generator.js             # Generator logic
│       └── README.md                # Generator guide
│
├── tests/                           # Hackathon Test Dataset Suite
│   ├── testRunner.js                # Node.js automated unit test suite
│   ├── test-results.md              # Empirical accuracy evaluation matrix
│   └── pages/
│       ├── index.html               # Hackathon Interactive Demo Hub
│       ├── official-erp-login.html  # Authentic college portal page
│       ├── cloned-fake-login.html   # Exact cloned phishing page
│       ├── modified-clone-login.html# Modified lookalike page
│       └── unrelated-login.html     # Generic SaaS login page
│
├── docs/                            # Architecture & Pitch Documentation
│   ├── architecture.md              # System architecture diagram & design
│   ├── algorithm.md                 # Mathematical scoring formulas
│   └── demo-script.md               # 2-Minute presentation script for judges
│
└── README.md                        # Project documentation
```

---

## ⚡ Quick Start Guide

### 1. Run Automated Evaluation Tests
To execute the automated unit benchmark testing the similarity engine across all 5 test vectors:
```bash
node tests/testRunner.js
```
*Expected Output: `5/5 Test Cases Passed (100% Accuracy)`*

---

### 2. Load Chrome Extension in Browser
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` directory from this workspace.
4. The **CampusAuthGuard** shield icon will appear in your browser extension toolbar!

---

### 3. Launch Interactive Hackathon Demo Hub
1. Open [tests/pages/index.html](file:///d:/Programming/ps-12%20fake%20login/tests/pages/index.html) in your browser.
2. Click **▶ Run Automated Accuracy Benchmark** to run the live evaluation table.
3. Click **Exact Fake Clone** (`cloned-fake-login.html`) to launch the phishing test page and watch the warning overlay trigger in real time!

---

## 📊 Benchmark Evaluation Results

| Test Case | Domain | Form Score | DOM Score | Text Score | Visual Score | Composite Similarity | Risk Prediction | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Official ERP Login** | `erp.college.edu` | 100% | 100% | 80% | 100% | **95%** | **SAFE** | **PASSED** ✅ |
| **Exact Fake Clone** | `abc-college-login.netlify.app` | 100% | 100% | 80% | 100% | **95%** | **DANGEROUS** | **PASSED** ✅ |
| **Subdomain Spoofing** | `college.edu.attacker.com` | 100% | 100% | 80% | 100% | **95%** | **DANGEROUS** | **PASSED** ✅ |
| **Modified Lookalike** | `student-portal-auth.com` | 100% | 90% | 41% | 20% | **71%** | **SUSPICIOUS** | **PASSED** ✅ |
| **Unrelated Page** | `cloud-sync.io` | 58% | 68% | 7% | 20% | **42%** | **UNRELATED** | **PASSED** ✅ |

---

## 📜 License
Developed for Hackathon Problem Statement 12. MIT License.
