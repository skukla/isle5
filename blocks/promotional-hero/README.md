# Promotional Hero Block

## Name of Block and Purpose

The **Promotional Hero** block creates one or more image-led promotional cards with a floating content panel and CTA.

It is designed for campaign moments where each card needs:
- a visual (image),
- a short text message,
- a single click-through CTA.

## Benefits

- Reusable authoring model for 1-3 promotional cards.
- Section Metadata controls for layout, spacing, image ratio, and CTA presentation.
- Safe link handling (`http`/`https` only) with `_blank` hardening (`rel="noopener noreferrer"`).
- Optimized image rendering via `createOptimizedPicture`.
- Inherits global typography and design system tokens by default.

## How to Author

Create a 3-column `promotional-hero` table.

| Column | Purpose | Required | Notes |
|---|---|---|---|
| 1 | Image | Yes | Use an uploaded image, a direct image URL, linked image URL, or existing `picture/img`. |
| 2 | Description | No | Plain text or multi-line copy (paragraphs supported). |
| 3 | CTA | No | Use `Label|URL` or an authored link. Example: `Shop Collection|/collection`. |

Example:

| promotional-hero | | |
|---|---|---|
| hero-1.jpg | New arrivals for spring | Shop now\|/new-arrivals |
| hero-2.jpg | Occasion edits and accessories | Explore\|/occasion-edit |

| Column | Purpose | Required | Default / Fallback |
|---|---|---|---|
| 1 | Card image | Yes | Card is rendered without media if invalid/missing image source. |
| 2 | Card description text | No | Empty description if omitted. |
| 3 | CTA (`Label|URL` or link) | No | Label falls back to `Shop now`; unsafe/missing URL becomes disabled CTA. |

Notes:
- Multiple rows create multiple cards.
- If no CTA URL is provided, CTA is disabled safely.
- Internal URLs should be site-relative (example: `/women/new`).
- External URLs should be full URLs (example: `https://example.com/campaign`).

## How to Section-Metadata

Place **Section Metadata immediately above** the `promotional-hero` block.

Example:

| Section Metadata | Value |
|---|---|
| `data-align` | `center` |
| `data-columns` | `2` |
| `data-card-width` | `medium` |
| `data-card-height` | `auto` |
| `data-image-ratio` | `portrait` |
| `data-image-fit` | `cover` |
| `data-gap` | `medium` |
| `data-density` | `comfortable` |
| `data-content-style` | `floating` |
| `data-content-align` | `center` |
| `data-panel-width` | `standard` |
| `data-card-radius` | `default` |
| `data-image-shadow` | `soft` |
| `data-image-position` | `center` |
| `data-hover-effect` | `subtle` |
| `data-button-style` | `pill` |
| `data-button-width` | `auto` |
| `data-button-text-transform` | `none` |
| `data-button-hover-style` | `fill` |
| `data-button-border-width` | `3` |
| `data-button-shadow` | `none` |
| `data-button-font-size` | `md` |
| `data-button-font-weight` | `600` |
| `data-button-color` | `brand` |
| `data-button-text-color` | `white` |
| `data-content-bg-color` | `white` |
| `data-content-text-color` | `dark` |
| `data-content-border-style` | `none` |
| `data-content-border-color` | empty |
| `data-content-shadow` | `soft` |
| `data-content-radius` | `default` |
| `data-panel-offset` | `medium` |
| `data-card-border-style` | `none` |
| `data-card-border-color` | empty |
| `data-card-border-width` | `0` |
| `data-description-max-lines` | `none` |
| `data-description-style` | `body` |
| `data-image-overlay` | `none` |
| `data-image-overlay-color` | `dark` |
| `data-grid-max-width` | `none` |
| `data-mobile-layout` | `stack` |
| `data-background-color` | `transparent` |
| `data-full-width` | `false` |

## Section Metadata Reference

