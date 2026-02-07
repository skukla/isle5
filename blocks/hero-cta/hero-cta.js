import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_INTERVAL = 5000;

/**
 * Calculate relative luminance for WCAG contrast ratio
 * @param {string} hex - Hex color (#RRGGBB)
 * @returns {number} Relative luminance (0-1)
 */
function getLuminance(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  // eslint-disable-next-line no-bitwise
  const r = ((rgb >> 16) & 0xff) / 255;
  // eslint-disable-next-line no-bitwise
  const g = ((rgb >> 8) & 0xff) / 255;
  // eslint-disable-next-line no-bitwise
  const b = (rgb & 0xff) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) => (
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Validate WCAG 2.1 AA contrast ratio
 * @param {string} bgColor - Background hex color
 * @param {string} textColor - Text hex color (default white)
 */
function validateContrast(bgColor, textColor = '#ffffff') {
  if (!bgColor.startsWith('#')) return;

  const bgLum = getLuminance(bgColor);
  const textLum = getLuminance(textColor);
  const ratio = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);

  if (ratio < 4.5) {
    console.warn(
      `hero-cta: Low contrast ratio ${ratio.toFixed(2)}:1 for ${bgColor}. `
      + 'WCAG AA requires 4.5:1 minimum. Consider adjusting color.',
    );
  }
}

function normalizeAlign(value, fallback) {
  const val = (value || '').toLowerCase();
  if (['left', 'center', 'right'].includes(val)) return val;
  return fallback;
}

function normalizeVertical(value, fallback) {
  const val = (value || '').toLowerCase();
  if (['top', 'middle', 'bottom'].includes(val)) return val;
  return fallback;
}

function normalizeSize(value, fallback) {
  const val = (value || '').toLowerCase();
  if (['short', 'tall'].includes(val)) return val;
  return fallback;
}

function normalizeGradientIntensity(value, fallback) {
  const val = (value || '').toLowerCase();
  if (['light', 'medium', 'strong'].includes(val)) return val;
  return fallback;
}

function normalizeButtonStyle(value, fallback) {
  const val = (value || '').toLowerCase();
  if (['default', 'pill', 'sharp'].includes(val)) return val;
  return fallback;
}

function normalizeButtonWidth(value, fallback) {
  const val = (value || '').toLowerCase();
  if (['narrow', 'medium', 'wide'].includes(val)) return val;
  return fallback;
}

function normalizeSidebar(value) {
  const val = (value || '').toLowerCase();
  if (['left', 'right'].includes(val)) return val;
  if (val === 'true') return 'left';
  return '';
}

/**
 * Separate nav rows from slide rows.
 * Nav rows have "nav" as the text in Column 1.
 */
function separateNavRows(rows) {
  const slideRows = [];
  const navRows = [];

  rows.forEach((row) => {
    const firstCell = row.children[0];
    const marker = (firstCell?.textContent || '').trim().toLowerCase();
    if (marker === 'nav') {
      navRows.push(row);
    } else {
      slideRows.push(row);
    }
  });

  return { slideRows, navRows };
}

/**
 * Build sidebar navigation from nav rows.
 * Column 2: Link text or Text|URL format, or existing <a> tags
 */
function buildSidebar(navRows) {
  const nav = document.createElement('nav');
  nav.className = 'hero-cta-sidebar';
  nav.setAttribute('aria-label', 'Hero navigation');

  const list = document.createElement('ul');
  list.className = 'hero-cta-sidebar-list';

  navRows.forEach((row) => {
    const linkCell = row.children[1];
    if (!linkCell) return;

    const li = document.createElement('li');
    li.className = 'hero-cta-sidebar-item';

    // Check for existing <a> tag
    const existingLink = linkCell.querySelector('a');
    if (existingLink) {
      existingLink.className = 'hero-cta-sidebar-link';
      li.append(existingLink);
    } else {
      // Parse Text|URL format
      const text = linkCell.textContent.trim();
      if (!text) return;

      const parts = text.split('|');
      const linkText = parts[0].trim();
      const linkUrl = parts[1]?.trim() || '#';

      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = linkText;
      link.className = 'hero-cta-sidebar-link';

      if (linkUrl === '#') {
        link.setAttribute('aria-disabled', 'true');
      }

      li.append(link);
    }

    list.append(li);
  });

  nav.append(list);
  return nav;
}

function extractInterval(rows) {
  const lastRow = rows[rows.length - 1];
  if (!lastRow) return { interval: DEFAULT_INTERVAL, rows };

  const cells = [...lastRow.children];
  if (cells.length === 1) {
    const raw = cells[0].textContent.trim();
    const ms = parseInt(raw, 10);
    if (!Number.isNaN(ms) && ms > 0) {
      lastRow.remove();
      return { interval: ms, rows: rows.slice(0, -1) };
    }
  }

  return { interval: DEFAULT_INTERVAL, rows };
}

