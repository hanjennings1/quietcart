// Small formatting helpers shared across pages

import dayjs from 'dayjs'


// Formats a number as USD: 18.5 -> "$18.50"
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount) {
    // uses null since prices/budgets are optional:
    if (amount === null || amount === undefined) return ''
        return currency.format(amount)
}


// "2026-11-01" → "Nov 1". Flask sends dates as plain "YYYY-MM-DD" strings -> dayjs reads those as LOCAL dates
// (new Date("2026-11-01") would read it as midnight UTC, which shows as Oct 31 in New York
export function formatShortDate(isoDate) {
    return dayjs(isoDate).format('MMM D')
}

// days_until from Flask (countdown label)
export function formatCountdown(days) {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 0) return 'Passed'
    return `In ${days} days`
}