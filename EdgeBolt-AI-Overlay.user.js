// ==UserScript==
// @name         EdgeBolt AI Extractor (Overlay Version)
// @namespace    https://chat.openai.com/
// @version      0.2
// @description  Detects Edgenuity question types and shows them in an on-screen popup (for iPad users)
// @match        https://student.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const createOverlay = () => {
    let existing = document.getElementById('edgebolt-overlay');
    if (existing) return existing;

    const box = document.createElement('div');
    box.id = 'edgebolt-overlay';
    box.style.position = 'fixed';
    box.style.bottom = '10px';
    box.style.right = '10px';
    box.style.width = '300px';
    box.style.maxHeight = '300px';
    box.style.overflowY = 'auto';
    box.style.background = '#111';
    box.style.color = '#0f0';
    box.style.fontSize = '12px';
    box.style.padding = '10px';
    box.style.zIndex = '999999';
    box.style.border = '1px solid lime';
    box.style.borderRadius = '6px';
    box.innerText = 'EdgeBolt AI Extractor active...';
    document.body.appendChild(box);
    return box;
  };

  const getAllDocs = () => {
    const docs = [document];
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) docs.push(doc);
      } catch (e) {}
    }
    return docs;
  };

  const extractQuestions = () => {
    const overlay = createOverlay();
    let output = '';

    const docs = getAllDocs();
    for (const doc of docs) {
      // Fill-in-the-blanks
      const inputs = doc.querySelectorAll("input[type='text'], textarea");
      if (inputs.length) {
        output += `\n• Detected ${inputs.length} fill-in text field(s)\n`;
      }

      // Dropdowns
      const selects = doc.querySelectorAll("select");
      if (selects.length) {
        output += `\n• Detected ${selects.length} dropdown question(s):\n`;
        selects.forEach((select, i) => {
          const options = [...select.options].map(o => o.text.trim()).filter(t => t);
          output += `  - Q${i + 1}: ${options.join(", ")}\n`;
        });
      }

      // Radio buttons
      const radios = doc.querySelectorAll("input[type='radio']");
      if (radios.length) {
        output += `\n• Detected ${radios.length} radio options (single-choice)\n`;
      }

      // Checkboxes
      const checks = doc.querySelectorAll("input[type='checkbox']");
      if (checks.length) {
        output += `\n• Detected ${checks.length} checkbox options (multi-choice)\n`;
      }

      // Drag and drop placeholders
      const draggables = doc.querySelectorAll('[draggable="true"], .drag-option, .match-option');
      if (draggables.length) {
        output += `\n• Detected ${draggables.length} drag/match elements\n`;
      }
    }

    overlay.innerText = output || 'EdgeBolt AI is running, but nothing detected yet...';
  };

  setInterval(extractQuestions, 5000);
})();
