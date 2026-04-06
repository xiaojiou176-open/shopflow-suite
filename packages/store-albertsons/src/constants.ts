export const SAFEWAY_HOST_PATTERN = '*://*.safeway.com/*';
export const VONS_SEARCH_HOST_PATTERN = '*://*.vons.com/shop/search-results*';
export const SAFEWAY_VERIFIED_SCOPE = 'safeway';
export const albertsonsHostPatterns = [
  SAFEWAY_HOST_PATTERN,
  VONS_SEARCH_HOST_PATTERN,
] as const;

export const productSelectors = {
  title: [
    '[data-shopflow-product-title]',
    '[data-testid="product-title"]',
    '[itemprop="name"]',
    'h1',
  ],
  price: ['[data-shopflow-product-price]', '[data-testid="product-price"]'],
  image: ['[data-shopflow-product-image]', '[data-testid="product-image"]'],
  sku: ['[data-shopflow-product-sku]', '[data-testid="product-sku"]'],
} as const;

export const searchSelectors = {
  item: ['[data-shopflow-search-item]', '[data-testid="search-result-card"]'],
  title:
    '[data-shopflow-search-title], [data-testid="search-result-title"]',
  price:
    '[data-shopflow-search-price], [data-testid="search-result-price"]',
  url: '[data-shopflow-search-url], [data-testid="search-result-link"], a[href]',
} as const;

export const dealSelectors = {
  item: ['[data-shopflow-deal-item]', '[data-testid="deal-card"]'],
  title: '[data-shopflow-deal-title], [data-testid="deal-title"]',
  label: '[data-shopflow-deal-label], [data-testid="deal-label"]',
  price: '[data-shopflow-deal-price], [data-testid="deal-price"]',
  url: '[data-shopflow-deal-url], [data-testid="deal-link"], a[href]',
} as const;

export const cartActionSelectors = {
  item: ['[data-shopflow-subscribe-item]'],
  trigger: [
    '[data-shopflow-schedule-save-trigger]',
    '[data-shopflow-subscribe-trigger]',
    'button[aria-label*="schedule" i][aria-label*="save" i]',
  ],
  cadence: [
    '[data-shopflow-schedule-save-option="16 weeks"]',
    '[data-shopflow-schedule-save-option]',
    '[data-shopflow-subscribe-cadence]',
    'button[aria-label*="deliver every" i]',
    'button[aria-label*="week" i]',
  ],
  confirm: [
    '[data-shopflow-schedule-save-confirm]',
    '[data-shopflow-subscribe-confirm]',
    'button[aria-label*="confirm" i]',
    'button[aria-label*="subscribe" i]',
  ],
} as const;

export const manageActionSelectors = {
  item: ['[data-shopflow-cancel-item]', '[data-testid="manage-subscription-item"]'],
  trigger: [
    '[data-shopflow-cancel-trigger]',
    '[data-shopflow-manage-trigger]',
    'button[aria-label*="cancel" i][aria-label*="subscription" i]',
    'button[aria-label*="stop" i][aria-label*="subscription" i]',
  ],
  reason: [
    '[data-shopflow-cancel-reason="It\'s too expensive"]',
    '[data-shopflow-cancel-reason]',
    '[data-shopflow-manage-reason]',
    'button[aria-label*="too expensive" i]',
    'input[type="radio"][aria-label*="expensive" i]',
    'input[type="radio"][value*="expensive" i]',
  ],
  confirm: [
    '[data-shopflow-cancel-confirm]',
    '[data-shopflow-manage-confirm]',
    'button[aria-label*="confirm cancellation" i]',
    'button[aria-label*="confirm cancel" i]',
    'button[aria-label*="stop subscription" i]',
  ],
} as const;
