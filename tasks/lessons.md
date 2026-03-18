## Lessons

### UI overlay stacking (2026-03-18)
- Problem: the favorites “star” overlay button became hidden after hover because the poster image (scaling on hover) ended up above the overlay in the stacking context.
- What I changed: set a higher `z-index` on the overlay button and gave the poster a lower stacking order so it stays behind the button while hovered.
- Rule for next time: whenever adding an absolutely-positioned overlay inside a hover-scaled element, explicitly set `z-index` (and, if needed, `position`) on both overlay and hovered element to avoid it being covered.

