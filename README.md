# Pokladna – prezentačný web Besteron Pokladňa

Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui + next-intl.

## Štruktúra

- `src/styles/tokens.css` – brand tokeny (farba, radius). Jediné miesto identity.
- `src/styles/theme.css` – shadcn téma (CSS premenné), vymeniteľná.
- `src/styles/globals.css` – mapovanie tokenov do Tailwindu.
- `src/components/ui` – shadcn primitíva.
- `src/components/blocks` – shadcnblocks (surové bloky).
- `src/components/sections` – naše sekcie; texty len cez i18n.
- `messages/{sk,en}.json` – preklady. Nový jazyk = nový JSON + záznam v `src/i18n/routing.ts`.

## Pravidlá

- Žiadne natvrdo farby (`bg-blue-500`, hex); len sémantické triedy (`bg-primary`).
- Žiadne natvrdo texty v JSX; len `useTranslations` / `getTranslations`.

## Vývoj

```bash
npm install
npm run dev
```
