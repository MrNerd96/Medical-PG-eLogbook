/* Theme switch shared by the PG and MBBS apps: Auto (follow the phone) -> Light -> Dark. */
(function () {
  var KEY = 'elogbook.theme';
  var ORDER = ['auto', 'light', 'dark'];
  var LABEL = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  var SVG = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">';
  var GLYPH = {
    auto: SVG + '<circle cx="8" cy="8" r="5.5"/><path d="M8 2.5v11A5.5 5.5 0 0 0 8 2.5z" fill="currentColor" stroke="none"/></svg>',
    light: SVG + '<circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>',
    dark: SVG + '<path d="M13.2 10.1A5.6 5.6 0 0 1 5.9 2.8a5.6 5.6 0 1 0 7.3 7.3z"/></svg>'
  };
  var mode = 'auto';
  try { mode = localStorage.getItem(KEY) || 'auto'; } catch (e) { /* storage blocked */ }
  if (ORDER.indexOf(mode) < 0) mode = 'auto';

  function apply() {
    var root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    var b = document.getElementById('themeBtn');
    if (b) {
      b.innerHTML = GLYPH[mode] + '<span>' + LABEL[mode] + '</span>';
      b.setAttribute('aria-label', 'Theme: ' + LABEL[mode] + '. Tap to change.');
      b.title = mode === 'auto' ? 'Following your phone setting' : LABEL[mode] + ' theme';
    }
  }
  apply();
  document.addEventListener('DOMContentLoaded', function () {
    apply();
    var b = document.getElementById('themeBtn');
    if (!b) return;
    b.addEventListener('click', function () {
      mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      try { localStorage.setItem(KEY, mode); } catch (e) { /* storage blocked */ }
      apply();
    });
  });
})();
