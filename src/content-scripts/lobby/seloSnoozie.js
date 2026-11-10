// Selo Snoozie nos cards de jogador (popover com stats, KDR, rating...).
export const adicionarSeloSnoozie = () => {
  const logoUrl = chrome.runtime.getURL( 'images/icon_48.png' );
  let versao = '';
  try {
    versao = chrome.runtime.getManifest().version || '';
  } catch ( _e ) {
    versao = '';
  }

  const scan = () => {
    document.querySelectorAll( 'div[data-test^="div:playerCard"]' ).forEach( card => {
      if ( card.querySelector( ':scope > .snoozie-plug' ) ) { return; }

      const plug = document.createElement( 'div' );
      plug.className = 'snoozie-plug';
      plug.title = `Snoozie GC${versao ? ` v${versao}` : ''} — KDR e raio-X direto na lobby`;

      const img = document.createElement( 'img' );
      img.src = logoUrl;
      img.alt = 'Snoozie GC';

      const txt = document.createElement( 'div' );
      txt.className = 'snoozie-plug-text';

      const brand = document.createElement( 'strong' );
      brand.textContent = 'SNOOZIE GC';

      const tag = document.createElement( 'span' );
      tag.textContent = `KDR e raio-X na lobby${versao ? ` • v${versao}` : ''}`;

      txt.appendChild( brand );
      txt.appendChild( tag );
      plug.appendChild( img );
      plug.appendChild( txt );
      card.appendChild( plug );
    } );
  };

  const observer = new MutationObserver( () => scan() );
  observer.observe( document.body, { childList: true, subtree: true } );
  scan();
  setInterval( scan, 2500 );
};
