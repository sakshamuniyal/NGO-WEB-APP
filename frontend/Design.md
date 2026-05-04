# Design System Strategy: Giggles Foundation

## 1. Overview & Creative North Star

**Creative North Star: The Optimistic Editorial**
The design system for the Giggles Foundation moves away from the traditional, "boxed-in" nonprofit aesthetic. Instead, it adopts an editorial-first approach that balances high-end professionalism with the vibrant, human warmth inherent in the "Giggles" brand. We are creating a digital experience that feels like a premium lifestyle publication—authoritative enough to win trust from major donors, yet energetic enough to reflect the joy of the children we serve.

The experience is defined by **intentional asymmetry**. We break the rigid 12-column grid by using overlapping imagery, generous whitespace, and typography that shifts in scale to guide the eye. By layering "frosted glass" containers over high-quality photography, we achieve a sense of depth and modernity that standard flat layouts cannot match.

---

## 2. Colors

The palette is rooted in a sophisticated neutral base to allow the logo’s tri-color accents (Green, Yellow, Pink/Red) to pop with intentionality rather than clutter.

*   **Primary (Green - #006a3d):** Used for growth-oriented actions and trust-building elements.
*   **Secondary (Yellow - #755700):** Symbolizes the "Giggle"—used for optimism, warmth, and highlighting key phrases.
*   **Tertiary (Pink/Red - #b7004d):** Reserved for urgent calls to action and emotional impact points.
*   **Neutral (Surface/Background - #f6f6f9):** A sophisticated off-white that prevents the "stark hospital" feel of pure white.

### The "No-Line" Rule
To maintain a high-end feel, **do not use 1px solid borders to separate sections.** Sectioning must be achieved through:
1.  **Tonal Shifts:** Transitioning from `surface` (#f6f6f9) to `surface-container-low` (#f0f0f3).
2.  **Whitespace:** Using the Spacing Scale (specifically `spacing-16` or `spacing-20`) to create breathing room.

### The "Glass & Gradient" Rule
For hero sections and floating navigation, use Glassmorphism. Apply `surface` colors at 80% opacity with a `backdrop-blur` of 16px. Main CTAs should utilize a subtle linear gradient from `primary` (#006a3d) to `primary-container` (#6ef9aa) at a 135-degree angle to provide a "jewel-like" depth.

---

## 3. Typography

The typography strategy pairs **Plus Jakarta Sans** (Display/Headlines) for its modern, friendly geometry with **Manrope** (Body/Labels) for its exceptional readability and professional tone.

*   **Display Scale (`display-lg` 3.5rem):** Used for high-impact emotional hooks. Use "Tight" letter-spacing (-0.02em) to feel premium.
*   **Headline Scale (`headline-lg` 2.0rem):** The primary storytelling weight. Pair with `secondary` (#755700) color for specific "warm" keywords.
*   **Body Scale (`body-lg` 1.0rem):** Set in `on-surface-variant` (#5a5c5e) to reduce ocular strain and create a soft, editorial texture.
*   **Label Scale (`label-md` 0.75rem):** Always uppercase with +0.05em tracking for a "curated" look in metadata or small eyebrow tags.

---

## 4. Elevation & Depth

We convey hierarchy through **Tonal Layering** and light physics, not structural lines.

*   **The Layering Principle:** Treat the UI as physical sheets. 
    *   *Base:* `surface` (#f6f6f9)
    *   *Section:* `surface-container-low` (#f0f0f3)
    *   *Card:* `surface-container-lowest` (#ffffff)
    This creates a "natural lift" that feels grounded and high-end.
*   **Ambient Shadows:** For floating elements like Modals or Menus, use a 4-layer diffused shadow: `0 20px 40px rgba(45, 47, 49, 0.06)`. Never use pure black (#000) for shadows; always use a transparent tint of `on-surface`.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility on inputs, use `outline-variant` (#acadaf) at 20% opacity.
*   **Corner Radii:** We use a generous `DEFAULT` (1rem / 16px) for cards and `full` for buttons to maintain the "warm/friendly" requirement. Avoid sharp corners which can feel aggressive.

---

## 5. Components

### Buttons (The "Soft-Touch" CTA)
*   **Primary:** Gradient fill (`primary` to `primary-container`), white text, `rounded-full`, with a subtle lift on hover.
*   **Secondary:** `surface-container-highest` (#dbdde0) background with `on-surface` text.
*   **Tertiary:** No background. Bold `primary` text with an underline that appears on hover.

### Cards & Collections
*   **Rule:** Forbid divider lines. Use `spacing-6` (2rem) as a vertical gap between content blocks within a card.
*   **Style:** `surface-container-lowest` fill, `rounded-lg` (2rem) corners. Use high-quality imagery with a `0.5` spacing inner padding from the top edge to create a "framed" art look.

### Input Fields
*   **Visual Style:** Subtle `surface-container` fill. No bottom border. On focus, the background shifts to `surface-container-lowest` with a 1px `primary` ghost-border (20% opacity).

### Floating "Smile" Chips
*   A custom component for the Giggles Foundation: Small, `rounded-full` chips using `secondary-container` (#ffca4d) to highlight "Impact Wins" or "Success Stories" in the feed.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical image placements where a photo might "bleed" off one side of the screen while text sits centered.
*   **Do** use the Spacing Scale rigorously. When in doubt, add more space.
*   **Do** use "Plus Jakarta Sans" for numbers to make data points (e.g., "500 Children Helped") feel like part of the brand's visual identity.
*   **Do** ensure high-contrast accessibility (4.5:1 ratio) for all body text on surface colors.

### Don't
*   **Don't** use 100% opaque black (#000000) for text. Use `on-surface` (#2d2f31) for a softer, premium feel.
*   **Don't** use the logo colors as backgrounds for large sections. They are "accents"—use them for buttons, icons, or small decorative shapes.
*   **Don't** use standard "drop shadows" with 20%+ opacity. Keep it airy and light.
*   **Don't** use generic icons. Use soft-cornered, thin-stroke (1.5px) icons that match the Manrope font weight.