| Key | Default | Possible Values | Effect |
|---|---|---|---|
| `data-align` | `center` | `left`, `center`, `right` | Controls where the full card grid sits within the section container (left anchored, centered, or right anchored). |
| `data-columns` | `2` | `auto`, `1`, `2`, `3` | Sets desktop column count directly; `auto` lets the grid auto-fit based on card width and available space. |
| `data-card-width` | `medium` | `small`, `medium`, `large` | Changes the base width and minimum height of each card, influencing how much imagery and copy can fit comfortably. |
| `data-card-height` | `auto` | `auto`, `short`, `medium`, `tall` | Controls vertical card scale independently of width. `auto` keeps current width/ratio-driven sizing, while presets enforce a shorter or taller layout frame. |
| `data-image-ratio` | `portrait` | `portrait`, `square`, `landscape` | Changes card media aspect ratio, which alters visual emphasis between height-led and width-led compositions. |
| `data-image-fit` | `cover` | `cover`, `contain` | Chooses crop behavior for images: `cover` fills frame with crop, `contain` preserves full image inside frame. |
| `data-gap` | `medium` | `small`, `medium`, `large` | Controls inter-card spacing to tune visual density between compact merchandising and editorial layouts. |
| `data-density` | `comfortable` | `compact`, `comfortable`, `spacious` | Scales block-level vertical rhythm (band padding + panel spacing) without changing authored content. |
| `data-content-style` | `floating` | `floating`, `flush`, `inset` | Defines panel placement: overlap below image edge (`floating`), full-width bottom edge (`flush`), or inset inside image (`inset`). |
| `data-content-align` | `center` | `left`, `center`, `right` | Controls text alignment inside the content panel for copy hierarchy and reading flow. |
| `data-panel-width` | `standard` | `compact`, `standard`, `wide` | Sets max/min width profile of the panel so copy line-length can be tightened or expanded per campaign style. |
| `data-card-radius` | `default` | `sharp`, `soft`, `default`, `rounded-lg` | Applies corner radius treatment consistently to card and image frame for sharper or softer visual tone. |
| `data-image-shadow` | `soft` | `none`, `soft`, `strong` | Sets image depth level by controlling shadow intensity in default and hover states. |
| `data-image-position` | `center` | `left`, `center`, `right`, `top`, `bottom` | Repositions the crop focus to keep the important subject visible across responsive breakpoints. |
| `data-hover-effect` | `subtle` | `none`, `subtle`, `lift` | Controls hover motion behavior: disable motion, keep gentle zoom/lift, or use stronger panel-lift emphasis. |
| `data-button-style` | `pill` | `default`, `pill`, `sharp`, `soft`, `rounded-lg`, `outline`, `ghost`, `elevated`, `minimal`, `glass`, `gradient`, `link` | Controls CTA visual personality through corner radius and fill/shadow treatment: from quiet minimal/link styles to high-emphasis elevated/gradient styles. |
| `data-button-width` | `auto` | `auto`, `narrow`, `medium`, `wide`, `fluid` | Defines CTA width strategy from intrinsic width to fixed presets or full panel width (`fluid`). |
| `data-button-text-transform` | `none` | `none`, `uppercase`, `capitalize` | Sets visual casing style for CTA labels without requiring content rewrite in authoring. |
| `data-button-hover-style` | `fill` | `fill`, `inverse`, `darken`, `lift`, `lift-only`, `none` | Controls CTA hover behavior: standard fill shift, color inversion, darken emphasis, lift motion, lift-only motion (no color change), or no hover change. |
| `data-button-border-width` | `3` | `1`, `2`, `3`, `4` | Sets CTA border thickness for softer or stronger button framing. |
| `data-button-shadow` | `none` | `none`, `soft`, `medium`, `strong` | Adds optional CTA elevation depth independent of `data-button-style`. |
| `data-button-font-size` | `md` | `sm`, `md`, `lg` | Adjusts CTA label scale for compact utility CTAs or stronger campaign emphasis. |
| `data-button-font-weight` | `600` | `400`, `500`, `600`, `700` | Tunes CTA typographic weight to match brand tone and readability targets. |
| `data-button-color` | `brand` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Applies CTA background and border color using token names or custom color values. Default `brand` uses the darker brand token for stronger CTA contrast. |
| `data-button-colour` | same as above | alias of `data-button-color` | UK spelling alias supported. |
| `data-button-text-color` | `white` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Sets CTA label color to maintain contrast against the chosen button background treatment. |
| `data-button-text-colour` | same as above | alias of `data-button-text-color` | UK spelling alias supported. |
| `data-content-bg-color` | `white` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Sets the bubble/panel surface color independently from the block background for stronger contrast control. |
| `data-content-bg-colour` | same as above | alias of `data-content-bg-color` | UK spelling alias supported. |
| `data-content-text-color` | `dark` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Sets copy color inside the panel so typography remains legible against the chosen panel surface. |
| `data-content-text-colour` | same as above | alias of `data-content-text-color` | UK spelling alias supported. |
| `data-content-border-style` | `none` | `none`, `subtle`, `strong`, `brand` | Adds panel edge definition from no border to campaign-accent border styles. |
| `data-content-border-color` | empty | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Optional explicit panel border color override; useful when border style is enabled and campaign palette needs custom color. |
| `data-content-border-colour` | same as above | alias of `data-content-border-color` | UK spelling alias supported. |
| `data-content-shadow` | `soft` | `none`, `soft`, `medium`, `strong` | Controls panel elevation depth independently from image shadow to tune visual hierarchy. |
| `data-content-radius` | `default` | `sharp`, `soft`, `default`, `rounded-lg`, `pill` | Controls panel corner geometry independently from card radius. |
| `data-panel-offset` | `medium` | `none`, `small`, `medium`, `large`, `xlarge` | Sets how far the panel overlaps below the image edge; higher offsets produce a stronger “floating card” look. |
| `data-card-border-style` | `none` | `none`, `subtle`, `strong`, `brand` | Adds frame border around each card for catalog-like or editorial framed treatments. |
| `data-card-border-color` | empty | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Optional explicit card border color override when frame borders are enabled. |
| `data-card-border-colour` | same as above | alias of `data-card-border-color` | UK spelling alias supported. |
| `data-card-border-width` | `0` | `0`, `1`, `2`, `3`, `4`, `6` | Sets card border thickness in pixels for minimal to bold frame emphasis. |
| `data-description-max-lines` | `none` | `2`, `3`, `4`, `5`, `none` | Clamps description copy to consistent heights, reducing uneven card heights in mixed content sets. |
| `data-description-style` | `body` | `body`, `headline`, `eyebrow`, `muted` | Applies quick text hierarchy presets for standard body copy, stronger headline look, uppercase eyebrow, or subdued supporting tone. |
| `data-image-overlay` | `none` | `none`, `light`, `medium`, `strong`, `brand-tint` | Adds a tint layer over images to improve text contrast and unify visual tone across mixed imagery. |
| `data-image-overlay-color` | `dark` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Controls the tint color used by image overlay modes for campaign color harmonization. |
| `data-image-overlay-colour` | same as above | alias of `data-image-overlay-color` | UK spelling alias supported. |
| `data-grid-max-width` | `none` | `none`, `1200`, `1400`, `1600`, `1800` | Caps overall grid width to maintain consistent measure on ultra-wide displays and preserve composition balance. |
| `data-mobile-layout` | `stack` | `stack`, `carousel`, `snap-scroll` | Defines small-screen behavior: classic vertical stack, horizontal carousel lane, or snap-scroll lane for guided swipe navigation. |
| `data-background-color` | `transparent` | `transparent`, `light`, `neutral`, `dark`, `brand`, `accent`, `white`, `black`, `#RGB`, `#RRGGBB`, `rgb(...)`, `rgba(...)` | Sets the full block band background behind the card grid using token names or custom color values. |
| `data-background-colour` | same as above | alias of `data-background-color` | UK spelling alias supported. |
| `data-full-width` | `false` | `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` | Removes the block corner radius to create a full-bleed section band treatment. |

## Behavior Patterns

- The first card image is eager-loaded for faster LCP.
- Remaining card images are lazy-loaded.
- Unsafe URLs are blocked and CTA is rendered disabled.
- If image data is missing, the block logs a `promotional-hero:` warning and continues safely.

## Accessibility

- CTA remains a semantic `<a>` for navigation behavior.
- Focus-visible outline is applied to keyboard navigation.
- Minimum target size is preserved via button sizing.
- The block respects inherited typography and color system tokens.

## Troubleshooting

- **Image not appearing**: ensure column 1 resolves to a valid image source.
- **CTA disabled**: verify URL uses `http://`, `https://`, or a valid relative path.
- **Metadata not applying**: verify Section Metadata is directly above the block.
- **Unexpected layout**: check for invalid metadata values; invalid values fall back to defaults.
- **Need transparent CTA with motion only**: use `data-button-style=outline`, `data-button-color=white`, `data-button-text-color=white`, and `data-button-hover-style=lift-only`.
