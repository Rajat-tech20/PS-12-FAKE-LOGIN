# CampusAuthGuard - Fingerprint Generator Tool

The **Fingerprint Generator Tool** enables college IT administrators and security teams to construct reference fingerprints for authentic login portals (ERP, Webmail, Scholarship, Library).

## Features
- Generates standardized reference JSON schema storing domain allowlists, DOM signatures, form structures, brand keywords, and visual tokens.
- 1-click export to `fingerprints/` directory for Chrome Extension registration.

## Usage
1. Open `tools/fingerprint-generator/generator.html` in any browser.
2. Enter official portal details (Domains, Title, Keywords).
3. Click **Generate Reference Fingerprint JSON**.
4. Save the generated JSON into `fingerprints/<portal-id>.json`.
