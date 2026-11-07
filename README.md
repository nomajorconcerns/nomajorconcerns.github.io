# No Major Concerns

Source for the joint site (Cephalo + SideEye) and the SideEye site.

- Joint site: https://nomajorconcerns.github.io/ (served from `docs/`)
- SideEye site: https://nomajorconcerns.github.io/sideeye/ (built here, published from the `sideeye` repo's `docs/`)
- Cephalo: https://nomajorconcerns.github.io/cephalo/ (separate repo, not touched here)

## Build

```
npm install
node scripts/build.mjs          # writes dist/joint and dist/sideeye
node scripts/contrast.mjs       # WCAG AA check of every text colour pair
node scripts/check.mjs          # axe, 360px overflow, external requests, JS-off
```

`shared/` holds the tokens, fonts, components and mascot SVGs used by both sites. Reference artwork is in `assets/`. No cookies, no analytics, no CDNs.

Status: Phase 1 (launch week). Nothing here is published until Pages is enabled.
