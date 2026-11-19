# Transit Carbon Calculator design

**Feeling:** platform signage you trust. It should read like the line diagram above a train door, sturdy and easy to scan, not like a startup landing page.

## Decisions and why

| Choice | Value | Why |
| --- | --- | --- |
| Body type | Atkinson Hyperlegible Next, variable 200 to 800 | Designed by the Braille Institute for low-vision readers. Distinct letterforms (its slashed zero is a feature). Self-hosted. |
| Sign type | Overpass ExtraBold | Open-source lettering based on U.S. highway signs. Used for headings, stop labels, and numbers. Self-hosted. Never Inter. |
| Signal navy | `--ink #12263f` | Station signs, text, buttons, and the results panel. |
| Line yellow | `--yellow #ffc72c` | The route line and the platform's tactile strip. Shapes on light backgrounds; text only on navy. |
| Platform tile | `--paper #f4f2ec` | Page background. Cards are white with a navy top edge. |
| Your ride / the car | `--ride #1d6b45`, `--car #a3302a` with hatching | The comparison bars. Each bar also has a text label and a number, and the car bar is hatched, so color is never the only cue. |

## Signature elements
- **The line diagram.** Results ride a yellow route line with stops at 1 week, 1 month, 1 year, and the rider's chosen number of years. The last stop is the terminal: a filled yellow dot with a white ring. On phones, the line turns vertical, like a station column. It's an ordered list, so screen readers hear it in order.
- **The tactile strip.** Under the masthead sits a yellow band with rows of domes, drawn from the detectable warning strip at platform edges, an ADA feature. It's decorative and hidden from assistive tech.
- **The share image** repeats the line diagram, so a post looks like the page.

## Rules
- No decorative gradients, soft drop shadows, glassmorphism, pill badges, emoji, or confetti. The only patterns are the tactile domes, the radio dot, and the hatched car bar.
- Square-ish corners (4px). Flat borders. Panels have a 6px navy top edge.
- Body text 4.5:1 or better; borders, bars, and focus rings 3:1 or better. `npm test` checks every token pair.
- One animation: the route line draws in when results appear. It's off under reduced motion.
- Layout stays conventional: one column, a real form, a real table. The look comes from the line, the type, and the color, not from unusual navigation.

## Family resemblance
Each of Nico's tools has its own Philadelphia object (BallotGap: the poll placard; Open Door Index: the rowhouse door; this one: the line diagram). They share a plain-language headline question, an accessibility statement, the cookie-free GoatCounter note, and a footer link back to https://meyeringn.github.io/.
