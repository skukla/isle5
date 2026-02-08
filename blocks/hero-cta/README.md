# Hero CTA Block

## Name of Block and Purpose

The **Hero CTA** block is a configurable, media-first hero for campaign and merchandising moments.

It supports:
- image-led slides with layered content,
- multiple CTA links per slide,
- optional sidebar navigation rows,
- layout controls via Section Metadata,
- timed slide rotation via an interval row in the block table.

## Benefits

- Reusable campaign hero pattern with strong DA.live authoring flexibility.
- Metadata-first controls for layout, overlays, and CTA presentation.
- Supports multi-CTA slides plus optional sidebar navigation in one block.
- Progressive enhancement with safe defaults and reduced-motion awareness.
- Optimized first-slide media loading to support Core Web Vitals.

## Quick Start

1. Create a 3-column `hero-cta` table.
2. Add slide rows (image in column 1, `Label|URL` lines in column 2, optional color lines in column 3).
3. Add optional `nav` rows.
4. Add interval as the last row (first cell only), for example `5000`.
5. Add Section Metadata directly above the block if you need layout overrides.

Minimal example:

| hero-cta | | |
|---|---|---|
| hero-1.jpg | Shop Collection A\|/collection-a | white |
| hero-2.jpg | Shop Outerwear\|/outerwear | brand |
| 5000 | | |

## How to Author

| Column | Purpose | Required | Notes |
|---|---|---|---|
| 1 | Slide image, or `nav` marker | Yes | Use an image for slide rows. Use literal `nav` to create sidebar rows. |
| 2 | Link lines in `Label|URL` format | Yes | One line per CTA (slide rows) or one nav item (nav rows). |
| 3 | Optional color variant lines | No | Optional per-CTA variant (`white`, `transparent`, `brand`, `accent`, `dark`, `outline-dark`, hex). |

`Label|URL` format:
- Example CTA: `Shop Outerwear|/outerwear`
- Example nav: `Seasonal Launch|/seasonal-launch`
- For multiple links in one cell, use one line per link (`Shift+Enter` in DA.live).

URL rules:
- Internal pages: use site-relative paths like `/women/winter`.
- External pages: use full URLs like `https://example.com/campaign`.
- `category/jackets` without leading `/` is invalid for internal links.

Image source support (column 1):
- uploaded asset,
- direct image URL,
- linked image URL,
- existing `img` or `picture` markup.

External DAM links work when they resolve directly to an image file URL.

## How to Section-Metadata

Place **Section Metadata immediately above** the `hero-cta` block.

Example:

| Section Metadata | Value |
|---|---|
| `data-sidebar` | `overlay-right` |
| `data-align` | `right` |
| `data-vertical` | `bottom-safe` |
| `data-size` | `medium` |
| `data-gradient-intensity` | `x-light` |
| `data-overlay-style` | `mesh-soft` |
| `data-overlay-color` | `brand` |
| `data-overlay-blur` | `soft` |
| `data-density` | `comfortable` |
| `data-content-max-width` | `520` |
| `data-content-surface` | `glass` |
| `data-eyebrow-style` | `label` |
| `data-button-style` | `rounded-lg` |
| `data-button-width` | `fit-content` |
| `data-button-color` | `brand` |
| `data-button-hover-style` | `fill` |
| `data-button-border-width` | `3` |
| `data-button-shadow` | `none` |
| `data-button-font-weight` | `600` |
| `data-cta-layout` | `inline` |
| `data-cta-gap` | `medium` |
| `data-cta-text-transform` | `none` |
| `data-cta-font-size` | `md` |
| `data-button-text-color` | `white` |
| `data-slide-transition` | `fade` |
| `data-autoplay` | `on` |
| `data-image-fit` | `cover` |
| `data-focal-point` | `center` |
| `data-image-frame-style` | `default` |
| `data-image-max-width` | `3000` |

## Reference Tables

### DA.live Model Options

This block now uses **Section Metadata as the configuration source of truth**.

DA.live model fields are intentionally empty to avoid duplicate control paths and authoring conflicts.

### Section Metadata Reference

