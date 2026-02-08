import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULTS = {
  align: 'center',
  columns: '2',
  cardWidth: 'medium',
  cardHeight: 'auto',
  imageRatio: 'portrait',
  imageFit: 'cover',
  gap: 'medium',
  density: 'comfortable',
  contentStyle: 'floating',
  contentAlign: 'center',
  panelWidth: 'standard',
  panelOffset: 'medium',
  contentBgColor: 'white',
  contentTextColor: 'dark',
  contentBorderStyle: 'none',
  contentBorderColor: '',
  contentShadow: 'soft',
  contentRadius: 'default',
  cardBorderStyle: 'none',
  cardBorderColor: '',
  cardBorderWidth: '0',
  buttonStyle: 'pill',
  buttonWidth: 'auto',
  buttonTextTransform: 'none',
  buttonHoverStyle: 'fill',
  buttonBorderWidth: '3',
  buttonShadow: 'none',
  buttonFontSize: 'md',
  buttonFontWeight: '600',
  buttonColor: 'brand',
  buttonTextColor: 'white',
  cardRadius: 'default',
  imageShadow: 'soft',
  imagePosition: 'center',
  hoverEffect: 'subtle',
  imageOverlay: 'none',
  imageOverlayColor: 'dark',
  gridMaxWidth: 'none',
  mobileLayout: 'stack',
  descriptionMaxLines: 'none',
  descriptionStyle: 'body',
  backgroundColor: 'transparent',
  fullWidth: false,
  fallbackButtonLabel: 'Shop now',
};

function getConfigValue(blockValue, sectionData, keys, fallback) {
  if (blockValue) return blockValue;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (sectionData?.[key]) return sectionData[key];
  }
  return fallback;
}

function normalizeToken(value, allowed, fallback) {
  const val = (value || '').toString().trim().toLowerCase();
  return allowed.includes(val) ? val : fallback;
}

function normalizeColor(value, fallback) {
  const raw = (value || '').toString().trim();
  if (!raw) return fallback;
  const val = raw.toLowerCase();
  const named = ['transparent', 'light', 'neutral', 'dark', 'brand', 'accent', 'white', 'black'];
  if (named.includes(val)) return val;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;
  if (/^rgba?\(/i.test(raw)) return raw;
  return fallback;
}

function normalizeBoolean(value, fallback = false) {
  const val = (value || '').toString().trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(val)) return true;
  if (['false', '0', 'no', 'off'].includes(val)) return false;
  return fallback;
}

function normalizePositiveInt(value, fallback, allowed = []) {
  const parsed = Number.parseInt((value || '').toString().trim(), 10);
  if (Number.isNaN(parsed)) return fallback;
  if (allowed.length && !allowed.includes(parsed)) return fallback;
  return parsed.toString();
}

