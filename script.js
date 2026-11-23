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

// Keep the static release status until the manifest contains a usable installer.
(async function () {
  'use strict';

  var status = document.getElementById('status');
  if (!status || !window.fetch || !window.AbortController) return;

  function httpsUrl(value) {
    if (typeof value !== 'string' || !value.startsWith('https://') ||
        /[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && url.hostname && !url.username && !url.password
        ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function platform() {
    var hint = text(navigator.userAgentData?.platform);
    var value = hint || navigator.userAgent;
    if (/android|iphone|ipad|ipod|cros/i.test(value)) return '';
    if (/windows/i.test(value)) return 'windows';
    if (/macos|macintosh|mac os/i.test(value)) return 'macos';
    if (/linux/i.test(value)) return 'linux';
    return '';
  }

  function element(tag, content, className) {
    var node = document.createElement(tag);
    if (content) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function link(label, url, className) {
    var node = element('a', label, className);
    node.setAttribute('href', url);
    return node;
  }

  var manifest;
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, 5000);
  try {
    var response = await fetch('/updates.json', { cache: 'no-store', signal: controller.signal });
    if (!response.ok) return;
    manifest = await response.json();
  } catch (_) {
    return;
  } finally {
    clearTimeout(timeout);
  }

  var version = text(manifest?.version);
  var downloads = manifest?.downloads;
  if (!version || !downloads || typeof downloads !== 'object' || Array.isArray(downloads)) return;

  var labels = {
    macos: 'macOS (Apple silicon and Intel)',
    windows: 'Windows 10 and 11 (x86-64)',
    'linux-deb': 'Debian / Ubuntu (.deb, amd64)',
    'linux-appimage': 'Linux AppImage (x86-64)'
  };
  var installers = Object.keys(labels).flatMap(function (key) {
    var asset = downloads[key];
    var url = httpsUrl(asset?.url);
    if (!url) return [];
    return [{ key: key, url: url, label: text(asset.label) || labels[key], size: text(asset.size) }];
  });
  if (!installers.length) return;

  var block = element('section', '', 'downloads');
  block.setAttribute('aria-labelledby', 'downloads-title');
  var heading = element('h3', 'Download Re-Hub ' + version);
  heading.id = 'downloads-title';
  block.append(heading);
  var published = text(manifest.published);
  if (published) block.append(element('p', 'Published ' + published, 'downloads__date'));

  var os = platform();
  // Prefer AppImage unless .deb is the only Linux package on offer.
  var preferred = installers.find(function (asset) {
    return asset.key === (os === 'linux' ? 'linux-appimage' : os);
  });
  if (os === 'linux' && !preferred) {
    preferred = installers.find(function (asset) { return asset.key === 'linux-deb'; });
  }

  function downloadLink(asset, className) {
    var anchor = link('Download ' + asset.label, asset.url, className);
    if (asset.size) anchor.append(element('small', ' ' + asset.size, 'downloads__size'));
    return anchor;
  }

  if (preferred) block.append(downloadLink(preferred, 'btn btn--ink downloads__primary'));

  var list = element('ul', '', 'downloads__list');
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'All available installers');
  installers.forEach(function (asset) {
    var row = element('li');
    row.append(downloadLink(asset, 'btn btn--ghost'));
    list.append(row);
  });
  block.append(list);

  var releaseUrl = httpsUrl(manifest.url);
  if (releaseUrl) block.append(link('All files and checksums', releaseUrl, 'downloads__release'));

  // Keep the platform warnings next to the buttons: they matter most when people can download.
  var warnings = element('ul', '', 'downloads__notes');
  if (installers.some(function (asset) { return asset.key === 'macos'; })) {
    warnings.append(element('li', 'macOS: the app is not notarised yet. On first launch, right-click Re-Hub and choose Open.'));
  }
  if (installers.some(function (asset) { return asset.key === 'windows'; })) {
    warnings.append(element('li', 'Windows: the installer is not signed yet, so SmartScreen may warn before it runs.'));
  }
  if (warnings.childElementCount) block.append(warnings);

  status.querySelector('.status').before(block);
  status.querySelector('[data-download-intro]').textContent =
    'The table below describes platform testing for Re-Hub 0.2.1.';
  status.querySelectorAll('[data-download-dormant]').forEach(function (note) {
    note.remove();
  });
  document.querySelectorAll('[data-download-nav]').forEach(function (anchor) {
    anchor.textContent = 'Download';
  });
})();
