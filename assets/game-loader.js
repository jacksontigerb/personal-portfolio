(function () {
  var mount = document.getElementById('battle');
  if (!mount || !window.PortfolioCharacters) return;
  var loading = false;
  function load() {
    if (loading) return;
    loading = true;
    import('./select.mjs?v=3').then(function (select) {
      select.mountSelect(mount, window.PortfolioCharacters);
      if (observer) observer.disconnect();
    }).catch(function () {
      loading = false;
      var message = document.createElement('p'); message.className = 'select-loading';
      message.textContent = 'The games couldn’t load. You can still use the Portfolio and Email links above. ';
      var retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Try again';
      retry.addEventListener('click', load); message.appendChild(retry); mount.replaceChildren(message);
    });
  }
  mount.querySelector('button').addEventListener('click', load);
  var observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) load();
    });
    observer.observe(mount);
  } else load();
})();
