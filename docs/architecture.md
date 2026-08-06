# CampusAuthGuard System Architecture

## Architecture Diagram

```
 +-----------------------------------------------------------------------+
 |                            USER BROWSER                               |
 |                                                                       |
 |   [ Active Web Page (ERP / Webmail / Phishing Site) ]                 |
 |                             │                                         |
 |                             ▼                                         |
 |   [ Content Script: extractFeatures.js ]                              |
 |   - Extracts DOM hierarchy, form inputs, button text, brand text     |
 |   - Computes CSS background colors & layout tokens                    |
 +-----------------------------│-----------------------------------------+
                               │ Chrome Extension Messaging / Window Events
                               ▼
 +-----------------------------------------------------------------------+
 |                     BACKGROUND SCANNER ENGINE                         |
 |                                                                       |
 |   1. Domain Checker (domainChecker.js)                                |
 |      - Validates against official allowlist                           |
 |      - Detects subdomain spoofing (e.g. college.edu.fake.com)         |
 |                                                                       |
 |   2. Similarity Scoring Engine (similarityEngine.js)                  |
 |      - Form Structure Similarity (35%)                                |
 |      - DOM Hierarchy Similarity (25%)                                 |
 |      - Text & Brand Keyword Similarity (25%)                          |
 |      - Visual & Style Token Similarity (15%)                          |
 |                                                                       |
 |   3. Risk Classifier (riskClassifier.js)                              |
 |      - Classifies SAFE, SUSPICIOUS, DANGEROUS, UNRELATED              |
 +-----------------------------│-----------------------------------------+
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
 [ Warning Overlay Injection ]       [ Extension Popup UI ]
 - Red glassmorphic modal             - Status badge & ring
 - Locks password fields              - Metric breakdown
 - Safe redirect button               - Portal switcher
```

## Core Modules
1. **Official Fingerprint Module**: Reference JSON specifications for ERP, Webmail, and Scholarship portals.
2. **Feature Extractor Module**: Client-side content script inspecting active DOM and styles.
3. **Similarity Engine**: Weighted multi-feature scoring module.
4. **Domain Checker**: Fast URL parsing and spoofing prevention engine.
5. **Warning UI & Popup**: Interactive feedback layer protecting students in real time.
