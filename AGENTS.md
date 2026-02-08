# Adobe Commerce Storefront Block Creation Rules (Codex)

Apply these rules only for **block creation tasks** (new block scaffolding, initial DA.live config, and first-pass README/docs), typically involving:
- `blocks/<new-block>/<new-block>.js`
- `blocks/<new-block>/<new-block>.css`
- `blocks/<new-block>/README.md`
- `blocks/<new-block>/_<new-block>.json`

Do **not** treat this file as mandatory for unrelated maintenance or small styling fixes in existing blocks unless explicitly requested.

Use the official Adobe Commerce Storefront docs as the source of truth:
- https://experienceleague.adobe.com/developer/commerce/storefront/get-started/

## Block Structure

Every block should include:
- `block-name.js`
- `block-name.css`
- `README.md`
- `_block-name.json` (DA.live configuration)

## DA.live Section Metadata Integration

### Double-prefix pattern

DA.live section metadata may appear with double data prefixing. Prefer robust reads:

```js
// preferred merge pattern
const section = block.closest('.section');

const config = {
  align: block.dataset.align || section?.dataset.dataAlign || 'right',
  size: block.dataset.size || section?.dataset.dataSize || 'medium',
  intensity: block.dataset.gradientIntensity
    || section?.dataset.dataGradientIntensity
    || section?.dataset.dataGradientIntesity
    || 'medium',
};

Object.entries(config).forEach(([key, value]) => {
  block.dataset[key] = value;
});
```

### Normalization

Validate author-provided options and fall back safely:

```js
function normalizeAlign(value, fallback = 'right') {
  const val = (value || '').toLowerCase();
  return ['left', 'center', 'right'].includes(val) ? val : fallback;
}
```

## CSS Rules

### Variant handling

Use data attributes, not ad-hoc variant classes:

```css
.hero-cta[data-align='center'] .hero-content { text-align: center; }
```

### Design tokens

Prefer design tokens/custom properties over hardcoded values.

### Specificity ordering

Order selectors low-to-high specificity to satisfy stylelint and improve maintainability.

### Color notation

Prefer modern notation:

```css
background: rgb(0 0 0 / 55%);
```

### Additional CSS conventions

- Use block-scoped class names.
- Avoid `!important` unless absolutely required and documented.
- Always provide visible `:focus-visible` styles.
- Prefer concise shorthand where valid.

## JavaScript Rules

### Architecture

- Single default export: `export default function decorate(block) {}`.
- Keep state local to block scope; avoid global state on `window`.
- Scope queries to `block` when possible.

### Image optimization

Use `createOptimizedPicture` with appropriate eager/lazy strategy (eager for LCP/hero, lazy elsewhere).

### Accessibility

- Keyboard accessibility for interactive elements.
- Correct ARIA/semantic usage.
- Respect `prefers-reduced-motion`.
- Maintain color contrast.

### Loading states

Use explicit loading states (`data-loading`) and clear them on completion with safe fallback timeout.

### Safety

- Do not inject unsanitized author/user content with `innerHTML`.
- Validate `href/src`; disallow unsafe protocols (`javascript:` etc.).
- For `target="_blank"`, include `rel="noopener noreferrer"`.

### Resilience

- Graceful degradation and safe defaults.
- Log actionable warnings with block prefix (e.g. `hero-cta: ...`).

## Performance

- Progressive enhancement first.
- Prefer plain JS unless complex state warrants Preact/HTM.
- Minimize layout thrash (batch reads/writes).
- Optimize for Core Web Vitals.

## README Requirements

Block README files should include:
1. Overview
2. DA.live integration (table/authoring structure)
3. Configuration options
4. Behavior patterns
5. Accessibility
6. Troubleshooting

Include section metadata placement guidance (immediately above block).

### README Style Preferences

- Keep docs concise but context-rich: short intro, then actionable tables.
- Use clear tables for both:
  - DA.live Model Options
  - Section Metadata Reference
- Each table row should include:
  - key/field
  - default
  - possible values
  - effect (what changes visually/behaviorally)
- Effect descriptions should be plain-language, specific, and outcome-focused (not vague labels).
- Document supported aliases explicitly (for example `color/colour`) when implemented.
- If new metadata options are introduced in code, update README in the same change.

## Linting Standards

All changes must pass:
- ESLint (JS)
- Stylelint (CSS)

Typical commands:

```bash
npm run lint
npm run lint:js
npm run lint:css
```

Follow project lint style (line length, quotes, trailing commas, etc.).

## HTML & Semantics

- Use semantic elements (`button` for actions, `a` for navigation).
- Keep heading hierarchy valid.
- Use meaningful `alt` text; empty alt only for decorative images.

## Before Shipping Checklist

1. Run lint and fix issues.
2. Verify DA.live metadata behavior (including double-prefix reads).
3. Verify acceptable no-JS behavior for critical content/links.
4. Verify mobile and desktop layout/tap targets (44x44 min tap target).
