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
  const isMobileLandscape = () => window.innerWidth <= 1000 && window.matchMedia('(orientation: landscape)').matches;

  let hasTriggered = false;
  let audioContext = null;
  let landingZoneY = 0;

  // Letter mapping: W(0) A(1) L(2) T(3) H(4) E(5) R(6) [space] W(7) O(8) R(9) L(10) D(11) W(12) I(13) D(14) E(15)
  const SOURCE_LETTERS = ['W','A','L','T','H','E','R','W','O','R','L','D','W','I','D','E'];

  // ==============================
  // WEB AUDIO - SIMPLE TONES
  // ==============================
  
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playTone(frequency, duration, type = 'sine') {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duration);
  }

  function soundPop() { playTone(800, 0.08, 'square'); }
  function soundBoing1() { playTone(400, 0.15, 'sine'); }
  function soundBoing2() { playTone(350, 0.12, 'sine'); }
  function soundBonk() { playTone(200, 0.1, 'triangle'); }

  // ==============================
  // ANAGRAM SELECTION & MAPPING
  // ==============================
  
  function selectRandomAnagram() {
    return ANAGRAMS[Math.floor(Math.random() * ANAGRAMS.length)];
  }

  function mapLettersToAnagram(anagram) {
    const words = anagram.split(' ').filter(w => w.length > 0);
    const neededLetters = anagram.replace(/ /g, '').split('');
    const sourceAvailable = [...SOURCE_LETTERS];
    const mapping = {}; // sourceIndex -> destIndex or 'offscreen-left' or 'offscreen-right'
    
    let destIndex = 0;
    for (const letter of neededLetters) {
      const srcIdx = sourceAvailable.indexOf(letter);
      if (srcIdx !== -1) {
        const actualSrcIdx = SOURCE_LETTERS.indexOf(letter, 
          Object.keys(mapping).filter(k => SOURCE_LETTERS[k] === letter).length);
        mapping[actualSrcIdx] = destIndex++;
        sourceAvailable[srcIdx] = null; // mark as used
      }
    }

    // Unused letters go offscreen
    SOURCE_LETTERS.forEach((letter, idx) => {
      if (!(idx in mapping)) {
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
      // Mobile: stack on button tops
      landingZoneY = document.querySelector('.mobile-nav-grid').getBoundingClientRect().top + window.scrollY;
      
      const containerWidth = Math.min(360, window.innerWidth - 32);
      const charWidth = 20; // approximate
      const totalWidth = totalChars * charWidth;
      const startX = (window.innerWidth - totalWidth) / 2;

      if (words.length === 1) {
        // Single line
        let x = startX;
        for (let i = 0; i < totalChars; i++) {
          destinations[i] = { x, y: landingZoneY };
          x += charWidth;
        }
      } else {
        // Two lines: first word(s) on top, last word on bottom
        const line1 = words.slice(0, -1).join(' ');
        const line2 = words[words.length - 1];
        const line1Width = line1.replace(/ /g, '').length * charWidth;
        const line2Width = line2.length * charWidth;
        
        let x1 = (window.innerWidth - line1Width) / 2;
        let x2 = (window.innerWidth - line2Width) / 2;
        let destIdx = 0;
        
        // Line 1
        for (const char of line1.replace(/ /g, '')) {
          destinations[destIdx++] = { x: x1, y: landingZoneY };
          x1 += charWidth;
        }
        // Line 2
        for (const char of line2) {
          destinations[destIdx++] = { x: x2, y: landingZoneY + 35 };
          x2 += charWidth;
        }
      }
    } else {
      // Desktop: land on footer bar
      const footer = document.querySelector('footer');
      landingZoneY = footer.getBoundingClientRect().top + window.scrollY - 60;
      
      const finalWidth = anagram.replace(/ /g, '').length * 28;
      const startX = (window.innerWidth - finalWidth * 1.2) / 2;
      
      let x = startX;
      let destIdx = 0;
      for (const word of words) {
        for (const char of word) {
          destinations[destIdx++] = { x, y: landingZoneY };
          x += 28;
        }
        x += 15; // space between words
      }
    }

    // Map source indices to destinations
    const letterDestinations = {};
    for (const [srcIdx, dest] of Object.entries(mapping)) {
      if (dest === 'offscreen-left') {
        letterDestinations[srcIdx] = { x: -200, y: landingZoneY };
      } else if (dest === 'offscreen-right') {
        letterDestinations[srcIdx] = { x: window.innerWidth + 200, y: landingZoneY };
      } else {
        letterDestinations[srcIdx] = destinations[dest];
      }
    }

    return letterDestinations;
  }

  // ==============================
  // ANIMATION PHYSICS
  // ==============================
  
  function animateLetter(element, index, destination, stagger = 0) {
    const startRect = element.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    
    const endX = destination.x;
    const endY = destination.y;
    const totalDistanceX = endX - startX;
    const totalDistanceY = endY - startY;

    // Physics params
    const finalTilt = (Math.random() - 0.5) * 30; // -15 to +15 degrees
    const firstArcDuration = 600;
    const secondArcDuration = 400;
    const mobile = isMobile();

    // Create floating letter
    const floater = document.createElement('div');
    floater.textContent = element.textContent;
    floater.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      font-size: ${startRect.height}px;
      font-family: inherit;
      font-weight: inherit;
      z-index: 99999;
      pointer-events: none;
      transform-origin: center center;
    `;
    document.body.appendChild(floater);

    // Hide original
    element.style.opacity = '0';

    setTimeout(() => {
      if (mobile) {
        animateMobileLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration);
      } else {
        animateDesktopLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration);
      }
    }, stagger);
  }

  function animateDesktopLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration) {
    const firstBounceX = startX + totalDistanceX * 0.67;
    const firstBounceY = endY;
    const firstBounceHeight = Math.abs(totalDistanceY) * 0.33;

    const secondBounceX = endX;
    const secondBounceY = endY;
    const secondBounceHeight = Math.abs(totalDistanceY) * 0.11;

    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < firstArcDuration) {
        // First arc
        const t = elapsed / firstArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = startX + (firstBounceX - startX) * easeT;
        const parabola = 4 * firstBounceHeight * t * (1 - t);
        const currentY = startY + (firstBounceY - startY) * easeT - parabola;
        const rotation = 240 * easeT;

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else if (elapsed < firstArcDuration + secondArcDuration) {
        // First bounce sound
        if (elapsed < firstArcDuration + 50 && elapsed >= firstArcDuration) {
          soundBoing1();
        }

        // Second arc
        const t = (elapsed - firstArcDuration) / secondArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = firstBounceX + (secondBounceX - firstBounceX) * easeT;
        const parabola = 4 * secondBounceHeight * t * (1 - t);
        const currentY = firstBounceY + (secondBounceY - firstBounceY) * easeT - parabola;
        const rotation = 240 + 120 * easeT;

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else {
        // Second bounce sound
        soundBoing2();
        
        // Final landing
        setTimeout(() => {
          soundBonk();
          floater.style.left = endX + 'px';
          floater.style.top = endY + 'px';
          floater.style.transform = `rotate(${360 + finalTilt}deg)`;
          floater.classList.add('landed');
        }, 100);
      }
    }

    requestAnimationFrame(animate);
  }

  function animateMobileLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration) {
    // Mobile: bounce PAST destination, then back
    const overshoot = totalDistanceX * 0.33;
    const firstBounceX = endX + overshoot;
    const firstBounceY = endY;
    const firstBounceHeight = Math.abs(totalDistanceY) * 0.33;

    const secondBounceX = endX;
    const secondBounceY = endY;
    const secondBounceHeight = Math.abs(totalDistanceY) * 0.11;

    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < firstArcDuration) {
        const t = elapsed / firstArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = startX + (firstBounceX - startX) * easeT;
        const parabola = 4 * firstBounceHeight * t * (1 - t);
        const currentY = startY + (firstBounceY - startY) * easeT - parabola;
        const rotation = 240 * easeT;

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else if (elapsed < firstArcDuration + secondArcDuration) {
        if (elapsed < firstArcDuration + 50 && elapsed >= firstArcDuration) {
          soundBoing1();
        }

        const t = (elapsed - firstArcDuration) / secondArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = firstBounceX + (secondBounceX - firstBounceX) * easeT;
        const parabola = 4 * secondBounceHeight * t * (1 - t);
        const currentY = firstBounceY + (secondBounceY - firstBounceY) * easeT - parabola;
        const rotation = 240 + 120 * easeT;

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else {
        soundBoing2();
        setTimeout(() => {
          soundBonk();
          floater.style.left = endX + 'px';
          floater.style.top = endY + 'px';
          floater.style.transform = `rotate(${360 + finalTilt}deg)`;
          floater.classList.add('landed');
        }, 100);
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
    
    const letters = document.querySelectorAll('.title-letter');
    const mobile = isMobile();

    if (mobile) {
      // Mobile: all letters triggered at once with random stagger
      soundPop();
      letters.forEach((letter, idx) => {
        const stagger = Math.random() * 3000;
        const dest = destinations[idx];
        if (dest) animateLetter(letter, idx, dest, stagger);
      });
    } else {
      // Desktop: letters fall individually on click
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
    }

    // After animation, pulse and lock
    setTimeout(() => {
      pulseAndLock();
    }, mobile ? 6000 : 10000);
  }

  function pulseAndLock() {
    const floaters = document.querySelectorAll('.landed');
    floaters.forEach(f => {
      f.style.transition = 'transform 0.3s ease';
      f.style.transform = f.style.transform + ' scale(1.15)';
      setTimeout(() => {
        f.style.transform = f.style.transform.replace('scale(1.15)', 'scale(1)');
      }, 300);
    });

    // Remove hover effects from original letters
    document.querySelectorAll('.title-letter').forEach(el => {
      el.style.cursor = 'default';
      el.style.pointerEvents = 'none';
    });
  }

  // ==============================
  // INITIALIZE
  // ==============================
  
  function init() {
    const title = document.getElementById('main-title');
    if (!title) return;

    if (isMobile()) {
      // Mobile: tap title to trigger
      title.style.cursor = 'pointer';
      title.addEventListener('click', triggerAnimation, { once: true });
    } else {
      // Desktop: letters are already clickable from setup
      triggerAnimation(); // Set up click handlers
    }
  }

  // Wait for DOM and letter wrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

})();
