// Clique no ícone da extensão alterna o painel interno (sem popup flutuante).
chrome.action.onClicked.addListener( async tab => {
  if ( !tab?.id ) { return; }
  try {
    await chrome.tabs.sendMessage( tab.id, { type: 'MG_TOGGLE_DRAWER' } );
  } catch ( _e ) {
    // Aba sem content-script (ex: chrome://, loja) — nada a fazer.
  }
} );
