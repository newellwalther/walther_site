// Accessible, touch-friendly dropdown menu
(function () {
  const menu = document.querySelector('.menu');
  const trigger = document.querySelector('.menu-trigger');
  const dropdown = document.querySelector('.dropdown');
  if (!menu || !trigger || !dropdown) return;

  function open() {
    menu.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  // Setup ARIA
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');

  // Toggle on click
  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.classList.contains('open')) {
      close();
    } else {
      open();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target)) close();
  });

  // Close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  // Close after selecting a link (good for mobile)
  dropdown.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => close());
  });
})();
