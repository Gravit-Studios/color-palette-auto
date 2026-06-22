# Color Palette Generator — Light & Dark

Ferramenta para gerar variações de cores com tokens semânticos para light e dark mode.

## Funcionalidades

- **Tokens semânticos** — 8 papéis (background, surface, subtle, muted, default, emphasis, strong, on-primary) gerados automaticamente para ambos os modos
- **Escala completa** — rampa de 11 stops: 50 → 950
- **Pré-visualização** — UI de exemplo renderizada nos dois modos lado a lado
- **Exportar** — CSS variables, Tailwind config, JSON e Figma tokens

## Uso

Abra `index.html` em qualquer navegador. Nenhuma dependência ou build necessário.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Estrutura da interface |
| `style.css` | Estilos com suporte a dark mode via `prefers-color-scheme` |
| `palette.js` | Lógica de geração de cores e tokens |

## Como funciona

A cor base é transformada em escala HSL com 11 stops. Os tokens semânticos são mapeados automaticamente:

- **Light mode** → stops claros para fundo, stops saturados para primária, stops escuros para texto
- **Dark mode** → inversão da lógica: stops escuros para fundo, stops médios para primária, stops claros para texto
