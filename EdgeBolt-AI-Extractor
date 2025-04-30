// ==UserScript==
// @name         EdgeBolt AI Extractor (Phase 1)
// @namespace    https://chat.openai.com/
// @version      0.1
// @description  Detects Edgenuity question types and logs all visible options (prep for AI answer engine)
// @match        https://student.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  const log = (...args) => console.log("[EdgeBolt AI]", ...args);

  // Checks all documents (main + iframes)
  function getAllDocs() {
    const docs = [document];
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) docs.push(doc);
      } catch (e) {
        log("iframe access error", e);
      }
    }
    return docs;
  }

  function extractQuestions() {
    const docs = getAllDocs();

    for (const doc of docs) {
      log("Scanning document...");

      // Text-based short answers
      const inputs = doc.querySelectorAll("input[type='text'], textarea");
      if (inputs.length) {
        log("Detected fill-in inputs:");
        inputs.forEach((input, i) => {
          const label = input.closest("label")?.innerText || "No label";
          log(`  [${i + 1}]`, label, "(input box)");
        });
      }

      // Dropdowns
      const selects = doc.querySelectorAll("select");
      if (selects.length) {
        log("Detected dropdown questions:");
        selects.forEach((select, i) => {
          const label = select.closest("label")?.innerText || "No label";
          const options = [...select.options].map(o => o.text.trim()).filter(t => t);
          log(`  [${i + 1}]`, label, "Options:", options);
        });
      }

      // Multiple choice / checkboxes
      const radios = doc.querySelectorAll("input[type='radio']");
      const checkboxes = doc.querySelectorAll("input[type='checkbox']");
      if (radios.length || checkboxes.length) {
        const type = radios.length ? "Radio (single answer)" : "Checkbox (multi answer)";
        const inputs = radios.length ? radios : checkboxes;
        log(`Detected ${type}:`);
        inputs.forEach((el, i) => {
          const label = el.closest("label")?.innerText || el.parentElement?.innerText || `Option ${i + 1}`;
          log(`  [${i + 1}]`, label);
        });
      }

      // Match or drag-and-drop elements (placeholder detection)
      const draggables = doc.querySelectorAll('[draggable="true"], .drag-option, .match-option');
      if (draggables.length) {
        log("Detected possible drag-and-drop items:");
        draggables.forEach((el, i) => {
          log(`  [${i + 1}]`, el.innerText.trim());
        });
      }
    }
  }

  // Run extraction every few seconds
  setInterval(extractQuestions, 5000);
})();
