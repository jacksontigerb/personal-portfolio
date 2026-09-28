(function () {
  var mount = document.getElementById('battle');
  if (!mount || !window.PortfolioCharacters) return;
  var loading = false;
  function load() {
    if (loading) return;
    loading = true;
    import('./battle.mjs?v=25').then(function (battle) {
      battle.mountBattle(mount, window.PortfolioCharacters);
      if (observer) observer.disconnect();
    }).catch(function () {
      loading = false;
      var message=document.createElement('p');message.className='battle-loading';
      message.textContent='The game couldn’t load. You can still use the Portfolio and Email links above. ';
      var retry=document.createElement('button');retry.type='button';retry.textContent='Load the fight';
      retry.addEventListener('click',load);message.appendChild(retry);mount.replaceChildren(message);
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
