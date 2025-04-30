// ==UserScript==
// @name         EdgeBolt AI Auto Answer + Video Skip
// @namespace    https://chat.openai.com/
// @version      2.0
// @description  Fully automated Edgenuity AI answer script with video skipping
// @author       ChatGPT
// @match        https://student.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const AI_ENDPOINT = "https://edgebolt-ai-api.glitch.me/answer"; // dummy endpoint for placeholder

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

  const log = (msg) => {
    console.log("[EdgeBolt AI]", msg);
  };

  const fastForwardVideo = (doc) => {
    const video = doc.querySelector("video");
    if (video && !video.ended) {
      video.currentTime = video.duration;
      video.dispatchEvent(new Event('ended'));
      log("Skipped video.");
    }
  };

  const extractQuestion = (doc) => {
    const questionText = doc.querySelector(".question-prompt, .question-container, h2, h3, .prompt");
    if (!questionText) return null;

    let answers = [];
    const radios = doc.querySelectorAll("input[type='radio']");
    const checks = doc.querySelectorAll("input[type='checkbox']");
    const selects = doc.querySelectorAll("select");

    if (radios.length) {
      answers = Array.from(radios).map(r => {
        const label = r.closest("label");
        return label ? label.innerText.trim() : "Option";
      });
    } else if (checks.length) {
      answers = Array.from(checks).map(c => {
        const label = c.closest("label");
        return label ? label.innerText.trim() : "Option";
      });
    } else if (selects.length) {
      selects.forEach(sel => {
        const opts = Array.from(sel.options).map(o => o.text.trim());
        answers.push(...opts);
      });
    }

    return {
      prompt: questionText.innerText.trim(),
      answers: answers
    };
  };

  const answerQuestion = async (doc) => {
    const data = extractQuestion(doc);
    if (!data || !data.answers.length) return;

    log("Extracted question: " + data.prompt);
    log("Options: " + data.answers.join(", "));

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      const best = json.bestAnswer?.toLowerCase().trim();

      if (!best) return;

      // Try to select correct answer
      const labels = doc.querySelectorAll("label");
      for (const label of labels) {
        if (label.innerText.toLowerCase().includes(best)) {
          const input = label.querySelector("input");
          if (input) {
            input.click();
            log("Selected best answer: " + label.innerText);
            break;
          }
        }
      }

      const selects = doc.querySelectorAll("select");
      selects.forEach(sel => {
        for (const option of sel.options) {
          if (option.text.toLowerCase().includes(best)) {
            sel.value = option.value;
            sel.dispatchEvent(new Event("change"));
            log("Filled dropdown with: " + option.text);
          }
        }
      });

      // Submit or move on
      const buttons = doc.querySelectorAll("button");
      for (const btn of buttons) {
        if (/submit|done|next/i.test(btn.textContent) && !btn.disabled) {
          btn.click();
          log("Clicked: " + btn.textContent.trim());
          break;
        }
      }
    } catch (err) {
      log("AI request failed: " + err);
    }
  };

  const runAutomation = () => {
    const docs = getAllDocs();

    docs.forEach(doc => {
      fastForwardVideo(doc);
      answerQuestion(doc);
    });
  };

  setInterval(runAutomation, 6000);
})();
