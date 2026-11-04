/* Theme switch shared by the PG and MBBS apps: Auto (follow the phone) -> Light -> Dark. */
(function () {
  var KEY = 'elogbook.theme';
  var ORDER = ['auto', 'light', 'dark'];
  var LABEL = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  var GLYPH = { auto: '◐', light: '☀', dark: '☾' };
  var mode = 'auto';
  try { mode = localStorage.getItem(KEY) || 'auto'; } catch (e) { /* storage blocked */ }
  if (ORDER.indexOf(mode) < 0) mode = 'auto';

  function apply() {
    var root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    var b = document.getElementById('themeBtn');
    if (b) {
      b.innerHTML = '<span aria-hidden="true">' + GLYPH[mode] + '</span> ' + LABEL[mode];
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
