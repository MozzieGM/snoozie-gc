// Painel interno Snoozie: botão flutuante + gaveta lateral com as
// configurações (index.html) injetados direto na página da GC.
export const injetarPainelSnoozie = () => {
  if ( document.getElementById( 'mg-drawer-root' ) ) { return; }

  const logoUrl = chrome.runtime.getURL( 'images/icon_128.png' );
  const pageUrl = chrome.runtime.getURL( 'index.html' );

  const root = document.createElement( 'div' );
  root.id = 'mg-drawer-root';
  root.innerHTML =
    '<button id="mg-fab" title="Snoozie GC — Configurações">' +
      `<img src="${logoUrl}" alt="Snoozie" />` +
    '</button>' +
    '<div id="mg-drawer" aria-hidden="true">' +
      '<div class="mg-drawer-header">' +
        `<img src="${logoUrl}" alt="Snoozie" />` +
        '<div class="mg-drawer-title"><strong>Snoozie GC</strong><span>painel interno</span></div>' +
        '<button id="mg-drawer-close" title="Fechar" aria-label="Fechar">' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<iframe id="mg-drawer-frame" title="Snoozie Configurações"></iframe>' +
    '</div>';

  ( document.documentElement || document.body ).appendChild( root );

  const drawer = root.querySelector( '#mg-drawer' );
  const frame = root.querySelector( '#mg-drawer-frame' );
  const fab = root.querySelector( '#mg-fab' );
  const closeBtn = root.querySelector( '#mg-drawer-close' );

  const setOpen = open => {
    drawer.classList.toggle( 'mg-open', open );
    drawer.setAttribute( 'aria-hidden', open ? 'false' : 'true' );
    if ( open && !frame.getAttribute( 'src' ) ) {
      frame.setAttribute( 'src', pageUrl );
    }
  };

  fab.addEventListener( 'click', () => {
    setOpen( !drawer.classList.contains( 'mg-open' ) );
  } );
  closeBtn.addEventListener( 'click', () => setOpen( false ) );
  document.addEventListener( 'keydown', e => {
    if ( e.key === 'Escape' ) { setOpen( false ); }
  } );

  // Clique no ícone da toolbar alterna o painel (sem popup flutuante)
  chrome.runtime.onMessage.addListener( msg => {
    if ( msg && msg.type === 'MG_TOGGLE_DRAWER' ) {
      setOpen( !drawer.classList.contains( 'mg-open' ) );
    }
  } );
};
