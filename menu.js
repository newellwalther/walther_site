// Touch-friendly dropdown: tap to toggle, click outside to close, ESC to close
(function() {
  const menu = document.querySelector('.menu');
  const trigger = document.querySelector('.menu-trigger');
  const dropdown = document.querySelector('.dropdown');
  if (!menu || !trigger || !dropdown) return;

  function open() { menu.classList.add('open'); trigger.setAttribute('aria-expanded','true'); }
  function close() { menu.classList.remove('open'); trigger.setAttribute('aria-expanded','false'); }

  trigger.setAttribute('aria-haspopup','true');
  trigger.setAttribute('aria-expanded','false');
  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.classList.toggle('open');
    trigger.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
  });

  document.addEventListener('click', function(e) {
    if (!menu.contains(e.target)) close();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });
})();