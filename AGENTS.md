# Repository Guidelines

## Project Shape

This repository generates the profile README assets under `output/` from TypeScript scripts in `scripts/`.
The published assets are pushed to the `release` branch by `.github/workflows/generate.yml`.

## Commands

-   Install dependencies: `npm ci`
-   Generate assets: `npm run generate`
-   Type-check: `npm run typecheck`
-   Run tests: `npm test`
-   Full local check: `npm run check`
-   Format scripts: `npm run format`

`npm run generate` needs a GitHub token that can read private repositories. Locally, set `PROFILE_GITHUB_TOKEN`.
In GitHub Actions, configure the repository secret `PROFILE_GITHUB_TOKEN`.

## TypeScript Conventions

-   Source files live in `scripts/**/*.ts`.
-   The project uses Node ESM with `moduleResolution: "NodeNext"`.
-   Keep relative runtime imports using `.js` specifiers from TypeScript files, for example `import { CONFIG } from './constants.js'`.
-   Prefer focused interfaces in `scripts/types.ts` or near the module that owns the API shape.
-   Do not weaken `strict` type checking to make an error disappear.

## Generated Output

-   `output/` is generated and should not be edited by hand.
-   README image URLs intentionally point at `https://raw.githubusercontent.com/perlou/perlou/release/...`.
-   The language card is rendered from `scripts/svgs/github-top-languages.ts`.

## GitHub Data Notes

-   Public profile stats use REST endpoints in `scripts/data-github.ts`.
-   Private-aware language stats use GraphQL in `scripts/data-github-private.ts`.
-   Private repository visibility depends on the token, not only on the query. The default Actions `GITHUB_TOKEN` is not enough for other private repositories.

## README Layout

Keep the badge/social area as a compact centered HTML block. Avoid adding empty headings for spacing; use simple line breaks or image spacing so GitHub Markdown renders consistently.
