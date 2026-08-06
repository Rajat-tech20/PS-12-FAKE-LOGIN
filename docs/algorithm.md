# CampusAuthGuard - Similarity Scoring Algorithm

CampusAuthGuard utilizes a **Deterministic Multi-Feature Weighted Vector Matcher** to evaluate webpage similarity in real-time without requiring heavy external computer vision server infrastructure.

---

## 1. Feature Weights

$$S_{\text{composite}} = 0.35 \times S_{\text{form}} + 0.25 \times S_{\text{dom}} + 0.25 \times S_{\text{text}} + 0.15 \times S_{\text{visual}}$$

---

## 2. Component Equations

### A. Form Similarity ($S_{\text{form}}$)
Compares password input presence, field counts, button text token overlap, and input placeholders:

$$S_{\text{form}} = \frac{M_{\text{pass}} + M_{\text{count}} + M_{\text{btn}} + M_{\text{holder}}}{4}$$

- $M_{\text{pass}} = 100\%$ if password count matches.
- $M_{\text{count}} = \max(0, 100 - |\text{Inputs}_{\text{curr}} - \text{Inputs}_{\text{ref}}| \times 25)$.
- $M_{\text{btn}} = \text{Jaccard Similarity of Button Labels}$.

### B. DOM Hierarchy Similarity ($S_{\text{dom}}$)
Calculates structural tag sequence overlap ($T_{\text{curr}}, T_{\text{ref}}$) and input type signature matching:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|} \times 100$$

### C. Text & Brand Similarity ($S_{\text{text}}$)
Evaluates presence of official college brand keywords ($K_{\text{ref}}$) in page title, headings, and innerText:

$$S_{\text{text}} = \frac{|\{k \in K_{\text{ref}} \mid k \in \text{PageText}\}|}{|K_{\text{ref}}|} \times 100$$

### D. Visual Style Similarity ($S_{\text{visual}}$)
Compares dominant computed CSS color palettes using Euclidean distance in RGB color space:

$$d(c_1, c_2) = \sqrt{(r_1 - r_2)^2 + (g_1 - g_2)^2 + (b_1 - b_2)^2}$$
