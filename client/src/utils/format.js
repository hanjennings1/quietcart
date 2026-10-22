// Small formatting helpers shared across pages

// Formats a number as USD: 18.5 -> "$18.50"
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount) {
    // uses null since prices/budgets are optional:
    if (amount === null || amount === undefined) return ''
        return currency.format(amount)
}