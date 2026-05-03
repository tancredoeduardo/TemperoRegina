# Tempero Regina Clone

Clone local completo do preview Readdy:

https://readdy.cc/preview/19bab42f-a1e6-4ada-9847-319a0f0abd49/9115452

## Rotas

- `/`
- `/catalogo`
- `/produto/:id`
- `/eventos`
- `/eventos/:id`
- `/quem-somos`
- `/receitas`
- `/faq`
- `/blog`
- `/contato`
- `/catalogo-impressao`
- `/revendedores`

Analise de paginas, funcionalidades, design e melhorias: `ANALISE-MELHORIAS.md`

## Rodar

```bash
node server.js
```

Depois abra:

```text
http://localhost:4173
```

## Teste visual automatizado

```bash
npm run test:visual
```

As capturas desktop/mobile sao salvas em `visual-report/summary.json` e `visual-report/*.png`.

## Integracao opcional (CRM e analytics externo)

Use `.env.example` como base para configurar:

- `CRM_WEBHOOK_URL`: recebe `contact`, `newsletter` e `revendedores`
- `ANALYTICS_WEBHOOK_URL`: recebe eventos de analytics

Sem esses valores, o sistema continua funcionando com persistencia local em `data/*.jsonl`.
