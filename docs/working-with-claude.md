# Working on the Transit Carbon Calculator with Claude

This is the workflow that keeps a vibe-coded climate tool trustworthy. It follows [Anthropic's Claude Code best practices](https://code.claude.com/docs/en/best-practices), adapted for a small static site, and matches BallotGap PHL and Open Door Index.

## The loop: explore, plan, change, verify

1. **Explore.** "Read CLAUDE.md and js/core.js. Explain how CO₂ avoided is calculated. Don't change anything yet."
2. **Plan.** "I want X. Which files change? What could break for screen reader users or phone users? Give me a short plan."
3. **Change.** Ask for small, targeted edits, never "rewrite index.html." Whole-file rewrites are how earlier fixes quietly disappear.
4. **Verify.** "Run `npm test` and `SCREENSHOTS=shots npm run test:e2e`. Show me the output and the screenshots." Ask for evidence, not "done."
5. **Review.** "Use the a11y-reviewer agent on this diff." A fresh reviewer catches what the author missed.
6. **Ship.** Open a pull request and let CI run before you merge.

## The biggest risk is made-up numbers

Language models are good at producing numbers that look right. In a climate tool, a confident wrong number does more harm than no number. So:

- Ask for the source first: "Find EPA's current bus factor and show me the page you read it on."
- Every number goes in `js/data.js` with its URL. Nothing gets hard-coded in app.js or the HTML.
- If Claude offers a "fun fact," ask where it comes from. If there's no source, cut it.

## Prompts that work well here

- **Yearly factor refresh:** "Use the update-factors skill. EPA published a new Emission Factors Hub."
- **New agency:** "Add [agency] to js/data.js with its current official name and service area from its own website. Run npm test."
- **New feature:** "Interview me with questions about [feature] first: who it's for, where the data comes from, edge cases, accessibility. Then write a plan."
- **Bug:** "Riders report [symptom] on [device/AT]. Write a failing test that reproduces it, then fix it and show the test passing."
- **Design tweak:** "Change [thing] using only the tokens in css/styles.css and the rules in docs/DESIGN.md. Take 390px and 1280px screenshots before and after."

## Habits

- Start a fresh session for each unrelated task.
- If you've corrected Claude twice on the same thing, start over with a clearer prompt that includes what you learned.
- When Claude makes the same mistake twice, add one line to CLAUDE.md. Keep that file short, because long rule lists get ignored.
- Don't paste API keys into a session. This project needs none (EIA's public demo key is rate-limited and has a fallback).
