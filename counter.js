// Site visit counter — odometer style
(function() {
  var COUNTER_URL = 'https://walther-counter.newell-pdx.workers.dev/count';
  var el = document.getElementById('site-visits');
  if (!el) return;

  function buildOdometer(container, count) {
    var digits = String(count).split('');

    var H = 16; // px — window height per digit slot
    var W = 11; // px — window width

    container.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'margin-left:0.75rem',
      'vertical-align:middle',
      'gap:2px',
      'font-family:Georgia,serif',
    ].join(';');

    digits.forEach(function(d, i) {
      var wheel = document.createElement('span');
      wheel.style.cssText = [
        'display:inline-block',
        'overflow:hidden',
        'height:' + H + 'px',
        'width:' + W + 'px',
        'border:1px solid #bbb',
        'border-radius:1px',
        'background:#fff',
        'box-shadow:inset 0 1px 2px rgba(0,0,0,0.08)',
        'position:relative',
      ].join(';');

      var inner = document.createElement('span');
      inner.style.cssText = [
        'display:block',
        'transform:translateY(0)',
        'will-change:transform',
      ].join(';');

      for (var n = 0; n <= 9; n++) {
        var digit = document.createElement('span');
        digit.style.cssText = [
          'display:block',
          'height:' + H + 'px',
          'line-height:' + H + 'px',
          'text-align:center',
          'font-size:11px',
          'color:#111',
        ].join(';');
        digit.textContent = n;
        inner.appendChild(digit);
      }

      wheel.appendChild(inner);
      container.appendChild(wheel);

      // Stagger: rightmost digit animates first
      var delay = (digits.length - 1 - i) * 90 + 120;
      setTimeout(function(innerEl, target) {
        innerEl.style.transition = 'transform 0.7s cubic-bezier(0.23,1,0.32,1)';
        innerEl.style.transform = 'translateY(-' + (target * H) + 'px)';
      }.bind(null, inner, parseInt(d)), delay);
    });

    var label = document.createElement('span');
    label.style.cssText = 'margin-left:0.35em;color:#888;font-size:11px;letter-spacing:0.5px;';
    label.textContent = 'visits';
    container.appendChild(label);
  }

  fetch(COUNTER_URL)
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.count) buildOdometer(el, data.count); })
    .catch(function() {});
})();