function isSafeUrl(url) {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function extractImageSource(cell) {
  if (!cell) return null;

  const pictureImg = cell.querySelector('picture img');
  if (pictureImg?.src) {
    return { src: pictureImg.src, alt: pictureImg.alt || '' };
  }

  const img = cell.querySelector('img');
  if (img?.src) {
    return { src: img.src, alt: img.alt || '' };
  }

  const link = cell.querySelector('a[href]');
  const linkedSrc = link?.getAttribute('href')?.trim();
  if (linkedSrc && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(linkedSrc)) {
    return { src: linkedSrc, alt: link.textContent.trim() || '' };
  }

  const rawText = cell.textContent?.trim();
  if (rawText && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(rawText)) {
    return { src: rawText, alt: '' };
  }

  return null;
}

function createDescription(cell, config = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'promotional-hero-description';
  if (config.descriptionStyle) wrapper.dataset.descriptionStyle = config.descriptionStyle;
  if (config.descriptionMaxLines && config.descriptionMaxLines !== 'none') {
    wrapper.style.setProperty('--promotional-hero-description-max-lines', config.descriptionMaxLines);
  }

  if (!cell || !cell.textContent.trim()) return wrapper;

  const paragraphs = [...cell.querySelectorAll('p')];
  if (paragraphs.length) {
    paragraphs.forEach((paragraph) => {
      const line = document.createElement('p');
      line.textContent = paragraph.textContent.trim();
      if (line.textContent) wrapper.append(line);
    });
    return wrapper;
  }

  const text = cell.textContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (text.length) {
    text.forEach((lineText) => {
      const line = document.createElement('p');
      line.textContent = lineText;
      wrapper.append(line);
    });
  }

  return wrapper;
}

function parseButton(cell, fallbackLabel) {
  const fallback = { label: fallbackLabel, href: '#', target: '_self' };
  if (!cell) return fallback;

  const authoredLink = cell.querySelector('a');
  if (authoredLink) {
    const label = authoredLink.textContent.trim() || fallbackLabel;
    const href = authoredLink.getAttribute('href')?.trim() || '#';
    const target = authoredLink.getAttribute('target')?.trim() || '_self';
    return { label, href, target };
  }

  const raw = cell.textContent.trim();
  if (!raw) return fallback;

  const [labelPart, hrefPart] = raw.split('|').map((part) => part?.trim());
  return {
    label: labelPart || fallbackLabel,
    href: hrefPart || '#',
    target: '_self',
  };
}

function resolveColorToken(value, map) {
  const key = (value || '').toLowerCase();
  return map[key] || value;
}

function resolveButtonHoverColor(colorValue, resolvedBaseColor) {
  const key = (colorValue || '').toLowerCase();
  const tokenMap = {
    transparent: 'var(--color-neutral-50)',
    light: 'var(--color-neutral-200)',
    neutral: 'var(--color-neutral-300)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-600)',
    accent: 'var(--color-informational-800)',
    white: 'var(--color-neutral-100)',
    black: 'var(--color-neutral-900)',
  };

  if (tokenMap[key]) return tokenMap[key];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorValue) || /^rgba?\(/i.test(colorValue)) {
    return `color-mix(in srgb, ${resolvedBaseColor} 92%, black)`;
  }
  return resolvedBaseColor;
}

