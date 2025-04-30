// ==UserScript==
// @name         EdgeBolt Stealth Skip
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Silently skips Edgenuity videos and auto-advances lessons.
// @author       ChatGPT
// @match        https://student.edgenuity.com/*
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    alert("IT’S ALIVE!");
    console.log("EdgeBolt Stealth is active");

    function trySkip() {
        // Click "Next Activity" if available
        const nextButton = document.querySelector('button[aria-label="Next Activity"]');
        if (nextButton && !nextButton.disabled) {
            nextButton.click();
            console.log("Clicked 'Next Activity'");
        }

        // Fast-forward video if it exists
        const vid = document.querySelector('video');
        if (vid && !vid.ended) {
            vid.currentTime = vid.duration;
            vid.dispatchEvent(new Event('ended'));
            console.log("Skipped video");
        }
    }

    setInterval(trySkip, 2500); // Run every 2.5 seconds
})();
