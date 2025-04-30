// ==UserScript==
// @name         EdgeBolt Full (iPad Edition)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  GUI + auto-answer + iframe-compatible version of EdgeBolt for iPad Safari (Desktop Mode)
// @author       ChatGPT
// @match        https://student.edgenuity.com/*
// @match        https://r*.core.learn.edgenuity.com/*
// @match        https://sessionmaster.learn.edgenuity.com/*
// @match        https://*.learn.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log("EdgeBolt Full: script loaded");

  // Create GUI Panel
  const gui = document.createElement("div");
  gui.id = "edgebolt-ui";
  gui.style.position = "fixed";
  gui.style.top = "10px";
  gui.style.right = "10px";
  gui.style.background = "#222";
  gui.style.color = "#fff";
  gui.style.padding = "10px";
  gui.style.zIndex = "99999";
  gui.style.fontSize = "14px";
  gui.innerHTML = `
    <strong>EdgeBolt (iPad)</strong><br>
    <label><input type="checkbox" id="autoAdvance"> Auto Advance</label><br>
    <label><input type="checkbox" id="autoGuess"> Auto Guess</label><br>
    <label><input type="checkbox" id="autoVideo"> Skip Videos</label>
  `;
  document.body.appendChild(gui);

  const getIframeDocs = () => {
    return Array.from(document.querySelectorAll("iframe"))
      .map(frame => {
        try {
          return frame.contentDocument || frame.contentWindow.document;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  };

  function runAutoFunctions() {
    const docs = [document, ...getIframeDocs()];

    docs.forEach(doc => {
      if (document.getElementById("autoVideo").checked) {
        const vid = doc.querySelector("video");
        if (vid && !vid.ended) {
          vid.currentTime = vid.duration;
          vid.dispatchEvent(new Event('ended'));
          console.log("EdgeBolt: Video skipped");
        }
      }

      if (document.getElementById("autoGuess").checked) {
        const answers = doc.querySelectorAll("input[type='radio'], input[type='checkbox']");
        if (answers.length > 0) {
          answers[Math.floor(Math.random() * answers.length)].click();
          console.log("EdgeBolt: Random answer clicked");
        }

        const doneBtn = Array.from(doc.querySelectorAll("button"))
          .find(b => /submit|done|next/i.test(b.textContent) && !b.disabled);
        if (doneBtn) {
          doneBtn.click();
          console.log("EdgeBolt: Done/Submit clicked");
        }
      }

      if (document.getElementById("autoAdvance").checked) {
        const nextBtn = doc.querySelector("button[aria-label='Next Activity']");
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
          console.log("EdgeBolt: Next Activity clicked");
        }
      }
    });
  }

  setInterval(runAutoFunctions, 3000);
})();
