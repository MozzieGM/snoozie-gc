import { GC_URL, headers, levelColor } from '../../lib/constants';
import { getFromStorage, setStorage } from '../../lib/storage';

const GRADIENT_KDR = 'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';

// A GC removeu o "KDR: X.XX" do title dos jogadores, então o KDR agora
// é resolvido pelo ID via API (com cache). O title segue como chute inicial.
const extractLobbyPlayerId = $element => {
  const href = $element.attr( 'href' ) || $element.find( 'a' ).attr( 'href' ) || '';
  const hrefMatch = href.match( /\/(?:jogador|player)\/(\d+)/i );
  if ( hrefMatch?.[1] ) { return hrefMatch[1]; }

  const triggerId = $element.find( '[id*="player-trigger-"]' ).first().attr( 'id' ) || '';
  const triggerMatch = triggerId.match( /player-trigger(?:-wrapper)?-(\d+)/ );
  if ( triggerMatch?.[1] ) { return triggerMatch[1]; }

  return null;
};

const paintKdrBadge = ( $badge, kdr ) => {
  const num = parseFloat( kdr );
  if ( kdr === null || kdr === undefined || kdr === '' || isNaN( num ) ) {
    $badge.css( { 'background': '', 'background-color': 'rgba(0,0,0,0.55)' } );
    return;
  }

  if ( num <= 2.5 ) {
    $badge.css( { 'background': '', 'background-color': ( levelColor[Math.round( num * 10 )] || '#000' ) + 'cc' } );
  } else {
    $badge.css( { 'background': GRADIENT_KDR, 'background-color': 'initial' } );
  }
};

const fillKdrBadgeFromApi = async ( $badge, $span, playerId ) => {
  try {
    const infoPlayer = await getPlayerInfo( playerId );
    const kdrStat = infoPlayer?.stats?.find( stat => stat.stat === 'KDR' );
    const raw = kdrStat?.value ?? null;
    const kdr = raw !== null && raw !== undefined && !isNaN( Number( raw ) ) ?
      Number( raw ).toFixed( 2 ) : '-';

    $span.text( kdr );
    $span.attr( 'kdr', kdr );
    paintKdrBadge( $badge, kdr );
  } catch ( _e ) {
    $span.text( '-' );
  }
};

const buildKdrBadge = ( lobbyId, kdrInicial ) => {
  const spanAttrs = {
    'id': 'gcbooster_kdr_span',
    'text': kdrInicial || '...',
    'kdr': kdrInicial || '',
    'css': { 'width': '100%', 'font-size': '10px' }
  };
  // Só marca com gcbooster_kdr_lobby quando pertence a uma sala da lista
  // (é assim que o filtro de KDR médio encontra os spans da sala).
  if ( lobbyId ) {
    spanAttrs.gcbooster_kdr_lobby = lobbyId;
  }
  const $span = $( '<span/>', spanAttrs );

  const $badge = $( '<div/>', {
    'id': 'gcbooster_kdr',
    'class': 'draw-orange',
    'css': {
      'margin-bottom': '4px',
      'margin-top': '2px',
      'width': '100%',
      'display': 'flex',
      'padding': '2px 4px',
      'align-items': 'center',
      'justify-content': 'center',
      'text-align': 'center',
      'color': 'white',
      'font-weight': '600',
      'border': 'none'
    }
  } ).append( $span );

  paintKdrBadge( $badge, kdrInicial );

  return { $badge, $span };
};

