// Site visit counter
// To activate: deploy counter-worker/ to Cloudflare, then set COUNTER_URL below
(function() {
  var COUNTER_URL = ''; // e.g. 'https://walther-counter.SUBDOMAIN.workers.dev/count'
  if (!COUNTER_URL) return;
  var el = document.getElementById('site-visits');
  if (!el) return;
  fetch(COUNTER_URL)
    .then(function(r) { return r.json(); })
    .then(function(d) { if (d.count) el.textContent = d.count + ' visits'; })
    .catch(function() {});
})();
