const DEFAULTS = {
  bannerMode: 'static',
  bannerMount: 'header',
  bannerMountTarget: 'header .header.block',
  bannerLayout: 'split',
  bannerAriaLive: 'off',
  bannerAlign: 'left',
  bannerVariant: 'neutral',
  bannerDismissible: false,
  bannerDismissScope: 'session',
  bannerMaxWidth: 'none',
  bannerTextSize: 'md',
  bannerTextWeight: '500',
  bannerDensity: 'default',
  bannerContentGap: 'none',
  bannerBgColor: 'neutral',
  bannerTextColor: 'dark',
  tickerSpeed: 'medium',
  tickerDirection: 'left',
  tickerPauseOnHover: true,
  tickerLoopGap: 'medium',
  tickerSource: 'all',
  tickerControls: false,
  tickerMobileMode: 'static',
  bannerRegion: 'global',
  bannerAudience: 'all',
  bannerAnalyticsId: '',
};

let resizeObserver;
let resizeBound = false;
let currentBannerBlock = null;

function onWindowResize() {
  if (currentBannerBlock) {
    updateTopBannerOffset(currentBannerBlock);
  }
}

function getConfigValue(blockValue, sectionData, keys, fallback) {
  if (blockValue) return blockValue;
  for (let i = 0; i < keys.length; i += 1) {
    if (sectionData?.[keys[i]]) return sectionData[keys[i]];
  }
  return fallback;
}

function normalizeToken(value, allowed, fallback) {
  const val = (value || '').toString().trim().toLowerCase();
  return allowed.includes(val) ? val : fallback;
}

function normalizeBoolean(value, fallback = false) {
  const val = (value || '').toString().trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(val)) return true;
  if (['false', '0', 'no', 'off'].includes(val)) return false;
  return fallback;
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

function hasMeaningfulContent(cell) {
  return Boolean(cell && cell.textContent.trim());
}

function cloneCellContent(cell) {
  const frag = document.createDocumentFragment();
  if (!cell) return frag;
  [...cell.childNodes].forEach((node) => {
    frag.append(node.cloneNode(true));
  });
  return frag;
}

function parseRows(block) {
  return [...block.children].map((row) => {
    const cells = [...row.children];
    return {
      left: cells[0] || null,
      center: cells[1] || null,
      right: cells[2] || null,
    };
  });
}

function normalizeMountTarget(value, fallback) {
  const val = (value || '').toString().trim();
  return val || fallback;
}

function resolveColorToken(value, map) {
  const key = (value || '').toLowerCase();
  return map[key] || value;
}

function isSafeHref(href) {
  const val = (href || '').toString().trim().toLowerCase();
  if (!val) return true;
  if (val.startsWith('#') || val.startsWith('/')) return true;
  if (val.startsWith('http://') || val.startsWith('https://')) return true;
  if (val.startsWith('mailto:') || val.startsWith('tel:')) return true;
  const blockedProtocols = [
    String.fromCharCode(106, 97, 118, 97, 115, 99, 114, 105, 112, 116, 58),
    'vbscript:',
    'data:',
  ];
  if (blockedProtocols.some((protocol) => val.startsWith(protocol))) return false;
  return true;
}

function sanitizeLinks(container) {
  if (!container) return;
  const links = container.querySelectorAll('a[href]');
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!isSafeHref(href)) {
      // eslint-disable-next-line no-console
      console.warn(`top-banner: blocked unsafe href "${href}"`);
      link.setAttribute('href', '#');
    }

    if (link.getAttribute('target') === '_blank') {
      const rel = (link.getAttribute('rel') || '').toLowerCase();
      const relTokens = rel.split(/\s+/).filter(Boolean);
      if (!relTokens.includes('noopener')) relTokens.push('noopener');
      if (!relTokens.includes('noreferrer')) relTokens.push('noreferrer');
      link.setAttribute('rel', relTokens.join(' '));
    }
  });
}

