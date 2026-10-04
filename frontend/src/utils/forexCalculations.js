// ─── Forex Calculation Utilities ────────────────────────────────────────────

export const COMMON_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD',
  'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
  'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'GBP/CAD', 'GBP/CHF',
  'AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY', 'AUD/CAD',
  'AUD/CHF', 'NZD/CHF', 'NZD/CAD', 'USD/SGD', 'USD/HKD',
]

/**
 * Returns true if the currency pair is a JPY pair.
 * JPY pairs use a different pip multiplier (100 instead of 10,000).
 */
export function isJpyPair(pair) {
  const normalized = pair.replace('/', '').toUpperCase()
  return normalized.endsWith('JPY')
}

/**
 * Calculates the number of pips gained or lost on a trade.
 *
 * Rules:
 *  - Non-JPY pairs: Pips = (Exit - Entry) × 10,000
 *  - JPY pairs:     Pips = (Exit - Entry) × 100
 *  - SELL trades:   sign is reversed (profit when price falls)
 */
export function calculatePips(pair, entryPrice, exitPrice, type) {
  if (isNaN(entryPrice) || isNaN(exitPrice)) return 0
  
  const normalized = pair.replace('/', '').toUpperCase()
  let multiplier = 10_000
  if (normalized.endsWith('JPY')) {
    multiplier = 100
  } else if (normalized.startsWith('XAU')) {
    multiplier = 10
  }

  const rawPips = (exitPrice - entryPrice) * multiplier
  return type === 'Sell' ? -rawPips : rawPips
}

/**
 * Returns the pip value (in USD) per lot for the given currency pair.
 *
 * Approximations used (no live rate feed):
 *  - XXX/USD (quote = USD):  $10 per pip per standard lot
 *  - USD/XXX (base = USD):   $10 per pip per standard lot (approximation)
 *  - JPY pairs:              $9.30 per pip per standard lot (approximation)
 *  - All other crosses:      $10 per pip per standard lot (approximation)
 *
 * Manual override is available in the form.
 */
export function getPipValue(pair, lotSize) {
  if (isNaN(lotSize) || lotSize <= 0) return 0
  const normalized = pair.replace('/', '').toUpperCase()
  const pipValuePerStandardLot = normalized.endsWith('JPY') ? 9.3 : 10
  return pipValuePerStandardLot * lotSize
}

/**
 * Calculates the profit or loss from a trade.
 *   Profit = Pips × Pip Value
 */
export function calculateProfit(pips, pipValue) {
  if (isNaN(pips) || isNaN(pipValue)) return 0
  return pips * pipValue
}

/**
 * Calculates the Risk/Reward ratio for a trade.
 * RR = Reward / Risk
 */
export function calculateRR(entryPrice, stopLoss, takeProfit, type) {
  if (!entryPrice || !stopLoss || !takeProfit) return 0
  
  const risk = Math.abs(type === 'Buy' ? entryPrice - stopLoss : stopLoss - entryPrice)
  const reward = Math.abs(type === 'Buy' ? takeProfit - entryPrice : entryPrice - takeProfit)
  
  if (risk <= 0) return 0 
  return parseFloat((reward / risk).toFixed(2))
}