export const mostrarKdr = mutations => {
  $.each( mutations, async ( _, mutation ) => {
    $( mutation.addedNodes )
      .find( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
      .addBack( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
      .each( ( _, element ) => {
        const $element = $( element );
        const $parent = $element.parent();

        if ( !$parent.hasClass( 'sala-lineup-imagem' ) ) {
          $element.css( 'min-height', '120px' );
        }

        if ( $element.find( 'div.PlayerPlaceholder' ).length > 0 ) {
          $element.find( 'div.PlayerPlaceholder__image' ).css( 'margin-top', '23px' );
        } else if ( !$element.find( '#gcbooster_kdr' ).length ) {
          const lobbyAncestor = $element.closest( '[id^="lobby-"], [id^="roomCardWrapper-"], [id^="room-card-"], [id^="lobby-card-"]' );
          const lobbyId = ( lobbyAncestor.attr( 'id' ) || 'rooms' ).split( '-' ).pop() || 'rooms';
          const kdrFromTitle = getKdrFromTitle( $element.attr( 'title' ) || '' );
          const playerId = extractLobbyPlayerId( $element );

          const { $badge, $span } = buildKdrBadge( lobbyId, kdrFromTitle );

          $element.prepend( $badge );
          $element.find( 'div.LobbyPlayer' ).append( '<style>.LobbyPlayer:before{top:15px !important;}</style>' );

          if ( !kdrFromTitle && playerId ) {
            fillKdrBadgeFromApi( $badge, $span, playerId );
          }
        }
      } );
  } );
};
const getUrlFlag = url => {
  const infoPlayerFlag = url?.split( '/' ).pop(); // br.png
  const upperCaseFlag = infoPlayerFlag?.split( '.' )[0].toUpperCase(); // BR
  const urlFlag = `24x24/${upperCaseFlag}.png`; // 24x24/BR.png
  const completeUrl = `https://gcv1-assets.gamersclub.com.br/assets/images/flags/${urlFlag}`;

  return completeUrl;
};

const getPlayerInfo = async id => {
  // Limpa o cache
  await limparCache( 'infoPlayerCache', 2 * 60 * 60 * 1000 ); // 3 horas

  const infoPlayerCache = await getFromStorage( 'infoPlayerCache' ) || {};

  if ( infoPlayerCache?.[id]?.ttl > Date.now() ) {
    return infoPlayerCache[id]?.infoPlayer;
  }

  const respostaPlayer = await fetch( `https://${GC_URL}/api/player-card/${id}`, {
    headers
  } );

  const dadosPlayer = await respostaPlayer.json();
  const infoPlayer = dadosPlayer;

  infoPlayerCache[id] = {
    infoPlayer,
    // TTL 20 min
    ttl: Date.now() + ( 20 * 60 * 1000 )
  };
  await setStorage( 'infoPlayerCache', infoPlayerCache );

  return infoPlayer ;
};

export const mostrarKdrDesafios = () => {
  const observer = new MutationObserver( () => {
    const challengeCardSelector = '.LobbyChallengeLineUpCard';
    if ( $( challengeCardSelector ).length ) {

      $( challengeCardSelector ).find( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
        .addBack( 'a.LobbyPlayerVertical, .sala-lineup-imagem a' )
        .each( ( _, element ) => {
          const $element = $( element );
          const $parent = $element.parent();

          if ( !$parent.hasClass( 'sala-lineup-imagem' ) ) {
            $element.css( 'min-height', '120px' );
          }

          if ( $element.find( 'div.PlayerPlaceholder' ).length > 0 ) {
            $element.find( 'div.PlayerPlaceholder__image' ).css( 'margin-top', '23px' );
          } else if ( !$element.find( '#gcbooster_kdr' ).length ) {
            const kdrFromTitle = getKdrFromTitle( $element.attr( 'title' ) || '' );
            const playerId = extractLobbyPlayerId( $element );

            const { $badge, $span } = buildKdrBadge( null, kdrFromTitle );

            $element.prepend( $badge );
            $element.find( 'div.LobbyPlayer' ).append( '<style>.LobbyPlayer:before{top:15px !important;}</style>' );

            if ( !kdrFromTitle && playerId ) {
              fillKdrBadgeFromApi( $badge, $span, playerId );
            }
          }
        } );
    }
  } );
    // monitora o documento inteiro
  observer.observe( document.body, { childList: true, subtree: true } );
};

// Limpa o cache a cada 2 dias se o TTL for menor q 'agora'
const limparCache = async ( cacheToClear, tempoDeCache ) => {
  const ultimaLimpezaCache = await getFromStorage( `ultimaLimpeza${cacheToClear}` );
  if ( !ultimaLimpezaCache || ultimaLimpezaCache < Date.now() - tempoDeCache ) {
    const cache = await getFromStorage( cacheToClear ) || {};
    for ( const [ id, obj ] of Object.entries( cache ) ) {
      if ( obj.ttl <= Date.now() ) {
        delete cache[id];
      }
    }
    await setStorage( cacheToClear, cache );
    await setStorage( `ultimaLimpeza${cacheToClear}`, Date.now() );
  }
};

function getKdrFromTitle( title ) {
  if ( !title || typeof title !== 'string' ) { return undefined; }
  const regexp = /KDR:\s+(\d+\.\d+)\s/g;
  return Array.from( title.matchAll( regexp ), m => m[1] )[0];
}

const fetchKdr = async id => {
  // Limpa o cache
  await limparCache( 'kdrCache', 20 * 60 * 1000 ); // 20 minutos

  const kdrCache = await getFromStorage( 'kdrCache' ) || {};

  if ( kdrCache?.[id]?.ttl > Date.now() ) {
    return kdrCache[id].kdr;
  }

  const resposta = await fetch( `https://gamersclub.com.br/api/box/history/${id}`, {
    headers
  } );
  const dadosHistoryBox = await resposta.json();

  const kdr = dadosHistoryBox?.stat[0]?.value;

  kdrCache[id] = {
    kdr,
    // 20min de ttl
    ttl: Date.now() + ( 20 * 60 * 1000 )
  };
  await setStorage( 'kdrCache', kdrCache );

  return kdr;
};

export const mostrarKdrRanked = () => {
  const kdrRankedInterval = setInterval( () => {
    $( '[class^=PlayerCardWrapper] [id^=trigger-]' ).each( ( _, element ) => {
      ( async () => {
        const playerId = String( element.id ).split( '-' ).pop();
        const wrapper = $( element ).closest( '[class^=PlayerCardWrapper]' );

        if ( $( '.PlayerIdentityBadges__KDR', wrapper ).length > 0 ) { return; }

        $( '.PlayerIdentityBadges', wrapper ).append( '<div class="WasdTooltip__wrapper PlayerIdentityBadges__KDR"></div>' );
        const kdrDiv = $( '.PlayerIdentityBadges__KDR', wrapper );

        const kdr = await fetchKdr( playerId );
        const playerKdr = parseFloat( kdr ).toFixed( 2 );

        const colorKrdDefault = playerKdr <= 2 ? '#000' :
          'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
        const colorKdr = playerKdr <= 2 ? levelColor[Math.round( playerKdr * 10 )] : colorKrdDefault;

        kdrDiv.css( {
          backgroundColor: colorKdr,
          fontSize: '12px',
          textAlign: 'center',
          width: '2rem',
          height: '1.5rem',
          marginLeft: '4px',
          order: 7
        } ).text( playerKdr );
      } )();
    } );

    if ( $( '[class^=PlayerCardWrapper] [id^=trigger-]' ).length > 0 ) {
      clearInterval( kdrRankedInterval );
    }
  }, 1500 );
};

export const mostrarInfoPlayerIntervaler = () => {
  chrome.storage.sync.get( [ 'autoInfoPlayer' ], function ( result ) {
    // Ativado por padrão (só desliga quem desmarcar)
    if ( result.autoInfoPlayer === false ) { return; }
    document.body.classList.add( 'gboost-info-player' );

    const scan = () => {
      $( '#suaLobby .player, #integrantesLobbyShort .player, .MyRoomPlayers .player' ).each( async ( _, player ) => {
        const $element = $( player );
        if ( $element.hasClass( 'MyRoomPlayers__placeholder' ) ) { return; }
        // Limpa blocos da versão anterior (linha que vazava por cima do próximo player)
        $element.find( '.gcboost-content' ).remove();
        if ( $element.find( '.gcboost-extra' ).length > 0 ) { return; }
        if ( $element.find( 'a[href*="/player/"], a[href*="/jogador/"]' ).length === 0 ) { return; }
        if ( player.dataset.gcboostInfoLoading === '1' ) { return; }

        const playerId = extractLobbyPlayerId( $element );
        if ( !playerId || !/^\d+$/.test( playerId ) ) { return; }
        player.dataset.gcboostInfoLoading = '1';

        try {
          const infoPlayer = await getPlayerInfo( playerId );
          injectMyRoomInfo( $element, infoPlayer );
        } catch ( _e ) {
          delete player.dataset.gcboostInfoLoading;
        }
      } );
    };

    const observer = new MutationObserver( () => scan() );
    observer.observe( document.body, { childList: true, subtree: true } );
    scan();
    setInterval( scan, 2000 );
  } );
};

// Dados compactos na fileira de badges (sem criar linha nova — o card tem
// altura fixa e qualquer bloco extra vaza por cima do player de baixo).
const injectMyRoomInfo = ( $player, infoPlayer ) => {
  if ( $player.find( '.gcboost-extra' ).length > 0 ) { return; }

  const $badges = $player.find( '[class*="badges"], [class*="Badges"]' ).first();
  if ( !$badges.length ) { return; }

  const wins = infoPlayer?.currentMonthMatchesHistory?.wins ?? 0;
  const losses = infoPlayer?.currentMonthMatchesHistory?.loss ?? 0;

  const $extra = $( '<span/>', {
    'class': 'gcboost-extra',
    'title': `${wins} vitórias e ${losses} derrotas no mês`
  } )
    .append( $( '<span/>', { 'class': 'wins', 'text': `${wins}V` } ) )
    .append( document.createTextNode( '/' ) )
    .append( $( '<span/>', { 'class': 'losses', 'text': `${losses}D` } ) );

  const $kdr = $badges.find( '.gcbooster-kdr-myroom' ).first();
  if ( $kdr.length ) {
    $kdr.after( $extra );
  } else {
    $badges.append( $extra );
  }
};

export const showKdrMatch = () => {
  const observer = new MutationObserver( () => {
    $( '[id^="trigger-"]' ).each( ( _, element ) => {
      if ( element.dataset.gcboosterProcessed ) {
        return;
      }

      const $trigger = $( element );
      const triggerId = element.id; // trigger-{playerId}
      const playerId = triggerId.replace( 'trigger-', '' );

      element.dataset.gcboosterProcessed = 'true';

      ( async () => {
        const $playerListCard = $trigger.closest( '.PlayerListCard' );
        const $badges = $playerListCard.find( '.PlayerIdentityBadges' );

        const infoPlayer = await getPlayerInfo( playerId );
        const kdrStat = infoPlayer?.stats?.find( stat => stat.stat === 'KDR' );
        const playerKdr = kdrStat ? parseFloat( kdrStat.value ).toFixed( 2 ) : '0.00';

        const colorKrdDefault = playerKdr <= 2 ? '#000' :
          'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
        const colorKdr = playerKdr <= 2 ? levelColor[Math.round( playerKdr * 10 )] : colorKrdDefault;

        const $kdrElement = $( '<div/>', {
          'id': 'gcbooster_kdr_match_' + playerId,
          'class': 'WasdTooltip__wrapper PlayerIdentityBadges__KDR',
          'css': {
            'background': colorKdr,
            'color': 'white',
            'font-weight': '600',
            'font-size': '10px',
            'padding': '2px 4px',
            'margin-top': '2px',
            'margin-left': '4px',
            'text-align': 'center',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center'
          },
          'title': `[MozzieGM GC]: KDR: ${playerKdr}`,
          'text': playerKdr
        } );

        const isLeftSide = $playerListCard.hasClass( 'PlayerListCard--left' );

        if ( $badges.length > 0 ) {
          $badges.append( $kdrElement );
          if ( isLeftSide ) {
            $kdrElement.css( 'order', '10' );
          } else {
            $kdrElement.css( { 'order': '-1', 'margin-left': '0', 'margin-right': '4px' } );
          }
        }
      } )();
    } );
  } );

  observer.observe( document.body, { childList: true, subtree: true } );
};

// KDR na "Minha Sala" (novo layout MyRoom / #suaLobby).
// A GC removeu o KDR nativo da lobby, então injetamos o badge
// no mesmo estilo do pré-jogo (showKdrMatch), na frente do nome.
const extractMyRoomPlayerId = $player => {
  const linkHref = $player.find( 'a[href*="/player/"], a[href*="/jogador/"]' ).first().attr( 'href' ) || '';
  const linkMatch = linkHref.match( /\/(?:player|jogador)\/(\d+)/i );
  if ( linkMatch?.[1] ) { return linkMatch[1]; }

  const triggerId = $player.find( '[id*="player-trigger-"]' ).first().attr( 'id' ) || '';
  const triggerMatch = triggerId.match( /player-trigger(?:-wrapper)?-(\d+)/ );
  if ( triggerMatch?.[1] ) { return triggerMatch[1]; }

  const imgSrc = $player.find( 'img[src*="/avatar/"]' ).first().attr( 'src' ) || '';
  const imgMatch = imgSrc.match( /\/avatar\/(\d{3,})/i );
  if ( imgMatch?.[1] ) { return imgMatch[1]; }

  return null;
};

const injectKdrMyRoom = ( $player, playerId, playerKdr, infoPlayer ) => {
  if ( $player.find( '.gcbooster-kdr-myroom' ).length > 0 ) { return; }

  const $badges = $player.find( '[class*="badges"], [class*="Badges"]' ).first();
  const $nickname = $player.find( '[class*="nickname"], [class*="Nickname"]' ).first();
  const $target = $badges.length ? $badges : $nickname.length ? $nickname : null;
  if ( !$target ) { return; }

  const kdrNum = parseFloat( playerKdr );
  const colorKrdDefault = kdrNum <= 2 ? '#000' :
    'linear-gradient(135deg, rgba(0,255,222,0.8) 0%, rgba(245,255,0,0.8) 30%, rgba(255,145,0,1) 60%, rgba(166,0,255,0.8) 100%)';
  const colorKdr = kdrNum <= 2 && !isNaN( kdrNum ) ?
    ( levelColor[Math.round( kdrNum * 10 )] || '#000' ) : colorKrdDefault;

  const wins = infoPlayer?.currentMonthMatchesHistory?.wins ?? '?';
  const losses = infoPlayer?.currentMonthMatchesHistory?.loss ?? '?';
  const adrStat = infoPlayer?.stats?.find( stat => stat.stat === 'ADR' );
  const adr = adrStat ? ` | ADR ${adrStat.value}` : '';

  const $kdrElement = $( '<span/>', {
    'class': 'gcbooster-kdr-myroom',
    'text': playerKdr,
    'title': `[MozzieGM GC] KDR: ${playerKdr}${adr} | Mês: ${wins}V/${losses}D`,
    'css': {
      'background': colorKdr,
      'color': '#fff',
      'font-weight': '700',
      'font-size': '11px',
      'line-height': '1',
      'padding': '3px 6px',
      'margin-left': '6px',
      'border-radius': '4px',
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'white-space': 'nowrap',
      'vertical-align': 'middle'
    }
  } );

  if ( $target.is( $badges ) ) {
    $target.append( $kdrElement );
  } else {
    // "na frente do nome": anexa logo após o nick dentro da mesma linha
    const $link = $nickname.find( 'a' ).first();
    if ( $link.length ) {
      $link.after( $kdrElement );
    } else {
      $nickname.append( $kdrElement );
    }
  }
};

export const mostrarKdrMinhaSala = () => {
  const scan = () => {
    $( '#suaLobby .player, #integrantesLobbyShort .player, .MyRoomPlayers .player' ).each( ( _, element ) => {
      const $player = $( element );
      if ( $player.hasClass( 'MyRoomPlayers__placeholder' ) ) { return; }
      if ( $player.find( '.gcbooster-kdr-myroom' ).length > 0 ) { return; }
      if ( $player.find( 'a[href*="/player/"], a[href*="/jogador/"]' ).length === 0 ) { return; }
      if ( element.dataset.gcboosterMyroomLoading === '1' ) { return; }
      const playerId = extractMyRoomPlayerId( $player );
      if ( !playerId || !/^\d+$/.test( playerId ) ) { return; }

      element.dataset.gcboosterMyroomLoading = '1';

      ( async () => {
        try {
          const infoPlayer = await getPlayerInfo( playerId );
          const kdrStat = infoPlayer?.stats?.find( stat => stat.stat === 'KDR' );
          const rawKdr = kdrStat?.value ?? infoPlayer?.kdr ?? null;
          const playerKdr = rawKdr !== null && !isNaN( Number( rawKdr ) ) ?
            Number( rawKdr ).toFixed( 2 ) : '0.00';
          injectKdrMyRoom( $player, playerId, playerKdr, infoPlayer );
        } catch ( _e ) {
          // Silencioso: tenta de novo no próximo scan ao liberar a flag
          delete element.dataset.gcboosterMyroomLoading;
          return;
        }
      } )();
    } );
  };

  const observer = new MutationObserver( () => scan() );
  observer.observe( document.body, { childList: true, subtree: true } );
  scan();
  setInterval( scan, 2000 );
};


// Example playerInfo
// [ {
//   infoPlayer: {
//     'avatar': 'https://static.gamersclub.com.br/players/avatar/2230397/2230397_full.jpg',
//     'countryFlag': 'https://gcv1-assets.gamersclub.com.br/assets/images/flags/br.png',
//     'currentMonthMatchesHistory': {
//       'loss': 8,
//       'matches': 13,
//       'wins': 5
//     },
//     'currentSeasonPosition': 0,
//     'featuredMedal': {
//       'color': '',
//       'id': '1299',
//       'image': 'https://gcv1-assets.gamersclub.com.br/images/medalhas/1299.png',
//       'name': 'O Rei do Level 21 - Eu joguei'
//     },
//     'isCalibrating': false,
//     'isMajorPlayer': false,
//     'isMuted': 0,
//     'isOfficial': false,
//     'isPrime': true,
//     'level': 15,
//     'mainRole': {
//       'gaming_role_id': '4',
//       'role': 'entry_fragger',
//       'role_order': '1'
//     },
//     'name': 'Jully Pocca',
//     'playerFrame': 'https://assets.gamersclub.com.br/marketplace/avatar-frame-pixel-geek',
//     'playerId': '2230397',
//     'playerNick': '@jully.poca',
//     'stats': [
//       {
//         'stat': 'KDR',
//         'value': '0.73'
//       },
//       {
//         'stat': 'ADR',
//         'value': 70
//       },
//       {
//         'stat': 'KAST%',
//         'value': '65%'
//       }
//     ],
//     'streaming': null,
//     'subscription': 'plus',
//     'verified': false
//   },
//   ttl: 1749963468500
// } ];
