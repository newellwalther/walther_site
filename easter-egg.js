// Easter Egg Animation System
// Letters fall, bounce, rotate, and form anagrams

(function() {
  'use strict';

  // ==============================
  // CONFIGURATION
  // ==============================

  const ANAGRAMS = [
    'WORLDWIDE WALTHER', 'WIDE WORLD', 'WORLD WIDE', 'EARTH HELD', 'WORLD HELD',
    'WIDE EARTH', 'EARTH WIDE', 'WORLD LAW', 'EARTH LAW', 'WORLD WEARIED',
    'EARTH WEARIED', 'WORLDED EARTH', 'EARTH DRAWN', 'WORLD DRAWN', 'HARD WORLD',
    'REAL WORLD', 'WIDE LAW', 'RAW EARTH', 'DRAWN WORLD', 'DRAWN EARTH',
    'WORLD HARD', 'EARTH HARD', 'WORLD REAL', 'EARTH WORLDED', 'WORLD RAW',
    'EARTH RAW', 'WORLD WEAR', 'EARTH WEAR', 'WEALTH', 'TRUE', 'LAW', 'DRAWN',
    'WALTHER WORLDED', 'WALTHER WIDE', 'WALTHER WIRED', 'WALTHER WEIRD',
    'WALTHER WIDER', 'WALTHER WIELD', 'WALTHER WOLD', 'WEIRD WALTHER',
    'WIDER WALTHER', 'WIELD WALTHER', 'WORLDED WALTHER', 'WEIRD WORLD',
    'WORLD WEIRD', 'WEIRD EARTH', 'EARTH WEIRD', 'WEIRD LAW', 'WEIRD RAW',
    'RAW WEIRD', 'WEIRD', 'DRAWL', 'ALTER', 'ALERT', 'LATHER', 'HEATED',
    'THAWED', 'HOARDED', 'WHALED', 'WREATHED', 'HALTER', 'WIRED', 'HERALD',
    'READ', 'DWELT', 'HEARD', 'ROAD', 'WARD', 'DEAL', 'RITE', 'RIDE', 'WEIR',
    'EWER', 'THEW', 'RATHE', 'THOLE'
  ];

  const isMobile = () => window.innerWidth <= 1000;

  // Returns the correct title element based on screen size
  function getTitle() {
    return document.getElementById(isMobile() ? 'mobile-main-title' : 'main-title');
  }

  let hasTriggered = false;
  let audioContext = null;
  let landingZoneY = 0;

  const SOURCE_LETTERS = ['W','A','L','T','H','E','R','W','O','R','L','D','W','I','D','E'];

  // ==============================
  // WEB AUDIO - SIMPLE TONES
  // ==============================

  function initAudio() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
  }

  function playTone(frequency, duration, type = 'sine') {
    if (!audioContext) return;
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = frequency;
      osc.type = type;
      gain.gain.setValueAtTime(0.09, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + duration);
    } catch(e) {}
  }

  function soundPop()   { playTone(800, 0.08, 'square'); }
  function soundBoing1() { playTone(400, 0.15, 'sine'); }
  function soundBoing2() { playTone(350, 0.12, 'sine'); }
  function soundBonk()  { playTone(200, 0.1,  'triangle'); }

  // ==============================
  // ANAGRAM SELECTION & MAPPING
  // ==============================

  function selectRandomAnagram() {
    return ANAGRAMS[Math.floor(Math.random() * ANAGRAMS.length)];
  }

  function mapLettersToAnagram(anagram) {
    const words = anagram.split(' ').filter(w => w.length > 0);
    const neededLetters = anagram.replace(/ /g, '').split('');
    const mapping = {};

    const usedSourceIndices = new Set();
    let destIndex = 0;

    for (const letter of neededLetters) {
      let foundIdx = -1;
      for (let i = 0; i < SOURCE_LETTERS.length; i++) {
        if (SOURCE_LETTERS[i] === letter && !usedSourceIndices.has(i)) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx !== -1) {
        mapping[foundIdx] = destIndex++;
        usedSourceIndices.add(foundIdx);
      }
    }

    SOURCE_LETTERS.forEach((letter, idx) => {
      if (!usedSourceIndices.has(idx)) {
        mapping[idx] = Math.random() < 0.5 ? 'offscreen-left' : 'offscreen-right';
      }
    });

    return { anagram, words, mapping, totalChars: neededLetters.length };
  }

  // ==============================
  // CALCULATE DESTINATIONS
  // ==============================

  function calculateDestinations(anagramData) {
    const { anagram, words, mapping, totalChars } = anagramData;
    const destinations = {};

    if (isMobile()) {
      const navGrid = document.querySelector('.mobile-nav-grid');
      if (navGrid) {
        landingZoneY = navGrid.getBoundingClientRect().top + window.scrollY - 20;
      } else {
        landingZoneY = window.innerHeight * 0.65;
      }

      const charWidth = 24;
      const spaceWidth = 12;

      if (words.length === 1) {
        const totalWidth = words[0].length * charWidth;
        let x = (window.innerWidth - totalWidth) / 2;
        for (let i = 0; i < totalChars; i++) {
          destinations[i] = { x, y: landingZoneY };
          x += charWidth;
        }
      } else {
        const lastWord = words[words.length - 1];
        const firstWords = words.slice(0, -1);
        const line1Width = firstWords.reduce((sum, w) => sum + w.length * charWidth, 0) + (firstWords.length - 1) * spaceWidth;
        const line2Width = lastWord.length * charWidth;

        let x1 = (window.innerWidth - line1Width) / 2;
        let x2 = (window.innerWidth - line2Width) / 2;
        let destIdx = 0;

        firstWords.forEach((word, wordIdx) => {
          for (const char of word) {
            destinations[destIdx++] = { x: x1, y: landingZoneY };
            x1 += charWidth;
          }
          if (wordIdx < firstWords.length - 1) x1 += spaceWidth;
        });

        for (const char of lastWord) {
          destinations[destIdx++] = { x: x2, y: landingZoneY + 38 };
          x2 += charWidth;
        }
      }
    } else {
      // Desktop: land above footer
      const footer = document.querySelector('footer');
      if (footer) {
        landingZoneY = footer.getBoundingClientRect().top + window.scrollY - 70;
      } else {
        landingZoneY = window.innerHeight - 150;
      }

      const charWidth = 38;
      const spaceWidth = 45; // Increased from 32 for more letter spacing

      let totalWidth = 0;
      words.forEach((word, idx) => {
        totalWidth += word.length * charWidth;
        if (idx < words.length - 1) totalWidth += spaceWidth;
      });

      let x = (window.innerWidth - totalWidth) / 2;
      let destIdx = 0;

      for (let w = 0; w < words.length; w++) {
        for (const char of words[w]) {
          destinations[destIdx++] = { x, y: landingZoneY };
          x += charWidth;
        }
        if (w < words.length - 1) x += spaceWidth;
      }
    }

    const letterDestinations = {};
    for (const [srcIdx, dest] of Object.entries(mapping)) {
      const srcIdxNum = parseInt(srcIdx);
      if (dest === 'offscreen-left') {
        letterDestinations[srcIdxNum] = { x: -200, y: landingZoneY, offscreen: true };
      } else if (dest === 'offscreen-right') {
        letterDestinations[srcIdxNum] = { x: window.innerWidth + 200, y: landingZoneY, offscreen: true };
      } else {
        letterDestinations[srcIdxNum] = destinations[dest];
      }
    }

    return letterDestinations;
  }

  // ==============================
  // ANIMATION PHYSICS
  // ==============================

  function animateLetter(element, index, destination, stagger = 0) {
    setTimeout(() => {
      const startRect = element.getBoundingClientRect();
      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;

      const endX = destination.x;
      const endY = destination.y;
      const totalDistanceX = endX - startX;
      const totalDistanceY = endY - startY;

      const floater = document.createElement('div');
      floater.textContent = element.textContent;
      floater.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        font-size: 3.2rem;
        font-family: inherit;
        font-weight: inherit;
        text-transform: uppercase;
        letter-spacing: 4px;
        z-index: 99999;
        pointer-events: none;
        transform-origin: center center;
      `;

      const mobile = isMobile();
      if (mobile) floater.style.fontSize = '1.75rem';

      document.body.appendChild(floater);
      element.style.opacity = '0';

      const finalTilt = (Math.random() - 0.5) * 30;

      // Mobile durations are double desktop
      const firstArcDuration  = mobile ? 1400 : 700;
      const secondArcDuration = mobile ? 900  : 450;
      const thirdArcDuration  = mobile ? 600  : 300;
      const isOffscreen = destination.offscreen || false;

      if (mobile) {
        animateMobileLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, thirdArcDuration, isOffscreen);
      } else {
        animateDesktopLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, thirdArcDuration, isOffscreen);
      }
    }, stagger);
  }

  function animateDesktopLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, thirdArcDuration, isOffscreen) {
    const fallTargetX = isOffscreen ? startX : (startX + totalDistanceX * 0.67);
    const fallTargetY = endY;

    // Bounce heights — increased 20% from previous version (0.6, 0.18)
    const fallDistance = Math.abs(startY - fallTargetY);
    const firstBounceHeight  = fallDistance * 0.72;
    const secondBounceHeight = fallDistance * 0.216;
    const thirdBounceHeight  = fallDistance * 0.10;

    // X landing positions for each arc
    let bounce1X, bounce2X, bounce3X;
    if (isOffscreen) {
      // Creep progressively toward screen edge across 3 bounces
      const goingLeft = endX < window.innerWidth / 2;
      const screenEdge = goingLeft ? -50 : window.innerWidth + 50;
      bounce1X = fallTargetX;  // straight down first
      bounce2X = startX + (screenEdge - startX) * 0.33;
      bounce3X = startX + (screenEdge - startX) * 0.66;
    } else {
      bounce1X = fallTargetX;
      bounce2X = endX;
      bounce3X = endX;
    }

    let startTime = null;
    let playedBoing1 = false;
    let playedBoing2 = false;
    let playedBonk = false;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < firstArcDuration) {
        // Arc 1: freefall
        const t = elapsed / firstArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = startX + (bounce1X - startX) * easeT;
        const parabola = 4 * firstBounceHeight * t * (1 - t);
        const currentY = startY + (fallTargetY - startY) * easeT - parabola;
        const rotation = 45 * easeT;
        floater.style.left = currentX + 'px';
        floater.style.top  = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);

      } else if (elapsed < firstArcDuration + secondArcDuration) {
        if (!playedBoing1) { soundBoing1(); playedBoing1 = true; }
        // Arc 2: first bounce
        const t = (elapsed - firstArcDuration) / secondArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = bounce1X + (bounce2X - bounce1X) * easeT;
        const parabola = 4 * secondBounceHeight * t * (1 - t);
        const currentY = fallTargetY - parabola;
        const rotation = 45 + 135 * easeT; // 45° → 180°
        floater.style.left = currentX + 'px';
        floater.style.top  = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);

      } else if (elapsed < firstArcDuration + secondArcDuration + thirdArcDuration) {
        if (!playedBoing2) { soundBoing2(); playedBoing2 = true; }
        // Arc 3: second bounce
        const t = (elapsed - firstArcDuration - secondArcDuration) / thirdArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = bounce2X + (bounce3X - bounce2X) * easeT;
        const parabola = 4 * thirdBounceHeight * t * (1 - t);
        const currentY = fallTargetY - parabola;
        const rotation = 180 + 120 * easeT; // 180° → 300°
        floater.style.left = currentX + 'px';
        floater.style.top  = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);

      } else {
        // Arc 4: final settle
        const finalDuration = 200;
        const finalElapsed = elapsed - firstArcDuration - secondArcDuration - thirdArcDuration;

        if (finalElapsed < finalDuration) {
          const t = finalElapsed / finalDuration;
          const easeT = easeInOutQuad(t);
          const currentX = bounce3X + (endX - bounce3X) * easeT;
          const tinyBounce = 4 * (thirdBounceHeight * 0.3) * t * (1 - t);
          const currentY = fallTargetY - tinyBounce;
          const rotation = 300 + 60 * easeT; // 300° → 360°
          floater.style.left = currentX + 'px';
          floater.style.top  = currentY + 'px';
          floater.style.transform = `rotate(${rotation}deg)`;
          requestAnimationFrame(animate);
        } else {
          if (!playedBonk) { soundBonk(); playedBonk = true; }

          if (isOffscreen) {
            // Exit off screen after 3 creeping bounces
            floater.style.transition = 'all 0.4s ease-in';
            floater.style.opacity = '0';
            floater.style.left = (endX < window.innerWidth / 2 ? -250 : window.innerWidth + 250) + 'px';
            setTimeout(() => floater.remove(), 400);
          } else {
            floater.style.left = endX + 'px';
            floater.style.top  = endY + 'px';
            floater.style.transform = `rotate(${360 + finalTilt}deg)`;
            floater.classList.add('landed');
          }
        }
      }
    }

    requestAnimationFrame(animate);
  }

  function animateMobileLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, thirdArcDuration, isOffscreen) {
    const safeMargin = 50;
    const buttonZoneTop = landingZoneY;
    const clampX = (x) => Math.max(safeMargin, Math.min(window.innerWidth - safeMargin, x));

    // Where the letter falls to first
    let fallX, fallY;
    fallY = landingZoneY;

    if (isOffscreen) {
      // Stay clamped during fall, don't slide horizontally
      fallX = clampX(startX);
    } else {
      fallX = clampX(endX + totalDistanceX * 0.15);
    }

    // FIXED bounce heights: use actual fall distance from startY to landingZoneY
    const fallDistance = Math.max(Math.abs(startY - landingZoneY), 80);
    const firstBounceHeight  = fallDistance * 0.72;
    const secondBounceHeight = fallDistance * 0.216;
    const thirdBounceHeight  = fallDistance * 0.10;

    let startTime = null;
    let playedBoing1 = false;
    let playedBoing2 = false;
    let playedBonk = false;

    // For offscreen exit physics
    let finalLandX = clampX(endX);
    let finalLandY = Math.min(endY, buttonZoneTop);

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < firstArcDuration) {
        // Arc 1: freefall
        const t = elapsed / firstArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = clampX(startX + (fallX - startX) * easeT);
        const parabola = 4 * firstBounceHeight * t * (1 - t);
        const currentY = Math.min(startY + (fallY - startY) * easeT - parabola, buttonZoneTop);
        const rotation = 45 * easeT;
        floater.style.left = currentX + 'px';
        floater.style.top  = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);

      } else if (elapsed < firstArcDuration + secondArcDuration) {
        if (!playedBoing1) { soundBoing1(); playedBoing1 = true; }
        // Arc 2: first bounce — move toward final destination
        const t = (elapsed - firstArcDuration) / secondArcDuration;
        const easeT = easeInOutQuad(t);
        const targetX = isOffscreen ? fallX : clampX(endX);
        const currentX = clampX(fallX + (targetX - fallX) * easeT);
        const parabola = 4 * secondBounceHeight * t * (1 - t);
        const currentY = Math.min(fallY - parabola, buttonZoneTop);
        const rotation = 45 + 135 * easeT; // 45° → 180°
        floater.style.left = currentX + 'px';
        floater.style.top  = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);

      } else if (elapsed < firstArcDuration + secondArcDuration + thirdArcDuration) {
        if (!playedBoing2) { soundBoing2(); playedBoing2 = true; }
        // Arc 3: second bounce — settle toward final
        const t = (elapsed - firstArcDuration - secondArcDuration) / thirdArcDuration;
        const easeT = easeInOutQuad(t);
        const targetX = isOffscreen ? fallX : clampX(endX);
        const currentX = clampX(targetX);
        const parabola = 4 * thirdBounceHeight * t * (1 - t);
        const currentY = Math.min(fallY - parabola, buttonZoneTop);
        const rotation = 180 + 120 * easeT; // 180° → 300°
        floater.style.left = currentX + 'px';
        floater.style.top  = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(animate);

      } else {
        // Arc 4: final landing
        const finalDuration = 200;
        const finalElapsed = elapsed - firstArcDuration - secondArcDuration - thirdArcDuration;

        if (finalElapsed < finalDuration) {
          const t = finalElapsed / finalDuration;
          const easeT = easeInOutQuad(t);
          const currentX = clampX(endX);
          const tinyBounce = 4 * (thirdBounceHeight * 0.3) * t * (1 - t);
          const currentY = Math.min(fallY - tinyBounce, buttonZoneTop);
          const rotation = 300 + 60 * easeT;
          floater.style.left = currentX + 'px';
          floater.style.top  = currentY + 'px';
          floater.style.transform = `rotate(${rotation}deg)`;
          requestAnimationFrame(animate);
        } else {
          if (!playedBonk) { soundBonk(); playedBonk = true; }

          finalLandX = clampX(endX);
          finalLandY = Math.min(endY, buttonZoneTop);

          floater.style.left = finalLandX + 'px';
          floater.style.top  = finalLandY + 'px';
          floater.style.transform = `rotate(${360 + finalTilt}deg)`;
          floater.classList.add('landed');

          if (isOffscreen) {
            // Bounce off screen with physical arc — no horizontal sliding
            setTimeout(() => {
              const goingLeft = endX < window.innerWidth / 2;
              const exitX = goingLeft ? -250 : window.innerWidth + 250;
              const exitDuration = 900;
              const exitBounceH = firstBounceHeight * 0.5;
              let exitStart = null;

              function exitAnim(ts) {
                if (!exitStart) exitStart = ts;
                const e = ts - exitStart;
                if (e < exitDuration) {
                  const t = e / exitDuration;
                  const curX = finalLandX + (exitX - finalLandX) * t;
                  const parabola = 4 * exitBounceH * t * (1 - t);
                  const curY = finalLandY - parabola;
                  floater.style.left = curX + 'px';
                  floater.style.top  = curY + 'px';
                  floater.style.opacity = String(Math.max(0, 1 - t * 1.5));
                  requestAnimationFrame(exitAnim);
                } else {
                  floater.remove();
                }
              }
              requestAnimationFrame(exitAnim);
            }, 150);
          }
        }
      }
    }

    requestAnimationFrame(animate);
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // ==============================
  // TRIGGER ANIMATION
  // ==============================

  function triggerAnimation() {
    if (hasTriggered) return;
    hasTriggered = true;

    initAudio();
    const anagramData = mapLettersToAnagram(selectRandomAnagram());
    const destinations = calculateDestinations(anagramData);

    const title = getTitle();
    const letters = title
      ? title.querySelectorAll('.title-letter')
      : document.querySelectorAll('.title-letter');
    const mobile = isMobile();

    soundPop();

    if (mobile) {
      letters.forEach((letter, idx) => {
        const stagger = Math.random() * 5000;
        const dest = destinations[idx];
        if (dest) animateLetter(letter, idx, dest, stagger);
      });
      setTimeout(() => pulseAndLock(), 11000); // adjusted for doubled durations
    } else {
      letters.forEach((letter, idx) => {
        const stagger = Math.random() * 300;
        const dest = destinations[idx];
        if (dest) animateLetter(letter, idx, dest, stagger);
      });
      setTimeout(() => pulseAndLock(), 2500);
    }
  }

  function pulseAndLock() {
    const floaters = document.querySelectorAll('.landed');
    floaters.forEach(f => {
      f.style.transition = 'transform 0.3s ease';
      const currentRotation = f.style.transform;
      f.style.transform = currentRotation + ' scale(1.15)';
      setTimeout(() => { f.style.transform = currentRotation + ' scale(1)'; }, 300);
    });

    const title = getTitle();
    const letters = title
      ? title.querySelectorAll('.title-letter')
      : document.querySelectorAll('.title-letter');
    letters.forEach(el => {
      el.style.cursor = 'default';
      el.style.pointerEvents = 'none';
    });
  }

  // ==============================
  // INITIALIZE
  // ==============================

  function init() {
    const title = getTitle();
    if (!title) return;

    if (isMobile()) {
      title.style.cursor = 'pointer';
      title.addEventListener('click', triggerAnimation, { once: true });
    } else {
      setupDesktopLetterClicks();
    }
  }

  function setupDesktopLetterClicks() {
    initAudio();
    const anagramData = mapLettersToAnagram(selectRandomAnagram());
    const destinations = calculateDestinations(anagramData);
    const title = getTitle();
    const letters = title
      ? title.querySelectorAll('.title-letter')
      : document.querySelectorAll('.title-letter');

    letters.forEach((letter, idx) => {
      letter.style.cursor = 'pointer';
      letter.addEventListener('click', () => {
        if (letter.dataset.triggered) return;
        letter.dataset.triggered = 'true';
        soundPop();
        const dest = destinations[idx];
        if (dest) animateLetter(letter, idx, dest, 0);
      }, { once: true });
    });

    let checkInterval = setInterval(() => {
      const allTriggered = Array.from(letters).every(l => l.dataset.triggered);
      if (allTriggered) {
        clearInterval(checkInterval);
        setTimeout(() => pulseAndLock(), 2000);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

})();
