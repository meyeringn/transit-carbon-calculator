# Transit Carbon Calculator

Static GitHub Pages site that answers "How much carbon does my ride save?" for Pennsylvania transit riders. Plain HTML/CSS/JS, no build step, no backend. Opening `index.html` straight from disk must keep working. The primary users are Disabled riders and people who don't drive.

## Commands
- `npm test`: unit tests for `js/core.js` plus static checks (CSP, contrast, copy rules, README matches `js/data.js`). Must pass before any commit.
- `npm run test:e2e`: offline browser smoke test with a faked EIA API (needs `npm i && npx playwright install chromium`). `SCREENSHOTS=shots` saves 390px and 1280px pictures. Look at them.
- `npm run serve`, then open http://localhost:8000.

## Where things live
- `js/data.js`: every emission factor, conversion, source URL, agency, version, and "data last verified" date. Routine updates go here and nowhere else.
- `js/core.js`: pure math and wording, no DOM or network. Add a test in `tests/core.test.js` for anything new here.
- `js/app.js`: DOM, events, gas price fetch, sharing. `css/styles.css`: design tokens at the top. Read `docs/DESIGN.md` before visual changes.

## Rules
- IMPORTANT: Never invent or estimate a number. Every factor, ridership figure, or comparison must come from a source you actually read, recorded in `js/data.js` with its URL. If you can't source it, leave it out. (v2.0 removed a neighborhood map and "fun facts" because their numbers had no source.)
- Results use national EPA averages per mode. Don't describe them as agency-specific until per-agency factors (FTA National Transit Database) are built and sourced.
- If a very efficient car beats the transit average, say so plainly. Never clamp or hide a negative result.
- Never store, log, or put rider inputs in a URL. GoatCounter counts the page path only.
- Identity-first language ("Disabled riders"). Plain words, short sentences. No em dashes in copy. Mode labels include "Walk or roll."
- Accessibility is a requirement: WCAG 2.2 AA, visible focus, meaning never by color alone, `role="status"` messages (no `alert()`), targets at least 24px (48px preferred), no sideways scrolling at 390px, reduced motion respected.
- No new frameworks, build tools, CDNs, or trackers without asking. Fonts are self-hosted. Adding an outside host means updating the CSP meta tag in `index.html` and the Privacy section of `README.md`.

## Workflow
- Small, targeted edits. Don't regenerate whole files; that silently undoes earlier fixes.
- Bump `version` in `js/data.js` and `package.json` together (`npm test` checks this).
- After UI changes: `npm test`, `SCREENSHOTS=shots npm run test:e2e`, look at both widths, then ask the `a11y-reviewer` agent to review the diff.
- Factor updates: use the `update-factors` skill.
- Ship through a branch and pull request. A push to `main` goes live on GitHub Pages.