function extractImageSource(cell) {
  if (!cell) {
    console.warn('hero-cta: No image cell found');
    return null;
  }

  // Check for existing picture element
  const picture = cell.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img && img.src && !img.src.includes('error')) {
      return { src: img.src, alt: img.alt || '' };
    }
  }

  // Check for img element
  const img = cell.querySelector('img');
  if (img && img.src && !img.src.includes('error')) {
    return { src: img.src, alt: img.alt || '' };
  }

  // Check for link to image (a[href])
  const link = cell.querySelector('a');
  if (link && link.href) {
    const { href } = link;
    // Check if link points to an image file
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(href)) {
      return { src: href, alt: link.textContent || '' };
    }
  }

  // Check for plain text URL
  const text = cell.textContent.trim();
  if (text && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(text)) {
    return { src: text, alt: '' };
  }

  console.warn('hero-cta: No valid image source found in cell:', cell.innerHTML);
  return null;
}

function buildSlide(row, isFirstSlide = false, config = {}) {
  const cells = [...row.children];
  const contentCell = cells[1];
  const categoryCell = cells[2];

  const slide = document.createElement('div');
  slide.className = 'hero-cta-slide';

  // Column 1: Image (flexible format support)
  const imageData = extractImageSource(cells[0]);
  if (imageData) {
    // Optimized breakpoints based on configured max width
    const maxWidth = config.imageMaxWidth || 2400;
    const breakpoints = [
      { media: '(min-width: 1920px)', width: Math.min(maxWidth, 2400).toString() },
      { media: '(min-width: 1200px)', width: Math.min(maxWidth, 2000).toString() },
      { media: '(min-width: 768px)', width: Math.min(maxWidth, 1500).toString() },
      { width: '1200' },
    ];

    const optimized = createOptimizedPicture(
      imageData.src,
      imageData.alt,
      isFirstSlide, // Eager load first slide for LCP optimization
      breakpoints,
    );
    const media = document.createElement('div');
    media.className = 'hero-cta-media';
    media.append(optimized);
    slide.append(media);
  }

  // Column 2: Pure text content (no structure required)
  const content = document.createElement('div');
  content.className = 'hero-cta-content';

  if (contentCell) {
    while (contentCell.firstElementChild) content.append(contentCell.firstElementChild);
  }

  // Column 3: Extract color variants (one per button)
  const colorVariants = [];
  if (categoryCell) {
    const categoryParagraphs = [...categoryCell.querySelectorAll('p')];
    categoryParagraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        colorVariants.push(text);
      }
    });
  }

  // Auto-convert simple text to CTA buttons with color variants from Column 3
  const paragraphs = [...content.querySelectorAll('p')];
  const buttonGroups = [];

  paragraphs.forEach((p, index) => {
    const colorVariant = colorVariants[index] || 'transparent'; // Get color from Column 3

    // If paragraph already has button links, style it
    if (p.querySelector('a.button')) {
      buttonGroups.push({ button: p });
      return;
    }

    // Check if paragraph has a regular link
    const existingLink = p.querySelector('a');
    if (existingLink && !existingLink.classList.contains('button')) {
      // Accessibility: ARIA attributes
      const linkText = existingLink.textContent.trim();
      existingLink.setAttribute('aria-label', linkText);
      if (existingLink.href === '#' || !existingLink.href) {
        existingLink.setAttribute('role', 'button');
        existingLink.setAttribute('aria-disabled', 'true');
        existingLink.setAttribute('tabindex', '-1');
      }

      if (colorVariant.startsWith('#')) {
        // Custom hex color - validate contrast
        validateContrast(colorVariant);
        existingLink.className = 'button button--custom';
        existingLink.style.backgroundColor = colorVariant;
        existingLink.style.borderColor = colorVariant;
        existingLink.style.color = 'var(--color-neutral-50)';
      } else {
        // Predefined variant
        existingLink.classList.add('button', `button--${colorVariant}`);
      }

      buttonGroups.push({ button: p });
      return;
    }

    // Convert simple text to a button (format: "Text" or "Text|URL")
    const text = p.textContent.trim();
    if (text && !p.querySelector('a')) {
      const parts = text.split('|');
      const buttonText = parts[0].trim();
      const buttonUrl = parts[1]?.trim() || '#';

      const button = document.createElement('a');
      button.href = buttonUrl;
      button.textContent = buttonText;

      // Accessibility: ARIA attributes
      button.setAttribute('aria-label', buttonText);
      if (buttonUrl === '#') {
        button.setAttribute('role', 'button');
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('tabindex', '-1');
      }

      // Apply color variant from Column 3
      if (colorVariant.startsWith('#')) {
        // Custom hex color - validate contrast
        validateContrast(colorVariant);
        button.className = 'button button--custom';
        button.style.backgroundColor = colorVariant;
        button.style.borderColor = colorVariant;
        button.style.color = 'var(--color-neutral-50)';
      } else {
        // Predefined variant (white, transparent, brand, accent, dark, outline-dark)
        button.className = `button button--${colorVariant}`;
      }

      p.textContent = '';
      p.appendChild(button);
      buttonGroups.push({ button: p });
    }
  });

  // Build button groups
  if (buttonGroups.length > 0) {
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'hero-cta-actions';

    buttonGroups.forEach(({ button }) => {
      actionsWrapper.appendChild(button);
    });

    content.appendChild(actionsWrapper);
  }

  const overlay = document.createElement('div');
  overlay.className = 'hero-cta-overlay';
  overlay.append(content);

  slide.append(overlay);
  return slide;
}

