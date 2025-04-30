// ==UserScript==
// @name         EdgeBolt Fuzzy Click Fix
// @namespace    https://chat.openai.com/
// @version      3.2
// @description  AI + video skip + fuzzy answer matching (clicks even weird Edgenuity formats)
// @match        https://student.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const AI_ENDPOINT = "https://edgebolt-ai-api.glitch.me/answer";
  let hasAnswered = false;
  let hasSkipped = false;

  const log = (...args) => console.log("[EdgeBolt Fuzzy]", ...args);

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

    if (radios.length || checks.length) {
      const inputs = radios.length ? radios : checks;
      inputs.forEach(input => {
        const label = input.closest("label") || input.parentElement;
        if (label) answers.push(label.innerText.trim());
      });
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

  const fuzzyMatch = (text, options) => {
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
    for (const opt of options) {
      const normOpt = opt.toLowerCase().replace(/[^\w\s]/g, '');
      if (normOpt.includes(normalized) || normalized.includes(normOpt)) {
        return opt;
      }
    }
    return null;
  };

  const clickFuzzyAnswer = (doc, bestAnswer) => {
    const allTextNodes = doc.querySelectorAll("label, span, div, p");
    for (const node of allTextNodes) {
      if (!node.innerText) continue;
      const text = node.innerText.toLowerCase();
      if (text.includes(bestAnswer.toLowerCase())) {
        const input = node.querySelector("input");
        if (input) {
          input.click();
          log("Clicked fuzzy-matched input:", node.innerText);
          return true;
        } else {
          node.click();
          log("Clicked fuzzy-matched node:", node.innerText);
          return true;
        }
      }
    }
    return false;
  };

  const tryAnswerQuestion = async (doc) => {
    if (hasAnswered) return;

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

      const matched = fuzzyMatch(best, data.answers);
      if (!matched) {
        log("No fuzzy match found.");
        return;
      }

      const clicked = clickFuzzyAnswer(doc, matched);
      if (!clicked) {
        log("Couldn't click the matched answer.");
        return;
      }

      hasAnswered = true;

      // Submit
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
