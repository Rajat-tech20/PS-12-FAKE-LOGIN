function splitCsv(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function showStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + type;
}

function buildFingerprint() {
  const rawExtracted = document.getElementById("extractedData").value.trim();

  let extracted = {
    pageTitleDetected: "",
    formFingerprint: {
      passwordFieldCount: 1,
      emailFieldCount: 1,
      inputCount: 3,
      buttonTexts: ["Login"],
    },
    domFingerprint: {
      inputTypes: ["text", "password", "submit"],
      formAction: "",
      formMethod: "POST",
    },
    visualFingerprint: {
      layoutType: "centered-login-card",
      dominantColors: [],
      logoAltText: "",
      headingText: "",
    },
  };

  if (rawExtracted) {
    // Tolerate messy pastes: strip a leading "> " REPL prompt on each line,
    // then grab only the substring between the first { and the last } —
    // this drops console.log labels like "✅ Extracted fingerprint data:"
    // or "📋 Copied to clipboard!" that often get copied alongside the JSON.
    const cleaned = rawExtracted
      .split("\n")
      .map((line) => line.replace(/^\s*>\s?/, ""))
      .join("\n");

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    const jsonSlice =
      firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? cleaned.slice(firstBrace, lastBrace + 1)
        : cleaned;

    try {
      const parsed = JSON.parse(jsonSlice);
      extracted = { ...extracted, ...parsed };
      extracted.formFingerprint = { ...extracted.formFingerprint, ...(parsed.formFingerprint || {}) };
      extracted.domFingerprint = { ...extracted.domFingerprint, ...(parsed.domFingerprint || {}) };
      extracted.visualFingerprint = { ...extracted.visualFingerprint, ...(parsed.visualFingerprint || {}) };
    } catch (e) {
      showStatus("⚠️ Extracted Page Data isn't valid JSON even after cleanup — using blank template instead. Try copying only the { ... } block from the console output.", "error");
    }
  }

  const collegeName = document.getElementById("collegeName").value.trim();
  const officialDomains = splitCsv(document.getElementById("officialDomains").value);
  const brandKeywords = splitCsv(document.getElementById("brandKeywords").value);
  const pageTitleOverride = document.getElementById("pageTitle").value.trim();

  const fingerprint = {
    collegeName,
    officialDomains,
    pageTitle: pageTitleOverride || extracted.pageTitleDetected || "",
    brandKeywords,
    formFingerprint: {
      passwordFieldCount: extracted.formFingerprint.passwordFieldCount,
      emailFieldCount: extracted.formFingerprint.emailFieldCount,
      inputCount: extracted.formFingerprint.inputCount,
      buttonTexts: extracted.formFingerprint.buttonTexts,
      placeholders: extracted.formFingerprint.placeholders || [],
    },
    domFingerprint: {
      inputTypes: extracted.domFingerprint.inputTypes,
      formAction: extracted.domFingerprint.formAction,
      formMethod: extracted.domFingerprint.formMethod,
    },
    visualFingerprint: {
      layoutType: extracted.visualFingerprint.layoutType,
      dominantColors: extracted.visualFingerprint.dominantColors,
      logoAltText: extracted.visualFingerprint.logoAltText,
      headingText: extracted.visualFingerprint.headingText,
    },
  };

  return fingerprint;
}

document.getElementById("btnGenerate").addEventListener("click", () => {
  const el = document.getElementById("status");
  el.className = "status";
  const fingerprint = buildFingerprint();
  document.getElementById("jsonOutput").textContent = JSON.stringify(fingerprint, null, 2);
  if (!el.className.includes("error")) {
    showStatus("✅ Fingerprint JSON generated. Review the values below before saving.", "ok");
  }
});

document.getElementById("btnCopy").addEventListener("click", () => {
  const text = document.getElementById("jsonOutput").textContent;
  navigator.clipboard.writeText(text).then(() => showStatus("📋 Copied to clipboard!", "ok"));
});

document.getElementById("btnDownload").addEventListener("click", () => {
  const text = document.getElementById("jsonOutput").textContent;
  if (!text || text.startsWith("//")) {
    showStatus("⚠️ Generate the JSON first.", "error");
    return;
  }
  const idInput = document.getElementById("collegeName").value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (idInput || "college-login") + "-fingerprint.json";
  a.click();
  URL.revokeObjectURL(url);
});
