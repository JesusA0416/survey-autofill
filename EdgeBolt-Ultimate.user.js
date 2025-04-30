// ==UserScript==
// @name         EdgeBolt Ultimate - AI Auto + Video Bypass
// @namespace    https://chat.openai.com/
// @version      3.0
// @description  Full AI auto-answer + unskippable video bypass + auto-advance for Edgenuity on iPad Safari
// @author       ChatGPT
// @match        https://student.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const AI_ENDPOINT = "https://edgebolt-ai-api.glitch.me/answer"; // Hosted AI lookup

  const getAllDocs = () => {
    const docs = [document];
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) docs.push(doc);
      } catch {}
    }
    return docs;
  };

  const log = (...args) => console.log("[EdgeBolt Ultimate]", ...args);

  const detectNextButton = (doc) => {
    const next = doc.querySelector("button[aria-label='Next Activity'], button[class*='next']");
    return next && !next.disabled ? next : null;
  };

  const unlockNextButton = (doc) => {
    const next = detectNextButton(doc);
    if (next) {
      next.click();
      log("Clicked 'Next Activity'.");
    }
  };

  const handleVideoBypass = (doc) => {
    const video = doc.querySelector("video");
    const progressBar = doc.querySelector(".ui-slider-handle, .vid-progress, .time-progress");

    if (video) {
      video.currentTime = video.duration;
      video.dispatchEvent(new Event("ended"));
      log("Set video to end.");
    }

    const next = detectNextButton(doc);
    if (next) {
      next.click();
      log("Clicked 'Next Activity' after video.");
    }
  };

  const extractQuestion = (doc) => {
    const promptElem = doc.querySelector(".question-prompt, .question-container, h2, h3, .prompt");
    if (!promptElem) return null;

    let answers = [];
    const radios = doc.querySelectorAll("input[type='radio']");
    const checks = doc.querySelectorAll("input[type='checkbox']");
    const selects = doc.querySelectorAll("select");

    if (radios.length) {
      answers = Array.from(radios).map(r => r.closest("label")?.innerText.trim() || "Option");
    } else if (checks.length) {
      answers = Array.from(checks).map(c => c.closest("label")?.innerText.trim() || "Option");
    } else if (selects.length) {
      selects.forEach(sel => {
        const opts = Array.from(sel.options).map(o => o.text.trim());
        answers.push(...opts);
      });
    }

    return {
      prompt: promptElem.innerText.trim(),
      answers: answers
    };
  };

  const answerQuestion = async (doc) => {
    const data = extractQuestion(doc);
    if (!data || !data.answers.length) return;

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      const best = json.bestAnswer?.toLowerCase().trim();
      if (!best) return;

      // Match radio/checkbox
      const labels = doc.querySelectorAll("label");
      for (const label of labels) {
        const labelText = label.innerText.toLowerCase().trim();
        if (labelText.includes(best)) {
          const input = label.querySelector("input");
          if (input) {
            input.click();
            log("Selected answer:", label.innerText);
            break;
          }
        }
      }

      // Match dropdowns
      const selects = doc.querySelectorAll("select");
      selects.forEach(sel => {
        for (const option of sel.options) {
          if (option.text.toLowerCase().includes(best)) {
            sel.value = option.value;
            sel.dispatchEvent(new Event("change"));
            log("Filled dropdown:", option.text);
          }
        }
      });

      // Submit
      const buttons = doc.querySelectorAll("button");
      for (const btn of buttons) {
        if (/submit|done|next/i.test(btn.textContent) && !btn.disabled) {
          btn.click();
          log("Clicked button:", btn.textContent.trim());
          break;
        }
      }
    } catch (err) {
      log("AI answer failed:", err);
    }
  };

  const mainLoop = () => {
    const docs = getAllDocs();
    for (const doc of docs) {
      handleVideoBypass(doc);
      answerQuestion(doc);
      unlockNextButton(doc);
    }
  };

  setInterval(mainLoop, 6000);
})();