function buildCard(row, index, config) {
  const cells = [...row.children];
  const imageCell = cells[0];
  const descriptionCell = cells[1];
  const buttonCell = cells[2];

  const card = document.createElement('article');
  card.className = 'promotional-hero-card';

  const imageData = extractImageSource(imageCell);
  if (imageData?.src) {
    const media = document.createElement('div');
    media.className = 'promotional-hero-image';
    const picture = createOptimizedPicture(
      imageData.src,
      imageData.alt,
      index === 0,
      [
        { media: '(min-width: 1200px)', width: '1200' },
        { media: '(min-width: 768px)', width: '900' },
        { width: '700' },
      ],
    );
    media.append(picture);
    card.append(media);
  } else {
    console.warn('promotional-hero: row is missing a valid image source.');
  }

  const content = document.createElement('div');
  content.className = 'promotional-hero-whitebox';

  const description = createDescription(descriptionCell, config);
  if (description.textContent.trim()) {
    content.append(description);
  }

  const buttonData = parseButton(buttonCell, DEFAULTS.fallbackButtonLabel);
  const button = document.createElement('a');
  button.className = 'promotional-hero-button';
  button.textContent = buttonData.label;

  if (isSafeUrl(buttonData.href)) {
    button.href = buttonData.href;
    button.target = buttonData.target;
    if (button.target === '_blank') {
      button.rel = 'noopener noreferrer';
    }
  } else {
    button.href = '#';
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('tabindex', '-1');
    if (buttonData.href && buttonData.href !== '#') {
      console.warn(`promotional-hero: blocked unsafe CTA URL "${buttonData.href}".`);
    }
  }

  content.append(button);
  card.append(content);

  return card;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  block.dataset.loading = 'true';

  const section = block.closest('.section');
  const sectionData = section?.dataset || {};
  const hasButtonWidthOverride = Boolean(
    block.dataset.buttonWidth?.trim()
    || sectionData.dataButtonWidth?.trim()
    || sectionData.dataDataButtonWidth?.trim(),
  );

  const raw = {
    align: getConfigValue(block.dataset.align, sectionData, ['dataAlign', 'dataDataAlign'], DEFAULTS.align),
    columns: getConfigValue(block.dataset.columns, sectionData, ['dataColumns', 'dataDataColumns'], DEFAULTS.columns),
    cardWidth: getConfigValue(block.dataset.cardWidth, sectionData, ['dataCardWidth', 'dataDataCardWidth'], DEFAULTS.cardWidth),
    cardHeight: getConfigValue(
      block.dataset.cardHeight,
      sectionData,
      ['dataCardHeight', 'dataDataCardHeight'],
      DEFAULTS.cardHeight,
    ),
    imageRatio: getConfigValue(block.dataset.imageRatio, sectionData, ['dataImageRatio', 'dataDataImageRatio'], DEFAULTS.imageRatio),
    imageFit: getConfigValue(block.dataset.imageFit, sectionData, ['dataImageFit', 'dataDataImageFit'], DEFAULTS.imageFit),
    gap: getConfigValue(block.dataset.gap, sectionData, ['dataGap', 'dataDataGap'], DEFAULTS.gap),
    density: getConfigValue(block.dataset.density, sectionData, ['dataDensity', 'dataDataDensity'], DEFAULTS.density),
    contentStyle: getConfigValue(block.dataset.contentStyle, sectionData, ['dataContentStyle', 'dataDataContentStyle'], DEFAULTS.contentStyle),
    contentAlign: getConfigValue(block.dataset.contentAlign, sectionData, ['dataContentAlign', 'dataDataContentAlign'], DEFAULTS.contentAlign),
    panelWidth: getConfigValue(block.dataset.panelWidth, sectionData, ['dataPanelWidth', 'dataDataPanelWidth'], DEFAULTS.panelWidth),
    panelOffset: getConfigValue(block.dataset.panelOffset, sectionData, ['dataPanelOffset', 'dataDataPanelOffset'], DEFAULTS.panelOffset),
    contentBgColor: getConfigValue(
      block.dataset.contentBgColor,
      sectionData,
      ['dataContentBgColor', 'dataDataContentBgColor', 'dataContentBgColour', 'dataDataContentBgColour'],
      DEFAULTS.contentBgColor,
    ),
    contentTextColor: getConfigValue(
      block.dataset.contentTextColor,
      sectionData,
      ['dataContentTextColor', 'dataDataContentTextColor', 'dataContentTextColour', 'dataDataContentTextColour'],
      DEFAULTS.contentTextColor,
    ),
    contentBorderStyle: getConfigValue(
      block.dataset.contentBorderStyle,
      sectionData,
      ['dataContentBorderStyle', 'dataDataContentBorderStyle'],
      DEFAULTS.contentBorderStyle,
    ),
    contentBorderColor: getConfigValue(
      block.dataset.contentBorderColor,
      sectionData,
      ['dataContentBorderColor', 'dataDataContentBorderColor', 'dataContentBorderColour', 'dataDataContentBorderColour'],
      DEFAULTS.contentBorderColor,
    ),
    contentShadow: getConfigValue(
      block.dataset.contentShadow,
      sectionData,
      ['dataContentShadow', 'dataDataContentShadow'],
      DEFAULTS.contentShadow,
    ),
    contentRadius: getConfigValue(
      block.dataset.contentRadius,
      sectionData,
      ['dataContentRadius', 'dataDataContentRadius'],
      DEFAULTS.contentRadius,
    ),
    cardBorderStyle: getConfigValue(
      block.dataset.cardBorderStyle,
      sectionData,
      ['dataCardBorderStyle', 'dataDataCardBorderStyle'],
      DEFAULTS.cardBorderStyle,
    ),
    cardBorderColor: getConfigValue(
      block.dataset.cardBorderColor,
      sectionData,
      ['dataCardBorderColor', 'dataDataCardBorderColor', 'dataCardBorderColour', 'dataDataCardBorderColour'],
      DEFAULTS.cardBorderColor,
    ),
    cardBorderWidth: getConfigValue(
      block.dataset.cardBorderWidth,
      sectionData,
      ['dataCardBorderWidth', 'dataDataCardBorderWidth'],
      DEFAULTS.cardBorderWidth,
    ),
    buttonStyle: getConfigValue(block.dataset.buttonStyle, sectionData, ['dataButtonStyle', 'dataDataButtonStyle'], DEFAULTS.buttonStyle),
    buttonWidth: getConfigValue(block.dataset.buttonWidth, sectionData, ['dataButtonWidth', 'dataDataButtonWidth'], DEFAULTS.buttonWidth),
    buttonTextTransform: getConfigValue(
      block.dataset.buttonTextTransform,
      sectionData,
      ['dataButtonTextTransform', 'dataDataButtonTextTransform'],
      DEFAULTS.buttonTextTransform,
    ),
    buttonHoverStyle: getConfigValue(
      block.dataset.buttonHoverStyle,
      sectionData,
      ['dataButtonHoverStyle', 'dataDataButtonHoverStyle'],
      DEFAULTS.buttonHoverStyle,
    ),
    buttonBorderWidth: getConfigValue(
      block.dataset.buttonBorderWidth,
      sectionData,
      ['dataButtonBorderWidth', 'dataDataButtonBorderWidth'],
      DEFAULTS.buttonBorderWidth,
    ),
    buttonShadow: getConfigValue(
      block.dataset.buttonShadow,
      sectionData,
      ['dataButtonShadow', 'dataDataButtonShadow'],
      DEFAULTS.buttonShadow,
    ),
    buttonFontSize: getConfigValue(
      block.dataset.buttonFontSize,
      sectionData,
      ['dataButtonFontSize', 'dataDataButtonFontSize'],
      DEFAULTS.buttonFontSize,
    ),
    buttonFontWeight: getConfigValue(
      block.dataset.buttonFontWeight,
      sectionData,
      ['dataButtonFontWeight', 'dataDataButtonFontWeight'],
      DEFAULTS.buttonFontWeight,
    ),
    buttonColor: getConfigValue(
      block.dataset.buttonColor,
      sectionData,
      ['dataButtonColor', 'dataDataButtonColor', 'dataButtonColour', 'dataDataButtonColour'],
      DEFAULTS.buttonColor,
    ),
    buttonTextColor: getConfigValue(
      block.dataset.buttonTextColor,
      sectionData,
      ['dataButtonTextColor', 'dataDataButtonTextColor', 'dataButtonTextColour', 'dataDataButtonTextColour'],
      DEFAULTS.buttonTextColor,
    ),
    cardRadius: getConfigValue(block.dataset.cardRadius, sectionData, ['dataCardRadius', 'dataDataCardRadius'], DEFAULTS.cardRadius),
    imageShadow: getConfigValue(block.dataset.imageShadow, sectionData, ['dataImageShadow', 'dataDataImageShadow'], DEFAULTS.imageShadow),
    imagePosition: getConfigValue(block.dataset.imagePosition, sectionData, ['dataImagePosition', 'dataDataImagePosition'], DEFAULTS.imagePosition),
    hoverEffect: getConfigValue(block.dataset.hoverEffect, sectionData, ['dataHoverEffect', 'dataDataHoverEffect'], DEFAULTS.hoverEffect),
    imageOverlay: getConfigValue(block.dataset.imageOverlay, sectionData, ['dataImageOverlay', 'dataDataImageOverlay'], DEFAULTS.imageOverlay),
    imageOverlayColor: getConfigValue(
      block.dataset.imageOverlayColor,
      sectionData,
      ['dataImageOverlayColor', 'dataDataImageOverlayColor', 'dataImageOverlayColour', 'dataDataImageOverlayColour'],
      DEFAULTS.imageOverlayColor,
    ),
    gridMaxWidth: getConfigValue(
      block.dataset.gridMaxWidth,
      sectionData,
      ['dataGridMaxWidth', 'dataDataGridMaxWidth'],
      DEFAULTS.gridMaxWidth,
    ),
    mobileLayout: getConfigValue(block.dataset.mobileLayout, sectionData, ['dataMobileLayout', 'dataDataMobileLayout'], DEFAULTS.mobileLayout),
    descriptionMaxLines: getConfigValue(
      block.dataset.descriptionMaxLines,
      sectionData,
      ['dataDescriptionMaxLines', 'dataDataDescriptionMaxLines'],
      DEFAULTS.descriptionMaxLines,
    ),
    descriptionStyle: getConfigValue(
      block.dataset.descriptionStyle,
      sectionData,
      ['dataDescriptionStyle', 'dataDataDescriptionStyle'],
      DEFAULTS.descriptionStyle,
    ),
    backgroundColor: getConfigValue(
      block.dataset.backgroundColor,
      sectionData,
      ['dataBackgroundColor', 'dataDataBackgroundColor', 'dataBackgroundColour', 'dataDataBackgroundColour'],
      DEFAULTS.backgroundColor,
    ),
    fullWidth: getConfigValue(block.dataset.fullWidth, sectionData, ['dataFullWidth', 'dataDataFullWidth'], ''),
  };

  const config = {
    align: normalizeToken(raw.align, ['left', 'center', 'right'], DEFAULTS.align),
    columns: normalizeToken(raw.columns, ['auto', '1', '2', '3'], DEFAULTS.columns),
    cardWidth: normalizeToken(raw.cardWidth, ['small', 'medium', 'large'], DEFAULTS.cardWidth),
    cardHeight: normalizeToken(raw.cardHeight, ['auto', 'short', 'medium', 'tall'], DEFAULTS.cardHeight),
    imageRatio: normalizeToken(raw.imageRatio, ['portrait', 'square', 'landscape'], DEFAULTS.imageRatio),
    imageFit: normalizeToken(raw.imageFit, ['cover', 'contain'], DEFAULTS.imageFit),
    gap: normalizeToken(raw.gap, ['small', 'medium', 'large'], DEFAULTS.gap),
    density: normalizeToken(raw.density, ['compact', 'comfortable', 'spacious'], DEFAULTS.density),
    contentStyle: normalizeToken(raw.contentStyle, ['floating', 'flush', 'inset'], DEFAULTS.contentStyle),
    contentAlign: normalizeToken(raw.contentAlign, ['left', 'center', 'right'], DEFAULTS.contentAlign),
    panelWidth: normalizeToken(raw.panelWidth, ['compact', 'standard', 'wide'], DEFAULTS.panelWidth),
    panelOffset: normalizeToken(raw.panelOffset, ['none', 'small', 'medium', 'large', 'xlarge'], DEFAULTS.panelOffset),
    contentBgColor: normalizeColor(raw.contentBgColor, DEFAULTS.contentBgColor),
    contentTextColor: normalizeColor(raw.contentTextColor, DEFAULTS.contentTextColor),
    contentBorderStyle: normalizeToken(raw.contentBorderStyle, ['none', 'subtle', 'strong', 'brand'], DEFAULTS.contentBorderStyle),
    contentBorderColor: normalizeColor(raw.contentBorderColor, DEFAULTS.contentBorderColor),
    contentShadow: normalizeToken(raw.contentShadow, ['none', 'soft', 'medium', 'strong'], DEFAULTS.contentShadow),
    contentRadius: normalizeToken(raw.contentRadius, ['sharp', 'soft', 'default', 'rounded-lg', 'pill'], DEFAULTS.contentRadius),
    cardBorderStyle: normalizeToken(raw.cardBorderStyle, ['none', 'subtle', 'strong', 'brand'], DEFAULTS.cardBorderStyle),
    cardBorderColor: normalizeColor(raw.cardBorderColor, DEFAULTS.cardBorderColor),
    cardBorderWidth: normalizePositiveInt(
      raw.cardBorderWidth,
      DEFAULTS.cardBorderWidth,
      [0, 1, 2, 3, 4, 6],
    ),
    buttonStyle: normalizeToken(
      raw.buttonStyle,
      [
        'default',
        'pill',
        'sharp',
        'soft',
        'rounded-lg',
        'outline',
        'ghost',
        'elevated',
        'minimal',
        'glass',
        'gradient',
        'link',
      ],
      DEFAULTS.buttonStyle,
    ),
    buttonWidth: normalizeToken(raw.buttonWidth, ['auto', 'narrow', 'medium', 'wide', 'fluid'], DEFAULTS.buttonWidth),
    buttonTextTransform: normalizeToken(raw.buttonTextTransform, ['none', 'uppercase', 'capitalize'], DEFAULTS.buttonTextTransform),
    buttonHoverStyle: normalizeToken(raw.buttonHoverStyle, ['fill', 'inverse', 'darken', 'lift', 'lift-only', 'none'], DEFAULTS.buttonHoverStyle),
    buttonBorderWidth: normalizePositiveInt(
      raw.buttonBorderWidth,
      DEFAULTS.buttonBorderWidth,
      [1, 2, 3, 4],
    ),
    buttonShadow: normalizeToken(raw.buttonShadow, ['none', 'soft', 'medium', 'strong'], DEFAULTS.buttonShadow),
    buttonFontSize: normalizeToken(raw.buttonFontSize, ['sm', 'md', 'lg'], DEFAULTS.buttonFontSize),
    buttonFontWeight: normalizeToken(raw.buttonFontWeight, ['400', '500', '600', '700'], DEFAULTS.buttonFontWeight),
    buttonColor: normalizeColor(raw.buttonColor, DEFAULTS.buttonColor),
    buttonTextColor: normalizeColor(raw.buttonTextColor, DEFAULTS.buttonTextColor),
    cardRadius: normalizeToken(raw.cardRadius, ['sharp', 'soft', 'default', 'rounded-lg'], DEFAULTS.cardRadius),
    imageShadow: normalizeToken(raw.imageShadow, ['none', 'soft', 'strong'], DEFAULTS.imageShadow),
    imagePosition: normalizeToken(raw.imagePosition, ['left', 'center', 'right', 'top', 'bottom'], DEFAULTS.imagePosition),
    hoverEffect: normalizeToken(raw.hoverEffect, ['none', 'subtle', 'lift'], DEFAULTS.hoverEffect),
    imageOverlay: normalizeToken(raw.imageOverlay, ['none', 'light', 'medium', 'strong', 'brand-tint'], DEFAULTS.imageOverlay),
    imageOverlayColor: normalizeColor(raw.imageOverlayColor, DEFAULTS.imageOverlayColor),
    gridMaxWidth: normalizeToken(raw.gridMaxWidth, ['none', '1200', '1400', '1600', '1800'], DEFAULTS.gridMaxWidth),
    mobileLayout: normalizeToken(raw.mobileLayout, ['stack', 'carousel', 'snap-scroll'], DEFAULTS.mobileLayout),
    descriptionMaxLines: normalizeToken(raw.descriptionMaxLines, ['2', '3', '4', '5', 'none'], DEFAULTS.descriptionMaxLines),
    descriptionStyle: normalizeToken(raw.descriptionStyle, ['body', 'headline', 'eyebrow', 'muted'], DEFAULTS.descriptionStyle),
    backgroundColor: normalizeColor(raw.backgroundColor, DEFAULTS.backgroundColor),
    fullWidth: normalizeBoolean(raw.fullWidth, DEFAULTS.fullWidth),
  };

  if (!hasButtonWidthOverride && config.imageRatio === 'landscape') {
    config.buttonWidth = 'medium';
  }

  block.dataset.align = config.align;
  block.dataset.columns = config.columns;
  block.dataset.cardWidth = config.cardWidth;
  block.dataset.cardHeight = config.cardHeight;
  block.dataset.imageRatio = config.imageRatio;
  block.dataset.imageFit = config.imageFit;
  block.dataset.gap = config.gap;
  block.dataset.density = config.density;
  block.dataset.contentStyle = config.contentStyle;
  block.dataset.contentAlign = config.contentAlign;
  block.dataset.panelWidth = config.panelWidth;
  block.dataset.panelOffset = config.panelOffset;
  block.dataset.contentBgColor = config.contentBgColor;
  block.dataset.contentTextColor = config.contentTextColor;
  block.dataset.contentBorderColor = config.contentBorderColor || '';
  block.dataset.contentBorderStyle = config.contentBorderStyle;
  block.dataset.contentShadow = config.contentShadow;
  block.dataset.contentRadius = config.contentRadius;
  block.dataset.cardBorderColor = config.cardBorderColor || '';
  block.dataset.cardBorderStyle = config.cardBorderStyle;
  block.dataset.cardBorderWidth = config.cardBorderWidth;
  block.dataset.buttonStyle = config.buttonStyle;
  block.dataset.buttonWidth = config.buttonWidth;
  block.dataset.buttonTextTransform = config.buttonTextTransform;
  block.dataset.buttonHoverStyle = config.buttonHoverStyle;
  block.dataset.buttonBorderWidth = config.buttonBorderWidth;
  block.dataset.buttonShadow = config.buttonShadow;
  block.dataset.buttonFontSize = config.buttonFontSize;
  block.dataset.buttonFontWeight = config.buttonFontWeight;
  block.dataset.buttonColor = config.buttonColor;
  block.dataset.buttonTextColor = config.buttonTextColor;
  block.dataset.cardRadius = config.cardRadius;
  block.dataset.imageShadow = config.imageShadow;
  block.dataset.imagePosition = config.imagePosition;
  block.dataset.hoverEffect = config.hoverEffect;
  block.dataset.imageOverlay = config.imageOverlay;
  block.dataset.imageOverlayColor = config.imageOverlayColor;
  block.dataset.gridMaxWidth = config.gridMaxWidth;
  block.dataset.mobileLayout = config.mobileLayout;
  block.dataset.descriptionMaxLines = config.descriptionMaxLines;
  block.dataset.descriptionStyle = config.descriptionStyle;
  block.dataset.fullWidth = config.fullWidth ? 'true' : 'false';

  const buttonColorToken = resolveColorToken(config.buttonColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-200)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const buttonTextColorToken = resolveColorToken(config.buttonTextColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-700)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const contentBgColorToken = resolveColorToken(config.contentBgColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-200)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const contentTextColorToken = resolveColorToken(config.contentTextColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-700)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const contentBorderColorToken = resolveColorToken(config.contentBorderColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-300)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const cardBorderColorToken = resolveColorToken(config.cardBorderColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-300)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const imageOverlayColorToken = resolveColorToken(config.imageOverlayColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-700)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const backgroundColorToken = resolveColorToken(config.backgroundColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-200)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const buttonHoverColorToken = resolveButtonHoverColor(config.buttonColor, buttonColorToken);

  block.style.setProperty('--promotional-hero-button-bg', buttonColorToken);
  block.style.setProperty('--promotional-hero-button-border', buttonColorToken);
  block.style.setProperty('--promotional-hero-button-text', buttonTextColorToken);
  block.style.setProperty('--promotional-hero-button-hover-bg', buttonHoverColorToken);
  block.style.setProperty('--promotional-hero-button-hover-border', buttonHoverColorToken);
  block.style.setProperty('--promotional-hero-button-hover-text', buttonTextColorToken);
  block.style.setProperty('--promotional-hero-content-bg', contentBgColorToken);
  block.style.setProperty('--promotional-hero-content-color', contentTextColorToken);
  block.style.setProperty('--promotional-hero-content-border-color', contentBorderColorToken);
  block.style.setProperty('--promotional-hero-card-border-color', cardBorderColorToken);
  block.style.setProperty('--promotional-hero-image-overlay-color', imageOverlayColorToken);
  block.style.setProperty('--promotional-hero-card-border-width', `${config.cardBorderWidth}px`);
  block.style.setProperty('--promotional-hero-button-border-width', `${config.buttonBorderWidth}px`);
  block.style.setProperty('--promotional-hero-button-font-weight', config.buttonFontWeight);
  block.style.setProperty('--promotional-hero-background', backgroundColorToken);

  const container = document.createElement('div');
  container.className = 'promotional-hero-container';

  rows.forEach((row, index) => {
    if (!row.children?.length) return;
    container.append(buildCard(row, index, config));
  });

  block.replaceChildren(container);

  const firstImage = block.querySelector('.promotional-hero-image img');
  if (firstImage) {
    if (firstImage.complete) {
      delete block.dataset.loading;
    } else {
      firstImage.addEventListener('load', () => {
        delete block.dataset.loading;
      }, { once: true });
      setTimeout(() => {
        delete block.dataset.loading;
      }, 3000);
    }
  } else {
    delete block.dataset.loading;
  }
}
