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
        ? value : null;
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

  // Phosphor Regular glyphs (MIT); paths from phosphor-icons/core.
  // See licenses/phosphor-icons.txt.
  var glyphs = {
    'apple-logo': "M223.3,169.59a8.07,8.07,0,0,0-2.8-3.4C203.53,154.53,200,134.64,200,120c0-17.67,13.47-33.06,21.5-40.67a8,8,0,0,0,0-11.62C208.82,55.74,187.82,48,168,48a72.2,72.2,0,0,0-40,12.13,71.56,71.56,0,0,0-90.71,9.09A74.63,74.63,0,0,0,16,123.4a127.06,127.06,0,0,0,40.14,89.73A39.8,39.8,0,0,0,83.59,224h87.68a39.84,39.84,0,0,0,29.12-12.57,125,125,0,0,0,17.82-24.6C225.23,174,224.33,172,223.3,169.59Zm-34.63,30.94a23.76,23.76,0,0,1-17.4,7.47H83.59a23.82,23.82,0,0,1-16.44-6.51A111.14,111.14,0,0,1,32,123,58.5,58.5,0,0,1,48.65,80.47,54.81,54.81,0,0,1,88,64h.78A55.45,55.45,0,0,1,123,76.28a8,8,0,0,0,10,0A55.44,55.44,0,0,1,168,64a70.64,70.64,0,0,1,36,10.35c-13,14.52-20,30.47-20,45.65,0,23.77,7.64,42.73,22.18,55.3A105.82,105.82,0,0,1,188.67,200.53ZM128.23,30A40,40,0,0,1,167,0h1a8,8,0,0,1,0,16h-1a24,24,0,0,0-23.24,18,8,8,0,1,1-15.5-4Z",
    'windows-logo': "M208,136H128a8,8,0,0,0-8,8v57.45a8,8,0,0,0,6.57,7.88l80,14.54A7.61,7.61,0,0,0,208,224a8,8,0,0,0,8-8V144A8,8,0,0,0,208,136Zm-8,70.41-64-11.63V152h64ZM96,136H32a8,8,0,0,0-8,8v40a8,8,0,0,0,6.57,7.87l64,11.64a8.54,8.54,0,0,0,1.43.13,8,8,0,0,0,8-8V144A8,8,0,0,0,96,136Zm-8,50.05-48-8.73V152H88ZM213.13,33.86a8,8,0,0,0-6.56-1.73l-80,14.55A8,8,0,0,0,120,54.55V112a8,8,0,0,0,8,8h80a8,8,0,0,0,8-8V40A8,8,0,0,0,213.13,33.86ZM200,104H136V61.22l64-11.63ZM101.13,54.22a8,8,0,0,0-6.56-1.73l-64,11.64A8,8,0,0,0,24,72v40a8,8,0,0,0,8,8H96a8,8,0,0,0,8-8V60.36A8,8,0,0,0,101.13,54.22ZM88,104H40V78.68L88,70Z",
    'linux-logo': "M229,214.25A8,8,0,0,1,217.76,213C216.39,211.27,184,169.86,184,88A56,56,0,0,0,72,88c0,81.86-32.37,123.27-33.75,125a8,8,0,0,1-12.51-10c.15-.2,7.69-9.9,15.13-28.74C47.77,156.8,56,127.64,56,88a72,72,0,0,1,144,0c0,39.64,8.23,68.8,15.13,86.28,7.48,18.94,15.06,28.64,15.14,28.74A8,8,0,0,1,229,214.25ZM100,88a12,12,0,1,0,12,12A12,12,0,0,0,100,88Zm68,12a12,12,0,1,0-12,12A12,12,0,0,0,168,100ZM99.58,128.84a8,8,0,0,0-7.15,14.31l32,16a7.94,7.94,0,0,0,7.15,0l32-16a8,8,0,0,0-7.16-14.31L128,143.05ZM128,176a54.07,54.07,0,0,0-47,28.11,8,8,0,1,0,14,7.78,37.35,37.35,0,0,1,66,0,8,8,0,0,0,14-7.78A54.07,54.07,0,0,0,128,176Z",
    'download-simple': "M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z",
    'package': "M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z",
    'shield-warning': "M120,136V96a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,48a12,12,0,1,0-12-12A12,12,0,0,0,128,184ZM224,56v56c0,52.72-25.52,84.67-46.93,102.19-23.06,18.86-46,25.27-47,25.53a8,8,0,0,1-4.2,0c-1-.26-23.91-6.67-47-25.53C57.52,196.67,32,164.72,32,112V56A16,16,0,0,1,48,40H208A16,16,0,0,1,224,56Zm-16,0L48,56l0,56c0,37.3,13.82,67.51,41.07,89.81A128.25,128.25,0,0,0,128,223.62a129.3,129.3,0,0,0,39.41-22.2C194.34,179.16,208,149.07,208,112Z",
    'seal-check': "M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11ZM173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z",
    'arrow-square-out': "M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"
  };

  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 256 256');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'download-icon');
    [].concat(glyphs[name]).forEach(function (data) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', data);
      svg.append(path);
    });
    return svg;
  }

  function iconLink(label, url, className, glyph) {
    var anchor = link('', url, className);
    anchor.append(icon(glyph), element('span', label));
    return anchor;
  }

  var platforms = [
    { id: 'macos', name: 'macOS', glyph: 'apple-logo', keys: ['macos'],
      warning: ['Not notarised', 'On first launch, right-click Re-Hub and choose Open.'] },
    { id: 'windows', name: 'Windows', glyph: 'windows-logo', keys: ['windows'],
      warning: ['Unsigned installer', 'If SmartScreen warns, choose More info, then Run anyway only if you trust this download.'] },
    { id: 'linux', name: 'Linux', glyph: 'linux-logo', keys: ['linux-deb', 'linux-appimage'] }
  ];
  var formats = {
    macos: { name: 'Disk image', extension: '.dmg', detail: 'Apple silicon and Intel' },
    windows: { name: 'Setup installer', extension: '.exe', detail: 'x86-64' },
    'linux-deb': { name: 'Debian package', extension: '.deb', detail: 'Debian / Ubuntu, amd64' },
    'linux-appimage': { name: 'AppImage', extension: '.AppImage', detail: 'x86-64' }
  };

  function assetDetail(key, label) {
    if (!label) return formats[key].detail;
    // Use the manifest requirements without duplicating the platform or format.
    if (key === 'linux-appimage') label = label.replace(/^Linux AppImage\b\s*/i, '') || formats[key].detail;
    if (key === 'linux-deb') label = label.replace(/\(\.deb,\s*([^()]+)\)$/i, '($1)');
    return label.replace(/^\(([^()]+)\)$/, '$1')
      .replace(/\s+\(([^()]+)\)$/, ' · $1')
      .replace(/x86-64/g, 'x86‑64');
  }

  var available = platforms.flatMap(function (item) {
    var assets = item.keys.flatMap(function (key) {
      var entry = downloads[key];
      var url = httpsUrl(entry?.url);
      if (!url) return [];
      return [{
        key: key, url: url, detail: assetDetail(key, text(entry.label)),
        size: text(entry.size), format: formats[key]
      }];
    });
    return assets.length ? [{ ...item, assets: assets }] : [];
  });
  if (!available.length) return;

  var os = platform();
  var recommended = available.find(function (item) { return item.id === os; });
  if (recommended) {
    available = [recommended].concat(available.filter(function (item) { return item !== recommended; }));
  }

  var releaseUrl = httpsUrl(manifest.url);
  var block = element('div', '', 'downloads');
  var header = element('header', '', 'downloads__header');
  var title = element('div');
  title.append(element('p', 'Desktop installers', 'label'));
  var heading = element('h2', 'Download Re-Hub ' + version);
  heading.id = 'st-h';
  title.append(heading);

  var published = text(manifest.published);
  var meta = element('p', '', 'downloads__date');
  if (published) {
    var date = element('time', published);
    if (/^\d{4}-\d{2}-\d{2}$/.test(published)) date.setAttribute('datetime', published);
    meta.append('Published ', date);
  } else {
    meta.append('Choose an installer for your platform.');
  }
  meta.setAttribute('data-download-intro', '');
  title.append(meta);
  header.append(title);
  if (releaseUrl) {
    header.append(iconLink('Release notes and all files', releaseUrl, 'downloads__text-link', 'arrow-square-out'));
  }
  block.append(header);

  var list = element('ul', '', 'downloads__list');
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Available platforms');
  available.forEach(function (item) {
    var featured = item === recommended;
    var card = element('li', '', 'downloads__platform' + (featured ? ' is-recommended' : ''));
    card.dataset.platform = item.id;
    var top = element('div', '', 'downloads__platform-head');
    var mark = element('span', '', 'downloads__mark');
    mark.append(icon(item.glyph));
    top.append(mark, element('h3', item.name));
    if (featured) top.append(element('span', 'Recommended', 'downloads__badge'));
    card.append(top);

    var files = element('ul', '', 'downloads__files');
    files.setAttribute('role', 'list');
    item.assets.forEach(function (asset) {
      var row = element('li', '', 'downloads__file');
      var info = element('div', '', 'downloads__file-info');
      var name = element('p', '', 'downloads__file-name');
      if (asset.key === 'linux-deb') name.append(icon('package'));
      name.append(element('span', asset.format.name));
      var detail = element('p', asset.detail, 'downloads__detail');
      var facts = element('p', '', 'downloads__facts');
      facts.append(element('span', asset.format.extension, 'downloads__extension'));
      if (asset.size) facts.append(element('span', asset.size));
      info.append(name, detail, facts);

      var emphasis = featured && (item.id !== 'linux' || asset.key === 'linux-appimage' || item.assets.length === 1);
      var button = iconLink('Download', asset.url,
        'btn downloads__action ' + (emphasis ? 'btn--ink' : 'btn--ghost'), 'download-simple');
      button.setAttribute('aria-label', 'Download ' + item.name + ' — ' + asset.format.name);
      row.append(info, button);
      files.append(row);
    });
    card.append(files);

    if (item.warning) {
      var warning = element('div', '', 'downloads__warning');
      var message = element('div');
      message.append(element('p', item.warning[0], 'downloads__warning-title'), element('p', item.warning[1]));
      warning.append(icon('shield-warning'), message);
      card.append(warning);
    }
    list.append(card);
  });
  block.append(list);

  if (releaseUrl) {
    var checksum = element('div', '', 'downloads__checksums');
    var explanation = element('div');
    var hint = element('p');
    hint.append('Compare the SHA-256 hash of your installer with ', element('code', 'SHA256SUMS.txt'), ' on the release page.');
    explanation.append(element('p', 'Verify your installer', 'downloads__check-title'), hint);
    checksum.append(icon('seal-check'), explanation,
      iconLink('Find checksums on the release page', releaseUrl, 'downloads__text-link', 'arrow-square-out'));
    block.append(checksum);
  }

  status.querySelector('.head').replaceWith(block);
  status.classList.add('status--downloadable');
  var testing = element('h3', 'Platform testing', 'downloads__testing');
  status.querySelector('.status').before(testing);
  status.querySelector('caption').textContent = 'Platform testing status';
  status.querySelectorAll('[data-download-dormant]').forEach(function (note) { note.remove(); });
  document.querySelectorAll('[data-download-nav]').forEach(function (anchor) { anchor.textContent = 'Download'; });

  var footerVersion = document.querySelector('[data-download-version]');
  if (footerVersion) footerVersion.textContent = 'Re-Hub ' + version;
  var fontCredit = document.querySelector('[data-font-credit]');
  if (fontCredit) {
    fontCredit.append(' ', link('Icons: Phosphor Icons, MIT', 'licenses/phosphor-icons.txt'));
    fontCredit.after(element('p',
      'Apple and macOS are trademarks of Apple Inc. Windows is a trademark of Microsoft. Linux is a trademark of Linus Torvalds.',
      'foot__download-credits'));
  }
})();
