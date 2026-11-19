# Accessibility Statement: Transit Carbon Calculator

I'm a Disabled civic technologist, and I build Transit Carbon Calculator with Disabled people as the primary user, not an afterthought. This page says what has been tested, what I know still needs work, and how to tell me about a barrier.

**Live tool:** https://meyeringn.github.io/transit-carbon-calculator/

## Target

Transit Carbon Calculator aims to meet the **Web Content Accessibility Guidelines (WCAG) 2.2, Level AA**.

## How it's tested

- **Automated, every week:** each live tool is scanned with axe-core against WCAG 2.1 A and AA rules. [See the latest results](https://github.com/meyeringn/meyeringn.github.io/actions/workflows/accessibility-check.yml).
- **Automated, every change:** `npm test` checks color contrast for every design token pair, the Content Security Policy, and copy rules. An offline browser test checks that every control has a name, that errors are announced and linked to their fields, that focus moves to your results, that Enter submits the form, and that nothing scrolls sideways at 390px.
- **Reduced motion:** the tool respects your device's "reduce motion" setting. The one animation (the route line drawing in) turns off.
- **Manual review:** not yet completed. Planned: keyboard-only use, NVDA and VoiceOver screen readers, and 200% zoom on a phone-width screen.

Automated tools catch only some barriers. Until the manual review is done, please treat this tool as tested by machine, not yet by people.

## Fixed in November 2026

The first automated scan found issues that are now fixed: low-contrast footer text, footer link styling, and a missing label on the lifetime slider.

## Changed in version 2.0 (November 2026)

- Fonts: Atkinson Hyperlegible Next, designed by the Braille Institute for low-vision readers, at an 18px base size.
- Results are announced: focus moves to the results heading, and form errors appear in a summary that links to each field.
- Errors are tied to their fields with `aria-invalid` and `aria-describedby`, and say "Error:" in text, not just in red.
- Emoji were removed, because screen readers read them aloud.
- The comparison bars carry text labels and numbers, and the car bar is hatched, so color is never the only cue.
- Confetti and counting animations were removed.
- The share image now comes with suggested alt text.
- "Walk or roll" replaced "Walk," so wheelchair and mobility device users are included.
- The visual-only Philadelphia map was removed. Its numbers had no source.

## Known issues

| Issue | Who it affects | Workaround | Status |
| --- | --- | --- | --- |
| The downloadable share image is a picture. | Screen reader users | Every number appears as text on the page, and the tool offers alt text to paste with the image. | By design |
| The page is English only. | Spanish speakers | None yet. | Planned, with a native-speaker review |

## Report a barrier

If something in Transit Carbon Calculator doesn't work for you, I want to know.

- [Open an issue](https://github.com/meyeringn/transit-carbon-calculator/issues/new?title=Accessibility%20barrier) (requires a free GitHub account), or
- Email meyeringn@gmail.com with "Accessibility" in the subject line.

Please describe what you were trying to do, what happened, and what device, browser, or assistive technology you use. I aim to reply within 5 business days.

**Last updated:** November 2026