function startRotation(slides, interval) {
  if (slides.length <= 1) return;

  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    slides[0].classList.add('is-active');
    return;
  }

  let index = 0;
  slides[index].classList.add('is-active');

  setInterval(() => {
    slides[index].classList.remove('is-active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('is-active');
  }, interval);
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Show loading state
  block.dataset.loading = 'true';

  // Get section element for metadata fallback
  const section = block.closest('.section');

  // Read configuration from block data attributes or section metadata
  // Note: DA.live Section Metadata adds double prefix (data-data-*)
  const config = {
    align: block.dataset.align
      || section?.dataset.dataAlign
      || section?.dataset.dataAllign // Handle typo in DA.live
      || 'right',
    vertical: block.dataset.vertical
      || section?.dataset.dataVertical
      || 'bottom',
    size: block.dataset.size
      || section?.dataset.dataSize
      || 'tall',
    gradientIntensity: block.dataset.gradientIntensity
      || section?.dataset.dataGradientIntensity
      || section?.dataset.dataGradientIntesity // Handle typo in DA.live
      || 'medium',
    buttonStyle: block.dataset.buttonStyle
      || section?.dataset.dataButtonStyle
      || 'default',
    imageQuality: block.dataset.imageQuality
      || section?.dataset.dataImageQuality
      || 'medium',
    imageMaxWidth: parseInt(
      block.dataset.imageMaxWidth
      || section?.dataset.dataImageMaxWidth
      || '2400',
      10,
    ),
    buttonWidth: block.dataset.buttonWidth
      || section?.dataset.dataButtonWidth
      || 'medium',
    sidebar: block.dataset.sidebar
      || section?.dataset.dataSidebar
      || '',
  };

  const { interval, rows: allRows } = extractInterval(rows);

  // Separate nav rows (Column 1 = "nav") from slide rows
  const { slideRows, navRows } = separateNavRows(allRows);

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-cta-slides';

  slideRows.forEach((row, index) => {
    wrapper.append(buildSlide(row, index === 0, config));
  });

  // Build sidebar if enabled and nav rows exist
  const sidebarPosition = normalizeSidebar(config.sidebar);
  if (sidebarPosition && navRows.length > 0) {
    const sidebar = buildSidebar(navRows);
    const layout = document.createElement('div');
    layout.className = 'hero-cta-layout';

    if (sidebarPosition === 'left') {
      layout.append(sidebar, wrapper);
    } else {
      layout.append(wrapper, sidebar);
    }

    block.replaceChildren(layout);
  } else {
    block.replaceChildren(wrapper);
  }

  // Apply normalized configuration to block
  const align = normalizeAlign(config.align, 'right');
  const vertical = normalizeVertical(config.vertical, 'bottom');
  const size = normalizeSize(config.size, 'tall');
  const gradientIntensity = normalizeGradientIntensity(
    config.gradientIntensity,
    'medium',
  );
  const buttonStyle = normalizeButtonStyle(config.buttonStyle, 'default');
  const buttonWidth = normalizeButtonWidth(config.buttonWidth, 'medium');

  block.dataset.align = align;
  block.dataset.vertical = vertical;
  block.dataset.size = size;
  block.dataset.interval = interval;
  block.dataset.gradientIntensity = gradientIntensity;
  block.dataset.buttonStyle = buttonStyle;
  block.dataset.buttonWidth = buttonWidth;

  if (sidebarPosition) {
    block.dataset.sidebar = sidebarPosition;
  }

  const slides = [...block.querySelectorAll('.hero-cta-slide')];
  if (slides.length) slides[0].classList.add('is-active');
  startRotation(slides, interval);

  // Remove loading state when first image loads
  const firstImage = block.querySelector('.hero-cta-media img');
  if (firstImage) {
    if (firstImage.complete) {
      delete block.dataset.loading;
    } else {
      firstImage.addEventListener('load', () => {
        delete block.dataset.loading;
      });
      // Fallback: remove loading after 3 seconds
      setTimeout(() => {
        delete block.dataset.loading;
      }, 3000);
    }
  } else {
    // No images, remove loading immediately
    delete block.dataset.loading;
  }
}
