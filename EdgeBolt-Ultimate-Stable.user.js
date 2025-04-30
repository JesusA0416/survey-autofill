// ==UserScript==
// @name         EdgeBolt Ultimate Stable - AI + Video Skip
// @namespace    https://chat.openai.com/
// @version      3.1
// @description  Auto-answer + stable video bypass for Edgenuity (no crashes on iPad Safari)
// @author       ChatGPT
// @match        https://student.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const AI_ENDPOINT = "https://edgebolt-ai-api.glitch.me/answer";
  let hasAnswered = false;
  let hasSkipped = false;

  const log = (...args) => console.log("[EdgeBolt Stable]", ...args);

  const getAllDocs = () => {
    const docs = [document];
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) docs.push(doc);
      } catch {}
    }
    return docs;
  };

  const detectNext = (doc) => {
    const btn = doc.querySelector("button[aria-label='Next Activity'], button[class*='next']");
    return btn && !btn.disabled ? btn : null;
  };

  const extractQuestion = (doc) => {
    const prompt = doc.querySelector(".question-prompt, .question-container, h2, h3, .prompt");
    if (!prompt) return null;

    const radios = doc.querySelectorAll("input[type='radio']");
    const checks = doc.querySelectorAll("input[type='checkbox']");
    const selects = doc.querySelectorAll("select");

    let answers = [];

    if (radios.length) {
      answers = Array.from(radios).map(r =>
        r.closest("label")?.innerText.trim() || "Option"
      );
    } else if (checks.length) {
      answers = Array.from(checks).map(c =>
        c.closest("label")?.innerText.trim() || "Option"
      );
    } else if (selects.length) {
      selects.forEach(sel => {
        const opts = Array.from(sel.options).map(o => o.text.trim());
        answers.push(...opts);
      });
    }

    return {
      prompt: prompt.innerText.trim(),
      answers: answers
    };
  };

  const tryAnswerQuestion = async (doc) => {
    if (hasAnswered) return;

    const data = extractQuestion(doc);
    if (!data || !data.answers.length) return;

    hasAnswered = true;
    log("Question found:", data.prompt);

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      const best = json.bestAnswer?.toLowerCase().trim();
      if (!best) return;

      const labels = doc.querySelectorAll("label");
      for (const label of labels) {
        if (label.innerText.toLowerCase().includes(best)) {
          const input = label.querySelector("input");
          if (input) input.click();
        }
      }

      const selects = doc.querySelectorAll("select");
      selects.forEach(sel => {
        for (const option of sel.options) {
          if (option.text.toLowerCase().includes(best)) {
            sel.value = option.value;
            sel.dispatchEvent(new Event("change"));
          }
        }
      });

      const btns = doc.querySelectorAll("button");
      for (const btn of btns) {
        if (/submit|done|next/i.test(btn.textContent) && !btn.disabled) {
          btn.click();
          log("Clicked submit.");
          break;
        }
      }
    } catch (err) {
      log("AI error:", err);
    }
  };

  const tryVideoSkip = (doc) => {
    if (hasSkipped) return;

    const vid = doc.querySelector("video");
    if (vid && !vid.ended) {
      vid.currentTime = vid.duration;
      vid.dispatchEvent(new Event("ended"));
      log("Skipped video.");
      hasSkipped = true;
    }

    const next = detectNext(doc);
    if (next) {
      next.click();
      log("Clicked Next.");
      hasSkipped = true;
    }
  };

  const observer = new MutationObserver(() => {
    const docs = getAllDocs();
    for (const doc of docs) {
      tryAnswerQuestion(doc);
      tryVideoSkip(doc);

      const next = detectNext(doc);
      if (next && !hasAnswered && !hasSkipped) {
        next.click();
        log("Auto-advanced.");
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("load", () => {
    hasAnswered = false;
    hasSkipped = false;
  });
})();
