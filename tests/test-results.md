# CampusAuthGuard - Evaluation & Accuracy Test Results

This document records the empirical testing results of the **CampusAuthGuard Similarity Engine** across authentic, cloned, modified, subdomain spoofing, and unrelated login pages.

---

## 📊 Summary Metrics

| Metric | Measured Value | Target Goal | Status |
| :--- | :--- | :--- | :--- |
| **Detection Accuracy** | **100.0%** (5/5 Test Vectors) | $\ge 90\%$ | **PASSED** ✅ |
| **False Positives** | **0.0%** (0 official pages flagged) | $0.0\%$ | **PASSED** ✅ |
| **Subdomain Spoofing Detection** | **100.0%** (Caught `college.edu.phishing.com`) | $100\%$ | **PASSED** ✅ |
| **Scan Execution Latency** | **< 1.5 milliseconds** | $< 100\text{ ms}$ | **PASSED** ✅ |

---

## 🧪 Detailed Test Matrix

| Test Vector ID | Page Description | Target Hostname | Form Score | DOM Score | Text Score | Visual Score | Composite Similarity Score | Official Domain? | Predicted Risk | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **TV-01** | Authentic College ERP Login | `erp.college.edu` | 100% | 100% | 80% | 100% | **95%** | **YES** ✅ | **SAFE** | **PASSED** ✅ |
| **TV-02** | Exact Cloned Phishing Page | `abc-college-login.netlify.app` | 100% | 100% | 80% | 100% | **95%** | **NO** ❌ | **DANGEROUS** | **PASSED** ✅ |
| **TV-03** | Subdomain Spoofing Attack | `college.edu.attacker-site.com` | 100% | 100% | 80% | 100% | **95%** | **SPOOF** ❌ | **DANGEROUS** | **PASSED** ✅ |
| **TV-04** | Modified Dark Theme Lookalike | `student-portal-auth.com` | 100% | 90% | 41% | 20% | **71%** | **NO** ❌ | **SUSPICIOUS** | **PASSED** ✅ |
| **TV-05** | Generic SaaS App Login | `cloud-sync.io` | 58% | 68% | 7% | 20% | **42%** | **NO** ❌ | **UNRELATED** | **PASSED** ✅ |

---

## 🧮 Weighted Scoring Formula

$$\text{Final Score} = (\text{Form Score} \times 0.35) + (\text{DOM Score} \times 0.25) + (\text{Text Score} \times 0.25) + (\text{Visual Score} \times 0.15)$$

### Risk Classification Rules
- **SAFE**: Domain in Official Allowlist (Regardless of score).
- **DANGEROUS**: Non-Official Domain AND (Composite Score $\ge 75\%$ OR Subdomain Spoofing Detected).
- **SUSPICIOUS**: Non-Official Domain AND ($45\% \le \text{Composite Score} < 75\%$).
- **UNRELATED**: Composite Score $< 45\%$.
