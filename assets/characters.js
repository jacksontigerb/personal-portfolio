(function(){
  const characters={"allrounder":{"n":"Jack of All Trades","art":"assets/char-allrounder.png","hex":"#46607d","rgb":"70,96,125"},"master":{"n":"Master of One","art":"assets/char-master.png","hex":"#3a3f45","rgb":"58,63,69"},"researcher":{"n":"Researcher","art":"assets/char-researcher.png","hex":"#137975","rgb":"19,121,117"},"builder":{"n":"Engineer","art":"assets/char-builder.png","hex":"#7d6a1a","rgb":"125,106,26"},"operator":{"n":"Computer Guy","art":"assets/char-operator.png","hex":"#2f7d4a","rgb":"47,125,74"},"creator":{"n":"Content Creator","art":"assets/char-creator.png","hex":"#b23a48","rgb":"178,58,72"},"rider":{"n":"Athlete","art":"assets/char-rider.png","hex":"#a85414","rgb":"168,84,20"},"wanderer":{"n":"Explorer","art":"assets/char-wanderer.png","hex":"#6f5aa8","rgb":"111,90,168"},"skier":{"n":"Skier","art":"assets/char-skier.png","hex":"#2a6f9e","rgb":"42,111,158"}};
  Object.values(characters).forEach(Object.freeze);
  const keys=Object.freeze(Object.keys(characters)), listeners=new Set();
  const fromURL=()=>{const key=new URLSearchParams(location.search).get('c');return characters[key]?key:'allrounder';};
  let current=fromURL();
  function paint(){const c=characters[current];document.documentElement.style.setProperty('--accent',c.hex);document.documentElement.style.setProperty('--accent-rgb',c.rgb);}
  function set(key,fromHistory=false){
    if(!characters[key]||key===current)return;
    current=key;paint();
    if(!fromHistory){const url=new URL(location.href);if(key==='allrounder')url.searchParams.delete('c');else url.searchParams.set('c',key);history.replaceState(null,'',url.pathname+url.search+url.hash);}
    listeners.forEach(fn=>fn(key));
  }
  paint();
  window.PortfolioCharacters=Object.freeze({get:()=>current,set,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},characters:Object.freeze(characters),keys});
  window.addEventListener('popstate',()=>set(fromURL(),true));
})();
