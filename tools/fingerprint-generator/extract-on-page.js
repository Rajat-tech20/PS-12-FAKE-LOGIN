/**
 * CampusAuthGuard — Live Page Extractor
 * ---------------------------------------------------
 * HOW TO USE:
 * 1. Open the REAL official login page (e.g. https://erp.stvincentngp.edu.in/login.aspx)
 * 2. Open DevTools (F12) → Console tab
 * 3. Paste this whole script and press Enter
 * 4. It prints JSON and auto-copies it to your clipboard
 * 5. Paste that JSON into the "Extracted Page Data" box in fingerprint-generator.html
 *
 * This only reads what's already visible in the DOM of the page you're on.
 * It does NOT send data anywhere, does NOT touch password values, and does NOT
 * work cross-origin — you must run it on the real page itself.
 */
(function extractPageFingerprint() {
  // ---- find the most likely login form ----
  const forms = Array.from(document.querySelectorAll("form"));
  const loginForm =
    forms.find((f) => f.querySelector('input[type="password"]')) ||
    forms[0] ||
    document.body; // fallback: scan whole page if no <form> tag used

  const inputs = Array.from(loginForm.querySelectorAll("input"));
  const buttons = Array.from(
    loginForm.querySelectorAll('button, input[type="submit"], input[type="button"]')
  );

  const passwordFieldCount = inputs.filter((i) => i.type === "password").length;
  const emailFieldCount = inputs.filter(
    (i) =>
      i.type === "email" ||
      /email|e-mail/i.test(i.name || "") ||
      /email|e-mail/i.test(i.placeholder || "")
  ).length;

  const inputTypes = [...new Set(inputs.map((i) => i.type || "text"))];

  const placeholders = [
    ...new Set(inputs.map((i) => i.placeholder || "").map((p) => p.trim()).filter(Boolean)),
  ];

  const buttonTexts = [
    ...new Set(
      buttons
        .map((b) => (b.tagName === "INPUT" ? b.value : b.textContent))
        .map((t) => (t || "").trim())
        .filter(Boolean)
    ),
  ];

  // ---- form action / method ----
  const formAction =
    loginForm.tagName === "FORM"
      ? loginForm.getAttribute("action") || ""
      : "";
  const formMethod =
    loginForm.tagName === "FORM"
      ? (loginForm.getAttribute("method") || "GET").toUpperCase()
      : "GET";

  // ---- heading text (best guess) ----
  const heading = document.querySelector("h1, h2, .login-title, .card-title");
  const headingText = heading ? heading.textContent.trim() : "";

  // ---- logo alt text (best guess) ----
  const logo = document.querySelector(
    'img[alt*="logo" i], header img, .logo img, .navbar img'
  );
  const logoAltText = logo ? logo.alt || "" : "";

  // ---- dominant colors (best-effort, from body/header/primary button) ----
  function rgbToHex(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return null;
    return (
      "#" +
      m
        .slice(0, 3)
        .map((x) => parseInt(x).toString(16).padStart(2, "0"))
        .join("")
    );
  }
  const colorSources = [document.body, heading, buttons[0]].filter(Boolean);
  const dominantColors = [
    ...new Set(
      colorSources
        .map((el) => getComputedStyle(el).backgroundColor)
        .map(rgbToHex)
        .filter((c) => c && c !== "#000000")
    ),
  ];

  // ---- layout guess (rough heuristic, review manually) ----
  const formRect = loginForm.getBoundingClientRect
    ? loginForm.getBoundingClientRect()
    : null;
  let layoutType = "unknown-review-manually";
  if (formRect) {
    const centeredHorizontally =
      Math.abs(
        formRect.left + formRect.width / 2 - window.innerWidth / 2
      ) < window.innerWidth * 0.15;
    layoutType = centeredHorizontally ? "centered-login-card" : "split-screen-or-offset";
  }

  const result = {
    pageTitleDetected: document.title,
    detectedCurrentDomain: window.location.hostname,
    formFingerprint: {
      passwordFieldCount,
      emailFieldCount,
      inputCount: inputs.length,
      buttonTexts,
      placeholders,
    },
    domFingerprint: {
      inputTypes,
      formAction,
      formMethod,
    },
    visualFingerprint: {
      layoutType,
      dominantColors,
      logoAltText,
      headingText,
    },
  };

  const json = JSON.stringify(result, null, 2);
  console.log("%c✅ Extracted fingerprint data:", "color:#38bdf8;font-weight:bold;");
  console.log(json);

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(json)
      .then(() => console.log("%c📋 Copied to clipboard!", "color:#10b981;font-weight:bold;"))
      .catch(() => console.log("Could not auto-copy — copy the JSON above manually."));
  }

  return result;
})();
