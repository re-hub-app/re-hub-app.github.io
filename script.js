// Re-Hub site: workflow tabs, phone menu and nav border. No dependencies.
(function () {
  'use strict';

  // Workflow tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.step[role="tab"]'));
  var title = document.getElementById('window-title');

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (panel) {
        panel.hidden = !on;
        if (on && title) title.textContent = panel.getAttribute('data-title');
      }
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      select(tabs[n], true);
    });
  });
  if (tabs.length) select(tabs[0], false);

  // Nav hairline once the page scrolls
  var nav = document.querySelector('.nav');
  function stuck() { nav.classList.toggle('is-stuck', window.scrollY > 8); }
  if (nav) { stuck(); window.addEventListener('scroll', stuck, { passive: true }); }
})();

// Close the phone menu and move focus to the chosen section.
var phoneMenu = document.querySelector('.nav__menu');
if (phoneMenu) {
  var menuButton = phoneMenu.querySelector('summary');
  phoneMenu.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && phoneMenu.open) {
      phoneMenu.open = false;
      menuButton.focus();
    }
  });
  phoneMenu.querySelectorAll('nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      phoneMenu.open = false;
      var section = document.getElementById(link.hash.slice(1));
      if (section) {
        section.tabIndex = -1;
        section.focus({ preventScroll: true });
      }
    });
  });
}
