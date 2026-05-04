# Tempero Regina Clone

Clone local completo do preview Readdy:

https:www.temperoregina.com.br
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

- `NEXT_PUBLIC_SUPABASE_URL`: URL publica do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publica recomendada do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: fallback legado, caso ainda esteja usando anon key
- `SUPABASE_SUBMISSIONS_TABLE`: tabela usada para contatos, newsletter, revendedores e analytics
- `CRM_WEBHOOK_URL`: recebe `contact`, `newsletter` e `revendedores`
- `ANALYTICS_WEBHOOK_URL`: recebe eventos de analytics

Sem esses valores, o sistema continua funcionando com persistencia local em `data/*.jsonl`.

## Supabase

O projeto Supabase configurado e `Tempero Regina` (`rwsxwcljnximafgajxvj`), com URL publica:

```text
https://rwsxwcljnximafgajxvj.supabase.co
```

A tabela `public.site_submissions` foi criada com RLS ativo. O acesso publico permite apenas `insert`, sem politica de leitura publica. O SQL reproduzivel fica em:

```text
scripts/setup-supabase.sql
```

Para validar localmente depois de preencher `.env.local`:

```bash
npm run check:supabase
```

Para testar tambem um insert real de healthcheck:

```bash
SUPABASE_HEALTHCHECK_INSERT=1 npm run check:supabase
```