| Key | Default | Possible Values | Effect |
|---|---|---|---|
| `data-align` | `right` | `left`, `center`, `right`, `start`, `end` | Repositions the overlay block horizontally and switches gradient direction/shape to keep text readable for that placement. |
| `data-vertical` | `bottom` | `top`, `middle`, `bottom`, `top-safe`, `bottom-safe` | Moves overlay content vertically. `top-safe` and `bottom-safe` add safe-area-aware padding for edge-constrained viewports. |
| `data-size` | `tall` | `short`, `medium`, `tall`, `fullscreen` | Changes hero height profile from compact (`short`) to full viewport (`fullscreen`). |
| `data-density` | `comfortable` | `compact`, `comfortable`, `spacious` | Scales overall hero spacing rhythm (overlay padding and content breathing room) without changing authored content. |
| `data-content-max-width` | `420` | `360`, `420`, `520`, `640` | Sets the maximum width of the content column, directly controlling line length and headline wrapping behavior. |
| `data-gradient-intensity` | `medium` | `none`, `x-light`, `light`, `medium`, `strong`, `x-strong` | Controls overlay opacity behind text, from no darkening (`none`) to highest readability emphasis (`x-strong`). |
| `data-overlay-style` | `linear` | `linear`, `radial`, `split`, `mesh-soft` | Changes overlay pattern geometry for different art-direction outcomes while preserving readability intent. |
| `data-overlay-color` | token-derived | `brand`, `accent`, `dark`, `light`, `neutral`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Tints the overlay with a token or custom color for campaign styling and brand adaptation. |
| `data-overlay-blur` | `none` | `none`, `soft`, `medium` | Applies backdrop blur strength to reduce background noise behind text and improve legibility. |
| `data-content-surface` | `none` | `none`, `glass`, `solid` | Adds an optional panel treatment behind content for stronger text contrast on complex imagery. |
| `data-eyebrow-style` | `none` | `none`, `label`, `pill`, `underline` | Styles the first supporting line as an eyebrow treatment when present, helping hierarchy and campaign tagging. |
| `data-button-style` | `pill` | `default`, `pill`, `sharp`, `soft`, `rounded-lg`, `outline`, `ghost`, `elevated`, `minimal`, `glass`, `gradient`, `link` | Changes CTA shape and surface treatment from classic solid styles to minimalist, glass, gradient, or link-like presentation. |
| `data-button-width` | `auto` | `auto`, `narrow`, `medium`, `wide`, `fluid`, `fit-content` | Controls CTA sizing behavior from intrinsic width (`auto`/`fit-content`) to fixed (`narrow`/`medium`/`wide`) and full-row (`fluid`). |
| `data-button-color` | `brand` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Sets CTA background and border color using design tokens or explicit colors. |
| `data-button-colour` | same as above | alias of `data-button-color` | UK spelling alias for the same button color control. |
| `data-button-hover-style` | `fill` | `fill`, `inverse`, `darken`, `lift`, `lift-only`, `none` | Controls hover behavior: color fill/invert/darken, lift motion, lift-only motion (no color change), or no hover change. |
| `data-button-border-width` | `3` | `1`, `2`, `3`, `4` | Sets CTA border thickness for lighter or stronger outline emphasis. |
| `data-button-shadow` | `none` | `none`, `soft`, `medium`, `strong` | Applies optional CTA depth independently from style preset. |
| `data-button-font-weight` | `600` | `400`, `500`, `600`, `700` | Sets CTA label weight to tune emphasis and readability. |
| `data-cta-layout` | `stack` | `stack`, `inline`, `split` | Switches CTA group layout between vertical stack, horizontal flow, or equal-width two-column split. |
| `data-cta-gap` | `medium` | `xsmall`, `small`, `medium`, `large` | Controls spacing between CTA items independently from global hero spacing presets. |
| `data-cta-text-transform` | `none` | `none`, `uppercase`, `capitalize` | Controls CTA label casing style without requiring copy changes. |
| `data-cta-font-size` | `default` | `default`, `sm`, `md`, `lg` | Uses inherited/global CTA font size by default; optional overrides adjust CTA label scale when needed. |
| `data-button-text-color` | `white` | `white`, `dark`, `brand`, `accent`, `inherit`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Overrides CTA text color and keeps it consistent across normal, hover, and focus states. |
| `data-button-text-colour` | same as above | alias of `data-button-text-color` | UK spelling alias for the same CTA text color control. |
| `data-slide-transition` | `fade` | `fade`, `slide`, `none` | Controls animation style between slides, from crossfade to directional slide or no transition. |
| `data-autoplay` | `on` | `on`, `off`, `true`, `false`, `1`, `0`, `yes`, `no` | Enables or disables automatic slide rotation while still honoring reduced-motion user preferences. |
| `data-image-fit` | `cover` | `cover`, `contain` | Controls image fill behavior: crop-to-fill (`cover`) or full-image visibility (`contain`). |
| `data-focal-point` | `center` | `left`, `center`, `right`, `top`, `bottom` | Sets image subject alignment to preserve important visual areas across responsive breakpoints. |
| `data-image-frame-style` | `default` | `default`, `pill`, `sharp`, `soft`, `rounded-lg`, `outline`, `elevated` | Applies presentation styling to the hero frame (corners, border, shadow) independently of CTA style. |
| `data-image-max-width` | `2400` | `1200`, `1600`, `2000`, `2400`, `3000`, `3600` | Caps the largest responsive image generated for slide media, balancing file weight and large-screen sharpness. |
| `data-sidebar` | `off` | `off`, `left`, `right`, `overlay-left`, `overlay-right`, `sticky-left`, `sticky-right` | Enables sidebar nav and chooses layout mode: standard side rail, overlay panel, or sticky side rail. |

## Accessibility

- First slide image is eager-loaded for LCP optimization.
- Remaining slides rotate by interval unless reduced motion is enabled.
- CTA and nav links are keyboard-focusable with visible focus states.
- Missing or partial content degrades safely without breaking layout.

## Troubleshooting

- **Sidebar not showing**: ensure rows start with `nav` in column 1 and `data-sidebar` is enabled.
- **Alignment not applying**: ensure Section Metadata is directly above the block and keys are correct.
- **Interval not applying**: ensure final row contains only one numeric value in cell 1 (`5000`).
- **Image not rendering**: verify column 1 resolves to a direct image URL or uploaded asset.
- **Need transparent CTA with motion only**: use `data-button-style=outline`, `data-button-color=white`, `data-button-text-color=white`, and `data-button-hover-style=lift-only`.
