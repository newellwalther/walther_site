// Easter Egg Animation System - FIXED VERSION
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

  let hasTriggered = false;
  let audioContext = null;
  let landingZoneY = 0;

  // Letter mapping: W(0) A(1) L(2) T(3) H(4) E(5) R(6) [space at 7] W(8) O(9) R(10) L(11) D(12) W(13) I(14) D(15) E(16)
  const SOURCE_LETTERS = ['W','A','L','T','H','E','R','W','O','R','L','D','W','I','D','E'];

  // ==============================
  // WEB AUDIO - SIMPLE TONES
  // ==============================
  
  function initAudio() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {
        console.log('Audio not supported');
      }
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
      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + duration);
    } catch(e) {}
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
    const mapping = {}; // sourceIndex -> destIndex or 'offscreen-left' or 'offscreen-right'
    
    // Build inventory of available letters
    const inventory = {};
    SOURCE_LETTERS.forEach(letter => {
      inventory[letter] = (inventory[letter] || 0) + 1;
    });

    // Map needed letters to source indices
    const usedSourceIndices = new Set();
    let destIndex = 0;
    
    for (const letter of neededLetters) {
      // Find first unused source index with this letter
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

    // Unused letters go offscreen
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
      // Mobile: stack on button tops
      const navGrid = document.querySelector('.mobile-nav-grid');
      if (navGrid) {
        landingZoneY = navGrid.getBoundingClientRect().top + window.scrollY - 80;
      } else {
        landingZoneY = window.innerHeight * 0.55;
      }
      
      const charWidth = 24;
      const spaceWidth = 12;
      
      if (words.length === 1) {
        // Single line
        const totalWidth = words[0].length * charWidth;
        let x = (window.innerWidth - totalWidth) / 2;
        for (let i = 0; i < totalChars; i++) {
          destinations[i] = { x, y: landingZoneY };
          x += charWidth;
        }
      } else {
        // Two lines - split into first word(s) and last word
        const lastWord = words[words.length - 1];
        const firstWords = words.slice(0, -1);
        
        // Calculate line widths properly
        const line1Width = firstWords.reduce((sum, w) => sum + w.length * charWidth, 0) + (firstWords.length - 1) * spaceWidth;
        const line2Width = lastWord.length * charWidth;
        
        let x1 = (window.innerWidth - line1Width) / 2;
        let x2 = (window.innerWidth - line2Width) / 2;
        let destIdx = 0;
        
        // Line 1 - first word(s)
        firstWords.forEach((word, wordIdx) => {
          for (const char of word) {
            destinations[destIdx++] = { x: x1, y: landingZoneY };
            x1 += charWidth;
          }
          if (wordIdx < firstWords.length - 1) {
            x1 += spaceWidth; // space between words on same line
          }
        });
        
        // Line 2 - last word
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
      const spaceWidth = 24;
      
      // Calculate total width
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

    // Map source indices to destinations
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

      // Create floating letter at NORMAL size (not hover-enlarged)
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
      
      // Mobile uses smaller font
      if (isMobile()) {
        floater.style.fontSize = '1.75rem';
      }
      
      document.body.appendChild(floater);

      // Hide original
      element.style.opacity = '0';

      // Physics params
      const finalTilt = (Math.random() - 0.5) * 30; // -15 to +15 degrees
      const firstArcDuration = 700;
      const secondArcDuration = 450;
      const mobile = isMobile();
      const isOffscreen = destination.offscreen || false;

      if (mobile) {
        animateMobileLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, isOffscreen);
      } else {
        animateDesktopLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, isOffscreen);
      }
    }, stagger);
  }

  function animateDesktopLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, isOffscreen) {
    // Physics: Fall straight down for offscreen, or toward destination for onscreen
    const fallTargetX = isOffscreen ? startX : (startX + totalDistanceX * 0.67);
    const fallTargetY = endY;
    
    // Bounce heights - first bounce much higher
    const firstBounceHeight = Math.abs(totalDistanceY) * 0.5;
    const secondBounceHeight = Math.abs(totalDistanceY) * 0.15;

    const firstBounceX = fallTargetX;
    const secondBounceX = endX;

    let startTime = null;
    let playedBoing1 = false;
    let playedBoing2 = false;
    let playedBonk = false;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < firstArcDuration) {
        // First arc - freefall with gentle rotation (max 45°)
        const t = elapsed / firstArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = startX + (firstBounceX - startX) * easeT;
        const parabola = 4 * firstBounceHeight * t * (1 - t);
        const currentY = startY + (fallTargetY - startY) * easeT - parabola;
        const rotation = 45 * easeT; // Only 45° during freefall

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else if (elapsed < firstArcDuration + secondArcDuration) {
        // First bounce sound
        if (!playedBoing1) {
          soundBoing1();
          playedBoing1 = true;
        }

        // Second arc - continue rotation to 240°
        const t = (elapsed - firstArcDuration) / secondArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = firstBounceX + (secondBounceX - firstBounceX) * easeT;
        const parabola = 4 * secondBounceHeight * t * (1 - t);
        const currentY = fallTargetY - parabola;
        const rotation = 45 + 195 * easeT; // 45° to 240°

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else {
        // Second bounce sound
        if (!playedBoing2) {
          soundBoing2();
          playedBoing2 = true;
        }
        
        // Final landing with third small bounce
        const finalDuration = 300;
        const finalElapsed = elapsed - firstArcDuration - secondArcDuration;
        
        if (finalElapsed < finalDuration) {
          const t = finalElapsed / finalDuration;
          const easeT = easeInOutQuad(t);
          const currentX = secondBounceX + (endX - secondBounceX) * easeT;
          const tinyBounce = 4 * (secondBounceHeight * 0.4) * t * (1 - t);
          const currentY = fallTargetY - tinyBounce;
          const rotation = 240 + 120 * easeT; // 240° to 360°
          
          floater.style.left = currentX + 'px';
          floater.style.top = currentY + 'px';
          floater.style.transform = `rotate(${rotation}deg)`;
          
          requestAnimationFrame(animate);
        } else {
          // Final bonk and settle
          if (!playedBonk) {
            soundBonk();
            playedBonk = true;
          }
          floater.style.left = endX + 'px';
          floater.style.top = endY + 'px';
          floater.style.transform = `rotate(${360 + finalTilt}deg)`;
          floater.classList.add('landed');
          
          // Remove offscreen letters
          if (isOffscreen) {
            setTimeout(() => {
              floater.style.transition = 'all 0.6s ease-out';
              floater.style.opacity = '0';
              floater.style.left = (endX < window.innerWidth / 2 ? -200 : window.innerWidth + 200) + 'px';
              setTimeout(() => floater.remove(), 600);
            }, 200);
          }
        }
      }
    }

    requestAnimationFrame(animate);
  }

  function animateMobileLetter(floater, startX, startY, endX, endY, totalDistanceX, totalDistanceY, finalTilt, firstArcDuration, secondArcDuration, isOffscreen) {
    // Mobile: ALL letters fall straight down to landing zone first
    // Offscreen letters: fall to center of landing zone, bounce, then fly away
    
    let fallX = startX;
    let fallY = landingZoneY;
    
    if (isOffscreen) {
      // Fall straight down to landing zone center
      fallX = startX;
      fallY = landingZoneY;
    } else {
      // Normal: overshoot destination
      fallX = endX + totalDistanceX * 0.33;
      fallY = landingZoneY;
    }
    
    const firstBounceHeight = Math.abs(totalDistanceY - landingZoneY + startY) * 0.5;
    const secondBounceHeight = Math.abs(totalDistanceY - landingZoneY + startY) * 0.15;

    let startTime = null;
    let playedBoing1 = false;
    let playedBoing2 = false;
    let playedBonk = false;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < firstArcDuration) {
        // Freefall - rotate gently (max 45°)
        const t = elapsed / firstArcDuration;
        const easeT = easeInOutQuad(t);
        const currentX = startX + (fallX - startX) * easeT;
        const parabola = 4 * firstBounceHeight * t * (1 - t);
        const currentY = startY + (fallY - startY) * easeT - parabola;
        const rotation = 45 * easeT;

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else if (elapsed < firstArcDuration + secondArcDuration) {
        // First bounce
        if (!playedBoing1) {
          soundBoing1();
          playedBoing1 = true;
        }

        const t = (elapsed - firstArcDuration) / secondArcDuration;
        const easeT = easeInOutQuad(t);
        
        // Bounce toward final position (or stay in place if offscreen)
        const bounceTargetX = isOffscreen ? fallX : endX;
        const currentX = fallX + (bounceTargetX - fallX) * easeT;
        const parabola = 4 * secondBounceHeight * t * (1 - t);
        const currentY = fallY - parabola;
        const rotation = 45 + 195 * easeT; // 45° to 240°

        floater.style.left = currentX + 'px';
        floater.style.top = currentY + 'px';
        floater.style.transform = `rotate(${rotation}deg)`;

        requestAnimationFrame(animate);
      } else {
        // Second bounce / final landing
        if (!playedBoing2) {
          soundBoing2();
          playedBoing2 = true;
        }
        
        const finalDuration = 300;
        const finalElapsed = elapsed - firstArcDuration - secondArcDuration;
        const bounceTargetX = isOffscreen ? fallX : endX;
        
        if (finalElapsed < finalDuration) {
          const t = finalElapsed / finalDuration;
          const easeT = easeInOutQuad(t);
          const currentX = bounceTargetX + (endX - bounceTargetX) * easeT;
          const tinyBounce = 4 * (secondBounceHeight * 0.4) * t * (1 - t);
          const currentY = fallY - tinyBounce;
          const rotation = 240 + 120 * easeT;
          
          floater.style.left = currentX + 'px';
          floater.style.top = currentY + 'px';
          floater.style.transform = `rotate(${rotation}deg)`;
          
          requestAnimationFrame(animate);
        } else {
          // Final settle
          if (!playedBonk) {
            soundBonk();
            playedBonk = true;
          }
          
          floater.style.left = endX + 'px';
          floater.style.top = endY + 'px';
          floater.style.transform = `rotate(${360 + finalTilt}deg)`;
          floater.classList.add('landed');
          
          // If offscreen, bounce away diagonally after landing
          if (isOffscreen) {
            setTimeout(() => {
              const offscreenX = endX < 0 ? -300 : window.innerWidth + 300;
              const offscreenY = endY - 100; // bounce up and away
              floater.style.transition = 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              floater.style.left = offscreenX + 'px';
              floater.style.top = offscreenY + 'px';
              floater.style.opacity = '0';
              setTimeout(() => floater.remove(), 700);
            }, 200);
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
    
    const letters = document.querySelectorAll('.title-letter');
    const mobile = isMobile();

    soundPop();

    if (mobile) {
      // Mobile: all letters triggered at once with gradual stagger (0-5 seconds)
      letters.forEach((letter, idx) => {
        const stagger = Math.random() * 5000;
        const dest = destinations[idx];
        if (dest) animateLetter(letter, idx, dest, stagger);
      });
      
      setTimeout(() => pulseAndLock(), 8500);
    } else {
      // Desktop: all letters fall with small random stagger
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
      setTimeout(() => {
        f.style.transform = currentRotation + ' scale(1)';
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
      // Mobile: tap anywhere on title to trigger
      title.style.cursor = 'pointer';
      title.addEventListener('click', triggerAnimation, { once: true });
    } else {
      // Desktop: individual letter clicking - set up on page load
      setupDesktopLetterClicks();
    }
  }

  function setupDesktopLetterClicks() {
    initAudio();
    const anagramData = mapLettersToAnagram(selectRandomAnagram());
    const destinations = calculateDestinations(anagramData);
    const letters = document.querySelectorAll('.title-letter');
    
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

    // Check if all letters have been triggered
    let checkInterval = setInterval(() => {
      const allTriggered = Array.from(letters).every(l => l.dataset.triggered);
      if (allTriggered) {
        clearInterval(checkInterval);
        setTimeout(() => pulseAndLock(), 2000);
      }
    }, 100);
  }

  // Wait for DOM and letter wrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

})();