function rgbStringToArray(value) {
  const match = (value || '').match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function channelToLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(rgb) {
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channelToLinear);
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function getContrastRatio(fg, bg) {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function warnIfLowContrast(block) {
  const styles = window.getComputedStyle(block);
  const fg = rgbStringToArray(styles.color);
  const bg = rgbStringToArray(styles.backgroundColor);
  const ratio = getContrastRatio(fg, bg);
  if (ratio !== null && ratio < 4.5) {
    // eslint-disable-next-line no-console
    console.warn(`top-banner: potential low contrast (${ratio.toFixed(2)}:1).`);
  }
}

function getTickerCellsForSource(row, source) {
  if (source === 'left') return [row.left];
  if (source === 'left-right') return [row.left, row.right];
  return [row.left, row.center, row.right];
}

function getMainBasePadding(main) {
  if (!main) return 0;
  const existing = Number(main.dataset.topBannerBasePadding || '');
  if (Number.isFinite(existing) && existing >= 0) return existing;
  const base = Number.parseFloat(window.getComputedStyle(main).paddingTop) || 0;
  main.dataset.topBannerBasePadding = String(base);
  return base;
}

function resolveContentGapValue(token) {
  const map = {
    none: '0px',
    xsmall: 'var(--spacing-xsmall)',
    small: 'var(--spacing-small)',
    medium: 'var(--spacing-medium)',
    large: 'var(--spacing-big)',
  };
  return map[token] || map.none;
}

function applyPortableHeaderOffsets(heightPx, contentGap = 'none') {
  const navWrapper = document.querySelector('header .nav-wrapper');
  const main = document.querySelector('main');
  const safeHeight = Math.max(0, Math.round(heightPx));
  const gapValue = resolveContentGapValue(contentGap);

  if (navWrapper) {
    navWrapper.style.top = `${safeHeight}px`;
  }

  if (main) {
    const basePadding = getMainBasePadding(main);
    main.style.paddingTop = `calc(${Math.round(basePadding + safeHeight)}px + ${gapValue})`;
  }

  return {
    hasNavWrapper: Boolean(navWrapper),
    hasMain: Boolean(main),
  };
}

function clearPortableHeaderOffsets() {
  const navWrapper = document.querySelector('header .nav-wrapper');
  const main = document.querySelector('main');

  if (navWrapper) {
    navWrapper.style.removeProperty('top');
  }

  if (main) {
    main.style.removeProperty('padding-top');
  }
}

function mountBannerToHeader(block, selector) {
  if (block.closest('header')) return true;

  let target = null;
  try {
    target = document.querySelector(selector);
  } catch {
    target = null;
  }

  target = target
    || document.querySelector('header .header.block')
    || document.querySelector('header .header')
    || document.querySelector('header');
  if (!target) return false;

  const navWrapper = target.querySelector(':scope > .nav-wrapper');
  if (navWrapper) {
    target.insertBefore(block, navWrapper);
  } else {
    target.prepend(block);
  }

  return true;
}

function updateTopBannerOffset(block) {
  const mountMode = block?.dataset?.bannerMount || DEFAULTS.bannerMount;
  const contentGap = block?.dataset?.bannerContentGap || DEFAULTS.bannerContentGap;
  const retries = Number(block?.dataset?.offsetRetry || '0');

  const scheduleRetry = () => {
    if (!block || retries >= 20) return;
    block.dataset.offsetRetry = String(retries + 1);
    window.requestAnimationFrame(() => updateTopBannerOffset(block));
  };

  if (!block || block.dataset.dismissed === 'true') {
    document.documentElement.style.setProperty('--top-banner-height', '0px');
    if (mountMode === 'header') {
      const { hasNavWrapper } = applyPortableHeaderOffsets(0, contentGap);
      if (!hasNavWrapper) scheduleRetry();
    }
    return;
  }

  const { height } = block.getBoundingClientRect();
  const safeHeight = Math.max(0, Math.round(height));

  if (mountMode === 'integrated') {
    clearPortableHeaderOffsets();
    document.documentElement.style.setProperty('--top-banner-height', `${safeHeight}px`);
    return;
  }

  document.documentElement.style.setProperty('--top-banner-height', '0px');
  if (mountMode === 'header') {
    const { hasNavWrapper } = applyPortableHeaderOffsets(safeHeight, contentGap);
    if (!hasNavWrapper) {
      scheduleRetry();
    } else {
      block.dataset.offsetRetry = '0';
    }
  } else {
    clearPortableHeaderOffsets();
    applyPortableHeaderOffsets(0, 'none');
    block.dataset.offsetRetry = '0';
  }
}

function applyDismissState(block, dismissScope, dismissKey) {
  if (dismissScope === 'none') return false;

  const storage = dismissScope === 'local' ? window.localStorage : window.sessionStorage;
  try {
    return storage.getItem(dismissKey) === '1';
  } catch {
    return false;
  }
}

function persistDismissState(dismissScope, dismissKey) {
  if (dismissScope === 'none') return;

  const storage = dismissScope === 'local' ? window.localStorage : window.sessionStorage;
  try {
    storage.setItem(dismissKey, '1');
  } catch {
    // storage may be unavailable in private mode; fail safely
  }
}

function emitBlockEvent(block, name, detail = {}) {
  block.dispatchEvent(new CustomEvent(`top-banner:${name}`, {
    bubbles: true,
    detail,
  }));
}

function buildTicker(leftLane, rows, config, prefersReducedMotion) {
  const messages = rows
    .flatMap((row) => getTickerCellsForSource(row, config.bannerTickerSource))
    .filter(hasMeaningfulContent);

  if (!messages.length) {
    leftLane.textContent = '';
    return { isAnimated: false, ticker: null };
  }

  const staticFallback = () => {
    leftLane.append(cloneCellContent(messages[0]));
  };

  const isMobileViewport = window.matchMedia('(max-width: 900px)').matches;
  const forceStaticOnMobile = isMobileViewport && config.bannerTickerMobileMode === 'static';

  if (prefersReducedMotion || forceStaticOnMobile) {
    staticFallback();
    return { isAnimated: false, ticker: null };
  }

  const ticker = document.createElement('div');
  ticker.className = 'top-banner-ticker';
  ticker.dataset.direction = config.bannerTickerDirection;
  ticker.dataset.speed = config.bannerTickerSpeed;
  ticker.dataset.pause = config.bannerTickerPauseOnHover ? 'true' : 'false';
  ticker.dataset.loopGap = config.bannerTickerLoopGap;
  ticker.dataset.source = config.bannerTickerSource;

  const buildTrack = () => {
    const frag = document.createDocumentFragment();
    messages.forEach((message, index) => {
      const item = document.createElement('span');
      item.className = 'top-banner-ticker-item';
      item.append(cloneCellContent(message));
      frag.append(item);

      if (index < messages.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'top-banner-ticker-separator';
        sep.textContent = '\u2022';
        frag.append(sep);
      }
    });
    return frag;
  };

  const track = document.createElement('div');
  track.className = 'top-banner-ticker-track';
  track.append(buildTrack());

  ticker.append(track);
  leftLane.append(ticker);
  return { isAnimated: true, ticker };
}

export default function decorate(block) {
  const rows = parseRows(block);
  if (!rows.length) return;

  const section = block.closest('.section');
  const sectionData = section?.dataset || {};
  const hasExplicitLayout = Boolean(
    block.dataset.bannerLayout
    || sectionData.dataBannerLayout
    || sectionData.dataDataBannerLayout,
  );

  const raw = {
    bannerMode: getConfigValue(block.dataset.bannerMode, sectionData, ['dataBannerMode', 'dataDataBannerMode'], DEFAULTS.bannerMode),
    bannerMount: getConfigValue(block.dataset.bannerMount, sectionData, ['dataBannerMount', 'dataDataBannerMount'], DEFAULTS.bannerMount),
    bannerMountTarget: getConfigValue(block.dataset.bannerMountTarget, sectionData, ['dataBannerMountTarget', 'dataDataBannerMountTarget'], DEFAULTS.bannerMountTarget),
    bannerLayout: getConfigValue(block.dataset.bannerLayout, sectionData, ['dataBannerLayout', 'dataDataBannerLayout'], DEFAULTS.bannerLayout),
    bannerAriaLive: getConfigValue(block.dataset.bannerAriaLive, sectionData, ['dataBannerAriaLive', 'dataDataBannerAriaLive'], DEFAULTS.bannerAriaLive),
    bannerAlign: getConfigValue(block.dataset.bannerAlign, sectionData, ['dataBannerAlign', 'dataDataBannerAlign'], DEFAULTS.bannerAlign),
    bannerVariant: getConfigValue(block.dataset.bannerVariant, sectionData, ['dataBannerVariant', 'dataDataBannerVariant'], DEFAULTS.bannerVariant),
    bannerDismissible: getConfigValue(block.dataset.bannerDismissible, sectionData, ['dataBannerDismissible', 'dataDataBannerDismissible'], ''),
    bannerDismissScope: getConfigValue(block.dataset.bannerDismissScope, sectionData, ['dataBannerDismissScope', 'dataDataBannerDismissScope'], DEFAULTS.bannerDismissScope),
    bannerMaxWidth: getConfigValue(block.dataset.bannerMaxWidth, sectionData, ['dataBannerMaxWidth', 'dataDataBannerMaxWidth'], DEFAULTS.bannerMaxWidth),
    bannerTextSize: getConfigValue(block.dataset.bannerTextSize, sectionData, ['dataBannerTextSize', 'dataDataBannerTextSize'], DEFAULTS.bannerTextSize),
    bannerTextWeight: getConfigValue(block.dataset.bannerTextWeight, sectionData, ['dataBannerTextWeight', 'dataDataBannerTextWeight'], DEFAULTS.bannerTextWeight),
    bannerDensity: getConfigValue(block.dataset.bannerDensity, sectionData, ['dataBannerDensity', 'dataDataBannerDensity'], DEFAULTS.bannerDensity),
    bannerContentGap: getConfigValue(block.dataset.bannerContentGap, sectionData, ['dataBannerContentGap', 'dataDataBannerContentGap'], DEFAULTS.bannerContentGap),
    bannerBgColor: getConfigValue(
      block.dataset.bannerBgColor,
      sectionData,
      ['dataBannerBgColor', 'dataDataBannerBgColor', 'dataBannerBgColour', 'dataDataBannerBgColour'],
      DEFAULTS.bannerBgColor,
    ),
    bannerTextColor: getConfigValue(
      block.dataset.bannerTextColor,
      sectionData,
      ['dataBannerTextColor', 'dataDataBannerTextColor', 'dataBannerTextColour', 'dataDataBannerTextColour'],
      DEFAULTS.bannerTextColor,
    ),
    bannerTickerSpeed: getConfigValue(block.dataset.tickerSpeed, sectionData, ['dataTickerSpeed', 'dataDataTickerSpeed'], DEFAULTS.tickerSpeed),
    bannerTickerDirection: getConfigValue(block.dataset.tickerDirection, sectionData, ['dataTickerDirection', 'dataDataTickerDirection'], DEFAULTS.tickerDirection),
    bannerTickerPauseOnHover: getConfigValue(block.dataset.tickerPauseOnHover, sectionData, ['dataTickerPauseOnHover', 'dataDataTickerPauseOnHover'], ''),
    bannerTickerLoopGap: getConfigValue(block.dataset.tickerLoopGap, sectionData, ['dataTickerLoopGap', 'dataDataTickerLoopGap'], DEFAULTS.tickerLoopGap),
    bannerTickerSource: getConfigValue(block.dataset.tickerSource, sectionData, ['dataTickerSource', 'dataDataTickerSource'], DEFAULTS.tickerSource),
    bannerTickerControls: getConfigValue(block.dataset.tickerControls, sectionData, ['dataTickerControls', 'dataDataTickerControls'], ''),
    bannerTickerMobileMode: getConfigValue(block.dataset.tickerMobileMode, sectionData, ['dataTickerMobileMode', 'dataDataTickerMobileMode'], DEFAULTS.tickerMobileMode),
    bannerRegion: getConfigValue(block.dataset.bannerRegion, sectionData, ['dataBannerRegion', 'dataDataBannerRegion'], DEFAULTS.bannerRegion),
    bannerAudience: getConfigValue(block.dataset.bannerAudience, sectionData, ['dataBannerAudience', 'dataDataBannerAudience'], DEFAULTS.bannerAudience),
    bannerAnalyticsId: getConfigValue(block.dataset.bannerAnalyticsId, sectionData, ['dataBannerAnalyticsId', 'dataDataBannerAnalyticsId'], DEFAULTS.bannerAnalyticsId),
  };

  const config = {
    bannerMode: normalizeToken(raw.bannerMode, ['static', 'ticker'], DEFAULTS.bannerMode),
    bannerMount: normalizeToken(raw.bannerMount, ['integrated', 'header', 'inline'], DEFAULTS.bannerMount),
    bannerMountTarget: normalizeMountTarget(raw.bannerMountTarget, DEFAULTS.bannerMountTarget),
    bannerLayout: normalizeToken(raw.bannerLayout, ['single', 'split', 'multi'], DEFAULTS.bannerLayout),
    bannerAriaLive: normalizeToken(raw.bannerAriaLive, ['off', 'polite'], DEFAULTS.bannerAriaLive),
    bannerAlign: normalizeToken(raw.bannerAlign, ['left', 'center', 'right'], DEFAULTS.bannerAlign),
    bannerVariant: normalizeToken(raw.bannerVariant, ['info', 'promo', 'urgent', 'neutral'], DEFAULTS.bannerVariant),
    bannerDismissible: normalizeBoolean(raw.bannerDismissible, DEFAULTS.bannerDismissible),
    bannerDismissScope: normalizeToken(raw.bannerDismissScope, ['session', 'local', 'none'], DEFAULTS.bannerDismissScope),
    bannerMaxWidth: normalizeToken(raw.bannerMaxWidth, ['none', '1200', '1400', '1600'], DEFAULTS.bannerMaxWidth),
    bannerTextSize: normalizeToken(raw.bannerTextSize, ['sm', 'md', 'lg'], DEFAULTS.bannerTextSize),
    bannerTextWeight: normalizeToken(raw.bannerTextWeight, ['400', '500', '600', '700'], DEFAULTS.bannerTextWeight),
    bannerDensity: normalizeToken(raw.bannerDensity, ['default', 'compact'], DEFAULTS.bannerDensity),
    bannerContentGap: normalizeToken(raw.bannerContentGap, ['none', 'xsmall', 'small', 'medium', 'large'], DEFAULTS.bannerContentGap),
    bannerBgColor: normalizeColor(raw.bannerBgColor, DEFAULTS.bannerBgColor),
    bannerTextColor: normalizeColor(raw.bannerTextColor, DEFAULTS.bannerTextColor),
    bannerTickerSpeed: normalizeToken(raw.bannerTickerSpeed, ['slow', 'medium', 'fast'], DEFAULTS.tickerSpeed),
    bannerTickerDirection: normalizeToken(raw.bannerTickerDirection, ['left', 'right'], DEFAULTS.tickerDirection),
    bannerTickerPauseOnHover: normalizeBoolean(
      raw.bannerTickerPauseOnHover,
      DEFAULTS.tickerPauseOnHover,
    ),
    bannerTickerLoopGap: normalizeToken(raw.bannerTickerLoopGap, ['small', 'medium', 'large'], DEFAULTS.tickerLoopGap),
    bannerTickerSource: normalizeToken(raw.bannerTickerSource, ['all', 'left', 'left-right'], DEFAULTS.tickerSource),
    bannerTickerControls: normalizeBoolean(raw.bannerTickerControls, DEFAULTS.tickerControls),
    bannerTickerMobileMode: normalizeToken(raw.bannerTickerMobileMode, ['static', 'ticker'], DEFAULTS.tickerMobileMode),
    bannerRegion: normalizeToken(raw.bannerRegion, ['global', 'emea', 'na', 'apac'], DEFAULTS.bannerRegion),
    bannerAudience: normalizeToken(raw.bannerAudience, ['all', 'guest', 'signed-in', 'vip'], DEFAULTS.bannerAudience),
    bannerAnalyticsId: (raw.bannerAnalyticsId || '').toString().trim(),
  };

  // Backward-compatible alias: data-banner-layout=center
  // maps to split layout with centered message lane.
  if ((raw.bannerLayout || '').toString().trim().toLowerCase() === 'center') {
    config.bannerLayout = 'split';
    config.bannerAlign = 'center';
  }

  // If authors did not explicitly set layout and provided center content,
  // show all authored static columns by default.
  const [firstRow] = rows;
  if (
    config.bannerMode === 'static'
    && !hasExplicitLayout
    && hasMeaningfulContent(firstRow.center)
  ) {
    config.bannerLayout = 'multi';
  }

  Object.entries(config).forEach(([key, value]) => {
    block.dataset[key] = value.toString();
  });

  if (config.bannerMount === 'header') {
    const didMount = mountBannerToHeader(block, config.bannerMountTarget);
    if (!didMount) {
      // eslint-disable-next-line no-console
      console.warn(`top-banner: header mount target not found ("${config.bannerMountTarget}"), falling back to inline.`);
      config.bannerMount = 'inline';
      block.dataset.bannerMount = 'inline';
    }
  }

  const effectiveLayout = config.bannerMode === 'ticker' ? 'single' : config.bannerLayout;
  block.dataset.bannerEffectiveLayout = effectiveLayout;

  const bgColorToken = resolveColorToken(config.bannerBgColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-200)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  const textColorToken = resolveColorToken(config.bannerTextColor, {
    transparent: 'transparent',
    light: 'var(--color-neutral-100)',
    neutral: 'var(--color-neutral-700)',
    dark: 'var(--color-neutral-900)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-informational-500)',
    white: 'var(--color-neutral-50)',
    black: '#000',
  });

  block.style.setProperty('--top-banner-bg', bgColorToken);
  block.style.setProperty('--top-banner-text', textColorToken);

  const dismissKey = `top-banner:${config.bannerAnalyticsId || window.location.pathname}`;
  if (applyDismissState(block, config.bannerDismissScope, dismissKey)) {
    block.dataset.dismissed = 'true';
    block.textContent = '';
    updateTopBannerOffset(block);
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const inner = document.createElement('div');
  inner.className = 'top-banner-inner';

  const leftLane = document.createElement('div');
  leftLane.className = 'top-banner-lane top-banner-lane-left';

  let tickerRuntime = { isAnimated: false, ticker: null };
  if (config.bannerMode === 'ticker') {
    tickerRuntime = buildTicker(leftLane, rows, config, prefersReducedMotion);
  } else {
    leftLane.append(cloneCellContent(firstRow.left));
  }

  inner.append(leftLane);

  if (
    config.bannerMode !== 'ticker'
    && effectiveLayout === 'multi'
    && hasMeaningfulContent(firstRow.center)
  ) {
    const centerLane = document.createElement('div');
    centerLane.className = 'top-banner-lane top-banner-lane-center';
    centerLane.append(cloneCellContent(firstRow.center));
    inner.append(centerLane);
  }

  if (
    config.bannerMode !== 'ticker'
    && ['split', 'multi'].includes(effectiveLayout)
    && hasMeaningfulContent(firstRow.right)
  ) {
    const rightLane = document.createElement('div');
    rightLane.className = 'top-banner-lane top-banner-lane-right';
    rightLane.append(cloneCellContent(firstRow.right));
    inner.append(rightLane);
  }

  if (config.bannerMode === 'ticker' && config.bannerTickerControls && tickerRuntime.ticker) {
    const tickerToggle = document.createElement('button');
    tickerToggle.type = 'button';
    tickerToggle.className = 'top-banner-ticker-toggle';
    tickerToggle.dataset.state = 'playing';
    tickerToggle.setAttribute('aria-pressed', 'false');
    tickerToggle.setAttribute('aria-label', 'Pause announcement ticker');
    tickerToggle.textContent = 'Pause';

    tickerToggle.addEventListener('click', () => {
      const track = tickerRuntime.ticker.querySelector('.top-banner-ticker-track');
      if (!track) return;
      const isPlaying = tickerToggle.dataset.state === 'playing';
      tickerToggle.dataset.state = isPlaying ? 'paused' : 'playing';
      tickerToggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      tickerToggle.setAttribute('aria-label', isPlaying ? 'Play announcement ticker' : 'Pause announcement ticker');
      tickerToggle.textContent = isPlaying ? 'Play' : 'Pause';
      track.style.animationPlayState = isPlaying ? 'paused' : 'running';
    });

    inner.append(tickerToggle);
  }

  if (config.bannerDismissible) {
    const dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.className = 'top-banner-dismiss';
    dismissButton.setAttribute('aria-label', 'Dismiss announcement');
    dismissButton.textContent = '\u00d7';
    dismissButton.addEventListener('click', () => {
      persistDismissState(config.bannerDismissScope, dismissKey);
      block.dataset.dismissed = 'true';
      block.textContent = '';
      updateTopBannerOffset(block);
      emitBlockEvent(block, 'dismissed', {
        analyticsId: config.bannerAnalyticsId,
        scope: config.bannerDismissScope,
      });
    });
    inner.append(dismissButton);
  }

  block.replaceChildren(inner);
  sanitizeLinks(block);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Site announcement');
  block.setAttribute('aria-live', config.bannerAriaLive);

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  resizeObserver = new ResizeObserver(() => updateTopBannerOffset(block));
  resizeObserver.observe(block);
  currentBannerBlock = block;
  if (!resizeBound) {
    window.addEventListener('resize', onWindowResize, { passive: true });
    resizeBound = true;
  }

  updateTopBannerOffset(block);
  warnIfLowContrast(block);

  emitBlockEvent(block, 'shown', {
    mode: config.bannerMode,
    mount: config.bannerMount,
    source: config.bannerTickerSource,
    direction: config.bannerTickerDirection,
    animated: tickerRuntime.isAnimated,
    analyticsId: config.bannerAnalyticsId,
  });

  if (tickerRuntime.isAnimated) {
    emitBlockEvent(block, 'ticker-start', {
      source: config.bannerTickerSource,
      direction: config.bannerTickerDirection,
      speed: config.bannerTickerSpeed,
      analyticsId: config.bannerAnalyticsId,
    });
  }
}
