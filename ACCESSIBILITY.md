# Accessibility Statement: Transit Carbon Calculator

I'm a Disabled civic technologist, and I build Transit Carbon Calculator with Disabled people as the primary user, not an afterthought. This page says what has been tested, what I know still needs work, and how to tell me about a barrier.

**Live tool:** https://meyeringn.github.io/transit-carbon-calculator/

## Target

Transit Carbon Calculator aims to meet the **Web Content Accessibility Guidelines (WCAG) 2.2, Level AA**.

## How it's tested

- **Automated, every week:** each live tool is scanned with axe-core against WCAG 2.1 A and AA rules. [See the latest results](https://github.com/meyeringn/meyeringn.github.io/actions/workflows/accessibility-check.yml).
- **Reduced motion:** the tool respects your device's "reduce motion" setting.
- **Manual review:** not yet completed. Planned: keyboard-only use, NVDA and VoiceOver screen readers, and 200% zoom on a phone-width screen.

Automated tools catch only some barriers. Until the manual review is done, please treat this tool as tested by machine, not yet by people.

## Fixed in November 2026

The first automated scan found issues that are now fixed: low-contrast footer text, footer link styling, and a missing label on the lifetime slider.

## Known issues

| Issue | Who it affects | Workaround | Status |
| --- | --- | --- | --- |
| The downloadable share card is an image. | Screen reader users | All of the same numbers appear as text on the results page. | By design |
| The Philadelphia carbon map is visual only. | Blind and low vision users | Your personal results appear as text above the map. | Planned |

## Report a barrier

If something in Transit Carbon Calculator doesn't work for you, I want to know.

- [Open an issue](https://github.com/meyeringn/transit-carbon-calculator/issues/new?title=Accessibility%20barrier) (requires a free GitHub account), or
- Email meyeringn@gmail.com with "Accessibility" in the subject line.

Please describe what you were trying to do, what happened, and what device, browser, or assistive technology you use. I aim to reply within 5 business days.

**Last updated:** November 2026
