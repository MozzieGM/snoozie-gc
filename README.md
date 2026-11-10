# Snoozie GC

Extensão para navegador com melhorias para a plataforma [GamersClub](https://gamersclub.com.br/).

Criada e mantida por **Snoozie**.

## Desenvolvimento

```powershell
npm install
npm run build   # gera a pasta dist
npm run dev     # rebuild automático (watch)
```

Depois, no Chrome, abra `chrome://extensions`, ative o **Modo do desenvolvedor** e clique em **Carregar sem compactação** selecionando a pasta `dist`.

## Estrutura

- `src/content-scripts/lobby` — melhorias de lobby, KDR, raio-X, sons, filtros
- `src/content-scripts/main` — barra de level, painel interno, dark/compact mode
- `src/content-scripts/profile`, `team`, `missions`, `my-matches` — melhorias das páginas
- `src/options` — tela de configurações (também injetada dentro do site via painel lateral)
- `src/lib`, `src/translations`, `src/utils` — compartilhados
- `public` — estilos da página de opções, imagens e libs estáticas
- `assets` — arte original do projeto (logo)

## Licença

GPL-3.0 — veja [LICENSE.md](LICENSE.md).
