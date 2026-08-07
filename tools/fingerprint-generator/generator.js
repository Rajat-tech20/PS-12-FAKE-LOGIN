function splitCsv(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function showStatus(msg, type) {
  const el = document.getElementById("status");
  if (!el) return;
  el.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">${type === 'error' ? 'error' : 'check_circle'}</span> ${msg}`;
  el.className = "status-toast " + type;
}

function buildFingerprint() {
  const rawExtracted = (document.getElementById("extractedData").value || "").trim();

  let extracted = {
    pageTitleDetected: "",
    formFingerprint: {
      passwordFieldCount: 1,
      emailFieldCount: 0,
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
      dominantColors: ["#ffffff"],
      logoAltText: "",
      headingText: "",
    },
  };

  if (rawExtracted) {
    // Tolerate messy pastes: strip leading prompt indicators like "> "
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
      extracted.pageTitleDetected = parsed.pageTitleDetected || parsed.pageTitle || "";
      
      const rawForm = parsed.formFingerprint || {};
      extracted.formFingerprint = {
        passwordFieldCount: Number(rawForm.passwordFieldCount ?? rawForm.password_fields_detected ?? 1),
        emailFieldCount: Number(rawForm.emailFieldCount ?? 0),
        inputCount: Number(rawForm.inputCount ?? rawForm.inputs_count ?? 3),
        buttonTexts: Array.isArray(rawForm.buttonTexts) ? rawForm.buttonTexts : (Array.isArray(rawForm.button_texts) ? rawForm.button_texts : ["Login"])
      };

      const rawDom = parsed.domFingerprint || {};
      extracted.domFingerprint = {
        inputTypes: Array.isArray(rawDom.inputTypes) ? rawDom.inputTypes : ["text", "password", "submit"],
        formAction: rawDom.formAction || "",
        formMethod: (rawDom.formMethod || "POST").toUpperCase()
      };

      const rawVis = parsed.visualFingerprint || {};
      extracted.visualFingerprint = {
        layoutType: rawVis.layoutType || "centered-login-card",
        dominantColors: Array.isArray(rawVis.dominantColors) ? rawVis.dominantColors : (rawVis.primary_color ? [rawVis.primary_color] : ["#ffffff"]),
        logoAltText: rawVis.logoAltText || "",
        headingText: rawVis.headingText || ""
      };
    } catch (e) {
      showStatus("Extracted payload isn't valid JSON even after cleanup — using default template fields.", "error");
    }
  }

  const collegeName = (document.getElementById("collegeName").value || "").trim();
  const portalType = (document.getElementById("portalType") ? document.getElementById("portalType").value : "erp").trim();
  const officialDomains = splitCsv(document.getElementById("officialDomains").value || "");
  const brandKeywords = splitCsv(document.getElementById("brandKeywords").value || "");
  const pageTitleOverride = (document.getElementById("pageTitle").value || "").trim();

  return {
    collegeName,
    portalType,
    officialDomains,
    pageTitle: pageTitleOverride || extracted.pageTitleDetected || "",
    brandKeywords,
    formFingerprint: {
      passwordFieldCount: extracted.formFingerprint.passwordFieldCount,
      emailFieldCount: extracted.formFingerprint.emailFieldCount,
      inputCount: extracted.formFingerprint.inputCount,
      buttonTexts: extracted.formFingerprint.buttonTexts
    },
    domFingerprint: {
      inputTypes: extracted.domFingerprint.inputTypes,
      formAction: extracted.domFingerprint.formAction,
      formMethod: extracted.domFingerprint.formMethod
    },
    visualFingerprint: {
      layoutType: extracted.visualFingerprint.layoutType,
      dominantColors: extracted.visualFingerprint.dominantColors,
      logoAltText: extracted.visualFingerprint.logoAltText,
      headingText: extracted.visualFingerprint.headingText
    }
  };
}

document.getElementById("btnGenerate").addEventListener("click", () => {
  const fingerprint = buildFingerprint();
  document.getElementById("jsonOutput").textContent = JSON.stringify(fingerprint, null, 2);
  const statusEl = document.getElementById("status");
  if (!statusEl.className.includes("error")) {
    showStatus("Fingerprint JSON generated with strict Schema v2 standard keys.", "ok");
  }
});

document.getElementById("btnCopy").addEventListener("click", () => {
  const text = document.getElementById("jsonOutput").textContent;
  if (!text || text.startsWith("//")) {
    showStatus("Generate the JSON first.", "error");
    return;
  }
  navigator.clipboard.writeText(text).then(() => showStatus("Copied JSON to clipboard! Ready to paste into Admin Portal.", "ok"));
});

document.getElementById("btnDownload").addEventListener("click", () => {
  const text = document.getElementById("jsonOutput").textContent;
  if (!text || text.startsWith("//")) {
    showStatus("Generate the JSON first.", "error");
    return;
  }
  const idInput = (document.getElementById("collegeName").value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (idInput || "college-login") + "-fingerprint.json";
  a.click();
  URL.revokeObjectURL(url);
});
