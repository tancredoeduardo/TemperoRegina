# Análise do Clone Tempero Regina

Origem analisada: `https://readdy.cc/preview/19bab42f-a1e6-4ada-9847-319a0f0abd49/9115452/`

## Escopo Clonado

- Home com hero, seção institucional, marcas, vendedores, produtos, receitas, depoimentos, newsletter, clientes e contato rápido.
- Catálogo com busca, filtro por categoria, visualização em grade/lista, download por produto e CTA de catálogo completo.
- Detalhe de produto em `/produto/:id`.
- Eventos em `/eventos` e detalhe em `/eventos/:id`.
- Quem somos em `/quem-somos`.
- Receitas em `/receitas`.
- FAQ em `/faq` com busca, categorias e acordeões.
- Blog em `/blog` com filtros, busca, paginação e modal de leitura.
- Contato em `/contato` com dados, mapa e formulário.
- Lista de desejos flutuante com persistência em `localStorage`, remoção de itens e CTA por e-mail.
- Fallback SPA para rotas diretas pelo `server.js` e pelo `vercel.json`.

## Funcionalidades

- Navegação SPA com React Router.
- Busca e filtros no catálogo, blog e FAQ.
- Alternância de layout do catálogo.
- Favoritos/lista de desejos persistente.
- Modais para blog/eventos e drawer lateral.
- Formulários com validação básica de e-mail.
- Links `mailto:` e `tel:` para contato comercial.
- Assets de produto e marca espelhados em `assets/remote`.

## Pontos Fortes

- Identidade visual consistente: vermelho Regina, amarelo de destaque, cards brancos e imagens de produto em foco.
- Catálogo bem útil para exploração comercial, com categorias claras e busca rápida.
- Boa cobertura de conteúdo institucional e comercial.
- Mobile-first razoável, com filtros recolhidos e grids responsivos.

## Melhorias Recomendadas

1. Substituir os formulários que enviam para `readdy.ai` por um endpoint próprio, CRM ou serviço de e-mail transacional.
2. Gerar um PDF real de catálogo ou trocar o CTA por uma página de catálogo imprimível.
3. Adicionar SEO por rota com títulos e descrições específicos para catálogo, receitas, blog e contato.
4. Melhorar acessibilidade dos cards clicáveis, evitando navegação apenas por `onClick` em `div`.
5. Adicionar estados de erro/carregamento para mapa, imagens e envio de formulário.
6. Incluir analytics próprio e eventos úteis: busca sem resultado, produto favoritado, download e clique de contato.
7. Criar página/fluxo de revendedores com formulário dedicado e campos comerciais.
8. Revisar contraste e tamanho de texto em alguns cards menores para leitura em celulares.
9. Remover dependências do preview Readdy em uma reconstrução fonte, mantendo o build atual apenas como clone estático.
10. Automatizar testes visuais das principais rotas em desktop e mobile.

## Como Rodar

```bash
node server.js
```

Acesse `http://localhost:4173`.

