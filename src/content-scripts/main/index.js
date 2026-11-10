import { autoCompactMode } from './autoCompactMode';
import { autoDarkMode } from './autoDarkMode';
import { adicionarBarraLevel } from './barraLevel';
import { injetarPainelSnoozie } from './painelSnoozie';
import injectPageScripts from './injectPageScripts';

// Silencia "Extension context invalidated" do script antigo após reload da extensão.
window.addEventListener( 'unhandledrejection', event => {
  if ( String( event.reason?.message || event.reason || '' ).includes( 'Extension context invalidated' ) ) {
    event.preventDefault();
  }
} );

let generalOptions = [];
chrome.storage.sync.get( null, function ( result ) {
  generalOptions = result;
  initGcBooster();
} );

const initGcBooster = async () => {
  // injeta os scripts no contexto da página para ter acesso às variáveis globais
  injectPageScripts();

  // Painel interno de configurações (gaveta lateral), sempre disponível
  injetarPainelSnoozie();

  if ( generalOptions.mostrarLevelProgress !== false ) {
    adicionarBarraLevel();
  }

  if ( generalOptions.autoDarkMode ) {
    autoDarkMode();
  }
  if ( generalOptions.autoCompactMode ) {
    autoCompactMode();
  }
};
