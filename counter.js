// Site visit counter — odometer style
(function() {
  var COUNTER_URL = 'https://walther-counter.newell-pdx.workers.dev/count';
  var el = document.getElementById('site-visits');
  if (!el) return;

  function buildOdometer(container, count) {
    var digits = String(count).split('');

    container.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'margin-left:0.75rem',
      'vertical-align:middle',
      'gap:2px',
      'font-family:Georgia,serif',
      'font-size:0.82rem',
    ].join(';');

    digits.forEach(function(d, i) {
      var wheel = document.createElement('span');
      wheel.style.cssText = [
        'display:inline-block',
        'overflow:hidden',
        'height:1.15em',
        'width:0.62em',
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
          'height:1.15em',
          'line-height:1.15em',
          'text-align:center',
          'color:#111',
          'font-variant-numeric:tabular-nums',
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
        innerEl.style.transform = 'translateY(-' + (target * 1.15) + 'em)';
      }.bind(null, inner, parseInt(d)), delay);
    });

    var label = document.createElement('span');
    label.style.cssText = 'margin-left:0.35em;color:#888;font-size:0.78rem;letter-spacing:0.5px;';
    label.textContent = 'visits';
    container.appendChild(label);
  }

  fetch(COUNTER_URL)
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.count) buildOdometer(el, data.count); })
    .catch(function() {});
})();
