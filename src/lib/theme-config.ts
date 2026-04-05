/**
 * Shared theme constants (no "use client") so the root layout can inject
 * `beforeInteractive` script without importing a client module.
 */
export const THEME_STORAGE_KEY = 'theme'

/** Inline script for `next/script` strategy="beforeInteractive" */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var k = ${JSON.stringify(THEME_STORAGE_KEY)};
    var t = localStorage.getItem(k);
    var r;
    if (t === 'dark') r = 'dark';
    else if (t === 'light') r = 'light';
    else r = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var el = document.documentElement;
    el.classList.toggle('dark', r === 'dark');
    el.style.colorScheme = r;
  } catch (e) {}
})();`
