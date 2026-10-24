// Microsoft Clarity — the same project as moshtariat.ir and app.moshtariat.ir,
// so a visitor's path from a tool to the signup page is one session.
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', 'xsl7qlkgog');

document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('[data-track]');
  if (a && window.clarity) window.clarity('event', a.getAttribute('data-track'));
});
